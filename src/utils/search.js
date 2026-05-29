export function normalizeSearch(query) {
  return String(query ?? '').trim().toLowerCase()
}

/** Match query against any of the given string fields (title, description, etc.). */
export function matchesSearch(item, query, fields) {
  const q = normalizeSearch(query)
  if (!q) return true
  return fields.some((field) => String(item[field] ?? '').toLowerCase().includes(q))
}

export function filterBySearch(items, query, fields) {
  const q = normalizeSearch(query)
  if (!q) return items
  return items.filter((item) => matchesSearch(item, query, fields))
}
