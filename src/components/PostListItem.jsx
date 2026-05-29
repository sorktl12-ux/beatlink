import { Link } from 'react-router-dom'
import { POST_STATUS, boardMeta, RECRUIT_BOARDS } from '../constants'
import { fmtDate } from '../utils/format'

const ROW =
  'grid grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[3rem_minmax(0,1fr)_5.5rem_5.5rem_4.5rem] items-center gap-x-3 gap-y-1 px-3 sm:px-4 py-3 min-h-[3.25rem] border-b border-line'

export default function PostListItem({ post, rowNum, currentUserId, isAdmin, onEdit }) {
  const board = boardMeta(post.board)
  const isDone = post.status === 'completed'
  const status = POST_STATUS[post.status] || POST_STATUS.approved
  const showRecruit = RECRUIT_BOARDS.includes(post.board) && post.recruit_count > 1
  const recruitCls = post.board === 'player' ? 'text-gold' : 'text-violet'
  const canManage = currentUserId && (post.author_id === currentUserId || isAdmin)

  const titleEl = (
    <p
      className={`font-semibold truncate ${
        isDone ? 'text-muted group-hover:text-white/70' : 'text-white group-hover:text-gold'
      }`}
    >
      {post.title}
    </p>
  )

  const inner = (
    <div className={`${ROW} transition-colors ${isDone ? '' : 'hover:bg-surface/60'} group`}>
      <span className="text-xs sm:text-sm text-muted tabular-nums text-center">{rowNum}</span>

      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="min-w-0 flex-1">
            <Link to={`/post/${post.id}`} className="block min-w-0">
              {titleEl}
            </Link>
          </div>
          {canManage && onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onEdit(post)
              }}
              className="shrink-0 text-[10px] sm:text-xs font-bold text-muted hover:text-gold border border-line hover:border-gold/40 rounded px-1.5 sm:px-2 py-0.5 transition-colors"
            >
              Edit
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 sm:hidden text-[11px] text-muted">
          <span>@{post.author_name}</span>
          {showRecruit && (
            <>
              <span>·</span>
              <span className={recruitCls}>Recruit {post.recruit_count}</span>
            </>
          )}
          <span>·</span>
          <span>{fmtDate(post.created_at)}</span>
          {post.audio_url && <span className="text-gold">♪</span>}
        </div>
      </div>

      <span className="hidden sm:block text-xs text-muted truncate">@{post.author_name}</span>
      <span className="hidden sm:block text-xs text-muted tabular-nums">
        {fmtDate(post.created_at)}
        {showRecruit && (
          <span className={`block text-[10px] mt-0.5 ${recruitCls}`}>
            Recruit {post.recruit_count}
          </span>
        )}
      </span>

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
          style={{ backgroundColor: isDone ? '#6b7280' : board.color }}
          aria-hidden
        />
        <span className={`text-[10px] font-bold ${status.cls}`}>{status.label}</span>
      </div>
    </div>
  )

  return <div>{inner}</div>
}

export function PostListEmptySlot() {
  return (
    <div
      className={`${ROW} bg-surface/[0.03]`}
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
