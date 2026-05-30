/** Parse YouTube / Twitch URLs into embed iframe src. */
export function parseStreamEmbed(url, parentHost) {
  const raw = String(url || '').trim()
  if (!raw) return null

  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, '')

    if (host === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      if (id) return { type: 'iframe', src: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` }
    }

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (u.pathname.startsWith('/embed/')) {
        return { type: 'iframe', src: raw.includes('?') ? raw : `${raw}?autoplay=1&rel=0` }
      }
      const v = u.searchParams.get('v')
      if (v) return { type: 'iframe', src: `https://www.youtube.com/embed/${v}?autoplay=1&rel=0` }
      const live = u.pathname.match(/^\/live\/([^/?]+)/)
      if (live?.[1]) return { type: 'iframe', src: `https://www.youtube.com/embed/${live[1]}?autoplay=1&rel=0` }
    }

    if (host === 'twitch.tv') {
      const channel = u.pathname.split('/').filter(Boolean)[0]
      if (channel && parentHost) {
        return {
          type: 'iframe',
          src: `https://player.twitch.tv/?channel=${encodeURIComponent(channel)}&parent=${encodeURIComponent(parentHost)}&autoplay=true`,
        }
      }
    }

    if (host === 'player.twitch.tv') {
      if (parentHost && !u.searchParams.has('parent')) {
        u.searchParams.set('parent', parentHost)
      }
      return { type: 'iframe', src: u.toString() }
    }

    if (/\.(m3u8|mp4)(\?|$)/i.test(u.pathname) || u.pathname.includes('m3u8')) {
      return { type: 'hls', src: raw }
    }
  } catch {
    return null
  }

  if (raw.startsWith('https://') && raw.includes('/embed')) {
    return { type: 'iframe', src: raw }
  }

  return null
}

export function eventDayKey(iso, timeZone = 'Asia/Seoul') {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

export function isShow505EventDay(eventStartsAt, now = new Date()) {
  if (!eventStartsAt) return false
  return eventDayKey(eventStartsAt) === eventDayKey(now.toISOString())
}

export function msUntil(iso) {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  return t - Date.now()
}

export function formatCountdown(ms, locale) {
  if (ms == null || ms <= 0) return null
  const sec = Math.floor(ms / 1000)
  const d = Math.floor(sec / 86400)
  const h = Math.floor((sec % 86400) / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  const pad = (n) => String(n).padStart(2, '0')
  if (locale === 'ko') {
    if (d > 0) return `${d}일 ${h}시간 ${m}분`
    if (h > 0) return `${h}시간 ${m}분 ${s}초`
    return `${m}분 ${s}초`
  }
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${s}s`
  return `${m}m ${s}s`
}
