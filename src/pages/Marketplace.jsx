import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import NewItemForm from '../components/NewItemForm'

const fmtPrice = (n) =>
  typeof n === 'number' ? `₩${n.toLocaleString('ko-KR')}` : '₩0'

export default function Marketplace() {
  const { user, profile, isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [busyId, setBusyId] = useState(null)

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

  const canSell = isAdmin || profile?.seller_approved

  const sorted = [...items].sort((a, b) => {
    const rank = (i) => (i.status === 'sold' ? 1 : 0)
    if (rank(a) !== rank(b)) return rank(a) - rank(b)
    return new Date(b.created_at) - new Date(a.created_at)
  })

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
    if (!confirm(`Delete "${item.title}"?`)) return
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
          <h1 className="display text-4xl sm:text-5xl text-emerald">MARKET</h1>
          <p className="text-muted text-sm mt-1">Buy & sell gear · secondhand trade</p>
        </div>
        {canSell && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-full bg-gold text-ink font-bold px-5 py-2.5 hover:bg-gold-hi transition-colors"
          >
            + List an Item
          </button>
        )}
      </div>

      {!isAdmin && profile && !profile.seller_approved && (
        <div className="mb-8 rounded-xl border border-orange/30 bg-orange/10 text-orange text-sm px-4 py-3">
          Selling is restricted to admin-approved members. You can browse and buy, but
          listing an item requires approval. Ask the admin to approve your account.
        </div>
      )}

      {!user && !isAdmin && (
        <div className="mb-8 rounded-xl border border-line bg-surface text-muted text-sm px-4 py-3">
          Anyone can browse the Market.{' '}
          <Link to="/login" className="text-gold font-semibold">
            Log in
          </Link>{' '}
          and get admin approval to list your own items.
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin-slow" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-24">
          <p className="display text-3xl text-line">NO ITEMS</p>
          <p className="text-muted text-sm mt-3">No items listed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sorted.map((item) => {
            const isSold = item.status === 'sold'
            const isOwner = user?.id === item.seller_id
            return (
              <div
                key={item.id}
                className={`rounded-2xl border border-line bg-surface overflow-hidden flex flex-col transition-all ${
                  isSold ? 'grayscale opacity-50' : 'hover:border-gold/40'
                }`}
              >
                <div className="aspect-[4/3] bg-ink flex items-center justify-center overflow-hidden">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="display text-3xl text-line">NO IMAGE</span>
                  )}
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white text-lg leading-snug">{item.title}</h3>
                    {isSold && (
                      <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border border-line text-muted">
                        SOLD
                      </span>
                    )}
                  </div>
                  <p className="text-gold font-bold text-lg mt-1">{fmtPrice(item.price)}</p>
                  {item.description && (
                    <p className="text-muted text-sm mt-2 line-clamp-3 whitespace-pre-wrap">
                      {item.description}
                    </p>
                  )}
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="text-xs text-muted">@{item.seller_name}</span>
                    {(isOwner || isAdmin) && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleSold(item)}
                          disabled={busyId === item.id}
                          className="text-xs font-bold text-gold hover:underline disabled:opacity-50"
                        >
                          {isSold ? 'Mark Available' : 'Mark Sold'}
                        </button>
                        <button
                          onClick={() => removeItem(item)}
                          disabled={busyId === item.id}
                          className="text-xs font-bold text-crimson hover:underline disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showForm && (
        <NewItemForm onClose={() => setShowForm(false)} onCreated={fetchItems} />
      )}
    </main>
  )
}
