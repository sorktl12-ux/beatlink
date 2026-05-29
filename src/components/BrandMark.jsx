export default function BrandMark({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      <span className="display text-xl sm:text-2xl leading-none whitespace-nowrap uppercase">
        <span className="text-gold">BEAT</span>
        <span className="text-white">LINK</span>
      </span>
      <span
        className="inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center -ml-0.5"
        aria-hidden
      >
        <img
          src="/hosho-logo.png"
          alt=""
          className="h-full w-full object-contain"
          draggable={false}
        />
      </span>
    </span>
  )
}
