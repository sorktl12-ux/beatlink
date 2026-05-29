import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { RECRUIT_BOARDS, RECRUIT_MIN, RECRUIT_MAX } from '../constants'
import { useLocale } from '../contexts/LocaleContext'
import Modal from './Modal'
import EngineerOfferFields, { validateEngineerOffer } from './EngineerOfferFields'
import { formatDbError } from '../utils/dbError'

export default function EditPostForm({ post, onClose, onSaved }) {
  const { t } = useLocale()
  const hasRecruitSlots = RECRUIT_BOARDS.includes(post.board)
  const isEngineer = post.board === 'engineer'
  const isCompleted = post.status === 'completed'

  const [title, setTitle] = useState(post.title || '')
  const [description, setDescription] = useState(post.description || '')
  const [recruitCount, setRecruitCount] = useState(post.recruit_count ?? 1)
  const [payKrw, setPayKrw] = useState(post.engineer_pay_krw ?? '')
  const [mixScope, setMixScope] = useState(post.engineer_mix_scope || 'acapella')
  const [acceptedCount, setAcceptedCount] = useState(0)
  const [loadingAccepted, setLoadingAccepted] = useState(hasRecruitSlots && !isCompleted)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!hasRecruitSlots || isCompleted) {
      setLoadingAccepted(false)
      return
    }
    let cancelled = false
    ;(async () => {
      const { count } = await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', post.id)
        .eq('status', 'accepted')
      if (!cancelled) {
        setAcceptedCount(count ?? 0)
        setLoadingAccepted(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [post.id, hasRecruitSlots, isCompleted])

  const minRecruit = isCompleted ? RECRUIT_MIN : Math.max(RECRUIT_MIN, acceptedCount)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!title.trim()) return setError(t('form.errTitle'))
    if (isEngineer) {
      const offerErr = validateEngineerOffer(payKrw, mixScope, t)
      if (offerErr) return setError(offerErr)
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
    }

    if (hasRecruitSlots) {
      const n = Number(recruitCount)
      if (!Number.isInteger(n) || n < minRecruit || n > RECRUIT_MAX) {
        return setError(t('form.errRecruit', { min: minRecruit, max: RECRUIT_MAX }))
      }
      payload.recruit_count = n
    }

    if (isEngineer) {
      payload.engineer_pay_krw = Number(payKrw)
      payload.engineer_mix_scope = mixScope
    }

    setBusy(true)
    try {
      const { error: err } = await supabase.from('posts').update(payload).eq('id', post.id)
      if (err) throw err
      onSaved?.()
      onClose()
    } catch (err) {
      setError(formatDbError(err, t))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`${t('form.editListing')} · ${t(`boards.${post.board}.label`)}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">{t('form.title')}</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">{t('form.details')}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none resize-none"
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
              min={minRecruit}
              max={RECRUIT_MAX}
              value={recruitCount}
              onChange={(e) => setRecruitCount(e.target.value)}
              disabled={loadingAccepted}
              className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white focus:border-gold focus:outline-none disabled:opacity-50"
            />
            <p className="text-[11px] text-muted mt-1.5">
              {isCompleted
                ? t('form.editRecruitClosed')
                : acceptedCount > 0
                  ? t('form.editRecruitMin', { n: acceptedCount, min: minRecruit })
                  : t('form.editRecruitDefault')}
            </p>
          </div>
        )}
        {error && (
          <p className="text-crimson text-sm bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={busy || loadingAccepted}
            className="flex-1 rounded-lg bg-gold text-ink font-bold py-3 hover:bg-gold-hi transition-colors disabled:opacity-50"
          >
            {busy ? t('form.saving') : t('form.save')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line text-white font-semibold px-5 py-3 hover:border-gold/50 transition-colors"
          >
            {t('form.cancel')}
          </button>
        </div>
      </form>
    </Modal>
  )
}
