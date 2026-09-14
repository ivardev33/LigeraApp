'use client'

import { useEffect, useRef, useState } from 'react'
import { Minus, Plus } from 'lucide-react'

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

  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(display)

  const valueRef = useRef(value)
  useEffect(() => {
    valueRef.current = value
  }, [value])

  function commit(raw: string) {
    const parsed = parseFloat(raw.replace(',', '.'))
    if (!Number.isNaN(parsed)) onChange(snap(parsed))
    setEditing(false)
  }

  const repeatRef = useRef<number | null>(null)

  function stopRepeat() {
    if (repeatRef.current !== null) {
      window.clearInterval(repeatRef.current)
      repeatRef.current = null
    }
  }

  function startRepeat(dir: 1 | -1) {
    const nudge = () => onChange(snap(valueRef.current + step * dir))
    nudge()
    if (repeatRef.current !== null) window.clearInterval(repeatRef.current)
    repeatRef.current = window.setInterval(nudge, 120)
  }

  useEffect(() => {
    const id = repeatRef.current
    return () => {
      if (id !== null) window.clearInterval(id)
    }
  }, [])

  const repeatProps = (dir: 1 | -1) => ({
    onPointerDown: () => startRepeat(dir),
    onPointerUp: stopRepeat,
    onPointerLeave: stopRepeat,
    onPointerCancel: stopRepeat,
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  })

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Decrease value"
        className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground active:translate-y-px"
        {...repeatProps(-1)}
      >
        <Minus className="size-3.5" />
      </button>

      {editing ? (
        <input
          value={text}
          autoFocus
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
            if (e.key === 'Escape') setEditing(false)
          }}
          inputMode={decimals === 0 ? 'numeric' : 'decimal'}
          className="w-12 rounded-md border border-primary/60 bg-secondary px-1 py-0.5 text-center font-mono text-sm font-medium tabular-nums text-foreground outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setText(display)
            setEditing(true)
          }}
          aria-label="Type value"
          className="w-12 shrink-0 text-center font-mono text-sm font-medium tabular-nums text-foreground transition-colors hover:text-primary"
        >
          {display}
        </button>
      )}

      <button
        type="button"
        aria-label="Increase value"
        className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground active:translate-y-px"
        {...repeatProps(1)}
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  )
}