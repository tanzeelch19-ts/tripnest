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
    console.error('TripNest render error:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div role="alert" className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
        <p className="mt-3 max-w-[50ch] text-slate-600 dark:text-slate-400">
          This page could not be shown. Reload the page, or go back to the home page and try again.
        </p>
        {import.meta.env.DEV && (
          <pre className="mt-4 max-w-full overflow-auto rounded-xl bg-slate-100 p-4 text-left text-xs text-red-700 dark:bg-slate-900 dark:text-red-400">
            {String(this.state.error?.message || this.state.error)}
          </pre>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-sky-600 px-5 py-3 font-semibold text-white hover:bg-sky-700"
          >
            Reload page
          </button>
          <a href="/" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 no-underline dark:border-slate-700 dark:text-slate-200">
            Go to home
          </a>
        </div>
      </div>
    )
  }
}