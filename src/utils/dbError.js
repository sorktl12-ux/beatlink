/** Map Supabase/PostgREST errors to user-facing copy (incl. missing DB columns). */
export function formatDbError(err, t) {
  const msg = String(err?.message || err || '')
  if (/schema cache|could not find the .* column/i.test(msg)) {
    return t('common.schemaMigration')
  }
  return msg || t('common.uploadFailed')
}
