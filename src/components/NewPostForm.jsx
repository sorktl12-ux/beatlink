import { useState } from 'react'
import { supabase, AUDIO_BUCKET, publicAudioUrl } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLocale } from '../contexts/LocaleContext'
import { BOARDS, RECRUIT_BOARDS, RECRUIT_MIN, RECRUIT_MAX } from '../constants'
import Modal from './Modal'
import EngineerClipPicker from './EngineerClipPicker'
import EngineerOfferFields, { validateEngineerOffer } from './EngineerOfferFields'
import { trimAudioFile } from '../utils/audioClip'
import { audioContentType, audioFileExtension, getAudioFileAccept, isAudioFile, isIOS } from '../utils/audioFile'
import { formatDbError } from '../utils/dbError'

export default function NewPostForm({ board, onClose, onCreated }) {
  const { user, profile } = useAuth()
  const { t } = useLocale()
  const meta = BOARDS.find((b) => b.id === board)
  const isEngineer = board === 'engineer'
  const hasRecruitSlots = RECRUIT_BOARDS.includes(board)
  const clipSeconds = meta?.clipSeconds ?? 10
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [recruitCount, setRecruitCount] = useState(1)
  const [file, setFile] = useState(null)
  const [clipStart, setClipStart] = useState(0)
  const [payKrw, setPayKrw] = useState('')
  const [mixScope, setMixScope] = useState('acapella')
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
    if (!title.trim()) return setError(t('form.errTitle'))
    if (!file) return setError(t('form.errAudio'))
    if (!isAudioFile(file)) return setError(t('form.errAudioType'))
    if (hasRecruitSlots) {
      const n = Number(recruitCount)
      if (!Number.isInteger(n) || n < RECRUIT_MIN || n > RECRUIT_MAX) {
        return setError(t('form.errRecruit', { min: RECRUIT_MIN, max: RECRUIT_MAX }))
      }
    }
    if (isEngineer) {
      const offerErr = validateEngineerOffer(payKrw, mixScope, t)
      if (offerErr) return setError(offerErr)
    }

    setBusy(true)
    try {
      let uploadFile = file
      let contentType = audioContentType(file)

      if (isEngineer) {
        try {
          const blob = await trimAudioFile(file, clipStart, clipSeconds)
          uploadFile = new File([blob], 'clip.wav', { type: 'audio/wav' })
          contentType = 'audio/wav'
        } catch (trimErr) {
          console.error(trimErr)
          throw new Error(t('form.errTrim'))
        }
      }

      const ext = isEngineer ? 'wav' : audioFileExtension(file)
      const path = `posts/${user.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from(AUDIO_BUCKET)
        .upload(path, uploadFile, { contentType })
      if (upErr) throw upErr
      const audioUrl = publicAudioUrl(path)

      const row = {
        board,
        author_id: user.id,
        author_name: profile?.username || 'anon',
        title: title.trim(),
        description: description.trim(),
        audio_url: audioUrl,
        audio_path: path,
        status: 'approved',
      }
      if (hasRecruitSlots) row.recruit_count = Number(recruitCount)
      if (isEngineer) {
        row.engineer_pay_krw = Number(payKrw)
        row.engineer_mix_scope = mixScope
      }

      const { error: insErr } = await supabase.from('posts').insert(row)
      if (insErr) throw insErr
      onCreated?.()
      onClose()
    } catch (err) {
      console.error(err)
      setError(formatDbError(err, t))
    } finally {
      setBusy(false)
    }
  }

  const titlePh = ['player', 'producer', 'engineer'].includes(board)
    ? t(`form.titlePh.${board}`)
    : t('form.titlePh.default')
  const detailsPh = ['player', 'producer', 'engineer'].includes(board)
    ? t(`form.detailsPh.${board}`)
    : t('form.detailsPh.default')

  const audioAccept = getAudioFileAccept()

  return (
    <Modal title={`${t('form.newListing')} · ${t(`boards.${board}.label`)}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-xs text-emerald bg-emerald/10 border border-emerald/30 rounded-lg px-3 py-2">
          {t('form.liveNotice')}
        </p>
        {hasRecruitSlots && (
          <p className="text-xs text-gold bg-gold/10 border border-gold/30 rounded-lg px-3 py-2">
            {t('form.recruitNotice')}
          </p>
        )}
        {isEngineer && (
          <p className="text-xs text-teal bg-teal/10 border border-teal/30 rounded-lg px-3 py-2">
            {t('form.engineerNotice')}
          </p>
        )}
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">{t('form.title')}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none"
            placeholder={titlePh}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">{t('form.details')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none resize-none"
            placeholder={detailsPh}
          />
        </div>
        {isEngineer && (
          <EngineerOfferFields
            payKrw={payKrw}
            onPayChange={setPayKrw}
            mixScope={mixScope}
            onMixScopeChange={setMixScope}
          />
        )}
        {hasRecruitSlots && (
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">{t('form.collabSlots')}</label>
            <input
              type="number"
              min={RECRUIT_MIN}
              max={RECRUIT_MAX}
              value={recruitCount}
              onChange={(e) => setRecruitCount(e.target.value)}
              className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white focus:border-gold focus:outline-none"
            />
            <p className="text-[11px] text-muted mt-1.5">
              {t('form.collabSlotsHint', { min: RECRUIT_MIN, max: RECRUIT_MAX })}
            </p>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">
            {isEngineer ? t('form.referenceTrack') : t('form.audio')}
          </label>
          <input
            type="file"
            {...(audioAccept ? { accept: audioAccept } : {})}
            onChange={(e) => onFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-gold file:text-ink file:font-bold file:px-4 file:py-2 file:cursor-pointer hover:file:bg-gold-hi"
          />
          {isIOS() && (
            <p className="text-[11px] text-muted mt-1.5 leading-relaxed">{t('form.iosAudioHint')}</p>
          )}
          {file && !isEngineer && <p className="text-xs text-muted mt-1.5">{file.name}</p>}
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
          {busy ? (isEngineer ? t('form.processing') : t('form.uploading')) : t('form.publish')}
        </button>
      </form>
    </Modal>
  )
}
