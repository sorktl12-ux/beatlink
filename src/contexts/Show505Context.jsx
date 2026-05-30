import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, supabaseConfigured } from '../supabase'
import { useAuth } from './AuthContext'

const Show505Context = createContext(null)

export function Show505Provider({ children }) {
  const { user } = useAuth()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!supabaseConfigured) {
      setConfig(null)
      setLoading(false)
      return
    }
    const { data, error } = await supabase.from('show505_config').select('*').eq('id', 1).maybeSingle()
    if (!error) setConfig(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    setLoading(true)
    reload()
  }, [reload, user?.id])

  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('show505:config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'show505_config' }, reload)
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [reload])

  const value = useMemo(
    () => ({
      config,
      loading,
      active: Boolean(config?.is_active),
      reload,
    }),
    [config, loading, reload]
  )

  return <Show505Context.Provider value={value}>{children}</Show505Context.Provider>
}

export function useShow505Config() {
  const ctx = useContext(Show505Context)
  if (!ctx) throw new Error('useShow505Config must be used within Show505Provider')
  return ctx
}
