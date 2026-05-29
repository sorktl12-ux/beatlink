import { useCallback, useEffect, useRef, useState } from 'react'
import { decodeAudioFile, formatTime } from '../utils/audioClip'
import { useLocale } from '../contexts/LocaleContext'

function WaveformLayer({ peaks, variant = 'faded' }) {
  const faded = variant === 'faded'
  return (
    <div className="flex items-center h-full w-full gap-px px-0.5">
      {peaks.map((peak, i) => {
        const h = Math.max(6, peak * 96)
        return (
          <div key={i} className="flex-1 flex items-center justify-center min-w-0 h-full">
            <div
              className={`w-full rounded-full ${faded ? 'bg-teal/40' : 'bg-teal'}`}
              style={{
                height: `${h}%`,
                opacity: faded ? 0.35 + peak * 0.25 : 0.55 + peak * 0.45,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

export default function EngineerClipPicker({ file, clipSeconds, startSec, onStartChange }) {
  const { t } = useLocale()
  const audioRef = useRef(null)
  const timelineRef = useRef(null)
  const stopTimer = useRef(null)
  const [duration, setDuration] = useState(null)
  const [peaks, setPeaks] = useState([])
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [playing, setPlaying] = useState(false)

  const maxStart = duration != null ? Math.max(0, duration - clipSeconds) : 0
  const endSec = duration != null ? Math.min(startSec + clipSeconds, duration) : startSec + clipSeconds

  useEffect(() => {
    if (!file) {
      setDuration(null)
      setPeaks([])
      setPreviewUrl('')
      return
    }
    let active = true
    setLoading(true)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    decodeAudioFile(file)
      .then(({ duration: d, peaks: p }) => {
        if (active) {
          setDuration(d)
          setPeaks(p)
          onStartChange(0)
        }
      })
      .catch(() => {
        if (active) {
          setDuration(null)
          setPeaks([])
        }
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

  const seekFromTimeline = (clientX) => {
    if (!timelineRef.current || duration == null || maxStart <= 0) return
    const rect = timelineRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    const centered = ratio * duration - clipSeconds / 2
    onStartChange(Math.max(0, Math.min(maxStart, centered)))
  }

  const handleTimelineClick = (e) => {
    seekFromTimeline(e.clientX)
  }

  if (!file) return null

  const startPct = duration ? (startSec / duration) * 100 : 0
  const widthPct = duration ? ((endSec - startSec) / duration) * 100 : 100
  const innerWidthPct = widthPct > 0 ? (100 / widthPct) * 100 : 100
  const innerLeftPct = widthPct > 0 ? -(startPct / widthPct) * 100 : 0

  return (
    <div className="rounded-xl border border-teal/30 bg-teal/5 p-4 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-teal uppercase tracking-wider">{t('clip.title')}</p>
        {loading && <span className="text-xs text-muted">{t('clip.analyzing')}</span>}
      </div>

      {duration != null && peaks.length > 0 && (
        <>
          {/* Waveform timeline */}
          <div
            ref={timelineRef}
            role="slider"
            aria-label="Clip start position"
            aria-valuemin={0}
            aria-valuemax={maxStart}
            aria-valuenow={Math.min(startSec, maxStart)}
            tabIndex={0}
            onClick={handleTimelineClick}
            onKeyDown={(e) => {
              const step = e.shiftKey ? 1 : 0.5
              if (e.key === 'ArrowLeft') onStartChange(Math.max(0, startSec - step))
              if (e.key === 'ArrowRight') onStartChange(Math.min(maxStart, startSec + step))
            }}
            className="relative h-24 rounded-lg bg-ink border border-line overflow-hidden cursor-crosshair select-none"
          >
            {/* Faded full-track waveform */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ filter: 'blur(1.2px)' }}
            >
              <WaveformLayer peaks={peaks} variant="faded" />
            </div>

            {/* Edge fade vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, rgba(10,10,10,0.55) 0%, transparent 12%, transparent 88%, rgba(10,10,10,0.55) 100%)',
              }}
            />

            {/* Selected region — sharper waveform */}
            <div
              className="absolute inset-y-0 overflow-hidden border-x-2 border-teal/90 bg-teal/[0.07] shadow-[inset_0_0_24px_rgba(0,206,209,0.12)]"
              style={{ left: `${startPct}%`, width: `${widthPct}%` }}
            >
              <div
                className="absolute top-0 bottom-0 pointer-events-none"
                style={{ width: `${innerWidthPct}%`, left: `${innerLeftPct}%` }}
              >
                <WaveformLayer peaks={peaks} variant="bright" />
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2 pb-1 text-[10px] text-muted/80 pointer-events-none">
              <span>0:00</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted mb-1.5">
              {t('clip.clipStart')} · {formatTime(startSec)} → {formatTime(endSec)}
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
                {t('clip.underLength', { n: clipSeconds })}
              </p>
            )}
            {maxStart > 0 && (
              <p className="text-xs text-muted/70 mt-1">{t('clip.hint')}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={playing ? stopPreview : playPreview}
              className="rounded-full bg-teal text-ink text-sm font-bold px-4 py-2 hover:opacity-90 transition-opacity"
            >
              {playing ? t('clip.stop') : t('clip.preview')}
            </button>
            <span className="text-xs text-muted">
              {t('clip.excerpt', { n: Math.round(endSec - startSec) })}
            </span>
          </div>
        </>
      )}

      <audio ref={audioRef} src={previewUrl} preload="auto" className="hidden" />
    </div>
  )
}
