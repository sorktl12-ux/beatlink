import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { BOARDS, PAGE_SIZE } from '../constants'
import PostListItem, { PostListHeader, PostListEmptySlot } from '../components/PostListItem'
import Pagination from '../components/Pagination'
import NewPostForm from '../components/NewPostForm'
import { useAuth } from '../contexts/AuthContext'

export default function Board() {
  const { board } = useParams()
  const { isAdmin, profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [page, setPage] = useState(1)

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
    setPage(1)
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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const visible = useMemo(() => {
    return [...posts].sort((a, b) => {
      const rank = (p) => (p.status === 'completed' ? 1 : 0)
      if (rank(a) !== rank(b)) return rank(a) - rank(b)
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [posts])

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return visible.slice(start, start + PAGE_SIZE)
  }, [visible, page])

  if (!meta) return <Navigate to="/board/player" replace />

  const canPost = isAdmin || profile?.seller_approved

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b border-line">
        <div>
          <h1 className="display text-4xl sm:text-5xl" style={{ color: meta.color }}>
            {meta.label}
          </h1>
          <p className="text-muted text-sm mt-1">
            {meta.sub} · Work Board
            {!loading && visible.length > 0 && (
              <span className="text-muted/70">
                {' '}
                · {visible.length} post{visible.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
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
      ) : (
        <div className="rounded-xl border border-line bg-ink/40 overflow-hidden animate-fade-in">
          {visible.length === 0 && (
            <p className="text-center text-muted text-sm py-3 border-b border-line bg-surface/20">
              No posts yet. Be the first to drop your work.
            </p>
          )}
          <PostListHeader />
          <div>
            {Array.from({ length: PAGE_SIZE }, (_, i) => {
              const post = paged[i]
              if (post) {
                return (
                  <PostListItem
                    key={post.id}
                    post={post}
                    rowNum={visible.length - ((page - 1) * PAGE_SIZE + i)}
                  />
                )
              }
              return <PostListEmptySlot key={`empty-${page}-${i}`} />
            })}
          </div>
          <div className="border-t border-line px-2 py-3 sm:py-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {showForm && (
        <NewPostForm
          board={board}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setPage(1)
            fetchPosts()
          }}
        />
      )}
    </main>
  )
}
