import { useLocale } from '../contexts/LocaleContext'

export default function BoardSearch({ value, onChange }) {
  const { t } = useLocale()

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
      <label className="sr-only" htmlFor="board-search">
        {t('search.label')}
      </label>
      <div className="relative flex-1 min-w-0">
        <input
          id="board-search"
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('search.placeholder')}
          className="w-full rounded-lg bg-ink border border-line pl-4 pr-4 py-2.5 text-sm text-white placeholder-muted/60 focus:border-gold focus:outline-none"
          autoComplete="off"
        />
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="shrink-0 rounded-lg border border-line text-muted text-sm font-semibold px-4 py-2.5 hover:text-white hover:border-gold/40 transition-colors"
        >
          {t('search.clear')}
        </button>
      )}
    </div>
  )
}
