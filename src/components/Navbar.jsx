import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navItem = ({ isActive }) =>
  `px-3 py-2 text-sm font-semibold tracking-wide transition-colors ${
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 mr-2">
          <span className="display text-2xl text-gold leading-none">BEAT</span>
          <span className="display text-2xl text-white leading-none">LINK</span>
        </Link>

        <nav className="hidden sm:flex items-center ml-2">
          <NavLink to="/board/player" className={navItem}>
            Player
          </NavLink>
          <NavLink to="/board/producer" className={navItem}>
            Producer
          </NavLink>
          <NavLink to="/board/engineer" className={navItem}>
            Engineer
          </NavLink>
          <NavLink to="/market" className={navItem}>
            Market
          </NavLink>
          <NavLink to="/shop" className={navItem}>
            Beat Shop
          </NavLink>
          {isAdmin && (
            <NavLink to="/admin" className={navItem}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {isAuthed ? (
            <>
              {!isAdmin && profile && (
                <Link
                  to="/me"
                  className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 hover:border-gold/50 transition-colors"
                >
                  <span className="text-sm font-semibold text-white">
                    {profile.username}
                  </span>
                  <span className="text-gold text-sm font-bold tabular-nums">
                    {profile.credits ?? 0}
                    <span className="text-[10px] text-muted ml-0.5">CR</span>
                  </span>
                </Link>
              )}
              {isAdmin && (
                <span className="rounded-full bg-gold/15 text-gold text-xs font-bold px-3 py-1.5 border border-gold/30">
                  ADMIN
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-muted hover:text-crimson transition-colors"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-gold text-ink text-sm font-bold px-4 py-2 hover:bg-gold-hi transition-colors"
            >
              Log In / Join
            </Link>
          )}
        </div>
      </div>

      {/* mobile board links */}
      <nav className="sm:hidden flex items-center justify-center gap-1 border-t border-line px-2 py-1.5">
        <NavLink to="/board/player" className={navItem}>
          Player
        </NavLink>
        <NavLink to="/board/producer" className={navItem}>
          Producer
        </NavLink>
        <NavLink to="/board/engineer" className={navItem}>
          Engineer
        </NavLink>
        <NavLink to="/market" className={navItem}>
          Market
        </NavLink>
        <NavLink to="/shop" className={navItem}>
          Shop
        </NavLink>
        {isAdmin && (
          <NavLink to="/admin" className={navItem}>
            Admin
          </NavLink>
        )}
      </nav>
    </header>
  )
}
