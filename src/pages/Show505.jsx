import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLocale } from '../contexts/LocaleContext'
import { useShow505Config } from '../contexts/Show505Context'
import Show505Live from '../components/Show505Live'
import Show505EventMeta from '../components/Show505EventMeta'

export default function Show505() {
  const { isAuthed, isAdmin } = useAuth()
  const { t } = useLocale()
  const { config, loading: configLoading, active } = useShow505Config()

  if (!isAuthed) return <Navigate to="/login" replace />

  if (!configLoading && !active && !isAdmin) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="text-muted">{t('show505.inactive')}</p>
      </main>
    )
  }

  if (configLoading) {
    return (
      <main className="min-h-[50vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin-slow" />
      </main>
    )
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="text-[#FF6B35] text-xs font-bold tracking-[0.35em] uppercase mb-2">
          {t('show505.eyebrow')}
        </p>
        <h1 className="display text-4xl sm:text-5xl text-white">{config?.event_title || '505'}</h1>
        <Show505EventMeta config={config} className="mt-3" />
        {!active && isAdmin && (
          <p className="text-orange text-xs mt-3 font-semibold">{t('show505.adminPreview')}</p>
        )}
      </div>

      <Show505Live config={config} isAdmin={isAdmin} />
    </main>
  )
}
