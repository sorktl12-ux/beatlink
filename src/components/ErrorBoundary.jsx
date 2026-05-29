import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[BEATLINK] Render error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-ink px-6">
          <div className="max-w-md text-center">
            <p className="display text-4xl text-gold mb-3">OOPS</p>
            <p className="text-white font-semibold">Something went wrong.</p>
            <p className="text-muted text-sm mt-2 break-words">
              {String(this.state.error?.message || this.state.error)}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-gold text-ink font-bold px-6 py-2.5 hover:bg-gold-hi transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
