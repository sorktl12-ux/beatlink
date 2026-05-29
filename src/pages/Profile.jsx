import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { useLocale } from '../contexts/LocaleContext'
import { BOARDS, POST_STATUS } from '../constants'

export default function Profile() {
  const { user, profile, isAdmin } = useAuth()
  const { t } = useLocale()
  const [myPosts, setMyPosts] = useState([])

  useEffect(() => {
    if (!user) return
    let active = true
    const load = async () => {
      const { data: posts } = await supabase
        .from('posts')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })
      if (active) setMyPosts(posts || [])
    }
    load()
    return () => {
      active = false
    }
  }, [user])

  if (isAdmin) return <Navigate to="/admin" replace />
  if (!profile) return null

  const roleColor = BOARDS.find((b) => b.id === profile.role)?.color || '#FFD700'

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-2xl border border-line bg-surface p-6 flex flex-wrap items-center gap-6">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center display text-ink text-2xl"
          style={{ backgroundColor: roleColor }}
        >
          {profile.username[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">@{profile.username}</h1>
          <p className="text-sm" style={{ color: roleColor }}>
            {t(`roles.${profile.role}.label`)} · {t(`roles.${profile.role}.sub`)}
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-bold text-white mb-4">{t('profile.myPosts')}</h2>
        {myPosts.length === 0 ? (
          <p className="text-muted text-sm">{t('profile.noPosts')}</p>
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
                    {t(`boards.${b.id}.label`)}
                    <span className="text-muted ml-1.5">({list.length})</span>
                  </h3>
                  <ul className="space-y-2">
                    {list.map((p) => {
                      const statusKey = POST_STATUS[p.status] ? p.status : 'approved'
                      return (
                        <li key={p.id}>
                          <Link to={`/post/${p.id}`}>
                            <div className="rounded-xl border border-line bg-surface px-4 py-3 flex items-center justify-between gap-3 hover:border-gold/30 transition-colors">
                              <p className="text-white font-semibold truncate min-w-0">{p.title}</p>
                              <span
                                className={`text-xs font-bold shrink-0 ${POST_STATUS[statusKey].cls}`}
                              >
                                {t(`status.${statusKey}`)}
                              </span>
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
    </main>
  )
}
