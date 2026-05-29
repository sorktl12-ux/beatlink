// Browser-side audio trim helpers for engineer showcase clips.

function encodeWav(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const length = audioBuffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = length * blockAlign
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bytesPerSample * 8, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(ch)[i]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

/** Peak amplitudes (0–1) for waveform visualization. */
export function extractWaveformPeaks(audioBuffer, barCount = 220) {
  const channels = audioBuffer.numberOfChannels
  const length = audioBuffer.length
  const samplesPerBar = Math.max(1, Math.floor(length / barCount))
  const peaks = []

  for (let i = 0; i < barCount; i++) {
    const start = i * samplesPerBar
    const end = Math.min(start + samplesPerBar, length)
    let peak = 0
    for (let j = start; j < end; j++) {
      for (let ch = 0; ch < channels; ch++) {
        peak = Math.max(peak, Math.abs(audioBuffer.getChannelData(ch)[j]))
      }
    }
    peaks.push(peak)
  }

  const max = Math.max(...peaks, 0.001)
  return peaks.map((p) => p / max)
}

export async function decodeAudioFile(file) {
  const arrayBuffer = await file.arrayBuffer()
  const ctx = new AudioContext()
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0))
    return {
      audioBuffer,
      duration: audioBuffer.duration,
      peaks: extractWaveformPeaks(audioBuffer),
    }
  } finally {
    await ctx.close()
  }
}

export function trimAudioBuffer(audioBuffer, startSec, clipSec) {
  const sampleRate = audioBuffer.sampleRate
  const startSample = Math.floor(Math.max(0, startSec) * sampleRate)
  const clipSamples = Math.min(
    Math.floor(clipSec * sampleRate),
    audioBuffer.length - startSample
  )
  if (clipSamples <= 0) throw new Error('Invalid clip range.')

  const trimmed = new AudioBuffer({
    numberOfChannels: audioBuffer.numberOfChannels,
    length: clipSamples,
    sampleRate,
  })

  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const src = audioBuffer.getChannelData(ch)
    trimmed.copyToChannel(src.subarray(startSample, startSample + clipSamples), ch)
  }
  return trimmed
}

/** Returns a WAV blob for the selected segment. */
export async function trimAudioFile(file, startSec, clipSec) {
  const { audioBuffer } = await decodeAudioFile(file)
  const trimmed = trimAudioBuffer(audioBuffer, startSec, clipSec)
  return encodeWav(trimmed)
}

export function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}
