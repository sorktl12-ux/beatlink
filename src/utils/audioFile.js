const AUDIO_EXTENSIONS = new Set([
  'mp3',
  'm4a',
  'wav',
  'aac',
  'aiff',
  'aif',
  'caf',
  'flac',
  'ogg',
  'oga',
  'opus',
  'webm',
  'wma',
])

const EXT_TO_MIME = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
  aac: 'audio/aac',
  aiff: 'audio/aiff',
  aif: 'audio/aiff',
  caf: 'audio/x-caf',
  flac: 'audio/flac',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/opus',
  webm: 'audio/webm',
  wma: 'audio/x-ms-wma',
}

// WebKit #242110 — iOS grays out everything when accept uses audio/* alone.
export const AUDIO_FILE_ACCEPT =
  'audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/m4a,audio/wav,audio/x-wav,audio/aac,audio/x-aac,audio/aiff,audio/x-caf,audio/flac,audio/ogg,audio/webm,audio/opus,.mp3,.m4a,.wav,.aac,.aiff,.aif,.caf,.flac,.ogg,.webm'

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/** iOS: omit accept (most reliable). Others: explicit MIME list. */
export function getAudioFileAccept() {
  return isIOS() ? undefined : AUDIO_FILE_ACCEPT
}

export function isAudioFile(file) {
  if (!file) return false
  const type = (file.type || '').toLowerCase()
  if (type.startsWith('audio/')) return true
  const ext = file.name?.split('.').pop()?.toLowerCase()
  return ext ? AUDIO_EXTENSIONS.has(ext) : false
}

export function audioContentType(file) {
  const type = (file.type || '').toLowerCase()
  if (type.startsWith('audio/')) return type
  const ext = file.name?.split('.').pop()?.toLowerCase()
  return (ext && EXT_TO_MIME[ext]) || 'audio/mpeg'
}

export function audioFileExtension(file, fallback = 'mp3') {
  const ext = file.name?.split('.').pop()?.toLowerCase()
  if (ext && AUDIO_EXTENSIONS.has(ext)) return ext
  const mime = audioContentType(file)
  if (mime === 'audio/wav') return 'wav'
  if (mime === 'audio/mp4' || mime === 'audio/x-m4a') return 'm4a'
  return fallback
}
