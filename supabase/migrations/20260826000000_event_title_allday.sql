-- Add an optional title and an all-day flag to events.
alter table public.events
  add column if not exists title text,
  add column if not exists all_day boolean not null default false;
