import { Routes, Route } from 'react-router-dom'
import { supabaseConfigured } from './supabase'
import Navbar from './components/Navbar'
import { RequireAuth, RequireAdmin } from './components/Guards'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Board from './pages/Board'
import PostDetail from './pages/PostDetail'
import Marketplace from './pages/Marketplace'
import Shop from './pages/Shop'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <div className="min-h-screen bg-ink noise-bg">
      {!supabaseConfigured && (
        <div className="bg-orange/15 border-b border-orange/30 text-orange text-center text-xs sm:text-sm px-4 py-2">
          Demo mode (design only) — no Supabase config detected. Add your Supabase
          values to <code className="font-bold">.env</code> to unlock login and the boards.
        </div>
      )}
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
          path="/shop"
          element={
            <RequireAuth>
              <Shop />
            </RequireAuth>
          }
        />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}
