'use client'

import { Check, Plus, Trash2, X } from 'lucide-react'
import type { DraftExercise, DraftSet } from '@/lib/workout-data'
import { cn } from '@/lib/utils'
import { NumberStepper } from '@/components/number-stepper'

const RIR_ORDER = [0, 1, 2, 3] as const

const RIR_CLASSES: Record<number, string> = {
  0: 'bg-red-500/15 text-red-400',
  1: 'bg-orange-500/15 text-orange-400',
  2: 'bg-yellow-500/15 text-yellow-400',
  3: 'bg-emerald-500/15 text-emerald-400',
}

function cycleRir(value: number | null | undefined): number | null {
  if (value == null) return RIR_ORDER[0]
  const idx = RIR_ORDER.indexOf(value as (typeof RIR_ORDER)[number])
  if (idx < 0 || idx === RIR_ORDER.length - 1) return null
  return RIR_ORDER[idx + 1]
}

export function ExerciseCard({
  exercise,
  lastNote,
  onToggleSet,
  onChangeSet,
  onSetRir,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
}: {
  exercise: DraftExercise
  lastNote: string | null
  onToggleSet: (setId: string) => void
  onChangeSet: (setId: string, patch: Partial<DraftSet>) => void
  onSetRir: (setId: string, rir: number | null) => void
  onAddSet: () => void
  onRemoveSet: (setId: string) => void
  onRemoveExercise: () => void
}) {
  const done = exercise.sets.filter((s) => s.done).length

  return (
    <section className="rounded-2xl border border-border bg-card">
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-4">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground text-balance">{exercise.name}</h2>
          {exercise.target && (
            <p className="mt-0.5 text-xs font-semibold text-primary">{exercise.target}</p>
          )}
          {exercise.nextKg != null && (
            <p className="mt-0.5 text-xs font-bold text-emerald-400">
              ↑ Next: {exercise.nextKg} kg
            </p>
          )}
          {lastNote && <p className="mt-1 text-sm text-muted-foreground">{lastNote}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
            {done}/{exercise.sets.length} sets
          </span>
          <button
            type="button"
            onClick={onRemoveExercise}
            aria-label="Remove exercise"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>

      <ul className="px-2 py-2">
        {exercise.sets.map((set, i) => (
          <li
            key={set.id}
            className={cn(
              'flex items-center gap-2 rounded-xl px-2 py-2 transition-colors',
              set.done && 'bg-primary/8',
            )}
          >
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-semibold tabular-nums',
                set.done ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground',
              )}
            >
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                kg
              </p>
              <NumberStepper
                value={set.kg}
                step={2.5}
                min={0}
                decimals={1}
                onChange={(kg) => onChangeSet(set.id, { kg })}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                reps
              </p>
              <NumberStepper
                value={set.reps}
                step={1}
                min={0}
                decimals={0}
                onChange={(reps) => onChangeSet(set.id, { reps })}
              />
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSetRir(set.id, cycleRir(set.rir))}
                aria-label={`Cycle RIR for set ${i + 1}`}
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition-colors',
                  set.rir != null ? RIR_CLASSES[set.rir] : 'bg-secondary text-muted-foreground/70',
                )}
              >
                {set.rir != null ? `RIR${set.rir}` : 'RIR'}
              </button>
              <button
                type="button"
                onClick={() => onToggleSet(set.id)}
                aria-pressed={set.done}
                aria-label={`Mark set ${i + 1} ${set.done ? 'incomplete' : 'complete'}`}
                className={cn(
                  'flex size-9 items-center justify-center rounded-lg border transition-all',
                  set.done
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-secondary text-muted-foreground hover:border-primary/60 hover:text-foreground',
                )}
              >
                <Check className="size-4" strokeWidth={3} />
              </button>
              <button
                type="button"
                onClick={() => onRemoveSet(set.id)}
                aria-label={`Remove set ${i + 1}`}
                className="rounded-md p-1 text-muted-foreground/60 transition-colors hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="px-3 pb-3">
        <button
          type="button"
          onClick={onAddSet}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 py-3.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/50 hover:bg-secondary"
        >
          <Plus className="size-4" />
          Add Set
        </button>
      </div>
    </section>
  )
}