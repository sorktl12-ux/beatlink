import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { BOARDS, PAGE_SIZE } from '../constants'
import PostListItem, { PostListHeader, PostListEmptySlot } from '../components/PostListItem'
import BoardSearch from '../components/BoardSearch'
import Pagination from '../components/Pagination'
import NewPostForm from '../components/NewPostForm'
import EditPostForm from '../components/EditPostForm'
import { useAuth } from '../contexts/AuthContext'
import { useLocale } from '../contexts/LocaleContext'
import { filterBySearch } from '../utils/search'

export default function Board() {
  const { board } = useParams()
  const { user, isAdmin, profile } = useAuth()
  const { t } = useLocale()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

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
    setSearchQuery('')
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

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const sorted = useMemo(() => {
    return [...posts].sort((a, b) => {
      const rank = (p) => (p.status === 'completed' ? 1 : 0)
      if (rank(a) !== rank(b)) return rank(a) - rank(b)
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [posts])

  const visible = useMemo(
    () => filterBySearch(sorted, searchQuery, ['title', 'description']),
    [sorted, searchQuery]
  )

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const paged = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return visible.slice(start, start + PAGE_SIZE)
  }, [visible, page])

  const slots = useMemo(
    () =>
      Array.from({ length: PAGE_SIZE }, (_, i) => ({
        post: paged[i] ?? null,
        rowNum: paged[i] ? visible.length - ((page - 1) * PAGE_SIZE + i) : null,
        key: paged[i]?.id ?? `empty-${page}-${i}`,
      })),
    [paged, visible.length, page]
  )

  if (!meta) return <Navigate to="/board/player" replace />

  const canPost = isAdmin || profile?.seller_approved

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b border-line">
        <div>
          <h1 className="display text-4xl sm:text-5xl" style={{ color: meta.color }}>
            {t(`boards.${board}.label`)}
          </h1>
          <p className="text-muted text-sm mt-1 max-w-lg">
            {t(`boards.${board}.sub`)}
            <span className="text-muted/70"> · {t(`boards.${board}.tagline`)}</span>
            {!loading && visible.length > 0 && (
              <span className="text-muted/70">
                {' '}
                · {t('board.listings', { count: visible.length })}
              </span>
            )}
          </p>
        </div>
        {canPost && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-gold text-ink font-bold px-5 py-2.5 hover:bg-gold-hi transition-colors"
          >
            {t('board.newListing')}
          </button>
        )}
      </div>

      {!isAdmin && profile && !profile.seller_approved && (
        <div className="mb-8 rounded-xl border border-orange/30 bg-orange/10 text-orange text-sm px-4 py-3">
          {t('board.approvalNotice')}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin-slow" />
        </div>
      ) : (
        <div className="rounded-xl border border-line bg-ink/40 overflow-hidden animate-fade-in">
          <div className="px-3 sm:px-4 py-3 border-b border-line bg-surface/30">
            <BoardSearch value={searchQuery} onChange={setSearchQuery} />
            {searchQuery.trim() && (
              <p className="text-muted text-xs mt-2">
                {visible.length > 0
                  ? t('search.results', { count: visible.length, query: searchQuery.trim() })
                  : t('search.empty', { query: searchQuery.trim() })}
              </p>
            )}
          </div>
          {visible.length === 0 && (
            <p className="text-center text-muted text-sm py-3 border-b border-line bg-surface/20">
              {searchQuery.trim() ? t('search.empty', { query: searchQuery.trim() }) : t('board.empty')}
            </p>
          )}
          <PostListHeader />
          <div>
            {slots.map(({ post, rowNum, key }) =>
              post ? (
                <PostListItem
                  key={key}
                  post={post}
                  rowNum={rowNum}
                  currentUserId={user?.id}
                  isAdmin={isAdmin}
                  onEdit={setEditingPost}
                />
              ) : (
                <PostListEmptySlot key={key} />
              )
            )}
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
      {editingPost && (
        <EditPostForm
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onSaved={fetchPosts}
        />
      )}
    </main>
  )
}
