import { useState } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROLES } from '../constants'

const authErr = (msg) => {
  if (!msg) return null
  const m = msg.toLowerCase()
  if (m.includes('already registered') || m.includes('already been registered'))
    return 'That ID is already taken.'
  if (m.includes('invalid login')) return 'Invalid ID or password.'
  if (m.includes('password') && (m.includes('at least') || m.includes('characters')))
    return 'Password is too short. Set the minimum length to 4 in Supabase (Auth > Sign In / Providers > Email).'
  if (m.includes('email not confirmed'))
    return 'Email confirmation is on in Supabase. Turn it OFF (Auth > Providers > Email).'
  return null
}

const KOREAN_NAME = /^[가-힣]{2,}$/

export default function Auth() {
  const [mode, setMode] = useState('login')
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('player')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login, signup, isAuthed, loading } = useAuth()
  const navigate = useNavigate()

  if (!loading && isAuthed) return <Navigate to="/" replace />

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!id.trim()) return setError('Please enter an ID.')
    if (mode === 'signup') {
      if (password.length < 4) return setError('Password must be at least 4 characters.')
      if (!KOREAN_NAME.test(fullName.trim()))
        return setError('본명을 한글로 입력해 주세요 (2자 이상).')
      const digits = phone.replace(/\D/g, '')
      if (digits.length < 10 || digits.length > 11 || digits[0] !== '0')
        return setError('올바른 핸드폰 번호를 입력해 주세요. (예: 010-1234-5678)')
    }
    setBusy(true)
    try {
      if (mode === 'login') {
        await login({ id, password })
        navigate('/')
      } else {
        await signup({ id, password, role, fullName: fullName.trim(), phone: phone.trim() })
        navigate('/')
      }
    } catch (err) {
      setError(authErr(err.message) || err.message || 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="display text-4xl">
            <span className="text-gold">BEAT</span>
            <span className="text-white">LINK</span>
          </h1>
          <p className="text-muted text-sm mt-2">Where rappers, beatmakers & engineers link up</p>
        </div>

        <div className="flex rounded-full bg-surface border border-line p-1 mb-6">
          {['login', 'signup'].map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m)
                setError('')
              }}
              className={`flex-1 rounded-full py-2 text-sm font-bold transition-colors ${
                mode === m ? 'bg-gold text-ink' : 'text-muted hover:text-white'
              }`}
            >
              {m === 'login' ? 'Log In' : 'Join'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">ID</label>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoComplete="username"
              className="w-full rounded-lg bg-surface border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none transition-colors"
              placeholder="Enter your ID"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full rounded-lg bg-surface border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none transition-colors"
              placeholder={mode === 'signup' ? '4+ characters' : 'Enter your password'}
            />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  본명 (한글)
                </label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg bg-surface border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none transition-colors"
                  placeholder="예: 홍길동"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  핸드폰 번호
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoComplete="tel"
                  className="w-full rounded-lg bg-surface border border-line px-4 py-3 text-white placeholder-muted/60 focus:border-gold focus:outline-none transition-colors"
                  placeholder="010-1234-5678"
                />
              </div>
            </>
          )}

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-muted mb-2">Choose Your Lane</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    onClick={() => setRole(r.id)}
                    className={`rounded-lg border px-2 py-3 text-center transition-all ${
                      role === r.id
                        ? 'border-transparent'
                        : 'border-line bg-surface hover:border-muted/40'
                    }`}
                    style={
                      role === r.id
                        ? { backgroundColor: `${r.color}22`, borderColor: r.color }
                        : undefined
                    }
                  >
                    <div
                      className="text-sm font-bold"
                      style={{ color: role === r.id ? r.color : '#fff' }}
                    >
                      {r.label}
                    </div>
                    <div className="text-[10px] text-muted mt-0.5">{r.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="text-crimson text-sm bg-crimson/10 border border-crimson/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-gold text-ink font-bold py-3 hover:bg-gold-hi transition-colors disabled:opacity-50"
          >
            {busy ? 'Working...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-muted/70 mt-6">
          <Link to="/" className="hover:text-gold transition-colors">
            ← Back home
          </Link>
        </p>
      </div>
    </div>
  )
}
