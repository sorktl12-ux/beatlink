import { createClient } from '@supabase/supabase-js'

// Trim — Vercel env vars sometimes include accidental spaces/tabs (breaks fetch headers).
const url = String(import.meta.env.VITE_SUPABASE_URL || '').trim()
const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

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
