import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { BOARDS } from '../constants'
import PostCard from '../components/PostCard'
import NewPostForm from '../components/NewPostForm'
import { useAuth } from '../contexts/AuthContext'

export default function Board() {
  const { board } = useParams()
  const { isAdmin, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const meta = BOARDS.find((b) => b.id === board)

  const fetchPosts = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('board', board)
      .in('status', ['approved', 'completed'])
      .order('created_at', { ascending: false })
    setPosts(data || [])
    setLoading(false)
  }, [board])

  useEffect(() => {
    if (!meta) return
    setLoading(true)
    fetchPosts()
    const channel = supabase
      .channel(`posts:${board}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts', filter: `board=eq.${board}` },
        () => fetchPosts()
      )
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [board, meta, fetchPosts])

  const visible = useMemo(() => {
    return [...posts].sort((a, b) => {
      const rank = (p) => (p.status === 'completed' ? 1 : 0)
      if (rank(a) !== rank(b)) return rank(a) - rank(b)
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [posts])

  if (!meta) return <Navigate to="/board/player" replace />

  const canPost = isAdmin || profile?.seller_approved

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b border-line">
        <div>
          <h1 className="display text-4xl sm:text-5xl" style={{ color: meta.color }}>
            {meta.label}
          </h1>
          <p className="text-muted text-sm mt-1">{meta.sub} · Work Board</p>
        </div>
        {canPost && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-gold text-ink font-bold px-5 py-2.5 hover:bg-gold-hi transition-colors"
          >
            + Drop Work
          </button>
        )}
      </div>

      {!isAdmin && profile && !profile.seller_approved && (
        <div className="mb-8 rounded-xl border border-orange/30 bg-orange/10 text-orange text-sm px-4 py-3">
          Posting is restricted to admin-approved members. You can browse freely, but
          uploading requires approval. Ask the admin to approve your account.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin-slow" />
        </div>
      ) : visible.length === 0 ? (
        <div className="text-center py-24">
          <p className="display text-3xl text-line">EMPTY</p>
          <p className="text-muted text-sm mt-3">No posts yet. Be the first to drop your work.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in">
          {visible.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {showForm && (
        <NewPostForm
          board={board}
          onClose={() => setShowForm(false)}
          onCreated={fetchPosts}
        />
      )}
    </main>
  )
}
