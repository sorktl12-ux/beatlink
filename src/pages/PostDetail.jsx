import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase, AUDIO_BUCKET } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { BOARDS, DEAL_REWARD } from '../constants'
import AudioPlayer from '../components/AudioPlayer'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, profile, isAdmin } = useAuth()
  const [post, setPost] = useState(undefined) // undefined=loading, null=not found
  const [requests, setRequests] = useState([])
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDesc, setEditDesc] = useState('')

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

  const startEdit = () => {
    setError('')
    setEditTitle(post.title)
    setEditDesc(post.description || '')
    setEditing(true)
  }

  const saveEdit = async () => {
    if (!editTitle.trim()) return setError('Please enter a title.')
    setBusy(true)
    setError('')
    try {
      const { error: err } = await supabase
        .from('posts')
        .update({ title: editTitle.trim(), description: editDesc.trim() })
        .eq('id', id)
      if (err) throw err
      setEditing(false)
      fetchPost()
    } catch (err) {
      setError(err.message || 'Update failed')
    } finally {
      setBusy(false)
    }
  }

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

      {editing ? (
        <section className="rounded-2xl border border-gold/30 bg-surface p-5 space-y-4">
          <h2 className="font-bold text-white">Edit Post</h2>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Title</label>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Details</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={4}
              className="w-full rounded-lg bg-ink border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={saveEdit}
              disabled={busy}
              className="rounded-lg bg-gold text-ink font-bold px-5 py-2.5 hover:bg-gold-hi transition-colors disabled:opacity-50"
            >
              {busy ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-line text-white font-semibold px-5 py-2.5 hover:border-gold/50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </section>
      ) : (
        <article className={isCompleted ? 'grayscale opacity-60' : ''}>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="text-[11px] font-bold tracking-widest uppercase"
              style={{ color: accent }}
            >
              {board?.label}
            </span>
            {isCompleted && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border border-line text-muted">
                Deal Closed
              </span>
            )}
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight">{post.title}</h1>
          <p className="text-muted text-sm mt-2">@{post.author_name}</p>

          {post.description && (
            <p className="text-white/90 leading-relaxed mt-5 whitespace-pre-wrap">
              {post.description}
            </p>
          )}

          <div className="mt-6">
            <AudioPlayer src={post.audio_url} label="Attached track" />
          </div>
        </article>
      )}

      {/* Owner / admin controls — available even after the deal is closed */}
      {canManage && !editing && (
        <div className="mt-5 flex gap-3">
          <button
            onClick={startEdit}
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
            ✓ Deal closed with <span className="text-gold">@{post.deal_requester_name}</span>
          </p>
          <p className="text-muted text-sm mt-1">
            {DEAL_REWARD} credits were granted to both sides.
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
            <p className="text-emerald text-sm bg-emerald/10 border border-emerald/30 rounded-lg px-3 py-2">
              Request sent. Waiting for the poster to greenlight you.
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
                  {isCompleted ? (
                    <span
                      className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${
                        r.status === 'accepted'
                          ? 'bg-gold/15 text-gold'
                          : 'bg-line text-muted'
                      }`}
                    >
                      {r.status === 'accepted' ? 'Chosen' : 'Closed'}
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
