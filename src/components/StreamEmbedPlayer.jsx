export default function StreamEmbedPlayer({ embed, title = '505 live', className = '' }) {
  if (!embed) return null

  return (
    <div className={`rounded-2xl overflow-hidden border border-line bg-black aspect-video ${className}`}>
      {embed.type === 'iframe' ? (
        <iframe
          title={title}
          src={embed.src}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <video src={embed.src} controls autoPlay className="w-full h-full" playsInline />
      )}
    </div>
  )
}
