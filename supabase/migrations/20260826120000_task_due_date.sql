-- Tasks now belong to a day.
alter table public.tasks add column if not exists due_date date;
