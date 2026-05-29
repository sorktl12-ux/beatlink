import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { BrandMark } from './BrandMark'

const navItem = ({ isActive }) =>
  `px-3 py-2 text-sm font-semibold tracking-wide transition-colors ${
    isActive ? 'text-gold' : 'text-muted hover:text-white'
  }`

const mobileNavItem = ({ isActive }) =>
  `shrink-0 px-2.5 py-1.5 text-xs font-semibold tracking-wide whitespace-nowrap transition-colors ${
    isActive ? 'text-gold' : 'text-muted hover:text-white'
  }`

export default function Navbar() {
  const { isAuthed, isAdmin, profile, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/85 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 min-h-16 flex items-center gap-1 sm:gap-2 min-w-0">
        <Link to="/" className="shrink min-w-0 mr-1 sm:mr-2 hover:opacity-90 transition-opacity">
          <BrandMark size="md" />
        </Link>

        <nav className="hidden sm:flex items-center ml-2 shrink-0">
          <NavLink to="/board/player" className={navItem}>
            Player
          </NavLink>
          <NavLink to="/board/producer" className={navItem}>
            Producer
          </NavLink>
          <NavLink to="/board/engineer" className={navItem}>
            Engineer
          </NavLink>
          <NavLink to="/shop" className={navItem}>
            Beatshop
          </NavLink>
          <NavLink to="/market" className={navItem}>
            Market
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navItem}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3 shrink-0">
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
                  <span className="text-gold text-xs sm:text-sm font-bold tabular-nums shrink-0">
                    {profile.credits ?? 0}
                    <span className="text-[10px] text-muted ml-0.5">CR</span>
                  </span>
                </Link>
              )}
              {isAdmin && (
                <span className="rounded-full bg-gold/15 text-gold text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 border border-gold/30 shrink-0">
                  ADMIN
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm text-muted hover:text-crimson transition-colors whitespace-nowrap shrink-0"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-gold text-ink text-xs sm:text-sm font-bold px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-gold-hi transition-colors whitespace-nowrap shrink-0"
            >
              <span className="sm:hidden">Log In</span>
              <span className="hidden sm:inline">Log In / Join</span>
            </Link>
          )}
        </div>
      </div>

      {/* mobile board links — horizontal scroll instead of clipping */}
      <nav className="sm:hidden flex items-center gap-0.5 overflow-x-auto flex-nowrap scrollbar-none border-t border-line px-2 py-1.5">
        <NavLink to="/board/player" className={mobileNavItem}>
          Player
        </NavLink>
        <NavLink to="/board/producer" className={mobileNavItem}>
          Producer
        </NavLink>
        <NavLink to="/board/engineer" className={mobileNavItem}>
          Engineer
        </NavLink>
        <NavLink to="/shop" className={mobileNavItem}>
          Beatshop
        </NavLink>
        <NavLink to="/market" className={mobileNavItem}>
          Market
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={mobileNavItem}>
            Admin
          </NavLink>
        )}
      </nav>
    </header>
  )
}
