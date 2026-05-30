import en from './en.js'
import ko from './ko.js'

const dicts = { en, ko }

export function translate(locale, key, vars) {
  const val = key.split('.').reduce((o, k) => o?.[k], dicts[locale] ?? en)
  if (typeof val !== 'string') return key
  if (!vars) return val
  return val.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}
