'use client'

import { LogOut } from 'lucide-react'
import { signOut, useProfile } from '@/lib/auth'
import { useUserId } from '@/lib/auth'

export function UserMenu() {
  const userId = useUserId()
  const profile = useProfile(userId)
  const name = profile?.username || 'you'
  const initial = name.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div className="flex items-center gap-2">
      <span className="flex size-7 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
        {initial}
      </span>
      <span className="max-w-28 truncate text-sm font-semibold text-foreground">{name}</span>
      <button
        type="button"
        onClick={() => signOut()}
        aria-label="Sign out"
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  )
}