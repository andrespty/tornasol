-- ============================================================
-- Fix: PostgREST returned 403 "permission denied" on table reads
-- (profiles, group_members, groups, ...).
--
-- Row Level Security decides WHICH ROWS a user can see, but the API
-- roles still need a base table-level GRANT to access the tables at
-- all. The initial migration enabled RLS and created policies but did
-- not grant table privileges to the `authenticated` role, so every
-- read/write from the app was rejected before RLS was even evaluated.
--
-- These grants are safe: the RLS policies from the initial migration
-- still restrict row access. Granting privileges only lets the roles
-- reach the tables; the policies still gate the data.
-- ============================================================

grant usage on schema public to anon, authenticated;

-- Logged-in users: full DML on the app tables, gated by RLS policies.
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Make sure tables created by future migrations are covered too.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

-- Note: the anon (pre-login) role needs no table grants — the only
-- pre-login data access is the invite lookup, which goes through the
-- SECURITY DEFINER function public.invite_group_name(uuid), already
-- granted to anon in the initial migration.
