'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export type Profile = {
  id: string
  username: string | null
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let active = true

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: string, next: Session | null) => {
      if (!active) return
      setSession(next)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  return { session, loading }
}

export function useUserId(): string | null {
  const { session } = useSession()
  return session?.user.id ?? null
}

export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username: email.split('@')[0] },
    },
  })
  return {
    user: data.user,
    needsConfirmation: !data.session && !!data.user,
    error,
  }
}

export async function signInWithEmail(email: string, password: string) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { session: data.session, error }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}

export function useProfile(userId: string | null): Profile | null {
  const [profile, setProfile] = useState<Profile | null>(null)
  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      return
    }
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('user_id', userId)
      .single()
    setProfile(data ?? null)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return profile
}