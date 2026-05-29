import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { BEAT_PRICE, BOARDS, POST_STATUS, roleMeta } from '../constants'

export default function Profile() {
  const { user, profile, isAdmin } = useAuth()
  const [myPosts, setMyPosts] = useState([])
  const [myBeats, setMyBeats] = useState([])

  useEffect(() => {
    if (!user) return
    let active = true
    const load = async () => {
      const [{ data: posts }, { data: buys }] = await Promise.all([
        supabase
          .from('posts')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false }),
        supabase.from('purchases').select('*').eq('buyer_id', user.id),
      ])
      if (active) {
        setMyPosts(posts || [])
        setMyBeats(buys || [])
      }
    }
    load()
    return () => {
      active = false
    }
  }, [user])

  if (isAdmin) return <Navigate to="/admin" replace />
  if (!profile) return null

  const role = roleMeta(profile.role)

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* profile header */}
      <div className="rounded-2xl border border-line bg-surface p-6 flex flex-wrap items-center gap-6">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center display text-ink text-2xl"
          style={{ backgroundColor: role.color }}
        >
          {profile.username[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">@{profile.username}</h1>
          <p className="text-sm" style={{ color: role.color }}>
            {role.label} · {role.sub}
          </p>
        </div>
        <div className="ml-auto text-right">
          <div className="display text-4xl text-gold leading-none">
            {profile.credits ?? 0}
          </div>
          <div className="text-xs text-muted mt-1">credits</div>
        </div>
      </div>

      <p className="text-muted text-xs mt-3">
        +2 credits per closed deal · {BEAT_PRICE} credits to buy a beat
      </p>

      {/* my posts grouped by category */}
      <section className="mt-10">
        <h2 className="font-bold text-white mb-4">My Posts</h2>
        {myPosts.length === 0 ? (
          <p className="text-muted text-sm">You haven't posted anything yet.</p>
        ) : (
          <div className="space-y-7">
            {BOARDS.map((b) => {
              const list = myPosts.filter((p) => p.board === b.id)
              if (list.length === 0) return null
              return (
                <div key={b.id}>
                  <h3
                    className="text-xs font-bold tracking-widest uppercase mb-2.5"
                    style={{ color: b.color }}
                  >
                    {b.label}
                    <span className="text-muted ml-1.5">({list.length})</span>
                  </h3>
                  <ul className="space-y-2">
                    {list.map((p) => {
                      const s = POST_STATUS[p.status] || POST_STATUS.approved
                      return (
                        <li key={p.id}>
                          <Link to={`/post/${p.id}`}>
                            <div className="rounded-xl border border-line bg-surface px-4 py-3 flex items-center justify-between gap-3 hover:border-gold/30 transition-colors">
                              <p className="text-white font-semibold truncate min-w-0">
                                {p.title}
                              </p>
                              <span className={`text-xs font-bold shrink-0 ${s.cls}`}>{s.label}</span>
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* purchased beats */}
      <section className="mt-10">
        <h2 className="font-bold text-white mb-4">My Beats</h2>
        {myBeats.length === 0 ? (
          <p className="text-muted text-sm">
            No beats purchased yet.{' '}
            <Link to="/shop" className="text-gold">
              Go to shop →
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {myBeats.map((b) => (
              <li
                key={b.id}
                className="rounded-xl border border-line bg-surface px-4 py-3 flex items-center justify-between gap-3"
              >
                <span className="text-white font-semibold truncate">{b.beat_title}</span>
                {b.audio_url && (
                  <a
                    href={b.audio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gold text-sm font-bold shrink-0"
                  >
                    Download ↓
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
