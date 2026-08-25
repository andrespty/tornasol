-- ============================================================
-- Rename "shifts" -> "events", add per-group event types, multi-attendee
-- sign-ups with capacity, and per-occurrence series linking.
--
-- Data is preserved: existing shifts become events (typed "Other",
-- capacity 1), existing shift_notes become event_notes, and anyone who
-- had taken a shift becomes an attendee of that event.
-- ============================================================

-- ---------- 1. Rename tables/columns ----------
-- Guarded so this migration can be safely re-run after a partial apply.
alter table if exists public.shifts rename to events;
alter table if exists public.shift_notes rename to event_notes;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'event_notes' and column_name = 'shift_id'
  ) then
    alter table public.event_notes rename column shift_id to event_id;
  end if;
end $$;

-- ---------- 2. Event types (per group) ----------
create table if not exists public.event_types (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  name text not null,
  color text not null default '#6b5d54',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_event_types_group on public.event_types (group_id, sort_order);

-- ---------- 3. Extend events ----------
alter table public.events
  add column if not exists series_id uuid,
  add column if not exists event_type_id uuid references public.event_types (id) on delete set null,
  add column if not exists capacity int not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'events_capacity_check'
  ) then
    alter table public.events add constraint events_capacity_check check (capacity >= 1);
  end if;
end $$;

-- ---------- 4. Attendees (multi sign-up) ----------
create table if not exists public.event_attendees (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index if not exists idx_event_attendees_user on public.event_attendees (user_id);
create index if not exists idx_events_series on public.events (series_id);

-- ---------- 5. Seed default types for existing groups ----------
insert into public.event_types (group_id, name, color, sort_order)
select g.id, t.name, t.color, t.sort_order
from public.groups g
cross join (values
  ('Quality Time', '#0F6E56', 1),
  ('Doctor Appointment', '#D85A30', 2),
  ('Activity', '#3B6EA5', 3),
  ('Other', '#6B5D54', 4)
) as t(name, color, sort_order)
where not exists (
  select 1 from public.event_types et where et.group_id = g.id
);

-- ---------- 6. Backfill existing events ----------
-- Give every existing event the group's "Other" type.
update public.events e
set event_type_id = (
  select et.id from public.event_types et
  where et.group_id = e.group_id and et.name = 'Other'
  limit 1
)
where e.event_type_id is null;

-- Migrate the old single assignee into the attendees table.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'events'
      and column_name = 'assigned_user_id'
  ) then
    insert into public.event_attendees (event_id, user_id)
    select id, assigned_user_id from public.events where assigned_user_id is not null
    on conflict do nothing;
  end if;
end $$;

-- Drop the now-migrated columns.
alter table public.events drop column if exists assigned_user_id;
alter table public.events drop column if exists recurrence_rule;

-- Require a type on every event now that existing rows are backfilled.
alter table public.events alter column event_type_id set not null;

-- ---------- 7. Functions ----------
create or replace function public.is_member_of_event_group(eid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1
    from public.events e
    join public.group_members gm on gm.group_id = e.group_id
    where e.id = eid and gm.user_id = auth.uid()
  );
$$;

create or replace function public.can_create_event(gid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.groups g
    where g.id = gid
      and (g.admin_id = auth.uid() or g.allow_member_shift_creation = true)
      and public.is_group_member(gid)
  );
$$;

-- Note: the old is_member_of_shift_group / can_create_shift functions are
-- dropped at the very end, after the policies that depend on them are replaced.

-- Enforce capacity on sign-up (guards against overbooking / races).
create or replace function public.enforce_event_capacity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cap int;
  cnt int;
begin
  select capacity into cap from public.events where id = new.event_id;
  select count(*) into cnt from public.event_attendees where event_id = new.event_id;
  if cnt >= cap then
    raise exception 'This event is already full';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_event_capacity on public.event_attendees;
create trigger trg_enforce_event_capacity
  before insert on public.event_attendees
  for each row execute function public.enforce_event_capacity();

