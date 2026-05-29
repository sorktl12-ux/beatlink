import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { BOARDS, RECRUIT_BOARDS, RECRUIT_MIN, RECRUIT_MAX } from '../constants'
import Modal from './Modal'

export default function EditPostForm({ post, onClose, onSaved }) {
  const meta = BOARDS.find((b) => b.id === post.board)
  const hasRecruitSlots = RECRUIT_BOARDS.includes(post.board)
  const isCompleted = post.status === 'completed'

  const [title, setTitle] = useState(post.title || '')
  const [description, setDescription] = useState(post.description || '')
  const [recruitCount, setRecruitCount] = useState(post.recruit_count ?? 1)
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
    if (!title.trim()) return setError('Please enter a title.')

    const payload = {
      title: title.trim(),
      description: description.trim(),
    }

    if (hasRecruitSlots) {
      const n = Number(recruitCount)
      if (!Number.isInteger(n) || n < minRecruit || n > RECRUIT_MAX) {
        return setError(
          !isCompleted && acceptedCount > 0
            ? `Recruitment slots must be ${minRecruit}–${RECRUIT_MAX} (${acceptedCount} already greenlit).`
            : `Recruitment slots must be ${RECRUIT_MIN}–${RECRUIT_MAX}.`
        )
      }
      payload.recruit_count = n
    }

    setBusy(true)
    try {
      const { error: err } = await supabase.from('posts').update(payload).eq('id', post.id)
      if (err) throw err
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={`Edit Post${meta ? ` · ${meta.label}` : ''}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1.5">Details</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none resize-none"
          />
        </div>
        {hasRecruitSlots && (
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Recruitment slots
            </label>
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
                ? 'Closed posts can be updated freely (1–20).'
                : acceptedCount > 0
                  ? `${acceptedCount} collaborator${acceptedCount !== 1 ? 's' : ''} already greenlit — minimum ${minRecruit}.`
                  : 'Number of collaborators to greenlight. Applications stay unlimited.'}
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
            {busy ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line text-white font-semibold px-5 py-3 hover:border-gold/50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
