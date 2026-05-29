const sizeMap = {
  sm: { logo: 'h-7 w-7', text: 'text-xl' },
  md: { logo: 'h-8 w-8', text: 'text-2xl' },
  lg: { logo: 'h-10 w-10', text: 'text-4xl' },
  hero: { logo: 'h-11 w-11 sm:h-14 sm:w-14', text: 'text-5xl sm:text-7xl lg:text-8xl' },
}

/** Hoseo logo — white PNG background blends away on dark surfaces. */
export function BrandLogo({ className = '', size = 'md' }) {
  const s = sizeMap[size] || sizeMap.md
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${s.logo} ${className}`}
      aria-hidden
    >
      <img
        src="/hosho-logo.png"
        alt=""
        className="h-full w-full object-contain"
        draggable={false}
      />
    </span>
  )
}

/** beatlink wordmark — single joined word, beat gold + link white. */
export function BrandWordmark({ size = 'md', className = '' }) {
  const s = sizeMap[size] || sizeMap.md
  return (
    <span className={`display ${s.text} leading-none whitespace-nowrap ${className}`}>
      <span className="text-gold">beat</span>
      <span className="text-white">link</span>
    </span>
  )
}

/** Logo beside beatlink wordmark. logoPosition: left | right (default right). */
export function BrandMark({ size = 'md', className = '', wordmarkClassName = '', logoPosition = 'right' }) {
  const wordmark = <BrandWordmark size={size} className={wordmarkClassName} />
  const logo = <BrandLogo size={size} />
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {logoPosition === 'left' ? (
        <>
          {logo}
          {wordmark}
        </>
      ) : (
        <>
          {wordmark}
          {logo}
        </>
      )}
    </span>
  )
}
