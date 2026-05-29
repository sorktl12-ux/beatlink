import { Link } from 'react-router-dom'
import { BOARDS } from '../constants'

const STATUS = {
  pending: { label: 'Pending', cls: 'bg-orange/15 text-orange border-orange/30' },
  approved: { label: 'Open', cls: 'bg-emerald/15 text-emerald border-emerald/30' },
  completed: { label: 'Closed', cls: 'bg-line text-muted border-line' },
  rejected: { label: 'Rejected', cls: 'bg-crimson/15 text-crimson border-crimson/30' },
}

export default function PostCard({ post }) {
  const board = BOARDS.find((b) => b.id === post.board)
  const accent = board?.color || '#FFD700'
  const isDone = post.status === 'completed'
  const status = STATUS[post.status] || STATUS.approved

  const inner = (
    <div
      className={`group relative rounded-2xl border border-line bg-surface p-5 h-full transition-all ${
        isDone
          ? 'grayscale opacity-50'
          : 'hover:-translate-y-1 hover:border-gold/40'
      }`}
    >
      <span
        className="absolute left-0 top-5 bottom-5 w-1 rounded-full"
        style={{ backgroundColor: accent }}
      />
      <div className="flex items-center justify-between mb-3 pl-2">
        <span
          className="text-[10px] font-bold tracking-widest uppercase"
          style={{ color: accent }}
        >
          {board?.label || post.board}
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${status.cls}`}>
          {status.label}
        </span>
      </div>
      <h3 className="font-bold text-white text-lg leading-snug pl-2 line-clamp-2">
        {post.title}
      </h3>
      {post.description && (
        <p className="text-muted text-sm mt-1.5 pl-2 line-clamp-2">{post.description}</p>
      )}
      <div className="flex items-center justify-between mt-4 pl-2">
        <span className="text-xs text-muted">@{post.author_name}</span>
        {post.audio_url && (
          <span className="text-[11px] text-gold font-semibold">♪ Track attached</span>
        )}
      </div>
    </div>
  )

  if (isDone) return <div>{inner}</div>
  return <Link to={`/post/${post.id}`}>{inner}</Link>
}
