'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { exerciseOptions } from '@/lib/workout-data'

export function ExercisePicker({
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