import { ENGINEER_MIX_SCOPES, ENGINEER_PAY_MIN, ENGINEER_PAY_MAX } from '../constants'
import { useLocale } from '../contexts/LocaleContext'
import { fmtKrw } from '../utils/format'

export function validateEngineerOffer(payKrw, mixScope, t) {
  const pay = Number(payKrw)
  if (!Number.isInteger(pay) || pay < ENGINEER_PAY_MIN || pay > ENGINEER_PAY_MAX) {
    return t('form.errRate', {
      min: fmtKrw(ENGINEER_PAY_MIN),
      max: fmtKrw(ENGINEER_PAY_MAX),
    })
  }
  if (!ENGINEER_MIX_SCOPES.some((s) => s.id === mixScope)) {
    return t('form.errMixScope')
  }
  return null
}

export default function EngineerOfferFields({ payKrw, onPayChange, mixScope, onMixScopeChange }) {
  const { t } = useLocale()

  return (
    <>
      <div>
        <label className="block text-xs font-semibold text-muted mb-1.5">{t('form.ratePerTrack')}</label>
        <div className="relative">
          <input
            type="number"
            min={ENGINEER_PAY_MIN}
            max={ENGINEER_PAY_MAX}
            step={1000}
            value={payKrw}
            onChange={(e) => onPayChange(e.target.value)}
            placeholder={t('form.ratePlaceholder')}
            className="w-full rounded-lg bg-ink border border-line px-4 py-3 pr-10 text-white placeholder-muted/60 focus:border-teal focus:outline-none"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm">₩</span>
        </div>
        <p className="text-[11px] text-muted mt-1.5">
          {t('form.rateRange', {
            min: fmtKrw(ENGINEER_PAY_MIN),
            max: fmtKrw(ENGINEER_PAY_MAX),
          })}
        </p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-muted mb-1.5">{t('form.mixScope')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {ENGINEER_MIX_SCOPES.map((scope) => {
            const selected = mixScope === scope.id
            return (
              <button
                key={scope.id}
                type="button"
                onClick={() => onMixScopeChange(scope.id)}
                className={`rounded-lg border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                  selected
                    ? 'border-teal bg-teal/10 text-teal'
                    : 'border-line text-white hover:border-teal/40'
                }`}
              >
                {t(`mixScope.${scope.id}`)}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
