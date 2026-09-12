'use client'

import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NumberStepper({
  value,
  onChange,
  step = 2.5,
  min = 0,
  decimals = 1,
}: {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  decimals?: number
}) {
  const factor = 10 ** decimals
  const snap = (n: number) => Math.max(min, Math.round(n * factor) / factor)

  const rounded = Math.round(value * factor) / factor
  const display =
    decimals === 0
      ? String(rounded)
      : Number.isInteger(rounded)
        ? String(rounded)
        : rounded.toFixed(decimals)

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(snap(value - step))}
        aria-label="Decrease value"
        className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground active:translate-y-px"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-10 shrink-0 text-center font-mono text-sm font-medium tabular-nums text-foreground">
        {display}
      </span>
      <button
        type="button"
        onClick={() => onChange(snap(value + step))}
        aria-label="Increase value"
        className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground active:translate-y-px"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}