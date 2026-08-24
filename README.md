# Tornasol 🌻

A warm, simple web app that helps families coordinate caregiving shifts for
someone they love. Built for people who are **not** tech-savvy — large text,
large buttons, high contrast, and as few steps per action as possible. It's a
PWA, so it can be added to the home screen and opened like a native app.

## Tech stack

- **React + Vite**
- **React Router** for routing
- **Supabase** for auth, database, and realtime updates
- **Plain CSS** with custom properties (the "Amanecer" design system) — no
  Tailwind, no component library
- **vite-plugin-pwa** for the manifest + service worker (installable)

## Getting started

### 1. Install

```bash
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, run the migration in
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   It creates every table, the row-level-security policies, helper functions,
   the invite/group RPCs, and turns on realtime.
3. In **Project Settings → API**, copy the **Project URL** and **anon public
   key**.
4. Copy the env template and paste those two values in:

   ```bash
   cp .env.example .env
   ```

   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

5. **Auth settings** (Supabase dashboard → Authentication):
   - Enable **Email** provider (email + password).
   - Add your app's URL (and `http://localhost:5173`) to the **Redirect URLs**
     so password-reset links work.
   - Optional: turn **"Confirm email"** off for the smoothest first-run
     experience. If you leave it on, new users must click a confirmation link
     before their session starts — the app handles both cases.

Until real credentials are present, the app shows a friendly "Almost ready"
setup screen instead of crashing.

### 3. Run

```bash
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

### 4. Build for production

```bash
npm run build
npm run preview   # preview the production build locally
```

Deploy the `dist/` folder to any static host (Netlify, Vercel, Cloudflare
Pages, etc.). Make sure the host is configured for **SPA fallback** (serve
`index.html` for unknown routes) so deep links like `/app/calendar` and
`/invite/:token` work.

## How it works

### Routes

| Route             | Purpose                                                        |
| ----------------- | -------------------------------------------------------------- |
| `/`               | Landing page (redirects to `/app` if already signed in)        |
| `/auth`           | Combined log in / create account, with "forgot password"       |
| `/reset-password` | Set a new password (opened from the reset email)               |
| `/invite/:token`  | Accept a group invite (routes through signup if needed)        |
| `/app`            | Dashboard — today's shifts + quick links                       |
| `/app/calendar`   | Week / month shift calendar (create, take, release, recurring) |
| `/app/tasks`      | Shared + assigned task list                                    |
| `/app/notes`      | Handoff-notes timeline for the whole group                     |
| `/app/group`      | Members, invites, admin settings, log out                      |

All `/app/*` routes are protected by an auth guard.

### Sessions

Supabase sessions are persisted (`persistSession` + `autoRefreshToken`), so a
home-screen install almost never shows the login screen again. There is no
"remember me" toggle — the session is always kept. A **Log out** button lives
in **Group → Account** for shared devices.

### Realtime

Shifts, tasks, notes, and membership changes update live for everyone in the
group via Supabase Realtime — no refresh needed.

### Data model

`profiles`, `groups`, `group_members`, `invites`, `shifts`, `shift_notes`,
`tasks` — all guarded by row-level security so members can only read/write data
for groups they belong to. See the migration file for the full schema.

## PWA / Add to Home Screen

The manifest, icons, iOS meta tags, and a minimal service worker are all set
up. On a phone, open the site in the browser and choose **Add to Home
Screen** — Tornasol installs full-screen with no browser chrome and reopens
straight into `/app` when already signed in.

### App icons

The icons in `public/icons/` are **generated placeholders** (a simple
terracotta sunflower — _tornasol_ is Spanish for sunflower). To regenerate
them after editing `scripts/generate-icons.js`:

```bash
npm run icons
```

Replace them with final brand art when it's ready — keep the same filenames and
sizes (192, 512, maskable 512, and a 180px apple-touch icon).

## Design system — "Amanecer"

All colors, type, spacing, and motion are CSS custom properties defined once in
[`src/styles/global.css`](src/styles/global.css). Components reference the
tokens rather than hardcoding values. Warm cream background, terracotta primary
actions, deep-teal secondary actions, peach handoff-note cards, Lora for
headings, and Atkinson Hyperlegible (designed for low vision) for all UI text.
