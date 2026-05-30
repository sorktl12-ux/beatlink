import { createClient } from '@supabase/supabase-js'

function cleanEnv(v) {
  return String(v ?? '').trim().replace(/[\r\n\t]/g, '')
}

const url = cleanEnv(import.meta.env.VITE_SUPABASE_URL)
const anonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)

export const supabaseConfigured = Boolean(
  url && anonKey && !url.includes('your_') && !anonKey.includes('your_')
)

export const AUDIO_BUCKET = 'audio'
export const IMAGE_BUCKET = 'images'

export const supabase = supabaseConfigured ? createClient(url, anonKey) : null

if (!supabaseConfigured && import.meta.env.DEV) {
  console.warn(
    '[BEATLINK] No Supabase config. Copy .env.example → .env and add your project URL and anon key.'
  )
}

export function publicAudioUrl(path) {
  if (!supabase || !path) return ''
  return supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path).data.publicUrl
}

export function publicImageUrl(path) {
  if (!supabase || !path) return ''
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}
