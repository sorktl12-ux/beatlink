import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { PAGE_SIZE } from '../constants'
import { useAuth } from '../contexts/AuthContext'
import { useLocale } from '../contexts/LocaleContext'
import BoardSearch from '../components/BoardSearch'
import MarketListItem, { MarketListHeader, MarketListEmptySlot } from '../components/MarketListItem'
import Pagination from '../components/Pagination'
import NewItemForm from '../components/NewItemForm'
import { filterBySearch } from '../utils/search'

export default function Marketplace() {
  const { user, profile, isAdmin } = useAuth()
  const { t } = useLocale()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from('items')
      .select('*')
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchItems()
    const channel = supabase
      .channel('items:all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, fetchItems)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchItems])

  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const canSell = isAdmin || profile?.seller_approved

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const rank = (i) => (i.status === 'sold' ? 1 : 0)
      if (rank(a) !== rank(b)) return rank(a) - rank(b)
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [items])

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
        item: paged[i] ?? null,
        rowNum: paged[i] ? visible.length - ((page - 1) * PAGE_SIZE + i) : null,
        key: paged[i]?.id ?? `empty-${page}-${i}`,
      })),
    [paged, visible.length, page]
  )

  const toggleSold = async (item) => {
    setBusyId(item.id)
    try {
      await supabase
        .from('items')
        .update({ status: item.status === 'sold' ? 'available' : 'sold' })
        .eq('id', item.id)
      await fetchItems()
    } finally {
      setBusyId(null)
    }
  }

  const removeItem = async (item) => {
    if (!confirm(t('market.deleteConfirm', { title: item.title }))) return
    setBusyId(item.id)
    try {
      await supabase.from('items').delete().eq('id', item.id)
      await fetchItems()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b border-line">
        <div>
          <h1 className="display text-4xl sm:text-5xl text-emerald">{t('market.title')}</h1>
          <p className="text-muted text-sm mt-1 max-w-lg">
            {t('market.cardSub')}
            <span className="text-muted/70"> · {t('market.desc')}</span>
            {!loading && visible.length > 0 && (
              <span className="text-muted/70">
                {' '}
                · {t('board.listings', { count: visible.length })}
              </span>
            )}
          </p>
        </div>
        {canSell && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-gold text-ink font-bold px-5 py-2.5 hover:bg-gold-hi transition-colors"
          >
            {t('market.listGear')}
          </button>
        )}
      </div>

      {!isAdmin && profile && !profile.seller_approved && (
        <div className="mb-8 rounded-xl border border-orange/30 bg-orange/10 text-orange text-sm px-4 py-3">
          {t('market.sellNotice')}
        </div>
      )}

      {!user && !isAdmin && (
        <div className="mb-8 rounded-xl border border-line bg-surface text-muted text-sm px-4 py-3">
          {t('market.browseNotice')}{' '}
          <Link to="/login" className="text-gold font-semibold">
            {t('market.logIn')}
          </Link>{' '}
          {t('market.browseNoticeEnd')}
        </div>
      )}

      <div className="mb-8 rounded-xl border border-line/70 bg-surface/40 px-4 py-3.5">
        <p className="text-[11px] font-bold tracking-wide uppercase text-muted mb-1.5">
          {t('market.disclaimerTitle')}
        </p>
        <p className="text-muted/85 text-xs leading-relaxed">{t('market.disclaimer')}</p>
      </div>

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
              {searchQuery.trim()
                ? t('search.empty', { query: searchQuery.trim() })
                : t('market.emptyDesc')}
            </p>
          )}
          <MarketListHeader />
          <div>
            {slots.map(({ item, rowNum, key }) =>
              item ? (
                <MarketListItem
                  key={key}
                  item={item}
                  rowNum={rowNum}
                  currentUserId={user?.id}
                  isAdmin={isAdmin}
                  busyId={busyId}
                  onToggleSold={toggleSold}
                  onDelete={removeItem}
                />
              ) : (
                <MarketListEmptySlot key={key} />
              )
            )}
          </div>
          <div className="border-t border-line px-2 py-3 sm:py-4">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      )}

      {showForm && (
        <NewItemForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setPage(1)
            fetchItems()
          }}
        />
      )}
    </main>
  )
}
