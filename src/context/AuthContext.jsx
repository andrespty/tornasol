import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  // Start "loading" so we can check for an existing session BEFORE deciding
  // whether to show the auth screen — returning PWA users skip login entirely.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session ?? null)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  // Keep the user's profile row handy for display name + avatar initials.
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setProfile(null)
      return
    }

    let active = true
    supabase
      .from('profiles')
      .select('id, email, display_name, avatar_initials')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile(data ?? null)
      })

    return () => {
      active = false
    }
  }, [session?.user?.id])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      loading,
      isAuthenticated: Boolean(session?.user),
      async signOut() {
        await supabase.auth.signOut()
      },
      async refreshProfile() {
        const userId = session?.user?.id
        if (!userId) return
        const { data } = await supabase
          .from('profiles')
          .select('id, email, display_name, avatar_initials')
          .eq('id', userId)
          .maybeSingle()
        setProfile(data ?? null)
      },
    }),
    [session, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
