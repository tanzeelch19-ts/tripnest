import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Search, Trash2 } from 'lucide-react'
import StayCard, { StayCardSkeleton } from '../components/Staycard'
import StateMessage from '../components/Statemessage'
import { btnGhost, notice, page, stayGrid } from '../components/ui'
import { useWishlist } from '../context/Wishlistcontext'
import { getStays } from '../services/StaysService'

export default function WishlistPage() {
  const { ids, clear } = useWishlist()
  const [state, setState] = useState({ status: 'loading', stays: [], error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    document.title = 'Wishlist | TripNest'
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getStays({ signal: controller.signal })
      .then((stays) => setState({ status: 'ready', stays, error: null }))
      .catch((error) => {
        if (!controller.signal.aborted) setState({ status: 'error', stays: [], error })
      })
    return () => controller.abort()
  }, [attempt])

  const retry = () => {
    setState({ status: 'loading', stays: [], error: null })
    setAttempt((n) => n + 1)
  }

  // Keep the order the visitor saved them in.
  const saved = useMemo(
    () => ids.map((id) => state.stays.find((s) => s.id === id)).filter(Boolean),
    [ids, state.stays],
  )

  const summary =
    ids.length === 0
      ? 'Stays you save will appear here.'
      : `${ids.length} saved ${ids.length === 1 ? 'stay' : 'stays'}, ready when you are.`

  let content
  if (ids.length === 0) {
    content = (
      <div className="flex flex-col items-center rounded-hero border border-dashed border-line bg-surface px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-ink">
          <Heart size={26} aria-hidden="true" />
        </span>
        <h2 className="mt-5 text-xl font-bold">Nothing saved yet</h2>
        <p className="mt-2 max-w-[40ch] text-ink-2">Tap the heart on any stay to keep it here for later.</p>
        <Link to="/explore" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-3 font-semibold text-brand-ink no-underline">
          <Search size={16} aria-hidden="true" />
          Explore stays
        </Link>
      </div>
    )
  } else if (state.status === 'error') {
    content = (
      <StateMessage
        tone="error"
        title="We couldn't load your saved stays"
        action={
          <button type="button" className={btnGhost} onClick={retry}>
            Try again
          </button>
        }
      >
        {state.error?.message || 'Something went wrong while loading.'}
      </StateMessage>
    )
  } else if (state.status === 'loading') {
    content = (
      <>
        <div className={stayGrid} aria-busy="true">
          {ids.map((id) => (
            <StayCardSkeleton key={id} />
          ))}
        </div>
        <p className="sr-only" role="status">
          Loading your saved stays
        </p>
      </>
    )
  } else {
    content = (
      <div className={stayGrid}>
        {saved.map((stay) => (
          <StayCard key={stay.id} stay={stay} />
        ))}
      </div>
    )
  }

  return (
    <section className={page}>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-ink">
            <Heart size={22} aria-hidden="true" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-[-0.02em]">Wishlist</h1>
            <p className="mt-1 text-ink-2">{summary}</p>
          </div>
        </div>
        {ids.length > 0 ? (
          <button type="button" className={`${btnGhost} gap-2`} onClick={clear}>
            <Trash2 size={16} aria-hidden="true" />
            Clear wishlist
          </button>
        ) : null}
      </div>

      <p className={`${notice} mt-6`}>Saved stays are kept for this visit only.</p>

      <div className="mt-8">{content}</div>
    </section>
  )
}