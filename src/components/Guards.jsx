import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function Splash() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin-slow" />
    </div>
  )
}

export function RequireAuth({ children }) {
  const { isAuthed, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Splash />
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

export function RequireAdmin({ children }) {
  const { isAdmin, loading } = useAuth()
  if (loading) return <Splash />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}
