const WINDOW = 5

/** Up to 5 page numbers, sliding as total pages grow. */
function pageRange(page, totalPages) {
  if (totalPages <= WINDOW) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  let start = page - Math.floor(WINDOW / 2)
  let end = start + WINDOW - 1

  if (start < 1) {
    start = 1
    end = WINDOW
  }
  if (end > totalPages) {
    end = totalPages
    start = totalPages - WINDOW + 1
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

export default function Pagination({ page, totalPages, onPageChange }) {
  const pages = pageRange(page, totalPages)
  const hasPrevWindow = pages[0] > 1
  const hasNextWindow = pages[pages.length - 1] < totalPages

  return (
    <nav
      className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5"
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

      {hasPrevWindow && (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className="min-w-[2.25rem] px-2.5 py-1.5 rounded-lg border border-line text-sm font-bold text-muted hover:text-white hover:border-gold/40 transition-colors"
          >
            1
          </button>
          <span className="px-0.5 text-muted text-sm select-none">…</span>
        </>
      )}

      {pages.map((p) => (
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
      ))}

      {hasNextWindow && (
        <>
          <span className="px-0.5 text-muted text-sm select-none">…</span>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            className="min-w-[2.25rem] px-2.5 py-1.5 rounded-lg border border-line text-sm font-bold text-muted hover:text-white hover:border-gold/40 transition-colors"
          >
            {totalPages}
          </button>
        </>
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
