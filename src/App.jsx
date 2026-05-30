import { Routes, Route } from 'react-router-dom'
import { supabaseConfigured } from './supabase'
import { useLocale } from './contexts/LocaleContext'
import Navbar from './components/Navbar'
import { RequireAuth, RequireAdmin } from './components/Guards'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Board from './pages/Board'
import PostDetail from './pages/PostDetail'
import Marketplace from './pages/Marketplace'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import Show505 from './pages/Show505'
import NotFound from './pages/NotFound'

function DemoBanner() {
  const { t } = useLocale()
  return (
    <div className="bg-orange/15 border-b border-orange/30 text-orange text-center text-xs sm:text-sm px-4 py-2">
      {t('app.demoMode')}
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-ink noise-bg">
      {!supabaseConfigured && <DemoBanner />}
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Auth />} />
        <Route
          path="/board/:board"
          element={
            <RequireAuth>
              <Board />
            </RequireAuth>
          }
        />
        <Route
          path="/post/:id"
          element={
            <RequireAuth>
              <PostDetail />
            </RequireAuth>
          }
        />
        <Route path="/market" element={<Marketplace />} />
        <Route
          path="/me"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
        <Route
          path="/505"
          element={
            <RequireAuth>
              <Show505 />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
