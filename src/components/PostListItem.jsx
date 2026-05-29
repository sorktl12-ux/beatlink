import { Link } from 'react-router-dom'
import { BOARDS } from '../constants'

const STATUS = {
  pending: { label: 'Pending', cls: 'text-orange' },
  approved: { label: 'Open', cls: 'text-emerald' },
  completed: { label: 'Closed', cls: 'text-muted' },
  rejected: { label: 'Rejected', cls: 'text-crimson' },
}

function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-CA').replace(/-/g, '.')
}

export default function PostListItem({ post, rowNum }) {
  const board = BOARDS.find((b) => b.id === post.board)
  const accent = board?.color || '#FFD700'
  const isDone = post.status === 'completed'
  const status = STATUS[post.status] || STATUS.approved

  const inner = (
    <div
      className={`grid grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[3rem_minmax(0,1fr)_5.5rem_5.5rem_4.5rem] items-center gap-x-3 gap-y-1 px-3 sm:px-4 py-3 min-h-[3.25rem] border-b border-line transition-colors ${
        isDone ? 'opacity-50 grayscale' : 'hover:bg-surface/60'
      }`}
    >
      <span className="text-xs sm:text-sm text-muted tabular-nums text-center">{rowNum}</span>

      <div className="min-w-0">
        <p className="font-semibold text-white truncate">{post.title}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 sm:hidden text-[11px] text-muted">
          <span>@{post.author_name}</span>
          <span>·</span>
          <span>{fmtDate(post.created_at)}</span>
          {post.audio_url && <span className="text-gold">♪</span>}
        </div>
      </div>

      <span className="hidden sm:block text-xs text-muted truncate">@{post.author_name}</span>
      <span className="hidden sm:block text-xs text-muted tabular-nums">{fmtDate(post.created_at)}</span>

      <div className="hidden sm:flex items-center justify-end gap-1.5">
        {post.audio_url && (
          <span className="text-[10px] text-gold font-semibold" title="Track attached">
            ♪
          </span>
        )}
        <span className={`text-[11px] font-bold ${status.cls}`}>{status.label}</span>
      </div>

      <div className="sm:hidden col-start-2 flex items-center gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <span className={`text-[10px] font-bold ${status.cls}`}>{status.label}</span>
      </div>
    </div>
  )

  if (isDone) return <div>{inner}</div>
  return <Link to={`/post/${post.id}`}>{inner}</Link>
}

export function PostListEmptySlot() {
  return (
    <div
      className="grid grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[3rem_minmax(0,1fr)_5.5rem_5.5rem_4.5rem] items-center gap-x-3 px-3 sm:px-4 py-3 min-h-[3.25rem] border-b border-line bg-surface/[0.03]"
      aria-hidden
    >
      <span className="text-xs sm:text-sm text-line/40 text-center select-none">·</span>
      <span className="hidden sm:block sm:col-span-4 border-b border-dashed border-line/25" />
      <span className="sm:hidden col-start-2 border-b border-dashed border-line/25" />
    </div>
  )
}

export function PostListHeader() {
  return (
    <div className="hidden sm:grid grid-cols-[3rem_minmax(0,1fr)_5.5rem_5.5rem_4.5rem] gap-x-3 px-4 py-2 border-y border-line bg-surface/50 text-[10px] font-bold tracking-widest uppercase text-muted">
      <span className="text-center">#</span>
      <span>Title</span>
      <span>Author</span>
      <span>Date</span>
      <span className="text-right">Status</span>
    </div>
  )
}
