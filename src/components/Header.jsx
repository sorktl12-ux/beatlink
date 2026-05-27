export default function Header({ onAddCard, cardCount, isLive }) {
  return (
    <header className="sticky top-0 z-10 bg-[#080808]/90 backdrop-blur-md border-b border-[rgba(201,168,76,0.1)]">
      {/* Top gold line */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Brand */}
          <div>
            <p className="text-[#C9A84C] text-[10px] tracking-[0.4em] uppercase mb-1 opacity-70">
              Collaborative
            </p>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-gold-gradient leading-none">
              공동 비전보드
            </h1>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Live indicator */}
            {isLive && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="text-[#3a3a3a] text-xs tracking-wider">실시간 동기화</span>
              </div>
            )}

            {/* Card count */}
            {cardCount > 0 && (
              <div className="hidden sm:block text-right">
                <span className="text-[#C9A84C] font-semibold font-serif text-lg leading-none">
                  {cardCount}
                </span>
                <span className="text-[#3a3a3a] text-xs ml-1">개</span>
              </div>
            )}

            {/* Add button */}
            <button
              onClick={onAddCard}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-black text-sm font-semibold tracking-wider hover:opacity-90 active:opacity-80 transition-opacity"
            >
              <span className="text-lg leading-none">+</span>
              <span className="hidden sm:inline">카드 추가</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
