-- Ligera migration 0003
-- 1) Per-user editable routine templates (routines + routine_exercises).
-- 2) Atomic workout save via the log_workout RPC (workout + exercises + sets in one transaction).
-- Run this in the Supabase SQL Editor.

-- ---------------------------------------------------------------
-- routines
-- ---------------------------------------------------------------
create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists routines_user_idx on public.routines (user_id, position);

-- ---------------------------------------------------------------
-- routine_exercises
-- ---------------------------------------------------------------
create table if not exists public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  name text not null,
  sets integer not null default 3,
  reps_min integer not null default 8,
  reps_max integer not null default 10,
  rir text not null default '1',
  note text,
  bodyweight boolean not null default false,
  position integer not null default 0
);

create index if not exists routine_exercises_routine_idx on public.routine_exercises (routine_id);

-- ---------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;

create policy "routines_select_own"
  on public.routines for select
  to authenticated
  using (auth.uid() = user_id);

create policy "routines_insert_own"
  on public.routines for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "routines_update_own"
  on public.routines for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "routines_delete_own"
  on public.routines for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "routine_exercises_select_own"
  on public.routine_exercises for select
  to authenticated
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

create policy "routine_exercises_insert_own"
  on public.routine_exercises for insert
  to authenticated
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

create policy "routine_exercises_update_own"
  on public.routine_exercises for update
  to authenticated
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

create policy "routine_exercises_delete_own"
  on public.routine_exercises for delete
  to authenticated
  using (
    exists (
      select 1 from public.routines r
      where r.id = routine_id and r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------
-- log_workout: atomic save of a whole session
-- ---------------------------------------------------------------
create or replace function public.log_workout(
  p_user_id uuid,
  p_date timestamptz default now(),
  p_elapsed integer default 0,
  p_exercises jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  w_id uuid;
  ex record;
  ex_id uuid;
  set_json jsonb;
  i int;
  j int;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'Forbidden: workout does not belong to the signed-in user';
  end if;

  if p_exercises is null or jsonb_typeof(p_exercises) <> 'array' then
    raise exception 'p_exercises must be a JSON array';
  end if;

  insert into public.workouts (user_id, date, elapsed_seconds)
  values (p_user_id, p_date, p_elapsed)
  returning id into w_id;

  i := 0;
  for ex in
    select value from jsonb_array_elements(p_exercises)
  loop
    insert into public.workout_exercises (workout_id, name, position)
    values (w_id, ex.value ->> 'name', i)
    returning id into ex_id;

    j := 0;
    for set_json in
      select value from jsonb_array_elements(coalesce(ex.value -> 'sets', '[]'::jsonb))
    loop
      insert into public.workout_sets (exercise_id, kg, reps, rir, position)
      values (
        ex_id,
        (set_json ->> 'kg')::numeric,
        (set_json ->> 'reps')::integer,
        (set_json ->> 'rir')::smallint,
        j
      );
      j := j + 1;
    end loop;

    i := i + 1;
  end loop;
end;
$$;