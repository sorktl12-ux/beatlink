import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <p className="text-gold text-xs font-bold tracking-[0.35em] uppercase mb-4">
            Players · Producers · Engineers
          </p>
          <h1 className="display text-5xl sm:text-7xl lg:text-8xl leading-[0.92] text-white">
            LINK
            <br />
            YOUR <span className="text-gold-gradient">SOUND</span>
          </h1>
          <p className="text-muted text-base sm:text-lg max-w-xl mt-6 leading-relaxed">
            The hip-hop work exchange where rappers, beatmakers, and engineers drop
            their work and pitch each other for collabs. Close a deal, stack credits,
            and cop beats from the shop.
          </p>
          <div className="flex flex-wrap gap-3 mt-9">
            <Link
              to="/shop"
              className="rounded-full bg-gold text-ink font-bold px-7 py-3.5 hover:bg-gold-hi transition-colors glow-gold"
            >
              Beat Shop
            </Link>
            <Link
              to="/market"
              className="rounded-full border border-line text-white font-semibold px-7 py-3.5 hover:border-gold/50 transition-colors"
            >
              Market
            </Link>
          </div>
        </div>
      </section>

      {/* BOARD ENTRIES */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 -mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
          {[
            { to: '/board/player', label: 'PLAYER', sub: 'Rappers / Vocalists', color: '#FFD700' },
            { to: '/board/producer', label: 'PRODUCER', sub: 'Beatmakers', color: '#CC44FF' },
            { to: '/board/engineer', label: 'ENGINEER', sub: 'Mix / Master', color: '#00CED1' },
          ].map((b) => (
            <Link
              key={b.to}
              to={b.to}
              className="group relative block min-w-0 rounded-2xl border border-line bg-surface transition-all hover:-translate-y-1"
            >
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
                <span
                  className="absolute inset-x-0 bottom-0 h-1 transition-all duration-300 group-hover:h-full group-hover:opacity-10"
                  style={{ backgroundColor: b.color }}
                />
              </div>
              <div className="relative px-5 sm:px-6 py-7 sm:py-8">
                <span
                  className="block h-1 w-10 rounded-full mb-5 sm:mb-6"
                  style={{ backgroundColor: b.color }}
                />
                <h3
                  className="display text-4xl sm:text-[1.95rem] md:text-3xl lg:text-[2.35rem] xl:text-5xl leading-[1.05] break-words"
                  style={{ color: b.color }}
                >
                  {b.label}
                </h3>
                <p className="text-muted text-sm mt-3">{b.sub}</p>
                <span className="inline-flex items-center gap-1 mt-6 text-xs font-bold tracking-widest uppercase text-white/80 group-hover:text-white transition-colors">
                  Enter Board
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-line bg-surface/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="display text-3xl sm:text-4xl text-white mb-10">How It Works</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: '01', t: 'Get Approved', d: 'The admin approves your account, then you can drop work straight to the board.' },
              { n: '02', t: 'Get Requests', d: 'Other members pitch you for a collab. Multiple requests can come in at once.' },
              { n: '03', t: 'Close The Deal', d: 'The poster greenlights one contact, the deal locks in, and the post goes inactive.' },
              { n: '04', t: 'Stack Credits', d: 'Both sides earn 2 credits per deal. Spend 10 credits to cop a beat.' },
            ].map((s) => (
              <div key={s.n}>
                <div className="display text-4xl text-gold/30">{s.n}</div>
                <h3 className="text-white font-bold mt-2">{s.t}</h3>
                <p className="text-muted text-sm mt-1.5 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-muted/60 text-xs">
          © {new Date().getFullYear()} BEATLINK — Hip-Hop Work Exchange
        </div>
      </footer>
    </main>
  )
}
