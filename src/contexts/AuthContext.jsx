import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from '../supabase'
import { ADMIN_ID, ADMIN_PW, ADMIN_DB_PW, toEmail, toDbPassword } from '../constants'

const AuthContext = createContext(null)

const ADMIN_KEY = 'beatlink_admin_session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isAdmin, setIsAdmin] = useState(
    () => sessionStorage.getItem(ADMIN_KEY) === '1'
  )
  const [loading, setLoading] = useState(true)

  // Subscribe to Supabase auth state
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

  // Load + live-subscribe to the signed-in member's profile
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
      credits: 0,
    })
    if (pErr) throw pErr
    return newUser
  }

  const login = async ({ id, password }) => {
    const username = String(id).trim()
    // Admin login: hardcoded check + a real Supabase account so the admin can post
    if (username.toLowerCase() === ADMIN_ID && password === ADMIN_PW) {
      sessionStorage.setItem(ADMIN_KEY, '1')
      setIsAdmin(true)
      if (supabaseConfigured) {
        const adminEmail = toEmail(ADMIN_ID)
        let res = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: ADMIN_DB_PW,
        })
        if (res.error) {
          const up = await supabase.auth.signUp({ email: adminEmail, password: ADMIN_DB_PW })
          if (!up.error && !up.data.session) {
            await supabase.auth.signInWithPassword({ email: adminEmail, password: ADMIN_DB_PW })
          }
        }
        const uid = (await supabase.auth.getSession()).data.session?.user?.id
        if (uid) {
          await supabase
            .from('profiles')
            .upsert(
              { id: uid, username: ADMIN_ID, role: 'admin', seller_approved: true },
              { onConflict: 'id' }
            )
        }
      }
      return { admin: true }
    }
    requireConfig()
    const email = toEmail(username)
    let { error } = await supabase.auth.signInWithPassword({
      email,
      password: toDbPassword(password),
    })
    // Backward compat: accounts created before the suffix used the raw password.
    if (error) {
      const fallback = await supabase.auth.signInWithPassword({ email, password })
      error = fallback.error
    }
    if (error) throw error
    return { admin: false }
  }

  const logout = async () => {
    sessionStorage.removeItem(ADMIN_KEY)
    setIsAdmin(false)
    if (supabase) await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  const value = {
    user,
    profile,
    isAdmin,
    isAuthed: isAdmin || !!user,
    loading,
    signup,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
