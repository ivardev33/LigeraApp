# AGENTS.md — Project memory for Ligera

Everything an agent needs to work on this repo without re-discovering context.
Keep this file up to date whenever the stack, architecture, or conventions change.

## What is Ligera

A mobile-first workout tracker (PWA) for **Ivar**

's** 5-day advanced training routine. The app lets the user:

- Start a `routineDays` template, or add exercises by hand
- Log each set with kg / reps / RIR, mark sets complete to trigger a rest timer
- Save sessions to Supabase (online-only, no offline cache)
- Review past workouts (History) and long-term strength trends (Progress)

> Product north star (deferred, not implemented): friend-to-friend competition
> (weekly volume leaderboards). The schema was normalized with this in mind.

## Stack

- **Next.js** 16 (App Router), **React** 19, **TypeScript** 5.7
- **Tailwind CSS** v4 + **shadcn/ui** primitives in `components/ui/`
- **Recharts** (progress chart)
- **lucide-react** icons
- **Supabase**: `@supabase/supabase-js` + `@supabase/ssr` (auth + Postgres)
- **pnpm** package manager (v12+)

## Commands

```bash
pnpm dev            # local dev server
pnpm build          # production build (this is the deploy gate)
pnpm exec tsc --noEmit  # typecheck (fast; there is no lint script)
```

There is **no `lint` script**. Verify with `tsc --noEmit` + `pnpm build`.

## Architecture

```
app/
  layout.tsx      root layout: fonts, metadata, viewport, PWA manifest/sw
  page.tsx        session gate; tab router (workout/history/progress)
  globals.css     Tailwind v4 entry
proxy.ts          root middleware replaced by this proxy (Next 16, refreshed-cookies session)
components/       client UI screens + shared controls
  ui/             shadcn/ui primitives (button, input, ...)
lib/
  auth.ts         useSession, useUserId, useProfile, signUp/signIn/signOut
  data.ts         Workout types, fetchWorkouts, saveWorkout, deleteWorkout/Exercise, useWorkouts
  stats.ts        Epley 1RM, PRs, lastBestSet, shouldProgress, filters
  workout-data.ts exerciseOptions, routineDays, target helpers, DraftSet/DraftExercise
  supabase/
    client.ts     browser Supabase client (singleton)
    server.ts     server client via cookies
    middleware.ts updateSession helper consumed by root proxy.ts
supabase/migrations/   SQL migrations (0001_init, 0002_rir, ...)
scripts/generate-icons.mjs  pure-Node PNG icon generator (no deps)
public/           manifest.json, sw.js, icons/
docs/             ROADMAP.md, SUPABASE.md
```

Screens are interchangeable views rendered inside `app/page.tsx`, switched by
`BottomNav` (`components/bottom-nav.tsx`, 3 tabs: Workout · History · Progress).

## Data model (Postgres via Supabase)

- `profiles` — user_id (unique → auth.users), username. Auto-created by trigger on signup.
- `workouts` — user_id, date, elapsed_seconds
- `workout_exercises` — workout_id (FK), name, position
- `workout_sets` — exercise_id (FK), kg numeric(6,1), reps int, position, **rir smallint nullable (0–3)**

All cascade on delete. **RLS enabled** on every table:
- profiles: any authenticated user may **read** usernames (for the planned competition), owner can update.
- workouts/exercises/sets: **owner-only** on every operation (checks `auth.uid()` up the parent chain).

See `docs/SUPABASE.md` for applying migrations and the RLS reference.

## Auth flow

- Browser Supabase session stored in cookies via `@supabase/ssr`.
- `proxy.ts` refreshes the session on route access.
- `lib/auth.ts` exposes hooks; the anon key in `.env.local` is public by design
  (never use the service-role key client-side).
- `app/page.tsx` gates: loading → `AuthScreen` → app.

## Save / refresh model (important)

`useWorkouts()` is the single source of truth for logged data across screens.
It refreshes on mount, on auth change, **and** on a window event
`ligera:workouts-changed`. Every mutation (`saveWorkout`, `deleteWorkout`,
`deleteExercise`) must dispatch that event afterwards or other screens go stale.

## Conventions

- **Language**: exercise names, routine days, and target text are in **Spanish**
  (they come from the user's training plan). All UI chrome/labels are in **English**.
- **Theme**: dark only. Layout is a phone frame: `max-w-md`, `min-h-svh`,
  bottom nav, sticky headers with `backdrop-blur`.
- kg steppers use 2.5 kg increments, 0.1 precision; reps 1, integer.
- Estimated 1RM uses the **Epley** formula: `kg * (1 + reps/30)`.
- `Intl.NumberFormat('en-US')` for big numbers (kg values keep their own decimals).
- No code comments unless asked. Keep components small and typed.
- Migrations live in `supabase/migrations/` but are applied **manually** in the
  Supabase SQL Editor (no supabase CLI linkage) — a new migration must always be
  communicated to the user with exact SQL to paste.

## Deploy

- **Vercel**, wired to GitHub: pushing to `main` auto-deploys.
- Remote: `origin` → `https://github.com/ivardev33/LigeraApp.git`.
- The user reviews before commit/push. Never commit or push unless explicitly told.

## Dotfiles / config

- `opencode.json` at the repo root (schema, MCP servers, no secrets —
  secrets come in via `{env:VAR}`).
- `.opencode/agent/*.md` defines specialized subagents (dba, workout-domain,
  deploy). `.opencode/` is committed.
- `.env.local` holds `SUPABASE_URL` + `SUPABASE_ANON_KEY` and is gitignored.
- `.env.example` documents every env var an agent/tool may need.
- After changing opencode config or agents, tell the user to **restart opencode**.

## Cross-cutting helpers

- `restSecondsFor(name)` → rest time for an exercise (routine lookup, default 85s).
- `targetText(te)` → shown on cards (e.g. `4 × 5–7 · RIR 1.5–2`).
- `shouldProgress(workouts, name, repsMax)` → true when the last session hit the
  top of the target rep range on every set (progressive overload hint).
- `exerciseNameOptions(workouts)` → includes old logged names so they persist in pickers.