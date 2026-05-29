import en from './en.js'
import ko from './ko.js'

const dicts = { en, ko }

export function translate(locale, key, vars) {
  const val = key.split('.').reduce((o, k) => o?.[k], dicts[locale] ?? en)
  if (typeof val !== 'string') return key
  if (!vars) return val
  return val.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

export function boardLabel(locale, boardId, field) {
  return translate(locale, `boards.${boardId}.${field}`)
}

export function roleLabel(locale, roleId, field) {
  return translate(locale, `roles.${roleId}.${field}`)
}

export function statusLabel(locale, status) {
  return translate(locale, `status.${status}`) || status
}

export function mixScopeLabel(locale, scopeId) {
  return translate(locale, `mixScope.${scopeId}`) || scopeId
}
