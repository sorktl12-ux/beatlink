import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { translate } from '../i18n'

const LocaleContext = createContext(null)
const STORAGE_KEY = 'beatlink-locale'

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'ko' ? 'ko' : 'en'
  })

  useEffect(() => {
    document.documentElement.lang = locale === 'ko' ? 'ko' : 'en'
    localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const setLocale = useCallback((next) => {
    setLocaleState(next === 'ko' ? 'ko' : 'en')
  }, [])

  const t = useCallback((key, vars) => translate(locale, key, vars), [locale])

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
