import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { useLocale } from '../contexts/LocaleContext'
import { useShow505Config } from '../contexts/Show505Context'
import StreamEmbedPlayer from './StreamEmbedPlayer'
import { parseStreamEmbed } from '../utils/streamEmbed'

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromDatetimeLocal(value) {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export default function Show505Admin() {
  const { t } = useLocale()
  const { config, reload: reloadConfig } = useShow505Config()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [form, setForm] = useState({
    event_title: '505',
    event_note: '',
    event_venue: '',
    event_starts_at: '',
    stream_url: '',
    stream_live: false,
    is_active: false,
  })
  const parentHost = typeof window !== 'undefined' ? window.location.hostname : ''
  const embedPreview = useMemo(
    () => parseStreamEmbed(form.stream_url, parentHost),
    [form.stream_url, parentHost]
  )

  useEffect(() => {
    if (config) {
      setForm({
        event_title: config.event_title || '505',
        event_note: config.event_note || '',
        event_venue: config.event_venue || '',
        event_starts_at: toDatetimeLocal(config.event_starts_at),
        stream_url: config.stream_url || '',
        stream_live: Boolean(config.stream_live),
        is_active: Boolean(config.is_active),
      })
    }
  }, [config])

  const save = async (patch = {}) => {
    setBusy(true)
    setMsg('')
    try {
      const payload = {
        event_title: (patch.event_title ?? form.event_title).trim() || '505',
        event_note: patch.event_note ?? form.event_note,
        event_venue: (patch.event_venue ?? form.event_venue).trim() || null,
        event_starts_at:
          patch.event_starts_at !== undefined
            ? fromDatetimeLocal(patch.event_starts_at)
            : fromDatetimeLocal(form.event_starts_at),
        stream_url: (patch.stream_url ?? form.stream_url).trim() || null,
        stream_live: patch.stream_live ?? form.stream_live,
        is_active: patch.is_active ?? form.is_active,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('show505_config').update(payload).eq('id', 1)
      if (error) throw error
      await reloadConfig()
      setMsg(t('show505.admin.saved'))
    } catch (e) {
      setMsg(e.message || t('common.uploadFailed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mt-12 pt-10 border-t border-line">
      <h2 className="display text-2xl text-[#FF6B35] mb-1">{t('show505.admin.title')}</h2>
      <p className="text-muted text-sm mb-6">{t('show505.admin.desc')}</p>

      {msg && <p className="text-sm text-emerald mb-4">{msg}</p>}

      <div className="rounded-xl border border-line bg-surface p-5 space-y-4 max-w-xl">
        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            disabled={busy}
            onChange={(e) => {
              const v = e.target.checked
              setForm((f) => ({ ...f, is_active: v }))
              save({ is_active: v })
            }}
            className="accent-[#FF6B35]"
          />
          {t('show505.admin.eventActive')}
        </label>

        <input
          type="text"
          value={form.event_title}
          onChange={(e) => setForm((f) => ({ ...f, event_title: e.target.value }))}
          onBlur={() => save()}
          placeholder={t('show505.admin.eventTitle')}
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white"
        />
        <input
          type="text"
          value={form.event_venue}
          onChange={(e) => setForm((f) => ({ ...f, event_venue: e.target.value }))}
          onBlur={() => save()}
          placeholder={t('show505.admin.eventVenue')}
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white"
        />
        <input
          type="datetime-local"
          value={form.event_starts_at}
          onChange={(e) => setForm((f) => ({ ...f, event_starts_at: e.target.value }))}
          onBlur={() => save()}
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white"
        />
        <textarea
          value={form.event_note}
          onChange={(e) => setForm((f) => ({ ...f, event_note: e.target.value }))}
          onBlur={() => save()}
          placeholder={t('show505.admin.eventNote')}
          rows={2}
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white"
        />

        <hr className="border-line" />

        <p className="text-xs font-bold tracking-widest uppercase text-[#FF6B35]">
          {t('show505.admin.streamSection')}
        </p>
        <input
          type="url"
          value={form.stream_url}
          onChange={(e) => setForm((f) => ({ ...f, stream_url: e.target.value }))}
          onBlur={() => save()}
          placeholder={t('show505.admin.streamUrl')}
          className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-white"
        />
        <p className="text-xs text-muted">{t('show505.admin.streamHint')}</p>

        {embedPreview ? (
          <div className="space-y-2">
            <p className="text-xs font-bold tracking-widest uppercase text-muted">
              {t('show505.admin.streamPreview')}
            </p>
            <StreamEmbedPlayer embed={embedPreview} title="505 preview" />
          </div>
        ) : form.stream_url.trim() ? (
          <p className="text-xs text-crimson">{t('show505.admin.invalidUrl')}</p>
        ) : null}

        <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
          <input
            type="checkbox"
            checked={form.stream_live}
            disabled={busy || !form.stream_url.trim()}
            onChange={(e) => {
              const v = e.target.checked
              setForm((f) => ({ ...f, stream_live: v }))
              save({ stream_live: v })
            }}
            className="accent-[#FF6B35]"
          />
          {t('show505.admin.streamLive')}
        </label>
      </div>
    </section>
  )
}
