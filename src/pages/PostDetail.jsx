import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, AUDIO_BUCKET } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { BOARDS, DEAL_REWARD, RECRUIT_BOARDS } from '../constants'
import AudioPlayer from '../components/AudioPlayer'
import EditPostForm from '../components/EditPostForm'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile, isAdmin } = useAuth()
  const [post, setPost] = useState(undefined) // undefined=loading, null=not found
  const [requests, setRequests] = useState([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showEditForm, setShowEditForm] = useState(false)

  const fetchPost = useCallback(async () => {
    const { data } = await supabase.from('posts').select('*').eq('id', id).maybeSingle()
    setPost(data || null)
  }, [id])

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase
      .from('requests')
      .select('*')
      .eq('post_id', id)
      .order('created_at', { ascending: true })
    setRequests(data || [])
  }, [id])

  useEffect(() => {
    fetchPost()
    fetchRequests()
    const channel = supabase
      .channel(`post:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts', filter: `id=eq.${id}` }, fetchPost)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests', filter: `post_id=eq.${id}` }, fetchRequests)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [id, fetchPost, fetchRequests])

  if (post === undefined) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin-slow" />
      </div>
    )
  }
  if (post === null) {
    return (
      <div className="text-center py-32">
        <p className="display text-3xl text-line">NOT FOUND</p>
        <Link to="/board/player" className="text-gold text-sm mt-4 inline-block">
          ← Back to board
        </Link>
      </div>
    )
  }

  const board = BOARDS.find((b) => b.id === post.board)
  const accent = board?.color || '#FFD700'
  const isOwner = user?.id === post.author_id
  const canManage = isOwner || isAdmin
  const isCompleted = post.status === 'completed'
  const myRequest = requests.find((r) => r.requester_id === user?.id)
  const hasRecruitSlots = RECRUIT_BOARDS.includes(post.board)
  const recruitTotal = hasRecruitSlots ? Math.max(1, post.recruit_count ?? 1) : 1
  const multiRecruit = hasRecruitSlots && recruitTotal > 1
  const acceptedRequests = requests.filter((r) => r.status === 'accepted')
  const acceptedCount = acceptedRequests.length
  const slotsRemaining = multiRecruit ? Math.max(0, recruitTotal - acceptedCount) : isCompleted ? 0 : 1
  const slotsFull = multiRecruit ? acceptedCount >= recruitTotal : isCompleted

  const deletePost = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    setBusy(true)
    setError('')
    try {
      if (post.audio_path) {
        await supabase.storage.from(AUDIO_BUCKET).remove([post.audio_path])
      }
      const { error: err } = await supabase.from('posts').delete().eq('id', id)
      if (err) throw err
      navigate(`/board/${post.board}`)
    } catch (err) {
      setError(err.message || 'Delete failed')
      setBusy(false)
    }
  }

  const sendRequest = async () => {
    setError('')
    setBusy(true)
    try {
      const { error: err } = await supabase.from('requests').insert({
        post_id: id,
        requester_id: user.id,
        requester_name: profile?.username || 'anon',
        message: message.trim(),
        status: 'pending',
      })
      if (err) throw err
      setMessage('')
      fetchRequests()
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setBusy(false)
    }
  }

  // Greenlight one contact -> lock the deal + grant +2 credits to both sides
  const acceptRequest = async (reqUser) => {
    setError('')
    setBusy(true)
    try {
      const { error: err } = await supabase.rpc('close_deal', {
        p_post_id: id,
        p_requester_id: reqUser.requester_id,
        p_requester_name: reqUser.requester_name,
      })
      if (err) throw err
      fetchPost()
      fetchRequests()
    } catch (err) {
      setError(err.message || 'Action failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <button
        onClick={() => navigate(-1)}
        className="text-muted hover:text-gold text-sm mb-6"
      >
        ← Back
      </button>

      {showEditForm && (
        <EditPostForm
          post={post}
          onClose={() => setShowEditForm(false)}
          onSaved={fetchPost}
        />
      )}

      <article>
          <div className="flex items-center gap-3 mb-3">
            <span
              className={`text-[11px] font-bold tracking-widest uppercase ${isCompleted ? 'text-muted' : ''}`}
              style={isCompleted ? undefined : { color: accent }}
            >
              {board?.label}
            </span>
            {isCompleted && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-line text-muted">
                Deal Closed
              </span>
            )}
            {multiRecruit && !isCompleted && (
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-full border"
                style={{ borderColor: `${accent}66`, color: accent }}
              >
                Recruiting {recruitTotal} · {acceptedCount}/{recruitTotal} filled
              </span>
            )}
            {multiRecruit && isCompleted && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-line text-muted">
                Recruited {recruitTotal}
              </span>
            )}
          </div>
          <h1
            className={`text-3xl font-extrabold leading-tight ${
              isCompleted ? 'text-muted' : 'text-white'
            }`}
          >
            {post.title}
          </h1>
          <p className="text-muted text-sm mt-2">@{post.author_name}</p>

          {post.description && (
            <p
              className={`leading-relaxed mt-5 whitespace-pre-wrap ${
                isCompleted ? 'text-muted/80' : 'text-white/90'
              }`}
            >
              {post.description}
            </p>
          )}

          <div className="mt-6">
            <AudioPlayer src={post.audio_url} label="Attached track" />
          </div>
        </article>

      {/* Owner / admin controls — available even after the deal is closed */}
      {canManage && (
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => {
              setError('')
              setShowEditForm(true)
            }}
            className="rounded-lg border border-line text-white text-sm font-bold px-4 py-2 hover:border-gold/50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={deletePost}
            disabled={busy}
            className="rounded-lg border border-crimson/40 text-crimson text-sm font-bold px-4 py-2 hover:bg-crimson/10 transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="mt-8 rounded-xl border border-line bg-surface p-5 text-center">
          <p className="text-white font-bold">
            ✓ Deal closed with{' '}
            <span className="text-gold">
              {acceptedRequests.length > 0
                ? acceptedRequests.map((r) => `@${r.requester_name}`).join(', ')
                : `@${post.deal_requester_name}`}
            </span>
          </p>
          <p className="text-muted text-sm mt-1">
            {DEAL_REWARD} credits were granted to both sides per greenlight.
          </p>
        </div>
      )}
      {error && (
        <p className="mt-6 text-crimson text-sm bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Request form shown to potential collaborators */}
      {!isCompleted && !isOwner && !isAdmin && (
        <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
          <h2 className="font-bold text-white mb-3">Send a Work Request</h2>
          {myRequest ? (
            <p
              className={`text-sm rounded-lg px-3 py-2 border ${
                myRequest.status === 'accepted'
                  ? 'text-gold bg-gold/10 border-gold/30'
                  : 'text-emerald bg-emerald/10 border-emerald/30'
              }`}
            >
              {myRequest.status === 'accepted'
                ? 'You were greenlit for this collab.'
                : 'Request sent. Waiting for the poster to greenlight you.'}
            </p>
          ) : (
            <>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder="Pitch your collab (optional)"
                className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none resize-none"
              />
              <button
                onClick={sendRequest}
                disabled={busy}
                className="mt-3 rounded-lg bg-gold text-ink font-bold px-5 py-2.5 hover:bg-gold-hi transition-colors disabled:opacity-50"
              >
                {busy ? 'Sending...' : 'Request Work'}
              </button>
            </>
          )}
        </section>
      )}

      {/* Request list shown to the poster */}
      {isOwner && (
        <section className="mt-8">
          <h2 className="font-bold text-white mb-3">
            Work Requests <span className="text-muted">({requests.length})</span>
            {multiRecruit && (
              <span className="text-muted font-normal text-sm ml-2">
                · {acceptedCount}/{recruitTotal} greenlit
                {slotsRemaining > 0 && ` · ${slotsRemaining} slot${slotsRemaining > 1 ? 's' : ''} left`}
              </span>
            )}
          </h2>
          {requests.length === 0 ? (
            <p className="text-muted text-sm">No requests yet.</p>
          ) : (
            <ul className="space-y-3">
              {requests.map((r) => (
                <li
                  key={r.id}
                  className="rounded-xl border border-line bg-surface p-4 flex items-start justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-white">@{r.requester_name}</p>
                    {r.message && (
                      <p className="text-muted text-sm mt-1 break-words">{r.message}</p>
                    )}
                  </div>
                  {r.status === 'accepted' ? (
                    <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-gold/15 text-gold">
                      Greenlit
                    </span>
                  ) : isCompleted || slotsFull ? (
                    <span className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-line text-muted">
                      Closed
                    </span>
                  ) : (
                    <button
                      onClick={() => acceptRequest(r)}
                      disabled={busy}
                      className="shrink-0 rounded-full bg-gold text-ink text-sm font-bold px-4 py-2 hover:bg-gold-hi transition-colors disabled:opacity-50"
                    >
                      Greenlight
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  )
}
