import { useState } from 'react'
import { supabase, AUDIO_BUCKET, publicAudioUrl } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { BOARDS, RECRUIT_BOARDS, RECRUIT_MIN, RECRUIT_MAX } from '../constants'
import Modal from './Modal'
import EngineerClipPicker from './EngineerClipPicker'
import { trimAudioFile } from '../utils/audioClip'

export default function NewPostForm({ board, onClose, onCreated }) {
  const { user, profile } = useAuth()
  const meta = BOARDS.find((b) => b.id === board)
  const isEngineer = board === 'engineer'
  const hasRecruitSlots = RECRUIT_BOARDS.includes(board)
  const clipSeconds = meta?.clipSeconds ?? 10
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [recruitCount, setRecruitCount] = useState(1)
  const [file, setFile] = useState(null)
  const [clipStart, setClipStart] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const onFile = (f) => {
    setError('')
    setClipStart(0)
    setFile(f)
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError('Please enter a title.')
    if (!file) return setError('Please attach an audio file.')
    if (!file.type.startsWith('audio/')) return setError('Only audio files can be uploaded.')
    if (hasRecruitSlots) {
      const n = Number(recruitCount)
      if (!Number.isInteger(n) || n < RECRUIT_MIN || n > RECRUIT_MAX) {
        return setError(`Recruitment slots must be ${RECRUIT_MIN}–${RECRUIT_MAX}.`)
      }
    }

    setBusy(true)
    try {
      let uploadFile = file
      let contentType = file.type

      if (isEngineer) {
        try {
          const blob = await trimAudioFile(file, clipStart, clipSeconds)
          uploadFile = new File([blob], 'clip.wav', { type: 'audio/wav' })
          contentType = 'audio/wav'
        } catch (trimErr) {
          console.error(trimErr)
          throw new Error('Could not trim audio. Try a different file format (MP3/WAV).')
        }
      }

      const ext = isEngineer ? 'wav' : file.name.split('.').pop()
      const path = `posts/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(path, uploadFile, { contentType })
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
        recruit_count: hasRecruitSlots ? Number(recruitCount) : null,
      })
      if (insErr) throw insErr
      onCreated?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError(err.message || 'Upload failed.')
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
        {hasRecruitSlots && (
          <p className="text-xs text-gold bg-gold/10 border border-gold/30 rounded-lg px-3 py-2">
            Set how many collaborators you want to recruit. Anyone can apply — there is no
            limit on applications.
          </p>
        )}
        {isEngineer && (
          <p className="text-xs text-teal bg-teal/10 border border-teal/30 rounded-lg px-3 py-2">
            Pick a <strong>10-second section</strong> from your mix/master — drag the slider,
            preview it, then upload.
          </p>
        )}
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none"
            placeholder={isEngineer ? 'e.g. Trap single — mix & master' : 'e.g. Looking for a trap hook collab'}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">Details</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none resize-none"
            placeholder="Describe the work (artist, genre, your role)."
          />
        </div>
        {hasRecruitSlots && (
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Recruitment slots
            </label>
            <input
              type="number"
              min={RECRUIT_MIN}
              max={RECRUIT_MAX}
              value={recruitCount}
              onChange={(e) => setRecruitCount(e.target.value)}
              className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white focus:border-gold focus:outline-none"
            />
            <p className="text-[11px] text-muted mt-1.5">
              Number of collaborators to greenlight ({RECRUIT_MIN}–{RECRUIT_MAX}).
              Unlimited people can still apply.
            </p>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">
            {isEngineer ? 'Source Track' : 'Attach Audio'}
          </label>
          <input
            type="file"
            accept="audio/*"
            onChange={(e) => onFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-gold file:text-ink file:font-bold file:px-4 file:py-2 file:cursor-pointer hover:file:bg-gold-hi"
          />
          {file && !isEngineer && (
            <p className="text-xs text-muted mt-1.5">{file.name}</p>
          )}
        </div>

        {isEngineer && file && (
          <EngineerClipPicker
            file={file}
            clipSeconds={clipSeconds}
            startSec={clipStart}
            onStartChange={setClipStart}
          />
        )}

        {error && (
          <p className="text-crimson text-sm bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || (isEngineer && !file)}
          className="w-full rounded-lg bg-gold text-ink font-bold py-3 hover:bg-gold-hi transition-colors disabled:opacity-50"
        >
          {busy ? (isEngineer ? 'Trimming & uploading…' : 'Uploading...') : 'Upload'}
        </button>
      </form>
    </Modal>
  )
}
