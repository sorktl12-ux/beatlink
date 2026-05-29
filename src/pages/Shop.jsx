import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { BEAT_PRICE } from '../constants'
import AudioPlayer from '../components/AudioPlayer'

export default function Shop() {
  const { user, profile, isAdmin } = useAuth()
  const [beats, setBeats] = useState([])
  const [owned, setOwned] = useState({})
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  const fetchBeats = useCallback(async () => {
    const { data } = await supabase
      .from('beats')
      .select('*')
      .order('created_at', { ascending: false })
    setBeats(data || [])
    setLoading(false)
  }, [])

  const fetchOwned = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('purchases')
      .select('*')
      .eq('buyer_id', user.id)
    const map = {}
    ;(data || []).forEach((p) => {
      map[p.beat_id] = p
    })
    setOwned(map)
  }, [user])

  useEffect(() => {
    fetchBeats()
  }, [fetchBeats])

  useEffect(() => {
    fetchOwned()
  }, [fetchOwned])

  const credits = profile?.credits ?? 0

  const buy = async (beat) => {
    setError('')
    setBusyId(beat.id)
    try {
      const { error: err } = await supabase.rpc('buy_beat', {
        p_beat_id: beat.id,
        p_buyer_id: user.id,
      })
      if (err) throw err
      await fetchOwned()
    } catch (err) {
      setError(err.message || 'Purchase failed')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8 pb-6 border-b border-line">
        <div>
          <h1 className="display text-4xl sm:text-5xl text-gold">BEAT SHOP</h1>
          <p className="text-muted text-sm mt-1">
            Cop admin-supplied beats for {BEAT_PRICE} credits each.
          </p>
        </div>
        {!isAdmin && profile && (
          <div className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2">
            <span className="text-gold font-bold tabular-nums">{credits}</span>
            <span className="text-muted text-xs ml-1">credits</span>
          </div>
        )}
      </div>

      {error && (
        <p className="mb-6 text-crimson text-sm bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-7 h-7 border-2 border-gold border-t-transparent rounded-full animate-spin-slow" />
        </div>
      ) : beats.length === 0 ? (
        <div className="text-center py-24">
          <p className="display text-3xl text-line">NO BEATS</p>
          <p className="text-muted text-sm mt-3">No beats have been listed yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {beats.map((beat) => {
            const purchased = owned[beat.id]
            return (
              <div
                key={beat.id}
                className="rounded-2xl border border-line bg-surface p-5 flex flex-col"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-violet">
                    BEAT
                  </span>
                  <span className="text-gold font-bold text-sm">{BEAT_PRICE} CR</span>
                </div>
                <h3 className="font-bold text-white text-lg">{beat.title}</h3>
                {beat.description && (
                  <p className="text-muted text-sm mt-1 line-clamp-2">{beat.description}</p>
                )}
                <div className="mt-4">
                  <AudioPlayer src={beat.audio_url} label="Preview" />
                </div>
                <div className="mt-4 pt-4 border-t border-line">
                  {isAdmin ? (
                    <p className="text-muted text-xs text-center">Admins can't purchase.</p>
                  ) : purchased ? (
                    <a
                      href={purchased.audio_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center rounded-lg bg-emerald/15 text-emerald font-bold py-2.5 hover:bg-emerald/25 transition-colors"
                    >
                      ✓ Owned · Download ↓
                    </a>
                  ) : (
                    <button
                      onClick={() => buy(beat)}
                      disabled={busyId === beat.id || credits < BEAT_PRICE}
                      className="w-full rounded-lg bg-gold text-ink font-bold py-2.5 hover:bg-gold-hi transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {busyId === beat.id
                        ? 'Buying...'
                        : credits < BEAT_PRICE
                        ? 'Not enough credits'
                        : `Buy (${BEAT_PRICE} CR)`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </main>
  )
}
