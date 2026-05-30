import { useLocale } from '../contexts/LocaleContext'

export function formatShow505When(iso, locale) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'ko' ? 'ko-KR' : 'en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(d)
}

export function show505EventLine(config, locale) {
  if (!config) return ''
  const when = formatShow505When(config.event_starts_at, locale)
  const venue = config.event_venue?.trim()
  if (when && venue) return `${venue} · ${when}`
  if (when) return when
  if (venue) return venue
  return ''
}

export default function Show505EventMeta({ config, className = '' }) {
  const { locale } = useLocale()
  const line = show505EventLine(config, locale)
  if (!line) return null
  return <p className={`text-muted text-sm leading-relaxed ${className}`.trim()}>{line}</p>
}
