export default function AudioPlayer({ src, label }) {
  if (!src) return null
  return (
    <div className="rounded-xl border border-line bg-ink/60 p-3">
      {label && (
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-end gap-0.5 h-3" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-0.5 bg-gold animate-equalize"
                style={{ height: '100%', animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
          <span className="text-xs font-semibold text-muted">{label}</span>
        </div>
      )}
      <audio controls preload="none" src={src} />
    </div>
  )
}
