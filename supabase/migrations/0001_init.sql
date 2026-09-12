-- Ligera schema for Supabase
-- Run this in the Supabase SQL Editor (or via supabase db push).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- workouts
-- ---------------------------------------------------------------
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date timestamptz not null default now(),
  elapsed_seconds integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists workouts_user_date_idx on public.workouts (user_id, date);

-- ---------------------------------------------------------------
-- workout_exercises
-- ---------------------------------------------------------------
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  name text not null,
  position integer not null default 0
);

create index if not exists workout_exercises_workout_idx on public.workout_exercises (workout_id);

-- ---------------------------------------------------------------
-- workout_sets
-- ---------------------------------------------------------------
create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  kg numeric(6,1) not null,
  reps integer not null,
  position integer not null default 0
);

create index if not exists workout_sets_exercise_idx on public.workout_sets (exercise_id);

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sets enable row level security;

-- profiles: any authenticated user may read usernames (competition prep),
-- but only the owner can update their own.
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- workouts: owner only.
create policy "workouts_select_own"
  on public.workouts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "workouts_insert_own"
  on public.workouts for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "workouts_update_own"
  on public.workouts for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workouts_delete_own"
  on public.workouts for delete
  to authenticated
  using (auth.uid() = user_id);

-- workout_exercises: owner via parent workout.
create policy "exercises_select_own"
  on public.workout_exercises for select
  to authenticated
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

create policy "exercises_insert_own"
  on public.workout_exercises for insert
  to authenticated
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

create policy "exercises_update_own"
  on public.workout_exercises for update
  to authenticated
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

create policy "exercises_delete_own"
  on public.workout_exercises for delete
  to authenticated
  using (
    exists (
      select 1 from public.workouts w
      where w.id = workout_id and w.user_id = auth.uid()
    )
  );

-- workout_sets: owner via parents.
create policy "sets_select_own"
  on public.workout_sets for select
  to authenticated
  using (
    exists (
      select 1
      from public.workout_exercises e
      join public.workouts w on w.id = e.workout_id
      where e.id = exercise_id and w.user_id = auth.uid()
    )
  );

create policy "sets_insert_own"
  on public.workout_sets for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.workout_exercises e
      join public.workouts w on w.id = e.workout_id
      where e.id = exercise_id and w.user_id = auth.uid()
    )
  );

create policy "sets_update_own"
  on public.workout_sets for update
  to authenticated
  using (
    exists (
      select 1
      from public.workout_exercises e
      join public.workouts w on w.id = e.workout_id
      where e.id = exercise_id and w.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.workout_exercises e
      join public.workouts w on w.id = e.workout_id
      where e.id = exercise_id and w.user_id = auth.uid()
    )
  );

create policy "sets_delete_own"
  on public.workout_sets for delete
  to authenticated
  using (
    exists (
      select 1
      from public.workout_exercises e
      join public.workouts w on w.id = e.workout_id
      where e.id = exercise_id and w.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------
-- Auto-create a profile on user signup
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, username)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'username', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();