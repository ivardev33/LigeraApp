'use client'

import { useEffect, useState } from 'react'
import { Flag, Plus, X } from 'lucide-react'
import { exerciseOptions, type DraftExercise, type DraftSet } from '@/lib/workout-data'
import { saveWorkout, useWorkouts } from '@/lib/data'
import { fmtDuration, lastSetNote } from '@/lib/stats'
import { useUserId } from '@/lib/auth'
import { ExerciseCard } from '@/components/exercise-card'
import { RestTimerBar } from '@/components/rest-timer-bar'

let idCounter = 0
const uid = (prefix: string) => `${prefix}-${Date.now()}-${idCounter++}`

function newSet(prev?: DraftSet): DraftSet {
  return {
    id: uid('s'),
    kg: prev?.kg ?? 20,
    reps: prev?.reps ?? 8,
    done: false,
  }
}

function newExercise(name: string): DraftExercise {
  return { id: uid('e'), name, sets: [newSet()] }
}

export function WorkoutScreen() {
  const [elapsed, setElapsed] = useState(0)
  const [draft, setDraft] = useState<DraftExercise[]>([])
  const [resting, setResting] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const workouts = useWorkouts()
  const userId = useUserId()

  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!flash) return
    const id = setTimeout(() => setFlash(null), 2600)
    return () => clearTimeout(id)
  }, [flash])

  const completedSets = draft.reduce((n, ex) => n + ex.sets.filter((s) => s.done).length, 0)
  const totalSets = draft.reduce((n, ex) => n + ex.sets.length, 0)

  function updateExercise(id: string, updater: (ex: DraftExercise) => DraftExercise) {
    setDraft((prev) => prev.map((ex) => (ex.id === id ? updater(ex) : ex)))
  }

  function addExercise(name: string) {
    if (draft.some((ex) => ex.name === name)) return
    setDraft((prev) => [...prev, newExercise(name)])
    setPickerOpen(false)
  }

  function toggleSet(exerciseId: string, setId: string) {
    updateExercise(exerciseId, (ex) => {
      const sets = ex.sets.map((s) => (s.id === setId ? { ...s, done: !s.done } : s))
      if (sets.find((s) => s.id === setId)?.done) setResting(true)
      return { ...ex, sets }
    })
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
          .map((ex) => ({ name: ex.name, sets: ex.sets.map((s) => ({ kg: s.kg, reps: s.reps })) })),
      })
      setDraft([])
      setElapsed(0)
      setResting(false)
      setPickerOpen(false)
      setFlash({ kind: 'ok', text: 'Workout saved' })
    } catch {
      setFlash({ kind: 'error', text: 'Could not save workout. Check your connection.' })
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
        {draft.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <Plus className="size-6 text-muted-foreground" />
            <p className="text-base font-semibold text-foreground">No exercises yet</p>
            <p className="text-sm text-muted-foreground">
              Add your first exercise to start logging sets.
            </p>
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

        <button
          type="button"
          onClick={() => setPickerOpen((open) => !open)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          <Plus className="size-4" />
          {pickerOpen ? 'Close' : draft.length === 0 ? 'Add First Exercise' : 'Add Exercise'}
        </button>

        {draft.length > 0 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {completedSets}/{totalSets} sets completed
          </p>
        )}
      </div>

      {resting && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-4">
          <div className="pointer-events-auto mx-auto max-w-md">
            <RestTimerBar onSkip={() => setResting(false)} />
          </div>
        </div>
      )}

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