-- Ligera migration 0002
-- Add per-set RIR (reps in reserve) to the workout log.
-- 0 = to failure, 1 = one rep in reserve ... nullable until logged.
-- Run this in the Supabase SQL Editor.

alter table public.workout_sets
  add column if not exists rir smallint
  check (rir is null or rir between 0 and 3);