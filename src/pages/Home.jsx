import { Link } from 'react-router-dom'
import { BOARDS, MARKET_COLOR } from '../constants'
import { useLocale } from '../contexts/LocaleContext'
import { useAuth } from '../contexts/AuthContext'
import { useShow505Config } from '../contexts/Show505Context'
import { show505EventLine } from '../components/Show505EventMeta'
import { useShow505Countdown, formatCountdownMain } from '../hooks/useShow505Countdown'

function HomeCard({ to, color, label, sub, tagline, cta }) {
  return (
    <Link
      to={to}
      className="group relative block min-w-0 rounded-2xl border border-line bg-surface transition-all hover:-translate-y-1"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <span
          className="absolute inset-x-0 bottom-0 h-1 transition-all duration-300 group-hover:h-full group-hover:opacity-10"
          style={{ backgroundColor: color }}
        />
      </div>
      <div className="relative px-5 sm:px-6 py-7 sm:py-8">
        <span
          className="block h-1 w-10 rounded-full mb-5 sm:mb-6"
          style={{ backgroundColor: color }}
        />
        <h3
          className="display text-4xl sm:text-[1.95rem] md:text-3xl lg:text-[2.35rem] xl:text-5xl leading-[1.05] break-words"
          style={{ color }}
        >
          {label}
        </h3>
        <p className="text-muted text-sm mt-2">{sub}</p>
        <p className="text-muted/80 text-xs mt-1.5 leading-relaxed">{tagline}</p>
        <span className="inline-flex items-center gap-1 mt-6 text-xs font-bold tracking-widest uppercase text-white/80 group-hover:text-white transition-colors">
          {cta}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </span>
      </div>
    </Link>
  )
}

export default function Home() {
  const { locale, t } = useLocale()
  const { isAuthed, isAdmin } = useAuth()
  const { active: show505Active, config: show505Config, loading: show505Loading } = useShow505Config()
  const steps = ['step1', 'step2', 'step3']
  const show505Title = show505Config?.event_title || '505'
  const show505To = isAuthed ? '/505' : '/login'
  const show505OnHome = !show505Loading && (show505Active || isAdmin)
  const show505VenueLine = show505EventLine(show505Config, locale)
  const { remaining: countdownMs } = useShow505Countdown(show505Config?.event_starts_at)
  const mainCountdown = show505Config?.event_starts_at
    ? formatCountdownMain(countdownMs, locale)
    : null

  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <p className="text-gold text-xs font-bold tracking-[0.35em] uppercase mb-4">
            {t('home.eyebrow')}
          </p>
          <h1 className="display text-5xl sm:text-7xl lg:text-8xl leading-[0.92] text-white">
            {t('home.heroLine1')}
            <br />
            {t('home.heroLine2')} <span className="text-gold-gradient">{t('home.heroAccent')}</span>
          </h1>
          <p className="text-muted text-base sm:text-lg max-w-xl mt-6 leading-relaxed">
            {t('home.heroDesc')}
          </p>

          {show505OnHome && (
            <Link
              to={show505To}
              className="group mt-10 block max-w-2xl rounded-2xl border border-[#FF6B35]/50 bg-[#FF6B35]/10 p-5 sm:p-6 transition-all hover:border-[#FF6B35] hover:bg-[#FF6B35]/15"
            >
              <p className="text-[#FF6B35] text-[10px] sm:text-xs font-bold tracking-[0.35em] uppercase mb-2">
                {t('home.show505Badge')}
              </p>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="display text-3xl sm:text-4xl text-white leading-none">{show505Title}</h2>
                  {mainCountdown && (
                    <p className="display text-xl sm:text-2xl text-[#FF6B35] mt-3 tabular-nums">
                      {mainCountdown}
                    </p>
                  )}
                  {show505VenueLine && (
                    <p className="text-muted text-sm mt-2 leading-relaxed">{show505VenueLine}</p>
                  )}
                </div>
                <span className="inline-flex items-center gap-1 shrink-0 text-xs font-bold tracking-widest uppercase text-[#FF6B35] group-hover:text-white transition-colors">
                  {isAuthed ? t('home.openShow505') : t('home.show505Login')}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 -mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
          {BOARDS.map((b) => (
            <HomeCard
              key={b.id}
              to={`/board/${b.id}`}
              color={b.color}
              label={t(`boards.${b.id}.label`)}
              sub={t(`boards.${b.id}.sub`)}
              tagline={t(`boards.${b.id}.tagline`)}
              cta={t('home.openBoard')}
            />
          ))}
          <HomeCard
            to="/market"
            color={MARKET_COLOR}
            label={t('market.title')}
            sub={t('market.cardSub')}
            tagline={t('market.desc')}
            cta={t('home.openMarket')}
          />
        </div>
      </section>

      <section className="border-t border-line bg-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="display text-3xl sm:text-4xl text-white mb-10">{t('home.howItWorks')}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((key, i) => (
              <div key={key}>
                <div className="display text-4xl text-gold/30">{String(i + 1).padStart(2, '0')}</div>
                <h3 className="text-white font-bold mt-2">{t(`home.${key}.t`)}</h3>
                <p className="text-muted text-sm mt-1.5 leading-relaxed">{t(`home.${key}.d`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 text-center sm:text-left">
          <p className="text-muted/80 text-sm leading-relaxed max-w-xl mx-auto sm:mx-0">
            {t('home.footer')}
          </p>
          <p className="text-muted/45 text-xs mt-3">© {new Date().getFullYear()} BEATLINK</p>
        </div>
      </footer>
    </main>
  )
}
