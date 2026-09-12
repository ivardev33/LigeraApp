'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type LoggedSet = {
  kg: number
  reps: number
}

export type LoggedExercise = {
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
      position: number
    }[]
  }[]
}

export function fetchWorkouts(userId: string): Promise<Workout[]> {
  const supabase = createClient()
  return supabase
    .from('workouts')
    .select(
      'id, date, elapsed_seconds, workout_exercises(id, name, position, workout_sets(kg, reps, position))',
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
            name: ex.name,
            sets: [...ex.workout_sets]
              .sort((a, b) => a.position - b.position)
              .map((s) => ({ kg: s.kg, reps: s.reps })),
          })),
      }))
    })
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
        position: setIndex,
      })),
    )
    if (setsError) throw setsError
  }
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

    supabase.auth.getSession().then(({ data }: { data: { session: { user: { id: string } | null } | null } }) => {
      if (!active) return
      const userId = data.session?.user?.id
      if (userId) refresh(userId)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user: { id: string } | null } | null) => {
      if (!active) return
      const userId = session?.user?.id
      if (userId) refresh(userId)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [refresh])

  return workouts
}