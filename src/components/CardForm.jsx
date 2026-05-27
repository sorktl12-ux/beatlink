import { useState, useEffect, useRef } from 'react'

const CATEGORIES = [
  {
    id: 'dream',
    label: '1년 뒤 이루고 싶은 것',
    description: '목표, 꿈, 성취하고 싶은 것',
    icon: '✦',
    color: '#C9A84C',
    bg: 'rgba(201, 168, 76, 0.08)',
    border: 'rgba(201, 168, 76, 0.5)',
  },
  {
    id: 'ai',
    label: 'AI로 바꿀 내 업무',
    description: 'AI를 활용해 개선할 업무나 프로세스',
    icon: '◈',
    color: '#CBD5E1',
    bg: 'rgba(203, 213, 225, 0.06)',
    border: 'rgba(203, 213, 225, 0.35)',
  },
]

export default function CardForm({ onSubmit, onClose }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    nameRef.current?.focus()
    // Prevent background scroll
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const isValid = name.trim() && category && content.trim()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), category, content: content.trim() })
    } finally {
      setSubmitting(false)
    }
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleOverlayClick}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm animate-fade-in" />

      {/* Panel */}
      <div className="relative w-full sm:max-w-lg bg-[#0e0e0e] sm:border sm:border-[rgba(201,168,76,0.2)] animate-slide-up">
        {/* Gold top accent */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#C9A84C] to-transparent" />

        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-7">
            <div>
              <p className="text-[#C9A84C] text-[10px] tracking-[0.35em] uppercase mb-1 opacity-70">
                New Vision Card
              </p>
              <h2 className="text-lg font-bold text-white font-serif">비전 카드 추가</h2>
            </div>
            <button
              onClick={onClose}
              className="text-[#444] hover:text-white transition-colors text-2xl leading-none mt-0.5"
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-[10px] text-[#C9A84C] tracking-[0.3em] uppercase mb-2">
                이름
              </label>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 입력하세요"
                maxLength={30}
                className="w-full bg-[#161616] border border-[rgba(255,255,255,0.07)] text-white px-4 py-3 text-sm focus:outline-none focus:border-[rgba(201,168,76,0.5)] transition-colors placeholder-[#333]"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-[10px] text-[#C9A84C] tracking-[0.3em] uppercase mb-2">
                카테고리
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CATEGORIES.map((cat) => {
                  const selected = category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className="p-4 text-left transition-all duration-200 border"
                      style={{
                        background: selected ? cat.bg : 'transparent',
                        borderColor: selected ? cat.border : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      <span
                        className="block text-xl mb-2"
                        style={{ color: cat.color }}
                      >
                        {cat.icon}
                      </span>
                      <span className="block text-white text-sm font-medium leading-snug mb-1">
                        {cat.label}
                      </span>
                      <span className="block text-[#444] text-xs leading-relaxed">
                        {cat.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-[10px] text-[#C9A84C] tracking-[0.3em] uppercase mb-2">
                내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="당신의 비전을 자유롭게 적어주세요..."
                rows={4}
                maxLength={300}
                className="w-full bg-[#161616] border border-[rgba(255,255,255,0.07)] text-white px-4 py-3 text-sm focus:outline-none focus:border-[rgba(201,168,76,0.5)] transition-colors placeholder-[#333] resize-none leading-relaxed"
                required
              />
              <div className="text-right text-[#2a2a2a] text-xs mt-1">{content.length}/300</div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="w-full py-4 bg-gradient-to-r from-[#C9A84C] to-[#E8C97A] text-black text-sm font-bold tracking-[0.2em] uppercase transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed mt-2"
            >
              {submitting ? '등록 중...' : '비전 카드 등록'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
