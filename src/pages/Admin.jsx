import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { ADMIN_ID } from '../constants'
import { useLocale } from '../contexts/LocaleContext'
import Show505Admin from '../components/Show505Admin'

export default function Admin() {
  const { t } = useLocale()
  const [members, setMembers] = useState([])
  const [busyId, setBusyId] = useState(null)

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('username', ADMIN_ID)
      .order('created_at', { ascending: false })
    setMembers(data || [])
  }, [])

  useEffect(() => {
    fetchMembers()
    const channel = supabase
      .channel('admin:members')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchMembers)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchMembers])

  const setApproved = async (id, value) => {
    setBusyId(id)
    try {
      await supabase.from('profiles').update({ seller_approved: value }).eq('id', id)
      await fetchMembers()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="display text-4xl text-gold mb-1">{t('admin.title')}</h1>
      <p className="text-muted text-sm mb-8">{t('admin.desc')}</p>

      <p className="text-muted text-sm mb-4">{t('admin.membersDesc')}</p>
      {members.length === 0 ? (
        <p className="text-muted text-sm">{t('admin.noMembers')}</p>
      ) : (
        <ul className="space-y-3">
          {members.map((m) => (
            <li
              key={m.id}
              className="rounded-xl border border-line bg-surface p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white truncate">
                  @{m.username}{' '}
                  <span className="text-xs text-muted font-normal uppercase">{m.role}</span>
                </p>
                <p className="text-xs text-muted mt-0.5 truncate">
                  {m.full_name || '—'}
                  {m.phone ? ` · ${m.phone}` : ''}
                </p>
                <p className="text-xs mt-0.5">
                  {m.seller_approved ? (
                    <span className="text-emerald">{t('admin.approved')}</span>
                  ) : (
                    <span className="text-muted">{t('admin.notApproved')}</span>
                  )}
                </p>
              </div>
              {m.seller_approved ? (
                <button
                  onClick={() => setApproved(m.id, false)}
                  disabled={busyId === m.id}
                  className="shrink-0 rounded-lg border border-crimson/40 text-crimson text-sm font-bold px-4 py-2 hover:bg-crimson/10 transition-colors disabled:opacity-50"
                >
                  {t('admin.revoke')}
                </button>
              ) : (
                <button
                  onClick={() => setApproved(m.id, true)}
                  disabled={busyId === m.id}
                  className="shrink-0 rounded-lg bg-emerald text-ink text-sm font-bold px-4 py-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {t('admin.approve')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <Show505Admin />
    </main>
  )
}
