const CATEGORY_CONFIG = {
  dream: {
    label: '1년 뒤 이루고 싶은 것',
    icon: '✦',
    color: '#C9A84C',
    borderHover: 'rgba(201, 168, 76, 0.5)',
    glowColor: 'rgba(201, 168, 76, 0.08)',
  },
  ai: {
    label: 'AI로 바꿀 내 업무',
    icon: '◈',
    color: '#CBD5E1',
    borderHover: 'rgba(203, 213, 225, 0.4)',
    glowColor: 'rgba(203, 213, 225, 0.05)',
  },
}

function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VisionCard({ card, index }) {
  const config = CATEGORY_CONFIG[card.category] ?? CATEGORY_CONFIG.dream

  return (
    <article
      className="group relative bg-[#111111] border border-[rgba(255,255,255,0.05)] transition-all duration-300 cursor-default"
      style={{
        animationDelay: `${Math.min(index * 60, 400)}ms`,
        animationFillMode: 'both',
      }}
    >
      {/* Hover: top gold rule */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${config.color}, transparent)`,
        }}
      />

      {/* Hover: subtle glow bg */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: config.glowColor }}
      />

      <div className="relative p-5 sm:p-6">
        {/* Category badge */}
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-base leading-none" style={{ color: config.color }}>
            {config.icon}
          </span>
          <span
            className="text-[10px] tracking-[0.2em] uppercase font-medium"
            style={{ color: config.color }}
          >
            {config.label}
          </span>
        </div>

        {/* Name */}
        <div className="text-white font-semibold text-base mb-3 leading-tight">
          {card.name}
        </div>

        {/* Divider */}
        <div className="h-px bg-[rgba(255,255,255,0.05)] mb-3" />

        {/* Content */}
        <p className="text-[#888] text-sm leading-[1.75] whitespace-pre-wrap break-words">
          {card.content}
        </p>

        {/* Timestamp */}
        {card.createdAt && (
          <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.04)]">
            <time className="text-[#2d2d2d] text-[11px]">{formatTime(card.createdAt)}</time>
          </div>
        )}
      </div>

      {/* Hover border glow override */}
      <div
        className="absolute inset-0 border opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ borderColor: config.borderHover }}
      />
    </article>
  )
}
