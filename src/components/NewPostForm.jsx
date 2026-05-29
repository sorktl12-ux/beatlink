import { useState } from 'react'
import { supabase, AUDIO_BUCKET, publicAudioUrl } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { BOARDS, ENGINEER_CLIP_MAX } from '../constants'
import Modal from './Modal'

// Reads the duration (seconds) of an audio file in the browser.
function readAudioDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(Number.isFinite(audio.duration) ? audio.duration : null)
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    audio.src = url
  })
}

export default function NewPostForm({ board, onClose, onCreated }) {
  const { user, profile } = useAuth()
  const meta = BOARDS.find((b) => b.id === board)
  const isEngineer = board === 'engineer'
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [duration, setDuration] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const onFile = async (f) => {
    setError('')
    setDuration(null)
    setFile(f)
    if (f && f.type.startsWith('audio/')) {
      const d = await readAudioDuration(f)
      setDuration(d)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Please enter a title.')
    if (!file) return setError('Please attach an audio file.')
    if (!file.type.startsWith('audio/')) return setError('Only audio files can be uploaded.')
    if (isEngineer && duration != null && duration > ENGINEER_CLIP_MAX) {
      return setError(
        `Engineer clips must be a ~10-second excerpt (your file is ${Math.round(
          duration
        )}s). Please trim it down first.`
      )
    }
    setBusy(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `posts/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(path, file, { contentType: file.type })
      if (upErr) throw upErr
      const audioUrl = publicAudioUrl(path)

      const { error: insErr } = await supabase.from('posts').insert({
        board,
        author_id: user.id,
        author_name: profile?.username || 'anon',
        title: title.trim(),
        description: description.trim(),
        audio_url: audioUrl,
        audio_path: path,
        status: 'approved',
      })
      if (insErr) throw insErr
      onCreated?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError('Upload failed: ' + (err.message || 'unknown error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`Drop Your Work${meta ? ` · ${meta.label}` : ''}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-xs text-emerald bg-emerald/10 border border-emerald/30 rounded-lg px-3 py-2">
          Your post goes live on the board right away.
        </p>
        {isEngineer && (
          <p className="text-xs text-teal bg-teal/10 border border-teal/30 rounded-lg px-3 py-2">
            Showcase your work: upload a <strong>10-second excerpt</strong> of a track you mixed
            or mastered.
          </p>
        )}
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none"
            placeholder="e.g. Looking for a trap hook collab"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">Details</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none resize-none"
            placeholder="Describe the vibe and the kind of collab you want."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">
            {isEngineer ? 'Attach 10-Second Clip' : 'Attach Audio'}
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-gold file:text-ink file:font-bold file:px-4 file:py-2 file:cursor-pointer hover:file:bg-gold-hi"
          />
          {file && (
            <p className="text-xs text-muted mt-1.5">
              {file.name}
              {duration != null && ` · ${Math.round(duration)}s`}
            </p>
          )}
          {isEngineer && duration != null && duration > ENGINEER_CLIP_MAX && (
            <p className="text-xs text-orange mt-1.5">
              This clip is {Math.round(duration)}s — please trim it to about 10 seconds.
            </p>
          )}
        </div>
        {error && (
          <p className="text-crimson text-sm bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-gold text-ink font-bold py-3 hover:bg-gold-hi transition-colors disabled:opacity-50"
        >
          {busy ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </Modal>
  )
}
