# Supabase — how it is wired

Reference for everything database / auth related in Ligera.

## Applying migrations (manual)

There is **no supabase CLI linkage** in this repo. Migrations are SQL files in
`supabase/migrations/` that the user pastes into the
[Supabase SQL Editor](https://supabase.com/dashboard) and runs by hand.

1. Open the project → **SQL Editor**.
2. Paste the full contents of the migration file.
3. Run it.
4. Confirm no errors.

Migrations are ordered by number and are safe to re-run (all `create` / `alter`
statements below are idempotent or guarded).

### `0001_init.sql`

Core schema. Run first. Creates:

- `profiles` (user_id unique → auth.users, username)
- `workouts` (user_id, date, elapsed_seconds)
- `workout_exercises` (workout_id FK, name, position)
- `workout_sets` (exercise_id FK, kg numeric(6,1), reps, position)
- `pgcrypto` extension (UUID gen)
- Enables **RLS** on all four tables
- Policies: profiles readable by any authenticated user (competition prep),
  owner-updatable; workouts/exercises/sets owner-only on every operation
  (`auth.uid()` checks up the parent chain)
- `handle_new_user()` trigger → auto-creates a profile on signup

### `0002_rir.sql`

Adds the per-set effort field for the workout log:

```sql
alter table public.workout_sets
  add column if not exists rir smallint;
```

`rir` is nullable, range 0–3 (0 = to failure, higher = easier). RLS-passthrough:
the db is the seed of truth for values.

## Row Level Security reference

| operation      | profiles                        | workouts / exercises / sets          |
| -------------- | ------------------------------- | ------------------------------------ |
| `select`       | any authenticated user          | owner only                           |
| `insert`       | — (trigger on signup)           | owner only (`user_id` / parent chain)|
| `update`       | owner only                      | owner only                           |
| `delete`       | —                               | owner only (cascade)                 |

All child-table policies resolve ownership through the parent workout
(`exists (select 1 from workouts w where w.id = workout_id and w.user_id = auth.uid())`).

## Env vars (`.env.local`, gitignored)

| var                     | required | purpose                                  |
| ----------------------- | -------- | ---------------------------------------- |
| `SUPABASE_URL`          | yes      | project API URL                          |
| `SUPABASE_ANON_KEY`     | yes      | browser client (public by design)        |

Mirrored in `.env.example` so agents/tools know the required set.

## MCP servers (for AI tooling, optional)

Configured in `opencode.json` under `mcp`, all **disabled by default** so a missing
token never breaks startup. To enable, set the env vars below, then flip `enabled` to
`true` in the config.

| server      | env vars needed                                             | note                                    |
| ----------- | ----------------------------------------------------------- | --------------------------------------- |
| `supabase-db` | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`            | official server, project-scoped        |
| `postgres`  | `DATABASE_URL`                                              | direct Postgres connection              |
| `github`    | `GITHUB_PERSONAL_ACCESS_TOKEN`                              | for PR / issues / deploy tooling        |
| `vercel`    | none (OAuth at `https://mcp.vercel.com`)                    | remote, beta — enable only if needed    |

Where to get each token:

- **Supabase PAT**: dashboard → Account → Access Tokens.
- **Project ref**: dashboard → project → Settings → API, the subdomain prefix
  (e.g. `abcxyz`) or from the `SUPABASE_URL` host (`https://<ref>.supabase.co`).
- **DATABASE_URL**: project → Settings → Database → connection string + password.
- **GitHub PAT**: github.com → Settings → Developer settings → PAT (classic, `repo` scope).
- Vercel uses its own OAuth; needs interactive browser sign-in.

Never commit tokens. They enter config via `{env:VAR}` interpolation.