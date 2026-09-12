'use client'

import { useState } from 'react'
import { Dumbbell } from 'lucide-react'
import { signInWithEmail, signUpWithEmail } from '@/lib/auth'
import { cn } from '@/lib/utils'

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setSubmitting(true)

    if (mode === 'signup') {
      const { needsConfirmation, error: signUpError } = await signUpWithEmail(email, password)
      if (signUpError) {
        setError(signUpError.message)
      } else if (needsConfirmation) {
        setNotice('Almost there — check your inbox to confirm your email.')
        setPassword('')
      }
    } else {
      const { error: signInError } = await signInWithEmail(email, password)
      if (signInError) setError(signInError.message)
    }

    setSubmitting(false)
  }

  const isSignup = mode === 'signup'

  return (
    <div className="flex h-full flex-col items-center justify-center px-6">
      <div className="flex w-full max-w-xs flex-col items-center gap-2">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
          <Dumbbell className="size-6" strokeWidth={2.2} />
        </span>
        <h1 className="mt-1 text-2xl font-bold text-foreground">Iron Log</h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          {isSignup
            ? 'Create an account to start tracking your lifts.'
            : 'Sign in to pick up where you left off.'}
        </p>
      </div>

      <form onSubmit={submit} className="w-full max-w-xs">
        <div className="rounded-2xl border border-border bg-card p-4">
          <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mb-4 h-11 w-full rounded-xl border border-border bg-secondary px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60"
          />
          <label className="mb-1.5 block text-xs font-semibold text-foreground" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className="h-11 w-full rounded-xl border border-border bg-secondary px-3.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60"
          />

          {error && (
            <p className="mt-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </p>
          )}
          {notice && (
            <p className="mt-3 rounded-lg bg-primary/12 px-3 py-2 text-xs text-primary">{notice}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 flex h-11 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
          >
            {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </div>
      </form>

      <button
        type="button"
        onClick={() => setMode(isSignup ? 'signin' : 'signup')}
        className="mt-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        {isSignup ? (
          <>
            Already have an account? <span className="font-semibold text-primary">Sign in</span>
          </>
        ) : (
          <>
            New here? <span className="font-semibold text-primary">Create an account</span>
          </>
        )}
      </button>
    </div>
  )
}