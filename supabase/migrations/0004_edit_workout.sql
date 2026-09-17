-- ---------------------------------------------------------------
-- update_logged_workout: atomic edit of a saved session
-- Replaces the workout's exercises/sets in place, preserving the
-- workout id and original date. Optional elapsed override.
-- ---------------------------------------------------------------
create or replace function public.update_logged_workout(
  p_workout_id uuid,
  p_elapsed integer default null,
  p_exercises jsonb default '[]'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ex record;
  ex_id uuid;
  set_json jsonb;
  i int;
  j int;
begin
  if not exists (
    select 1 from public.workouts w
    where w.id = p_workout_id and w.user_id = auth.uid()
  ) then
    raise exception 'Forbidden: workout does not belong to the signed-in user';
  end if;

  if p_exercises is null or jsonb_typeof(p_exercises) <> 'array' then
    raise exception 'p_exercises must be a JSON array';
  end if;

  if p_elapsed is not null then
    update public.workouts
       set elapsed_seconds = p_elapsed
     where id = p_workout_id;
  end if;

  delete from public.workout_exercises
   where workout_id = p_workout_id;

  i := 0;
  for ex in
    select value from jsonb_array_elements(p_exercises)
  loop
    insert into public.workout_exercises (workout_id, name, position)
    values (p_workout_id, ex.value ->> 'name', i)
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