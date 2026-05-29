import { useCallback, useEffect, useRef, useState } from 'react'
import { decodeAudioFile, formatTime } from '../utils/audioClip'

export default function EngineerClipPicker({ file, clipSeconds, startSec, onStartChange }) {
  const audioRef = useRef(null)
  const stopTimer = useRef(null)
  const [duration, setDuration] = useState(null)
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [playing, setPlaying] = useState(false)

  const maxStart = duration != null ? Math.max(0, duration - clipSeconds) : 0
  const endSec = duration != null ? Math.min(startSec + clipSeconds, duration) : startSec + clipSeconds

  useEffect(() => {
    if (!file) {
      setDuration(null)
      setPreviewUrl('')
      return
    }
    let active = true
    setLoading(true)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    decodeAudioFile(file)
      .then(({ duration: d }) => {
        if (active) {
          setDuration(d)
          onStartChange(0)
        }
      })
      .catch(() => {
        if (active) setDuration(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      URL.revokeObjectURL(url)
      stopPreview()
    }
  }, [file]) // eslint-disable-line react-hooks/exhaustive-deps

  const stopPreview = useCallback(() => {
    if (stopTimer.current) {
      clearTimeout(stopTimer.current)
      stopTimer.current = null
    }
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
    setPlaying(false)
  }, [])

  const playPreview = () => {
    const audio = audioRef.current
    if (!audio || duration == null) return
    stopPreview()
    audio.currentTime = startSec
    audio.play()
    setPlaying(true)
    stopTimer.current = setTimeout(() => {
      audio.pause()
      setPlaying(false)
    }, (endSec - startSec) * 1000)
  }

  if (!file) return null

  const widthPct = duration ? ((endSec - startSec) / duration) * 100 : 100

  return (
    <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-teal uppercase tracking-wider">Select 10s Clip</p>
        {loading && <span className="text-xs text-muted">Loading…</span>}
      </div>

      {duration != null && (
        <>
          {/* Timeline */}
          <div className="relative h-10 rounded-lg bg-ink border border-line overflow-hidden">
            <div
              className="absolute inset-y-0 bg-teal/20 border-x-2 border-teal"
              style={{ left: `${(startSec / duration) * 100}%`, width: `${widthPct}%` }}
            />
            <div className="absolute inset-0 flex items-center px-2 text-[10px] text-muted pointer-events-none">
              <span>0:00</span>
              <span className="ml-auto">{formatTime(duration)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              Clip start · {formatTime(startSec)} → {formatTime(endSec)}
            </label>
            <input
              type="range"
              min={0}
              max={maxStart}
              step={0.1}
              value={Math.min(startSec, maxStart)}
              onChange={(e) => onStartChange(Number(e.target.value))}
              className="w-full accent-teal"
              disabled={maxStart <= 0}
            />
            {maxStart <= 0 && duration <= clipSeconds && (
              <p className="text-xs text-muted mt-1">
                Track is under {clipSeconds}s — the full file will be used.
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={playing ? stopPreview : playPreview}
              className="rounded-full bg-teal text-ink text-sm font-bold px-4 py-2 hover:opacity-90 transition-opacity"
            >
              {playing ? 'Stop' : 'Preview Clip'}
            </button>
            <span className="text-xs text-muted">
              {Math.round(endSec - startSec)}s excerpt selected
            </span>
          </div>
        </>
      )}

      <audio ref={audioRef} src={previewUrl} preload="auto" className="hidden" />
    </div>
  )
}
