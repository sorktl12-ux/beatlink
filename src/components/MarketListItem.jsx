import { fmtDate } from '../utils/format'
import { useLocale } from '../contexts/LocaleContext'

const ROW =
  'grid grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[3rem_minmax(0,1fr)_5.5rem_5.5rem_4.5rem] items-center gap-x-3 gap-y-1 px-3 sm:px-4 py-3 min-h-[3.25rem] border-b border-line'

const fmtPrice = (n) =>
  typeof n === 'number' ? `₩${n.toLocaleString('ko-KR')}` : '₩0'

export default function MarketListItem({ item, rowNum, currentUserId, isAdmin, busyId, onToggleSold, onDelete }) {
  const { t } = useLocale()
  const isSold = item.status === 'sold'
  const isOwner = currentUserId === item.seller_id
  const canManage = isOwner || isAdmin
  const busy = busyId === item.id

  return (
    <div
      className={`${ROW} transition-colors ${isSold ? 'opacity-60' : 'hover:bg-surface/60'} group`}
    >
      <span className="text-xs sm:text-sm text-muted tabular-nums text-center">{rowNum}</span>

      <div className="min-w-0">
        <div className="flex items-start gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <p
              className={`font-semibold truncate ${
                isSold ? 'text-muted' : 'text-white group-hover:text-emerald'
              }`}
            >
              {item.title}
            </p>
            {item.description && (
              <p className="text-muted/80 text-xs mt-0.5 line-clamp-1">{item.description}</p>
            )}
          </div>
          {canManage && (
            <div className="shrink-0 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onToggleSold(item)}
                disabled={busy}
                className="text-[10px] sm:text-xs font-bold text-gold hover:underline disabled:opacity-50"
              >
                {isSold ? t('market.markAvailable') : t('market.markSold')}
              </button>
              <button
                type="button"
                onClick={() => onDelete(item)}
                disabled={busy}
                className="text-[10px] sm:text-xs font-bold text-crimson hover:underline disabled:opacity-50"
              >
                {t('market.delete')}
              </button>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 sm:hidden text-[11px] text-muted">
          <span>@{item.seller_name}</span>
          <span>·</span>
          <span className="text-gold font-semibold">{fmtPrice(item.price)}</span>
          <span>·</span>
          <span>{fmtDate(item.created_at)}</span>
        </div>
      </div>

      <span className="hidden sm:block text-xs text-muted truncate">@{item.seller_name}</span>
      <span className="hidden sm:block text-xs text-gold font-semibold tabular-nums">
        {fmtPrice(item.price)}
      </span>

      <div className="hidden sm:flex items-center justify-end">
        <span
          className={`text-[11px] font-bold ${isSold ? 'text-muted' : 'text-emerald'}`}
        >
          {isSold ? t('market.sold') : t('market.available')}
        </span>
      </div>

      <div className="sm:hidden col-start-2 flex items-center gap-2">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${isSold ? 'bg-muted' : 'bg-emerald'}`}
          aria-hidden
        />
        <span className={`text-[10px] font-bold ${isSold ? 'text-muted' : 'text-emerald'}`}>
          {isSold ? t('market.sold') : t('market.available')}
        </span>
      </div>
    </div>
  )
}

export function MarketListEmptySlot() {
  return (
    <div className={`${ROW} bg-surface/[0.03]`} aria-hidden>
      <span className="text-xs sm:text-sm text-line/40 text-center select-none">·</span>
      <span className="hidden sm:block sm:col-span-4 border-b border-dashed border-line/25" />
      <span className="sm:hidden col-start-2 border-b border-dashed border-line/25" />
    </div>
  )
}

export function MarketListHeader() {
  const { t } = useLocale()
  return (
    <div className="hidden sm:grid grid-cols-[3rem_minmax(0,1fr)_5.5rem_5.5rem_4.5rem] gap-x-3 px-4 py-2 border-y border-line bg-surface/50 text-[10px] font-bold tracking-widest uppercase text-muted">
      <span className="text-center">{t('board.listHeader.num')}</span>
      <span>{t('board.listHeader.title')}</span>
      <span>{t('market.listHeader.seller')}</span>
      <span>{t('market.listHeader.price')}</span>
      <span className="text-right">{t('market.listHeader.status')}</span>
    </div>
  )
}
