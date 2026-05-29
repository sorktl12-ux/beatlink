import { createClient } from '@supabase/supabase-js'

// Strip accidental spaces/tabs/newlines from Vercel env vars (breaks fetch headers).
function cleanEnv(v) {
  return String(v ?? '').trim().replace(/[\r\n\t]/g, '')
}

// Defaults are the public anon URL/key (safe in frontend). Env vars override when clean.
const DEFAULT_URL = 'https://dkmrvavkzwtbqzttcmiz.supabase.co'
const DEFAULT_KEY = 'sb_publishable_vWf8PyKI9Ld_TSTb81h6Kw_MVK_FlqY'

const url = cleanEnv(import.meta.env.VITE_SUPABASE_URL) || DEFAULT_URL
const anonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY) || DEFAULT_KEY

// True only when real config is present (false for placeholder/empty values)
export const supabaseConfigured = Boolean(
  url && anonKey && !String(url).includes('your_') && !String(anonKey).includes('your_')
)

// Buckets: audio holds tracks/beats, images holds marketplace photos
export const AUDIO_BUCKET = 'audio'
export const IMAGE_BUCKET = 'images'

export const supabase = supabaseConfigured
  ? createClient(url, anonKey)
  : null

if (!supabaseConfigured) {
  console.warn(
    '[BEATLINK] No Supabase config found. Fill in your .env to enable login and the boards.'
  )
}

// Returns the public URL for a stored object path
export function publicAudioUrl(path) {
  if (!supabase || !path) return ''
  return supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path).data.publicUrl
}

export function publicImageUrl(path) {
  if (!supabase || !path) return ''
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}
