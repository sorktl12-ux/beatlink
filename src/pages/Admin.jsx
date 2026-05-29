import { useCallback, useEffect, useState } from 'react'
import { supabase, AUDIO_BUCKET, publicAudioUrl } from '../supabase'
import { ADMIN_ID } from '../constants'

export default function Admin() {
  const [tab, setTab] = useState('members')
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="display text-4xl text-gold mb-1">ADMIN</h1>
      <p className="text-muted text-sm mb-8">Approve members and manage beats.</p>

      <div className="flex rounded-full bg-surface border border-line p-1 mb-8 w-full max-w-xs">
        {[
          { id: 'members', label: 'Members' },
          { id: 'beats', label: 'Beats' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
              tab === t.id ? 'bg-gold text-ink' : 'text-muted hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'members' && <Members />}
      {tab === 'beats' && <Beats />}
    </main>
  )
}

function Members() {
  const [members, setMembers] = useState([])
  const [busyId, setBusyId] = useState(null)

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('username', ADMIN_ID)
      .order('created_at', { ascending: false })
    setMembers(data || [])
  }, [])

  useEffect(() => {
    fetchMembers()
    const channel = supabase
      .channel('admin:members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchMembers)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchMembers])

  const setApproved = async (id, value) => {
    setBusyId(id)
    try {
      await supabase.from('profiles').update({ seller_approved: value }).eq('id', id)
      await fetchMembers()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <p className="text-muted text-sm mb-4">
        Approve members so they can post work on the boards and list items in the Market.
      </p>
      {members.length === 0 ? (
        <p className="text-muted text-sm">No members yet.</p>
      ) : (
        <ul className="space-y-3">
          {members.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-line bg-surface p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">
                  @{m.username}{' '}
                  <span className="text-xs text-muted font-normal uppercase">{m.role}</span>
                </p>
                <p className="text-xs text-muted mt-0.5 truncate">
                  {m.full_name || '—'}
                  {m.phone ? ` · ${m.phone}` : ''}
                </p>
                <p className="text-xs mt-0.5">
                  {m.seller_approved ? (
                    <span className="text-emerald">Approved to post</span>
                  ) : (
                    <span className="text-muted">Not approved to post</span>
                  )}
                </p>
              </div>
              {m.seller_approved ? (
                <button
                  onClick={() => setApproved(m.id, false)}
                  disabled={busyId === m.id}
                  className="shrink-0 rounded-lg border border-crimson/40 text-crimson text-sm font-bold px-4 py-2 hover:bg-crimson/10 transition-colors disabled:opacity-50"
                >
                  Revoke
                </button>
              ) : (
                <button
                  onClick={() => setApproved(m.id, true)}
                  disabled={busyId === m.id}
                  className="shrink-0 rounded-lg bg-emerald text-ink text-sm font-bold px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Approve
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Beats() {
  const [beats, setBeats] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const fetchBeats = useCallback(async () => {
    const { data } = await supabase
      .from('beats')
      .select('*')
      .order('created_at', { ascending: false })
    setBeats(data || [])
  }, [])

  useEffect(() => {
    fetchBeats()
  }, [fetchBeats])

  const upload = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Please enter a title.')
    if (!file) return setError('Please attach a beat file.')
    if (!file.type.startsWith('audio/')) return setError('Only audio files are allowed.')
    setBusy(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `beats/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(path, file, { contentType: file.type })
      if (upErr) throw upErr
      const audioUrl = publicAudioUrl(path)

      const { error: insErr } = await supabase.from('beats').insert({
        title: title.trim(),
        description: description.trim(),
        audio_url: audioUrl,
        audio_path: path,
      })
      if (insErr) throw insErr
      setTitle('')
      setDescription('')
      setFile(null)
      e.target.reset?.()
      await fetchBeats()
    } catch (err) {
      setError('Upload failed: ' + (err.message || ''))
    } finally {
      setBusy(false)
    }
  }

  const remove = async (beat) => {
    if (!confirm(`Delete the beat "${beat.title}"?`)) return
    try {
      await supabase.from('beats').delete().eq('id', beat.id)
      if (beat.audio_path) {
        await supabase.storage.from(AUDIO_BUCKET).remove([beat.audio_path])
      }
      await fetchBeats()
    } catch (err) {
      setError('Delete failed: ' + (err.message || ''))
    }
  }

  return (
    <div>
      <form onSubmit={upload} className="rounded-2xl border border-line bg-surface p-5 space-y-4">
        <h2 className="font-bold text-white">Upload New Beat</h2>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Beat title"
          className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description (BPM, key, mood, etc.)"
          className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none resize-none"
        />
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-gold file:text-ink file:font-bold file:px-4 file:py-2 file:cursor-pointer hover:file:bg-gold-hi"
        />
        {error && (
          <p className="text-crimson text-sm bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-gold text-ink font-bold px-5 py-2.5 hover:bg-gold-hi transition-colors disabled:opacity-50"
        >
          {busy ? 'Uploading...' : 'List Beat'}
        </button>
      </form>

      <h2 className="font-bold text-white mt-10 mb-4">
        Listed Beats <span className="text-muted">({beats.length})</span>
      </h2>
      {beats.length === 0 ? (
        <p className="text-muted text-sm">No beats listed yet.</p>
      ) : (
        <ul className="space-y-3">
          {beats.map((b) => (
            <li
              key={b.id}
              className="rounded-xl border border-line bg-surface p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">{b.title}</p>
                {b.description && (
                  <p className="text-muted text-sm truncate">{b.description}</p>
                )}
              </div>
              <button
                onClick={() => remove(b)}
                className="shrink-0 text-crimson text-sm font-bold hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
