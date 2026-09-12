'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, SkipForward, Timer } from 'lucide-react'

function fmt(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function RestTimerBar({ seconds, onSkip }: { seconds: number; onSkip: () => void }) {
  const [remaining, setRemaining] = useState(seconds)
  const total = useRef(seconds)

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const pct = Math.max(0, Math.min(100, (remaining / total.current) * 100))

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-card shadow-lg shadow-black/40">
      <div
        className="absolute inset-y-0 left-0 bg-primary/12 transition-[width] duration-1000 ease-linear"
        style={{ width: `${pct}%` }}
        aria-hidden
      />
      <div className="relative flex items-center gap-3 px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Timer className="size-5" />
        </span>
        <div className="flex flex-col leading-none">
          <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Rest
          </span>
          <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
            {fmt(remaining)}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              total.current += 30
              setRemaining((r) => r + 30)
            }}
            className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-muted"
          >
            <Plus className="size-4" />
            30s
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <SkipForward className="size-4" />
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
