'use client'

import { useMemo, useState } from 'react'
import { Award, ChevronDown, Flame, TrendingUp, Trophy, Weight } from 'lucide-react'
import { useWorkouts } from '@/lib/data'
import {
  RANGES,
  bestPerWorkout,
  deriveRecords,
  exerciseNameOptions,
  exerciseStats,
  filterByRange,
  type Range,
  type RecordKind,
} from '@/lib/stats'
import { ProgressChart } from '@/components/progress-chart'
import { cn } from '@/lib/utils'

const nf = new Intl.NumberFormat('en-US')

const prIcon: Record<RecordKind, typeof Trophy> = {
  '1rm': Trophy,
  volume: Flame,
  reps: Award,
}

function fmtValue(n: number): string {
  return nf.format(n)
}

export function AnalyticsScreen() {
  const workouts = useWorkouts()
  const names = useMemo(() => exerciseNameOptions(workouts), [workouts])
  const [selected, setSelected] = useState('')
  const [range, setRange] = useState<Range>('3M')

  const active = names.includes(selected) ? selected : (names[0] ?? '')
  const stats = useMemo(() => exerciseStats(workouts, active), [workouts, active])
  const records = useMemo(() => deriveRecords(stats), [stats])
  const points = useMemo(
    () => filterByRange(bestPerWorkout(workouts, active), range),
    [workouts, active, range],
  )

  const hasData = stats.workoutCount > 0
  const trend =
    points.length >= 2
      ? Math.round(((points[points.length - 1].oneRm - points[0].oneRm) / points[0].oneRm) * 100)
      : null

  const statCards = [
    { label: 'Estimated 1RM', unit: 'kg', value: hasData ? fmtValue(stats.best1Rm) : '—', icon: TrendingUp },
    {
      label: 'Max Weight',
      unit: 'kg',
      value: hasData && stats.maxWeight ? fmtValue(stats.maxWeight.kg) : '—',
      icon: Weight,
    },
    { label: 'Total Volume', unit: 'kg', value: hasData ? fmtValue(stats.totalVolume) : '—', icon: Flame },
  ]

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 px-4 pb-4 pt-5 backdrop-blur">
        <h1 className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Progress
        </h1>
        <div className="relative mt-2">
          <select
            value={active}
            onChange={(e) => setSelected(e.target.value)}
            aria-label="Select exercise"
            className="w-full appearance-none rounded-xl border border-border bg-card py-3 pl-4 pr-10 text-lg font-semibold text-foreground outline-none focus:border-primary/60"
          >
            {names.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        {workouts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
            <TrendingUp className="size-6 text-muted-foreground" />
            <p className="text-base font-semibold text-foreground">No progress yet</p>
            <p className="text-sm text-muted-foreground">
              Finish a workout and your lifts will show up here.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2.5">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="rounded-2xl border border-border bg-card p-3">
                    <Icon className="size-4 text-primary" />
                    <p className="mt-3 font-mono text-xl font-bold leading-none tabular-nums text-foreground">
                      {stat.value}
                      <span className="ml-0.5 text-xs font-medium text-muted-foreground">
                        {stat.unit}
                      </span>
                    </p>
                    <p className="mt-1.5 text-[11px] leading-tight text-muted-foreground text-pretty">
                      {stat.label}
                    </p>
                  </div>
                )
              })}
            </div>

            <section className="mt-4 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">1RM Progression</p>
                  <p className="text-xs text-muted-foreground">
                    Estimated one-rep max per logged session
                  </p>
                </div>
                {trend !== null && (
                  <span
                    className={cn(
                      'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                      trend >= 0 ? 'bg-primary/12 text-primary' : 'bg-destructive/10 text-destructive',
                    )}
                  >
                    <TrendingUp className={cn('size-3.5', trend < 0 && 'rotate-180')} />
                    {trend >= 0 ? '+' : ''}
                    {trend}%
                  </span>
                )}
              </div>

              <div className="mt-4">
                {hasData ? (
                  <ProgressChart data={points} />
                ) : (
                  <div className="flex h-56 w-full items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
                    No logged sessions for {active}
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-secondary/50 p-1">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={cn(
                      'flex-1 rounded-lg py-1.5 text-xs font-semibold transition-colors',
                      range === r
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>

            {records.length > 0 && (
              <section className="mt-4">
                <h2 className="px-1 text-sm font-semibold text-foreground">
                  Recent Personal Records
                </h2>
                <ul className="mt-2.5 flex flex-col gap-2">
                  {records.map((pr) => {
                    const Icon = prIcon[pr.kind]
                    return (
                      <li
                        key={pr.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-card px-3.5 py-3"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/12 text-primary">
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">{pr.label}</p>
                          <p className="text-xs text-muted-foreground">{pr.date}</p>
                        </div>
                        <span className="font-mono text-base font-bold tabular-nums text-foreground">
                          {pr.value}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}