-- ============================================================
-- Tornasol — initial schema, helper functions, RLS, realtime
-- Run this in your Supabase project (SQL editor or `supabase db push`).
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  avatar_initials text,
  created_at timestamptz not null default now()
);

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  admin_id uuid not null references auth.users (id) on delete cascade,
  allow_member_shift_creation boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.invites (
  token uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  created_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  -- references profiles (which mirrors auth.users) so PostgREST can embed the
  -- assignee's display name/initials directly.
  assigned_user_id uuid references public.profiles (id) on delete set null,
  recurrence_rule text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.shift_notes (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  title text not null,
  assigned_user_id uuid references public.profiles (id) on delete set null,
  is_shared boolean not null default true,
  is_complete boolean not null default false,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists idx_group_members_user on public.group_members (user_id);
create index if not exists idx_shifts_group_start on public.shifts (group_id, start_time);
create index if not exists idx_shift_notes_shift on public.shift_notes (shift_id, created_at);
create index if not exists idx_tasks_group on public.tasks (group_id, is_complete);

-- ------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so RLS policies can call
-- them without recursing back through the policies themselves).
-- ------------------------------------------------------------

create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(gid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.groups
    where id = gid and admin_id = auth.uid()
  );
$$;

create or replace function public.shares_group_with(other_user uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.user_id = auth.uid() and b.user_id = other_user
  );
$$;

create or replace function public.is_member_of_shift_group(sid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.shifts s
    join public.group_members gm on gm.group_id = s.group_id
    where s.id = sid and gm.user_id = auth.uid()
  );
$$;

create or replace function public.can_create_shift(gid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.groups g
    where g.id = gid
      and (g.admin_id = auth.uid() or g.allow_member_shift_creation = true)
      and public.is_group_member(gid)
  );
$$;

-- ------------------------------------------------------------
-- RPCs used by the app
-- ------------------------------------------------------------

-- Create a group and add the creator as admin + first member, atomically.
create or replace function public.create_group(group_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.groups;
begin
  if coalesce(trim(group_name), '') = '' then
    raise exception 'Group name is required';
  end if;

  insert into public.groups (name, admin_id)
  values (trim(group_name), auth.uid())
  returning * into g;

  insert into public.group_members (group_id, user_id)
  values (g.id, auth.uid())
  on conflict do nothing;

  return g;
end;
$$;

-- Read the group name behind an invite (used before/around signup).
create or replace function public.invite_group_name(invite_token uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select g.name
  from public.invites i
  join public.groups g on g.id = i.group_id
  where i.token = invite_token
    and (i.expires_at is null or i.expires_at > now());
$$;

-- Accept an invite: add the current user to the group (idempotent).
create or replace function public.accept_invite(invite_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group uuid;
  v_expires timestamptz;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to accept an invite';
  end if;

  select group_id, expires_at into v_group, v_expires
  from public.invites
  where token = invite_token;

  if v_group is null then
    raise exception 'This invite link is not valid';
  end if;

  if v_expires is not null and v_expires < now() then
    raise exception 'This invite link has expired';
  end if;

  insert into public.group_members (group_id, user_id)
  values (v_group, auth.uid())
  on conflict (group_id, user_id) do nothing;

  update public.invites
  set used_at = coalesce(used_at, now())
  where token = invite_token;

  return v_group;
end;
$$;

-- Keep public.profiles in sync when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
begin
  v_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    split_part(new.email, '@', 1)
  );

  insert into public.profiles (id, email, display_name, avatar_initials)
  values (
    new.id,
    new.email,
    v_name,
    upper(
      substr(
        coalesce(split_part(v_name, ' ', 1), ''), 1, 1
      ) ||
      substr(
        coalesce(nullif(split_part(v_name, ' ', 2), ''), substr(v_name, 2, 1)), 1, 1
      )
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.invites enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_notes enable row level security;
alter table public.tasks enable row level security;

-- profiles: read your own + anyone who shares a group with you.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (
    id = auth.uid() or public.shares_group_with(id)
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- groups: members can read; only admin manages.
drop policy if exists "groups_select" on public.groups;
create policy "groups_select" on public.groups
  for select using (public.is_group_member(id));

drop policy if exists "groups_insert" on public.groups;
create policy "groups_insert" on public.groups
  for insert with check (admin_id = auth.uid());

drop policy if exists "groups_update_admin" on public.groups;
create policy "groups_update_admin" on public.groups
  for update using (public.is_group_admin(id)) with check (public.is_group_admin(id));

drop policy if exists "groups_delete_admin" on public.groups;
create policy "groups_delete_admin" on public.groups
  for delete using (public.is_group_admin(id));

-- group_members: members see co-members; admin adds, admin/self removes.
drop policy if exists "group_members_select" on public.group_members;
create policy "group_members_select" on public.group_members
  for select using (public.is_group_member(group_id));

drop policy if exists "group_members_insert" on public.group_members;
create policy "group_members_insert" on public.group_members
  for insert with check (
    user_id = auth.uid() and public.is_group_admin(group_id)
  );

drop policy if exists "group_members_delete" on public.group_members;
create policy "group_members_delete" on public.group_members
  for delete using (
    public.is_group_admin(group_id) or user_id = auth.uid()
  );

-- invites: members/admin manage; acceptance goes through RPCs.
drop policy if exists "invites_select" on public.invites;
create policy "invites_select" on public.invites
  for select using (
    public.is_group_member(group_id) or created_by = auth.uid()
  );

drop policy if exists "invites_insert" on public.invites;
create policy "invites_insert" on public.invites
  for insert with check (
    created_by = auth.uid() and public.is_group_admin(group_id)
  );

drop policy if exists "invites_delete" on public.invites;
create policy "invites_delete" on public.invites
  for delete using (public.is_group_admin(group_id));

-- shifts: members read; create depends on group setting; members claim/release.
drop policy if exists "shifts_select" on public.shifts;
create policy "shifts_select" on public.shifts
  for select using (public.is_group_member(group_id));

drop policy if exists "shifts_insert" on public.shifts;
create policy "shifts_insert" on public.shifts
  for insert with check (
    created_by = auth.uid() and public.can_create_shift(group_id)
  );

drop policy if exists "shifts_update" on public.shifts;
create policy "shifts_update" on public.shifts
  for update using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

drop policy if exists "shifts_delete" on public.shifts;
create policy "shifts_delete" on public.shifts
  for delete using (
    public.is_group_admin(group_id) or created_by = auth.uid()
  );

-- shift_notes: group members read/write; author or admin can delete.
drop policy if exists "shift_notes_select" on public.shift_notes;
create policy "shift_notes_select" on public.shift_notes
  for select using (public.is_member_of_shift_group(shift_id));

drop policy if exists "shift_notes_insert" on public.shift_notes;
create policy "shift_notes_insert" on public.shift_notes
  for insert with check (
    author_id = auth.uid() and public.is_member_of_shift_group(shift_id)
  );

drop policy if exists "shift_notes_delete" on public.shift_notes;
create policy "shift_notes_delete" on public.shift_notes
  for delete using (author_id = auth.uid());

-- tasks: any group member can add/complete/delete.
drop policy if exists "tasks_select" on public.tasks;
create policy "tasks_select" on public.tasks
  for select using (public.is_group_member(group_id));

drop policy if exists "tasks_insert" on public.tasks;
create policy "tasks_insert" on public.tasks
  for insert with check (
    created_by = auth.uid() and public.is_group_member(group_id)
  );

drop policy if exists "tasks_update" on public.tasks;
create policy "tasks_update" on public.tasks
  for update using (public.is_group_member(group_id))
  with check (public.is_group_member(group_id));

drop policy if exists "tasks_delete" on public.tasks;
create policy "tasks_delete" on public.tasks
  for delete using (public.is_group_member(group_id));

-- ------------------------------------------------------------
-- Grants for RPCs
-- ------------------------------------------------------------

grant execute on function public.create_group(text) to authenticated;
grant execute on function public.accept_invite(uuid) to authenticated;
grant execute on function public.invite_group_name(uuid) to anon, authenticated;

-- ------------------------------------------------------------
-- Realtime — broadcast row changes for live shift/task updates.
-- ------------------------------------------------------------

do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;

  foreach t in array array['shifts', 'shift_notes', 'tasks', 'group_members']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
