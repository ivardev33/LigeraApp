'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export const WORKOUTS_CHANGED = 'ligera:workouts-changed'

export type LoggedSet = {
  kg: number
  reps: number
  rir?: number | null
}

export type LoggedExercise = {
  id: string
  name: string
  sets: LoggedSet[]
}

export type Workout = {
  id: string
  date: string
  elapsedSeconds: number
  exercises: LoggedExercise[]
}

type WorkoutRow = {
  id: string
  date: string
  elapsed_seconds: number
  workout_exercises: {
    id: string
    name: string
    position: number
    workout_sets: {
      kg: number
      reps: number
      rir: number | null
      position: number
    }[]
  }[]
}

export function fetchWorkouts(userId: string): Promise<Workout[]> {
  const supabase = createClient()
  return supabase
    .from('workouts')
    .select(
      'id, date, elapsed_seconds, workout_exercises(id, name, position, workout_sets(kg, reps, rir, position))',
    )
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .then(({ data, error }: { data: WorkoutRow[] | null; error: { message: string } | null }) => {
      if (error) throw error
      const rows = (data ?? []) as WorkoutRow[]
      return rows.map((row) => ({
        id: row.id,
        date: row.date,
        elapsedSeconds: row.elapsed_seconds,
        exercises: [...row.workout_exercises]
          .sort((a, b) => a.position - b.position)
          .map((ex) => ({
            id: ex.id,
            name: ex.name,
            sets: [...ex.workout_sets]
              .sort((a, b) => a.position - b.position)
              .map((s) => ({ kg: s.kg, reps: s.reps, rir: s.rir })),
          })),
      }))
    })
}

function notifyChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(WORKOUTS_CHANGED))
}

export async function saveWorkout(userId: string, workout: Workout) {
  const supabase = createClient()

  const { data: workoutRow, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      date: workout.date,
      elapsed_seconds: workout.elapsedSeconds,
    })
    .select('id')
    .single()
  if (workoutError) throw workoutError

  for (const [exIndex, ex] of workout.exercises.entries()) {
    const { data: exerciseRow, error: exerciseError } = await supabase
      .from('workout_exercises')
      .insert({ workout_id: workoutRow.id, name: ex.name, position: exIndex })
      .select('id')
      .single()
    if (exerciseError) throw exerciseError

    if (ex.sets.length === 0) continue

    const { error: setsError } = await supabase.from('workout_sets').insert(
      ex.sets.map((s, setIndex) => ({
        exercise_id: exerciseRow.id,
        kg: s.kg,
        reps: s.reps,
        rir: s.rir ?? null,
        position: setIndex,
      })),
    )
    if (setsError) throw setsError
  }

  notifyChanged()
}

export async function deleteWorkout(workoutId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('workouts').delete().eq('id', workoutId)
  if (error) throw error
  notifyChanged()
}

export async function deleteExercise(exerciseId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('workout_exercises').delete().eq('id', exerciseId)
  if (error) throw error
  notifyChanged()
}

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const refresh = useCallback(async (userId: string) => {
    try {
      setWorkouts(await fetchWorkouts(userId))
    } catch {
      setWorkouts([])
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let active = true

    const applyUser = (userId: string | null | undefined) => {
      if (!active || !userId) return
      refresh(userId)
    }

    supabase.auth.getSession().then(({ data }: { data: { session: { user: { id: string } | null } | null } }) => {
      applyUser(data.session?.user?.id)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user: { id: string } | null } | null) => {
      applyUser(session?.user?.id)
    })

    const onChanged = () => {
      supabase.auth
        .getSession()
        .then(({ data }: { data: { session: { user: { id: string } | null } | null } }) => applyUser(data.session?.user?.id))
    }
    window.addEventListener(WORKOUTS_CHANGED, onChanged)

    return () => {
      active = false
      subscription.unsubscribe()
      window.removeEventListener(WORKOUTS_CHANGED, onChanged)
    }
  }, [refresh])

  return workouts
}