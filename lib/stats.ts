import { exerciseOptions } from '@/lib/workout-data'
import type { LoggedSet, Workout } from '@/lib/data'

export const RANGES = ['1M', '3M', '6M', 'ALL'] as const
export type Range = (typeof RANGES)[number]

const RANGE_DAYS: Record<Range, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  ALL: Infinity,
}

const nf = new Intl.NumberFormat('en-US')

export function epley1Rm(kg: number, reps: number): number {
  if (kg <= 0 || reps <= 0) return 0
  if (reps === 1) return kg
  return Math.round(kg * (1 + reps / 30))
}

function fmtShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
}

export function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.round(seconds % 60)
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export type ProgressPoint = {
  date: string
  label: string
  oneRm: number
}

export function exerciseNameOptions(workouts: Workout[]): string[] {
  const used = Array.from(new Set(workouts.flatMap((w) => w.exercises.map((e) => e.name))))
  return Array.from(new Set([...exerciseOptions, ...used]))
}

export function lastBestSet(workouts: Workout[], name: string): LoggedSet | null {
  let last: LoggedSet | null = null
  let lastTime = -1
  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.name === name)
    if (!ex || ex.sets.length === 0) continue
    const t = new Date(w.date).getTime()
    if (t < lastTime) continue
    lastTime = t
    let best: LoggedSet | null = null
    for (const s of ex.sets) {
      if (!best || epley1Rm(s.kg, s.reps) > epley1Rm(best.kg, best.reps)) best = s
    }
    last = best
  }
  return last
}

export function lastSetNote(workouts: Workout[], name: string): string | null {
  const last = lastBestSet(workouts, name)
  if (!last) return null
  return `Last time: ${last.kg} kg × ${last.reps}`
}

export function bestPerWorkout(workouts: Workout[], name: string): ProgressPoint[] {
  const points: ProgressPoint[] = []
  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.name === name)
    if (!ex || ex.sets.length === 0) continue
    let best: LoggedSet = ex.sets[0]
    for (const s of ex.sets) {
      if (epley1Rm(s.kg, s.reps) > epley1Rm(best.kg, best.reps)) best = s
    }
    points.push({ date: w.date, label: fmtShort(w.date), oneRm: epley1Rm(best.kg, best.reps) })
  }
  return points.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

export function filterByRange<T extends { date: string }>(points: T[], range: Range): T[] {
  const cutoff = Date.now() - RANGE_DAYS[range] * 24 * 60 * 60 * 1000
  return points.filter((p) => new Date(p.date).getTime() >= cutoff)
}

export type MaxSet = { kg: number; reps: number }

export type ExerciseStats = {
  best1Rm: number
  best1RmDate: string | null
  maxWeight: MaxSet | null
  maxWeightDate: string | null
  totalVolume: number
  volumePr: number | null
  volumePrDate: string | null
  repPr: MaxSet | null
  repPrDate: string | null
  workoutCount: number
}

export function exerciseStats(workouts: Workout[], name: string): ExerciseStats {
  let best1Rm = 0
  let best1RmDate: string | null = null
  let maxWeight: MaxSet | null = null
  let maxWeightDate: string | null = null
  let totalVolume = 0
  let volumePr: number | null = null
  let volumePrDate: string | null = null
  let repPr: MaxSet | null = null
  let repPrDate: string | null = null
  let workoutCount = 0

  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.name === name)
    if (!ex || ex.sets.length === 0) continue
    workoutCount++
    let workoutVolume = 0
    for (const s of ex.sets) {
      workoutVolume += s.kg * s.reps
      const rm = epley1Rm(s.kg, s.reps)
      if (rm > best1Rm) {
        best1Rm = rm
        best1RmDate = w.date
      }
      if (!maxWeight || s.kg > maxWeight.kg) {
        maxWeight = { kg: s.kg, reps: s.reps }
        maxWeightDate = w.date
      }
      const betterRep =
        !repPr || (s.reps !== repPr.reps ? s.reps > repPr.reps : s.kg > repPr.kg)
      if (betterRep) {
        repPr = { kg: s.kg, reps: s.reps }
        repPrDate = w.date
      }
    }
    if (volumePr === null || workoutVolume > volumePr) {
      volumePr = workoutVolume
      volumePrDate = w.date
    }
    totalVolume += workoutVolume
  }

  return {
    best1Rm,
    best1RmDate,
    maxWeight,
    maxWeightDate,
    totalVolume,
    volumePr,
    volumePrDate,
    repPr,
    repPrDate,
    workoutCount,
  }
}

export type RecordKind = '1rm' | 'volume' | 'reps'

export type PersonalRecord = {
  id: string
  label: string
  value: string
  date: string
  kind: RecordKind
}

export function deriveRecords(s: ExerciseStats): PersonalRecord[] {
  if (s.workoutCount === 0) return []
  const dateText = (iso: string | null) => (iso ? fmtShort(iso) : '—')
  const records: PersonalRecord[] = []

  if (s.best1Rm > 0) {
    records.push({
      id: 'pr-1rm',
      label: 'Estimated 1RM',
      value: nf.format(s.best1Rm),
      date: dateText(s.best1RmDate),
      kind: '1rm',
    })
  }
  if (s.maxWeight) {
    records.push({
      id: 'pr-max',
      label: 'Max Weight',
      value: `${nf.format(s.maxWeight.kg)} × ${s.maxWeight.reps}`,
      date: dateText(s.maxWeightDate),
      kind: '1rm',
    })
  }
  if (s.volumePr && s.volumePr > 0) {
    records.push({
      id: 'pr-volume',
      label: 'Volume PR',
      value: nf.format(s.volumePr),
      date: dateText(s.volumePrDate),
      kind: 'volume',
    })
  }
  if (s.repPr) {
    records.push({
      id: 'pr-rep',
      label: 'Rep PR',
      value: `${nf.format(s.repPr.kg)} × ${s.repPr.reps}`,
      date: dateText(s.repPrDate),
      kind: 'reps',
    })
  }
  return records
}