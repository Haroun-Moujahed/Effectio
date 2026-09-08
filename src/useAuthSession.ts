import { useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { isSupabaseConfigured, supabase } from './lib/supabase'

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setReady(true)
      return
    }

    let active = true

    function applySession(nextSession: Session | null) {
      setSession(nextSession)
      setUser((prev) => {
        const next = nextSession?.user ?? null
        if (prev?.id === next?.id) return prev
        return next
      })
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      applySession(data.session)
      setReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
  }

  return { session, user, ready, signOut }
}
