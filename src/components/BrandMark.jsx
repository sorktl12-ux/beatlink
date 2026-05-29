const sizeMap = {
  sm: { logo: 'h-7 w-7', text: 'text-xl' },
  md: { logo: 'h-6 w-6 sm:h-8 sm:w-8', text: 'text-lg sm:text-2xl' },
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

/** BEATLINK wordmark — joined uppercase word, BEAT gold + LINK white. */
export function BrandWordmark({ size = 'md', className = '' }) {
  const s = sizeMap[size] || sizeMap.md
  return (
    <span className={`display ${s.text} leading-none whitespace-nowrap uppercase ${className}`}>
      <span className="text-gold">BEAT</span>
      <span className="text-white">LINK</span>
    </span>
  )
}

/** Logo beside beatlink wordmark. logoPosition: left | right (default right). */
export function BrandMark({ size = 'md', className = '', wordmarkClassName = '', logoPosition = 'right' }) {
  const wordmark = <BrandWordmark size={size} className={wordmarkClassName} />
  const logo = <BrandLogo size={size} className={logoPosition === 'right' ? '-ml-0.5' : ''} />
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
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
