function pageRange(page, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages = new Set([1, totalPages, page, page - 1, page + 1].filter((p) => p >= 1 && p <= totalPages))
  const sorted = [...pages].sort((a, b) => a - b)
  const out = []
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push('…')
    out.push(sorted[i])
  }
  return out
}

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const pages = pageRange(page, totalPages)

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5 pt-8"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded-lg border border-line text-sm font-semibold text-muted hover:text-white hover:border-gold/40 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        Prev
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-muted text-sm select-none">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`min-w-[2.25rem] px-2.5 py-1.5 rounded-lg border text-sm font-bold transition-colors ${
              p === page
                ? 'border-gold bg-gold/15 text-gold'
                : 'border-line text-muted hover:text-white hover:border-gold/40'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded-lg border border-line text-sm font-semibold text-muted hover:text-white hover:border-gold/40 disabled:opacity-30 disabled:pointer-events-none transition-colors"
      >
        Next
      </button>
    </nav>
  )
}
