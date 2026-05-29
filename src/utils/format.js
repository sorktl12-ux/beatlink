export function fmtDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-CA').replace(/-/g, '.')
}

export function fmtKrw(amount) {
  if (amount == null || amount === '') return '—'
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `₩${n.toLocaleString('en-US')}`
}