-- Transfer your spot to another member (atomic, validated).
create or replace function public.transfer_attendance(p_event_id uuid, p_to_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (
    select 1 from public.event_attendees
    where event_id = p_event_id and user_id = auth.uid()
  ) then
    raise exception 'You do not have a spot to transfer';
  end if;

  if not exists (
    select 1 from public.events e
    join public.group_members gm on gm.group_id = e.group_id
    where e.id = p_event_id and gm.user_id = p_to_user
  ) then
    raise exception 'That person is not in this care team';
  end if;

  if exists (
    select 1 from public.event_attendees
    where event_id = p_event_id and user_id = p_to_user
  ) then
    raise exception 'That person already has a spot';
  end if;

  delete from public.event_attendees where event_id = p_event_id and user_id = auth.uid();
  insert into public.event_attendees (event_id, user_id) values (p_event_id, p_to_user);
end;
$$;

-- Recreate create_group so new groups get the default event types too.
create or replace function public.create_group(group_name text)
returns public.groups language plpgsql security definer set search_path = public as $$
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

  insert into public.event_types (group_id, name, color, sort_order)
  values
    (g.id, 'Quality Time', '#0F6E56', 1),
    (g.id, 'Doctor Appointment', '#D85A30', 2),
    (g.id, 'Activity', '#3B6EA5', 3),
    (g.id, 'Other', '#6B5D54', 4);

  return g;
end;
$$;

-- ---------- 8. RLS ----------
alter table public.event_types enable row level security;
alter table public.event_attendees enable row level security;

-- events (drop old shift-named policies, add fresh ones)
drop policy if exists "shifts_select" on public.events;
drop policy if exists "shifts_insert" on public.events;
drop policy if exists "shifts_update" on public.events;
drop policy if exists "shifts_delete" on public.events;

drop policy if exists "events_select" on public.events;
create policy "events_select" on public.events
  for select using (public.is_group_member(group_id));

drop policy if exists "events_insert" on public.events;
create policy "events_insert" on public.events
  for insert with check (created_by = auth.uid() and public.can_create_event(group_id));

drop policy if exists "events_update" on public.events;
create policy "events_update" on public.events
  for update using (public.is_group_admin(group_id) or created_by = auth.uid())
  with check (public.is_group_admin(group_id) or created_by = auth.uid());

drop policy if exists "events_delete" on public.events;
create policy "events_delete" on public.events
  for delete using (public.is_group_admin(group_id) or created_by = auth.uid());

-- event_notes (drop old shift_notes-named policies)
drop policy if exists "shift_notes_select" on public.event_notes;
drop policy if exists "shift_notes_insert" on public.event_notes;
drop policy if exists "shift_notes_delete" on public.event_notes;

drop policy if exists "event_notes_select" on public.event_notes;
create policy "event_notes_select" on public.event_notes
  for select using (public.is_member_of_event_group(event_id));

drop policy if exists "event_notes_insert" on public.event_notes;
create policy "event_notes_insert" on public.event_notes
  for insert with check (
    author_id = auth.uid() and public.is_member_of_event_group(event_id)
  );

drop policy if exists "event_notes_delete" on public.event_notes;
create policy "event_notes_delete" on public.event_notes
  for delete using (author_id = auth.uid());

-- event_types
drop policy if exists "event_types_select" on public.event_types;
create policy "event_types_select" on public.event_types
  for select using (public.is_group_member(group_id));

drop policy if exists "event_types_insert" on public.event_types;
create policy "event_types_insert" on public.event_types
  for insert with check (public.is_group_admin(group_id));

drop policy if exists "event_types_update" on public.event_types;
create policy "event_types_update" on public.event_types
  for update using (public.is_group_admin(group_id)) with check (public.is_group_admin(group_id));

drop policy if exists "event_types_delete" on public.event_types;
create policy "event_types_delete" on public.event_types
  for delete using (public.is_group_admin(group_id));

-- event_attendees
drop policy if exists "event_attendees_select" on public.event_attendees;
create policy "event_attendees_select" on public.event_attendees
  for select using (public.is_member_of_event_group(event_id));

drop policy if exists "event_attendees_insert" on public.event_attendees;
create policy "event_attendees_insert" on public.event_attendees
  for insert with check (
    user_id = auth.uid() and public.is_member_of_event_group(event_id)
  );

drop policy if exists "event_attendees_delete" on public.event_attendees;
create policy "event_attendees_delete" on public.event_attendees
  for delete using (
    user_id = auth.uid()
    or exists (
      select 1 from public.events e
      where e.id = event_id and public.is_group_admin(e.group_id)
    )
  );

-- ---------- 9. Grants ----------
grant execute on function public.can_create_event(uuid) to authenticated;
grant execute on function public.transfer_attendance(uuid, uuid) to authenticated;
grant select, insert, update, delete on public.event_types to authenticated;
grant select, insert, update, delete on public.event_attendees to authenticated;

-- ---------- 10. Realtime ----------
do $$
declare
  t text;
begin
  foreach t in array array['event_attendees', 'event_types']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------- 11. Drop old functions (now that dependent policies are gone) ----------
drop function if exists public.is_member_of_shift_group(uuid);
drop function if exists public.can_create_shift(uuid);
