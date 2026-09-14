'use client'

import { useEffect, useState } from 'react'
import { CalendarRange, ChevronRight, Flag, Plus, X } from 'lucide-react'
import {
  exerciseOptions,
  targetText,
  type DraftExercise,
  type DraftSet,
  type RoutineDay,
} from '@/lib/workout-data'
import { saveWorkout, useWorkouts } from '@/lib/data'
import { useRoutines } from '@/lib/routines'
import { fmtDuration, lastBestSet, lastSetNote, shouldProgress } from '@/lib/stats'
import { useUserId } from '@/lib/auth'
import { ExerciseCard } from '@/components/exercise-card'

let idCounter = 0
const uid = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`

let sessionStarted: number | null = null

function getSessionStart() {
  if (sessionStarted == null) sessionStarted = Date.now()
  return sessionStarted
}

function resetSessionStart() {
  sessionStarted = null
}

function newSet(prev?: DraftSet): DraftSet {
  return {
    id: uid('s'),
    kg: prev?.kg ?? 20,
    reps: prev?.reps ?? 8,
    done: false,
  }
}

export function WorkoutScreen({ onOpenRoutines }: { onOpenRoutines: () => void }) {
  const [elapsed, setElapsed] = useState(() =>
    Math.floor((Date.now() - getSessionStart()) / 1000),
  )
  const [draft, setDraft] = useState<DraftExercise[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [routineOpen, setRoutineOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const workouts = useWorkouts()
  const routines = useRoutines()
  const userId = useUserId()

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - getSessionStart()) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const completedSets = draft.reduce((n, ex) => n + ex.sets.filter((s) => s.done).length, 0)
  const totalSets = draft.reduce((n, ex) => n + ex.sets.length, 0)

  function updateExercise(id: string, updater: (ex: DraftExercise) => DraftExercise) {
    setDraft((prev) => prev.map((ex) => (ex.id === id ? updater(ex) : ex)))
  }

  function addExercise(name: string) {
    if (draft.some((ex) => ex.name === name)) return
    const last = lastBestSet(workouts, name)
    const first = last
      ? { id: uid('s'), kg: last.kg, reps: last.reps, done: false }
      : newSet()
    setDraft((prev) => [...prev, { id: uid('e'), name, sets: [first] }])
    setPickerOpen(false)
  }

  function startDay(day: RoutineDay) {
    setDraft((prev) => {
      const existing = new Set(prev.map((ex) => ex.name))
      const fresh: DraftExercise[] = []
      for (const te of day.exercises) {
        if (existing.has(te.name)) continue
        const last = lastBestSet(workouts, te.name)
        const progress =
          !te.bodyweight && last && shouldProgress(workouts, te.name, te.repsMax)
            ? Math.round((last.kg + 2.5) * 10) / 10
            : undefined
        fresh.push({
          id: uid('e'),
          name: te.name,
          target: targetText(te),
          note: te.note || undefined,
          nextKg: progress,
          sets: Array.from({ length: te.sets }, () => ({
            id: uid('s'),
            kg: te.bodyweight ? 0 : last?.kg ?? 20,
            reps: last?.reps ?? te.repsMin,
            done: false,
          })),
        })
      }
      return [...prev, ...fresh]
    })
    setRoutineOpen(false)
    setPickerOpen(false)
  }

  function toggleSet(exerciseId: string, setId: string) {
    updateExercise(exerciseId, (cur) => ({
      ...cur,
      sets: cur.sets.map((s) => (s.id === setId ? { ...s, done: !s.done } : s)),
    }))
  }

  async function commit() {
    if (!userId || draft.length === 0 || saving) return
    setSaving(true)
    setConfirming(false)
    try {
      await saveWorkout(userId, {
        id: uid('w'),
        date: new Date().toISOString(),
        elapsedSeconds: elapsed,
        exercises: draft
          .filter((ex) => ex.sets.length > 0)
          .map((ex) => ({
            id: ex.id,
            name: ex.name,
            sets: ex.sets.map((s) => ({ kg: s.kg, reps: s.reps, rir: s.rir ?? null })),
          })),
      })
      setDraft([])
      resetSessionStart()
      setElapsed(0)
      setPickerOpen(false)
      setRoutineOpen(false)
      setFlash({ kind: 'ok', text: 'Workout saved' })
    } catch (e) {
      const msg = (e as { message?: string } | null)?.message
      setFlash({
        kind: 'error',
        text: msg ? `Could not save: ${msg}` : 'Could not save workout. Check your connection.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-4 pb-4 pt-5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
              Active workout
            </span>
            <span className="mt-1.5 font-mono text-3xl font-bold tabular-nums text-foreground">
              {fmtDuration(elapsed)}
            </span>
          </div>
          {confirming ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={saving}
                className="rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm font-bold text-secondary-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={commit}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
              >
                <Flag className="size-4" strokeWidth={2.5} />
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={draft.length === 0 || saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
            >
              <Flag className="size-4" strokeWidth={2.5} />
              Finish
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-40">
        {draft.length === 0 && !pickerOpen && !routineOpen ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <Plus className="size-6 text-muted-foreground" />
            <div>
              <p className="text-base font-semibold text-foreground">Start today's session</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Load your routine for the day, or log exercises by hand.
              </p>
            </div>
            <div className="grid w-full gap-2">
              <button
                type="button"
                onClick={() => setRoutineOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90"
              >
                <CalendarRange className="size-4" />
                Start routine day
              </button>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                <Plus className="size-4" />
                Add exercises manually
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {draft.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                lastNote={lastSetNote(workouts, ex.name)}
                onToggleSet={(setId) => toggleSet(ex.id, setId)}
                onChangeSet={(setId, patch) =>
                  updateExercise(ex.id, (cur) => ({
                    ...cur,
                    sets: cur.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
                  }))
                }
                onSetRir={(setId, rir) =>
                  updateExercise(ex.id, (cur) => ({
                    ...cur,
                    sets: cur.sets.map((s) => (s.id === setId ? { ...s, rir } : s)),
                  }))
                }
                onAddSet={() =>
                  updateExercise(ex.id, (cur) => ({ ...cur, sets: [...cur.sets, newSet()] }))
                }
                onRemoveSet={(setId) =>
                  updateExercise(ex.id, (cur) => ({
                    ...cur,
                    sets: cur.sets.filter((s) => s.id !== setId),
                  }))
                }
                onRemoveExercise={() =>
                  setDraft((prev) => prev.filter((cur) => cur.id !== ex.id))
                }
              />
            ))}
          </div>
        )}

        {pickerOpen && (
          <div className="mt-4">
            <ExercisePicker onAdd={addExercise} onClose={() => setPickerOpen(false)} />
          </div>
        )}

        {routineOpen && (
          <div className="mt-4">
            <RoutinePicker
              routines={routines}
              onPick={startDay}
              onEdit={onOpenRoutines}
              onClose={() => setRoutineOpen(false)}
            />
          </div>
        )}

        {draft.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPickerOpen((open) => !open)}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <Plus className="size-4" />
              {pickerOpen ? 'Close' : 'Add Exercise'}
            </button>
            <button
              type="button"
              onClick={() => setRoutineOpen((open) => !open)}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              <CalendarRange className="size-4" />
              {routineOpen ? 'Close' : 'Routine Day'}
            </button>
          </div>
        )}

        {draft.length > 0 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {completedSets}/{totalSets} sets completed
          </p>
        )}
      </div>

      {flash && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-4">
          <div
            className={[
              'animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-xl',
              flash.kind === 'ok'
                ? 'border-border bg-popover text-popover-foreground'
                : 'border-destructive/40 bg-popover text-destructive',
            ].join(' ')}
          >
            {flash.text}
          </div>
        </div>
      )}
    </div>
  )
}

function ExercisePicker({
  onAdd,
  onClose,
}: {
  onAdd: (name: string) => void
  onClose: () => void
}) {
  const [custom, setCustom] = useState('')

  function submit() {
    const name = custom.trim()
    if (name) onAdd(name)
  }

  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <p className="text-sm font-semibold text-foreground">Add exercise</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2 px-4 pt-2">
        {exerciseOptions.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onAdd(opt)}
            className="rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-muted"
          >
            {opt}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-4 pb-4 pt-3">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Custom exercise name"
          className="h-9 flex-1 rounded-lg border border-border bg-secondary px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!custom.trim()}
          className="h-9 rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </section>
  )
}

function RoutinePicker({
  routines,
  onPick,
  onEdit,
  onClose,
}: {
  routines: RoutineDay[]
  onPick: (day: RoutineDay) => void
  onEdit: () => void
  onClose: () => void
}) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 pb-1 pt-4">
        <p className="text-sm font-semibold text-foreground">Your routines</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <ul className="px-2 pb-2 pt-1">
        {routines.map((day) => (
          <li key={day.id}>
            <button
              type="button"
              onClick={() => onPick(day)}
              className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary"
            >
              <span className="text-sm font-semibold text-foreground">{day.title}</span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onEdit}
          className="w-full rounded-xl border border-border bg-secondary py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          Manage routines
        </button>
      </div>
      <p className="px-4 pb-4 text-xs text-muted-foreground">
        Exercises are pre-filled with your target sets and reps. Weight starts from your last log.
      </p>
    </section>
  )
}