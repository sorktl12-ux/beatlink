import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="text-center py-32">
      <p className="display text-6xl text-gold">404</p>
      <p className="text-muted text-sm mt-3">Page not found.</p>
      <Link
        to="/"
        className="inline-block mt-6 rounded-full bg-gold text-ink font-bold px-6 py-2.5 hover:bg-gold-hi transition-colors"
      >
        Back Home
      </Link>
    </div>
  )
}
