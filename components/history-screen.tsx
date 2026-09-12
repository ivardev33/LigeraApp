'use client'

import { useState } from 'react'
import { ChevronDown, Dumbbell } from 'lucide-react'
import { useWorkouts, type Workout } from '@/lib/data'
import { fmtDuration } from '@/lib/stats'
import { cn } from '@/lib/utils'

const nf = new Intl.NumberFormat('en-US')

function workoutSetCount(w: Workout) {
  return w.exercises.reduce((n, ex) => n + ex.sets.length, 0)
}

function workoutVolume(w: Workout) {
  return w.exercises.reduce((n, ex) => n + ex.sets.reduce((s, set) => s + set.kg * set.reps, 0), 0)
}

function fmtDay(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function HistoryScreen() {
  const workouts = useWorkouts()
  const [openId, setOpenId] = useState<string | null>(null)
  const sorted = [...workouts].reverse()

  if (sorted.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-4 pb-4 pt-5 backdrop-blur">
          <h1 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            History
          </h1>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <Dumbbell className="size-6 text-muted-foreground" />
          <p className="text-base font-semibold text-foreground">No workouts yet</p>
          <p className="text-sm text-muted-foreground">
            Once you finish a session it will show up here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-4 pb-4 pt-5 backdrop-blur">
        <h1 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          History
        </h1>
        <p className="mt-1.5 text-lg font-semibold text-foreground">
          {sorted.length} workout{sorted.length === 1 ? '' : 's'}
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        <ul className="flex flex-col gap-2.5">
          {sorted.map((w) => {
            const open = openId === w.id
            const sets = workoutSetCount(w)
            const volume = Math.round(workoutVolume(w))
            return (
              <li key={w.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : w.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">
                      {fmtDay(w.date)} · {fmtTime(w.date)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {w.exercises.length} exercise{w.exercises.length === 1 ? '' : 's'} · {sets} set
                      {sets === 1 ? '' : 's'} · {nf.format(volume)} kg
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-mono text-xs font-semibold tabular-nums text-muted-foreground">
                      {fmtDuration(w.elapsedSeconds)}
                    </span>
                    <ChevronDown
                      className={cn('size-4 text-muted-foreground transition-transform', open && 'rotate-180')}
                    />
                  </div>
                </button>

                {open && (
                  <div className="border-t border-border px-4 py-3">
                    <ul className="flex flex-col gap-2.5">
                      {w.exercises.map((ex, i) => (
                        <li key={i}>
                          <p className="text-xs font-semibold text-foreground">{ex.name}</p>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {ex.sets.length === 0 ? (
                              <span className="text-xs text-muted-foreground">No sets</span>
                            ) : (
                              ex.sets.map((s, j) => (
                                <span
                                  key={j}
                                  className="rounded-md bg-secondary px-2 py-1 font-mono text-xs tabular-nums text-muted-foreground"
                                >
                                  {s.kg} × {s.reps}
                                </span>
                              ))
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}