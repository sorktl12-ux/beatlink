import { Link } from 'react-router-dom'
import { useLocale } from '../contexts/LocaleContext'

export default function NotFound() {
  const { t } = useLocale()
  return (
    <div className="text-center py-32">
      <p className="display text-6xl text-gold">{t('notFound.code')}</p>
      <p className="text-muted text-sm mt-3">{t('notFound.desc')}</p>
      <Link
        to="/"
        className="inline-block mt-6 rounded-full bg-gold text-ink font-bold px-6 py-2.5 hover:bg-gold-hi transition-colors"
      >
        {t('notFound.backHome')}
      </Link>
    </div>
  )
}
