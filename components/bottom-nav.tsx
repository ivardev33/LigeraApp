'use client'

import { Dumbbell, LineChart } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Screen = 'workout' | 'progress'

const items: { id: Screen; label: string; icon: typeof Dumbbell }[] = [
  { id: 'workout', label: 'Workout', icon: Dumbbell },
  { id: 'progress', label: 'Progress', icon: LineChart },
]

export function BottomNav({
  active,
  onChange,
}: {
  active: Screen
  onChange: (s: Screen) => void
}) {
  return (
    <nav className="border-t border-border bg-card/80 backdrop-blur">
      <ul className="mx-auto flex max-w-md items-stretch">
        {items.map((item) => {
          const isActive = active === item.id
          const Icon = item.icon
          return (
            <li key={item.id} className="flex-1">
              <button
                type="button"
                onClick={() => onChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex w-full flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-5" strokeWidth={2.2} />
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
