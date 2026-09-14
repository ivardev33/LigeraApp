'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  defaultRoutineDays,
  type RoutineExercise,
} from '@/lib/workout-data'

export const ROUTINES_CHANGED = 'ligera:routines-changed'

export type ManagedRoutineExercise = RoutineExercise & { id: string }

export type ManagedRoutineDay = {
  id: string
  title: string
  exercises: ManagedRoutineExercise[]
}

type RoutineExerciseRow = {
  id: string
  name: string
  sets: number
  reps_min: number
  reps_max: number
  rir: string
  note: string | null
  bodyweight: boolean
  position: number
}

type RoutineRow = {
  id: string
  title: string
  position: number
  routine_exercises: RoutineExerciseRow[]
}

function toRoutineExercise(row: RoutineExerciseRow): ManagedRoutineExercise {
  return {
    id: row.id,
    name: row.name,
    sets: row.sets,
    repsMin: row.reps_min,
    repsMax: row.reps_max,
    rir: row.rir,
    note: row.note ?? '',
    bodyweight: row.bodyweight,
  }
}

function toRoutineDay(row: RoutineRow): ManagedRoutineDay {
  return {
    id: row.id,
    title: row.title,
    exercises: [...row.routine_exercises]
      .sort((a, b) => a.position - b.position)
      .map(toRoutineExercise),
  }
}

function notifyChanged() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(ROUTINES_CHANGED))
}

async function ensureSeeded(userId: string) {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('routines')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throw error
  if ((count ?? 0) !== 0) return

  for (let i = 0; i < defaultRoutineDays.length; i++) {
    const day = defaultRoutineDays[i]
    const { data: routine, error: dayError } = await supabase
      .from('routines')
      .insert({ user_id: userId, title: day.title, position: i })
      .select('id')
      .single()
    if (dayError) throw dayError

    if (day.exercises.length === 0) continue
    const { error: exError } = await supabase.from('routine_exercises').insert(
      day.exercises.map((ex, j) => ({
        routine_id: routine.id,
        name: ex.name,
        sets: ex.sets,
        reps_min: ex.repsMin,
        reps_max: ex.repsMax,
        rir: ex.rir,
        note: ex.note ?? null,
        bodyweight: ex.bodyweight ?? false,
        position: j,
      })),
    )
    if (exError) throw exError
  }
}

export async function fetchRoutines(userId: string): Promise<ManagedRoutineDay[]> {
  await ensureSeeded(userId)
  const supabase = createClient()
  const { data, error } = await supabase
    .from('routines')
    .select(
      'id, title, position, routine_exercises(id, name, sets, reps_min, reps_max, rir, note, bodyweight, position)',
    )
    .eq('user_id', userId)
    .order('position', { ascending: true })
  if (error) throw error
  return (data ?? []).map(toRoutineDay)
}

export async function createRoutine(userId: string, title: string) {
  const supabase = createClient()
  const { count } = await supabase
    .from('routines')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  const { error } = await supabase
    .from('routines')
    .insert({ user_id: userId, title, position: count ?? 0 })
  if (error) throw error
  notifyChanged()
}

export async function renameRoutine(routineId: string, title: string) {
  const supabase = createClient()
  const { error } = await supabase.from('routines').update({ title }).eq('id', routineId)
  if (error) throw error
  notifyChanged()
}

export async function deleteRoutine(routineId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('routines').delete().eq('id', routineId)
  if (error) throw error
  notifyChanged()
}

export type RoutineExerciseInput = {
  name: string
  sets: number
  repsMin: number
  repsMax: number
  rir: string
  note: string
  bodyweight?: boolean
}

export async function addRoutineExercise(routineId: string, input: RoutineExerciseInput) {
  const supabase = createClient()
  const { count } = await supabase
    .from('routine_exercises')
    .select('id', { count: 'exact', head: true })
    .eq('routine_id', routineId)
  const { error } = await supabase.from('routine_exercises').insert({
    routine_id: routineId,
    name: input.name,
    sets: input.sets,
    reps_min: input.repsMin,
    reps_max: input.repsMax,
    rir: input.rir,
    note: input.note || null,
    bodyweight: input.bodyweight ?? false,
    position: count ?? 0,
  })
  if (error) throw error
  notifyChanged()
}

export async function updateRoutineExercise(exerciseId: string, patch: Partial<RoutineExerciseInput>) {
  const supabase = createClient()
  const payload: Record<string, string | number | boolean | null> = {}
  if (patch.name !== undefined) payload.name = patch.name
  if (patch.sets !== undefined) payload.sets = patch.sets
  if (patch.repsMin !== undefined) payload.reps_min = patch.repsMin
  if (patch.repsMax !== undefined) payload.reps_max = patch.repsMax
  if (patch.rir !== undefined) payload.rir = patch.rir
  if (patch.note !== undefined) payload.note = patch.note || null
  if (patch.bodyweight !== undefined) payload.bodyweight = patch.bodyweight
  if (Object.keys(payload).length === 0) return

  const { error } = await supabase
    .from('routine_exercises')
    .update(payload)
    .eq('id', exerciseId)
  if (error) throw error
  notifyChanged()
}

export async function deleteRoutineExercise(exerciseId: string) {
  const supabase = createClient()
  const { error } = await supabase.from('routine_exercises').delete().eq('id', exerciseId)
  if (error) throw error
  notifyChanged()
}

export function useRoutines() {
  const [routines, setRoutines] = useState<ManagedRoutineDay[]>([])
  const refresh = useCallback(async (userId: string) => {
    try {
      setRoutines(await fetchRoutines(userId))
    } catch (e) {
      console.error('Failed to load routines', e)
      setRoutines([])
    }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let active = true

    const applyUser = (userId: string | null | undefined) => {
      if (!active || !userId) return
      refresh(userId)
    }

    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: { user: { id: string } | null } | null } }) =>
        applyUser(data.session?.user?.id),
      )

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, session: { user: { id: string } | null } | null) => {
      applyUser(session?.user?.id)
    })

    const onChanged = () => {
      supabase.auth
        .getSession()
        .then(({ data }: { data: { session: { user: { id: string } | null } | null } }) =>
          applyUser(data.session?.user?.id),
        )
    }
    window.addEventListener(ROUTINES_CHANGED, onChanged)

    return () => {
      active = false
      subscription.unsubscribe()
      window.removeEventListener(ROUTINES_CHANGED, onChanged)
    }
  }, [refresh])

  return routines
}