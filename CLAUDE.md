# Tornasol — project conventions

## Database migrations (IMPORTANT)

All database schema changes are tracked as versioned migration files and are
**always committed with the change that needs them**. Never change the database
in a way the repo can't reproduce.

Rules — follow these every time:

1. **Every schema change gets a migration file** in `supabase/migrations/`.
   This includes tables, columns, indexes, RLS policies, functions/RPCs,
   triggers, grants, and realtime publication changes. No ad-hoc changes made
   only in the Supabase dashboard — if it changed the database, it must exist as
   a migration in the repo.
2. **Never edit an already-applied/committed migration** to alter the schema.
   Add a **new** migration instead. (Editing the initial migration is only okay
   before it has ever been applied anywhere.)
3. **Always `git add` the migration file(s)** in the same commit as the code
   that depends on them. A commit that needs a schema change is incomplete
   without its migration. Before committing, verify with
   `git status supabase/migrations/` that new/changed migrations are staged.
4. **Migration filenames** use the Supabase CLI timestamp convention:
   `YYYYMMDDHHMMSS_short_description.sql`. Create them with
   `npm run migration:new <name>` so the timestamp is generated correctly.
5. **Keep migrations idempotent where practical** (`create ... if not exists`,
   `create or replace`, `drop policy if exists` before `create policy`) so they
   can be re-applied safely.
6. `supabase/migrations/` is tracked in git and must never be added to
   `.gitignore`. Only the CLI's local state (`supabase/.temp`, `.branches`,
   `.env`) is ignored.

### Workflow

- New change: `npm run migration:new <name>` → write SQL → `npm run db:push`
  (applies to the linked remote) → commit the new file.
- Apply everything to a fresh DB: `npm run db:push` (remote) or
  `npm run db:reset` (local Docker stack, re-runs all migrations + `seed.sql`).
- See `README.md` → "Managing the database" for the full command list.

## Stack / layout

- React + Vite, React Router, Supabase (auth + Postgres + realtime), plain CSS.
- Design tokens live only in `src/styles/global.css` ("Amanecer" system) —
  reference the CSS custom properties, never hardcode hex values in components.
- Supabase access goes through `src/lib/api.js`; auth/group state lives in
  `src/context/`.

## Git

- Develop on the branch `claude/tornasol-caregiving-app-kn7o7t` (tracked by
  PR #1). Push to that branch to update the PR.
