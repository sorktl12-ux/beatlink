import { useEffect, useMemo, useState } from 'react'
import { useLocale } from '../contexts/LocaleContext'
import StreamEmbedPlayer from './StreamEmbedPlayer'
import {
  formatCountdown,
  isShow505EventDay,
  msUntil,
  parseStreamEmbed,
} from '../utils/streamEmbed'

export default function Show505Live({ config, isAdmin }) {
  const { locale, t } = useLocale()
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const eventDay = isShow505EventDay(config?.event_starts_at, new Date(now))
  const until = msUntil(config?.event_starts_at)
  const countdown = formatCountdown(until, locale)
  const parentHost = typeof window !== 'undefined' ? window.location.hostname : ''
  const embed = useMemo(
    () => parseStreamEmbed(config?.stream_url, parentHost),
    [config?.stream_url, parentHost]
  )

  const streamLive = Boolean(config?.stream_live)
  const memberCanWatch = Boolean(embed && streamLive && eventDay)
  const adminCanPreview = Boolean(isAdmin && embed && !memberCanWatch)

  if (memberCanWatch || adminCanPreview) {
    return (
      <div className="space-y-4">
        {adminCanPreview && (
          <p className="text-orange text-xs font-semibold">{t('show505.live.adminPreview')}</p>
        )}
        {streamLive && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-crimson" />
            </span>
            <span className="text-crimson text-xs font-bold tracking-widest uppercase">
              {t('show505.live.onAir')}
            </span>
          </div>
        )}
        <StreamEmbedPlayer embed={embed} />
        <p className="text-muted text-xs">{t('show505.live.hint')}</p>
      </div>
    )
  }

  if (isAdmin && config?.stream_url?.trim() && !embed) {
    return (
      <div className="rounded-2xl border border-crimson/40 bg-crimson/10 p-8 text-center">
        <p className="text-crimson text-sm font-semibold">{t('show505.live.invalidUrl')}</p>
        <p className="text-muted text-xs mt-2">{t('show505.live.invalidUrlHint')}</p>
      </div>
    )
  }

  if (eventDay && config?.stream_url && !streamLive) {
    return (
      <div className="rounded-2xl border border-[#FF6B35]/40 bg-[#FF6B35]/10 p-8 text-center">
        <p className="text-[#FF6B35] text-xs font-bold tracking-[0.3em] uppercase mb-3">
          {t('show505.live.eventDay')}
        </p>
        <p className="text-white font-semibold text-lg">{t('show505.live.waiting')}</p>
        <p className="text-muted text-sm mt-2">{t('show505.live.waitingDesc')}</p>
      </div>
    )
  }

  if (!eventDay && until != null && until > 0) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-muted text-xs font-bold tracking-[0.3em] uppercase mb-3">
          {t('show505.live.countdownLabel')}
        </p>
        {countdown && (
          <p className="display text-4xl sm:text-5xl text-[#FF6B35]">{countdown}</p>
        )}
        <p className="text-muted text-sm mt-4">{t('show505.live.countdownDesc')}</p>
      </div>
    )
  }

  if (eventDay && !config?.stream_url) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-muted text-sm">{isAdmin ? t('show505.live.noUrlAdmin') : t('show505.live.noUrl')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-8 text-center">
      <p className="text-muted text-sm">{t('show505.live.ended')}</p>
    </div>
  )
}
