import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import Header from './components/Header'
import CardForm from './components/CardForm'
import VisionCard from './components/VisionCard'

export default function App() {
  const [cards, setCards] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const q = query(collection(db, 'cards'), orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setCards(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Firestore error:', err)
        setError('Firebase 연결 오류. .env 파일의 설정을 확인하세요.')
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [])

  const handleAddCard = async (cardData) => {
    await addDoc(collection(db, 'cards'), {
      ...cardData,
      createdAt: serverTimestamp(),
    })
    setShowForm(false)
  }

  const dreamCount = cards.filter((c) => c.category === 'dream').length
  const aiCount = cards.filter((c) => c.category === 'ai').length

  return (
    <div className="min-h-screen bg-[#080808]">
      <Header
        onAddCard={() => setShowForm(true)}
        cardCount={cards.length}
        isLive={!loading && !error}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error ? (
          <ErrorState message={error} />
        ) : loading ? (
          <LoadingState />
        ) : cards.length === 0 ? (
          <EmptyState onAddCard={() => setShowForm(true)} />
        ) : (
          <>
            {/* Category summary strip */}
            <div className="flex items-center gap-8 mb-8 pb-6 border-b border-[rgba(201,168,76,0.12)]">
              <StatBadge count={dreamCount} label="1년 뒤 목표" color="#C9A84C" />
              <div className="w-px h-8 bg-[rgba(255,255,255,0.06)]" />
              <StatBadge count={aiCount} label="AI 전환 업무" color="#CBD5E1" />
              <div className="ml-auto text-[#3a3a3a] text-xs tracking-widest uppercase">
                실시간 공유 중
              </div>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {cards.map((card, index) => (
                <VisionCard key={card.id} card={card} index={index} />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Floating add button on mobile */}
      {!loading && !error && cards.length > 0 && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-6 sm:hidden w-14 h-14 bg-gradient-to-br from-[#C9A84C] to-[#8B6914] text-black text-2xl font-bold shadow-[0_4px_24px_rgba(201,168,76,0.4)] hover:shadow-[0_4px_32px_rgba(201,168,76,0.6)] transition-shadow z-20 flex items-center justify-center"
          aria-label="카드 추가"
        >
          +
        </button>
      )}

      {showForm && (
        <CardForm onSubmit={handleAddCard} onClose={() => setShowForm(false)} />
      )}
    </div>
  )
}

function StatBadge({ count, label, color }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold font-serif" style={{ color }}>
        {count}
      </span>
      <span className="text-[#4a4a4a] text-sm">{label}</span>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin-slow mx-auto mb-4" />
        <p className="text-[#444] text-xs tracking-[0.3em] uppercase">연결 중</p>
      </div>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="text-3xl text-red-500 mb-4">⚠</div>
        <p className="text-red-400 text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  )
}

function EmptyState({ onAddCard }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
      <div className="mb-8">
        <div className="text-[#C9A84C] text-4xl opacity-30 mb-3 select-none">✦ ✦ ✦</div>
        <div className="w-px h-16 bg-gradient-to-b from-[#C9A84C] to-transparent mx-auto opacity-20" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3 font-serif">비전보드가 비어있습니다</h3>
      <p className="text-[#4a4a4a] text-sm leading-7 mb-10 max-w-xs">
        첫 번째 비전 카드를 추가해보세요.
        <br />
        같은 링크를 공유하면 함께 채울 수 있어요.
      </p>
      <button
        onClick={onAddCard}
        className="px-10 py-3.5 border border-[#C9A84C] text-[#C9A84C] text-sm tracking-[0.2em] uppercase hover:bg-[rgba(201,168,76,0.08)] transition-colors duration-300"
      >
        첫 카드 추가하기
      </button>
    </div>
  )
}
