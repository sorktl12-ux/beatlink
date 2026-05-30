import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLocale } from '../contexts/LocaleContext'
import { useShow505Config } from '../contexts/Show505Context'
import { useShow505Countdown, formatCountdownNav } from '../hooks/useShow505Countdown'
import BrandMark from './BrandMark'

const NAV_LINKS = [
  { to: '/board/player', labelKey: 'nav.player', activeCls: 'text-gold' },
  { to: '/board/producer', labelKey: 'nav.producer', activeCls: 'text-violet' },
  { to: '/board/engineer', labelKey: 'nav.engineer', activeCls: 'text-teal' },
  { to: '/market', labelKey: 'nav.market', activeCls: 'text-emerald' },
  { to: '/505', labelKey: 'nav.show505', activeCls: 'text-[#FF6B35]', show505Only: true },
  { to: '/admin', labelKey: 'nav.admin', activeCls: 'text-gold', adminOnly: true },
]

const navItem = (activeCls) => ({ isActive }) =>
  `px-1.5 lg:px-2 py-2 text-[1.05rem] lg:text-[1.225rem] font-semibold tracking-normal whitespace-nowrap transition-colors ${
    isActive ? activeCls : 'text-muted hover:text-white'
  }`

const navItem505 = (activeCls) => ({ isActive }) =>
  `px-1.5 lg:px-2 py-1.5 text-[1.05rem] lg:text-[1.225rem] font-semibold tracking-normal whitespace-nowrap transition-colors ${
    isActive ? activeCls : ''
  }`

const mobileNavItem505 = (activeCls) => ({ isActive }) =>
  `shrink-0 px-2 py-1 text-[1.05rem] font-semibold tracking-normal whitespace-nowrap transition-colors ${
    isActive ? activeCls : ''
  }`

const mobileNavItem = (activeCls) => ({ isActive }) =>
  `shrink-0 px-2 py-1.5 text-[1.05rem] font-semibold tracking-normal whitespace-nowrap transition-colors ${
    isActive ? activeCls : 'text-muted hover:text-white'
  }`

function Nav505Link({ to, label, countdownLabel, activeCls, classNameFn }) {
  return (
    <NavLink to={to} className={classNameFn(activeCls)}>
      {({ isActive }) => (
        <span className="flex flex-col items-center leading-none gap-0.5">
          {countdownLabel && (
            <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-crimson">
              {countdownLabel}
            </span>
          )}
          <span className={isActive ? activeCls : 'text-muted hover:text-white'}>{label}</span>
        </span>
      )}
    </NavLink>
  )
}

function LangSwitch() {
  const { locale, setLocale, t } = useLocale()
  return (
    <div className="flex rounded-full border border-line bg-surface p-0.5 shrink-0">
      {(['en', 'ko']).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l)}
          className={`px-2 py-1 text-[10px] sm:text-xs font-bold rounded-full transition-colors ${
            locale === l ? 'bg-gold text-ink' : 'text-muted hover:text-white'
          }`}
          aria-pressed={locale === l}
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  )
}

export default function Navbar() {
  const { isAuthed, isAdmin, profile, logout } = useAuth()
  const { locale, t } = useLocale()
  const { active: show505Active, config: show505Config } = useShow505Config()
  const navigate = useNavigate()

  const show505Nav = isAuthed && (show505Active || isAdmin)
  const show505Label = show505Config?.event_title || t('nav.show505')
  const { remaining: countdownMs } = useShow505Countdown(show505Config?.event_starts_at)
  const navCountdown = show505Config?.event_starts_at
    ? formatCountdownNav(countdownMs, locale)
    : null

  const visibleLinks = NAV_LINKS.filter((link) => {
    if (link.adminOnly && !isAdmin) return false
    if (link.show505Only && !show505Nav) return false
    return true
  })

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 min-h-16 flex items-center gap-1 min-w-0">
        <Link to="/" className="shrink-0 mr-0.5 sm:mr-1 hover:opacity-90 transition-opacity">
          <BrandMark size="md" />
        </Link>

        <nav className="hidden sm:flex items-center gap-0 ml-0.5 shrink-0">
          {visibleLinks.map((link) =>
            link.show505Only ? (
              <Nav505Link
                key={link.to}
                to={link.to}
                label={show505Label}
                countdownLabel={navCountdown}
                activeCls={link.activeCls}
                classNameFn={navItem505}
              />
            ) : (
              <NavLink key={link.to} to={link.to} className={navItem(link.activeCls)}>
                {t(link.labelKey)}
              </NavLink>
            )
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1 sm:gap-2 shrink-0">
          <LangSwitch />
          {isAuthed ? (
            <>
              {!isAdmin && profile && (
                <Link
                  to="/me"
                  className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-line bg-surface px-2 sm:px-3 py-1.5 hover:border-gold/50 transition-colors max-w-[9.5rem] sm:max-w-none"
                >
                  <span className="text-xs sm:text-sm font-semibold text-white truncate">
                    {profile.username}
                  </span>
                </Link>
              )}
              {isAdmin && (
                <span className="rounded-full bg-gold/15 text-gold text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 border border-gold/30 shrink-0">
                  {t('nav.admin').toUpperCase()}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm text-muted hover:text-crimson transition-colors whitespace-nowrap shrink-0"
              >
                {t('nav.logOut')}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-gold text-ink text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-gold-hi transition-colors whitespace-nowrap shrink-0"
            >
              <span className="sm:hidden">{t('nav.logIn')}</span>
              <span className="hidden sm:inline">{t('nav.logInJoin')}</span>
            </Link>
          )}
        </div>
      </div>

      <nav className="sm:hidden flex items-center gap-0 overflow-x-auto flex-nowrap scrollbar-none border-t border-line px-2 py-1.5">
        {visibleLinks.map((link) =>
          link.show505Only ? (
            <Nav505Link
              key={link.to}
              to={link.to}
              label={show505Label}
              countdownLabel={navCountdown}
              activeCls={link.activeCls}
              classNameFn={mobileNavItem505}
            />
          ) : (
            <NavLink key={link.to} to={link.to} className={mobileNavItem(link.activeCls)}>
              {t(link.labelKey)}
            </NavLink>
          )
        )}
      </nav>
    </header>
  )
}
