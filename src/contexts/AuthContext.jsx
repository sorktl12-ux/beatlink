import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from '../supabase'
import { ADMIN_ID, toEmail, toDbPassword } from '../constants'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabaseConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      if (!data.session) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session) {
        setProfile(null)
        setLoading(false)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true

    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      if (active) {
        setProfile(data ? { uid: data.id, ...data } : null)
        setLoading(false)
      }
    }
    load()

    const channel = supabase
      .channel(`profile:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          if (active && payload.new) setProfile({ uid: payload.new.id, ...payload.new })
        }
      )
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [user])

  const isAdmin = profile?.role === 'admin'

  const requireConfig = () => {
    if (!supabaseConfigured)
      throw new Error('Supabase config required. Fill in your .env file first.')
  }

  const signup = async ({ id, password, role, fullName, phone }) => {
    requireConfig()
    const username = String(id).trim()
    if (username.toLowerCase() === ADMIN_ID) {
      throw new Error('This ID is not available.')
    }
    const { data, error } = await supabase.auth.signUp({
      email: toEmail(username),
      password: toDbPassword(password),
    })
    if (error) throw error
    const newUser = data.user
    if (!newUser) throw new Error('Sign up failed. Check email confirmation settings.')

    const { error: pErr } = await supabase.from('profiles').insert({
      id: newUser.id,
      username,
      full_name: String(fullName).trim(),
      phone: String(phone).trim(),
      role,
    })
    if (pErr) throw pErr
    return newUser
  }

  const login = async ({ id, password }) => {
    requireConfig()
    const email = toEmail(String(id).trim())
    let { error } = await supabase.auth.signInWithPassword({
      email,
      password: toDbPassword(password),
    })
    if (error) {
      const fallback = await supabase.auth.signInWithPassword({ email, password })
      error = fallback.error
    }
    if (error) throw error
  }

  const logout = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      isAdmin,
      isAuthed: !!user,
      loading,
      signup,
      login,
      logout,
    }),
    [user, profile, isAdmin, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
