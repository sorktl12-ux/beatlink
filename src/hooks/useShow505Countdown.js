import { useEffect, useMemo, useState } from 'react'

export function useShow505Countdown(eventStartsAt) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  return useMemo(() => {
    if (!eventStartsAt) return { ms: null, remaining: null }
    const t = new Date(eventStartsAt).getTime()
    if (Number.isNaN(t)) return { ms: null, remaining: null }
    const remaining = t - now
    return { ms: remaining, remaining: Math.max(0, remaining) }
  }, [eventStartsAt, now])
}

export function countdownParts(ms) {
  if (ms == null || ms <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, past: true }
  }
  const sec = Math.floor(ms / 1000)
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
    past: false,
  }
}

export function formatCountdownNav(ms, locale) {
  const p = countdownParts(ms)
  if (p.past) return 'D-Day'
  return `D-${p.days}`
}

export function formatCountdownMain(ms, locale) {
  const p = countdownParts(ms)
  if (p.past) return 'D-Day'
  if (locale === 'ko') {
    return `D-${p.days} ${p.hours}시간 ${p.minutes}분 ${p.seconds}초`
  }
  return `D-${p.days} ${p.hours}h ${p.minutes}m ${p.seconds}s`
}
