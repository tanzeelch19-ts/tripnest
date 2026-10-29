import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Heart, Search, ShieldCheck } from 'lucide-react'
import SearchPanel from '../components/Searchpanel'
import StayCard, { StayCardSkeleton } from '../components/Staycard'
import StateMessage from '../components/Statemessage'
import { btnPrimary, stayGrid, textLink } from '../components/ui'
import { buildDestinations, formatPrice, getStays } from '../services/StaysService'
import { placeImage } from '../services/Photos'
import { sceneImage } from '../data/stays'

const HERO_FALLBACK = sceneImage('coast', 33, { time: 'dusk' })
import { useAuth } from '../context/Authcontext'
import { useRecentIds } from '../services/Shortlist'

const section = 'container py-[clamp(2.5rem,5vw,4rem)]'
const sectionTitle = 'text-[clamp(1.6rem,1.1rem+1.8vw,2.4rem)] font-stretch-[88%] font-bold tracking-[-0.02em]'

const FEATURES = [
  { icon: Search, title: 'Search with confidence', text: 'Filter by destination, guests, price and amenities.' },
  { icon: Heart, title: 'Save what you love', text: 'Build a wishlist and come back to it on any device.' },
  { icon: Briefcase, title: 'Every trip in one place', text: 'Keep your bookings, dates and details together.' },
  { icon: ShieldCheck, title: 'Your account, protected', text: 'Sign in securely and manage your own settings.' },
]

// The destination mosaic: the first tile is large, the last one is wide.
const tileSpan = (i) => (i === 0 ? 'col-span-2 row-span-2' : i === 7 ? 'col-span-2' : '')

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const [state, setState] = useState({ status: 'loading', stays: [], error: null })
  const [attempt, setAttempt] = useState(0)
  const [heroSrc, setHeroSrc] = useState(null)
  const [destPhotos, setDestPhotos] = useState({})

  // Real photo of the hero destination, loaded from Wikipedia.
  useEffect(() => {
    placeImage('Santorini').then((src) => {
      if (src) setHeroSrc(src)
    })
  }, [])

  useEffect(() => {
    document.title = 'TripNest: find a place to land'
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

  const destinations = useMemo(() => buildDestinations(state.stays), [state.stays])

  // Real photo for each destination tile. Generated art stays as the fallback.
  useEffect(() => {
    destinations.forEach((d) => {
      placeImage(d.name).then((src) => {
        if (src) setDestPhotos((prev) => ({ ...prev, [d.name]: src }))
      })
    })
  }, [destinations])

  const topRated = useMemo(
    () => [...state.stays].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 4),
    [state.stays],
  )

  const recentIds = useRecentIds()
  const recentStays = useMemo(
    () => recentIds.map((id) => state.stays.find((s) => s.id === id)).filter(Boolean).slice(0, 4),
    [recentIds, state.stays],
  )

  const loading = state.status === 'loading'

  return (
    <>
      {/* Hero */}
      <section className="pt-[clamp(2rem,6vw,4.5rem)] pb-[clamp(1rem,3vw,2rem)]" aria-labelledby="hero-title">
        <div className="container mb-[clamp(1.5rem,3vw,2.5rem)] grid items-end gap-x-12 gap-y-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-1.5 text-sm font-semibold text-ink">
              Stays in real places, worldwide
            </p>
            <h1
              id="hero-title"
              className="max-w-[9em] text-[clamp(3rem,1.2rem+7.4vw,6.25rem)] leading-[0.94] font-extrabold font-stretch-[78%] tracking-[-0.03em]"
            >
              Find a place to land.
            </h1>
          </div>
          <p className="max-w-[34ch] text-lg text-ink-2">
            Search stays, save the ones you like, and keep every trip in one place.
          </p>
        </div>
        <div className="container">
          <div className="relative">
            <img
              className="h-[clamp(240px,36vw,440px)] w-full rounded-hero object-cover"
              src={heroSrc ?? HERO_FALLBACK}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = HERO_FALLBACK }}
              alt="Coastal view of Santorini"
              width="800"
              height="600"
            />
            <div className="pointer-events-none absolute inset-0 rounded-hero bg-linear-to-t from-[rgba(4,18,22,0.55)] to-transparent" />
            <div className="relative -mt-13 mx-[clamp(0.5rem,3vw,2rem)]">
              <SearchPanel variant="hero" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={section} aria-labelledby="features-title">
        <h2 id="features-title" className="sr-only">Why TripNest</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} className="rounded-card border border-line bg-surface p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-ink">
                <Icon size={20} aria-hidden="true" />
              </span>
              <p className="mt-4 font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm text-ink-2">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      {state.status === 'error' ? (
        <div className={section}>
          <StateMessage
            tone="error"
            title="We couldn't load stays"
            action={
              <button type="button" className={btnPrimary} onClick={retry}>
                Try again
              </button>
            }
          >
            {state.error?.message || 'Something went wrong while loading.'}
          </StateMessage>
        </div>
      ) : (
        <>
          {/* Destinations */}
          <section className={section} aria-labelledby="destinations-title">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="destinations-title" className={sectionTitle}>
                  Where to next
                </h2>
                <p className="mt-1 text-ink-2">Pick a destination to see what is available.</p>
              </div>
            </div>
            <div
              className="grid auto-rows-[clamp(140px,30vw,200px)] grid-cols-2 gap-3 md:auto-rows-[clamp(150px,17vw,215px)] md:grid-cols-4 md:gap-4"
              aria-busy={loading}
            >
              {loading
                ? Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className={`skeleton rounded-card ${tileSpan(i)}`} aria-hidden="true" />
                  ))
                : destinations.map((d, i) => (
                    <Link
                      key={d.slug}
                      to={`/explore?destination=${encodeURIComponent(d.name)}`}
                      className={`group relative isolate block overflow-hidden rounded-card bg-surface-2 text-white no-underline after:absolute after:inset-x-0 after:bottom-0 after:-z-1 after:h-[62%] after:bg-linear-to-t after:from-[rgba(4,18,22,0.8)] after:to-transparent ${tileSpan(i)}`}
                    >
                      <img
                        className="absolute inset-0 -z-2 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        src={destPhotos[d.name] ?? d.image}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = d.image }}
                        alt=""
                        loading="lazy"
                        width="800"
                        height="600"
                      />
                      <span className="absolute inset-x-4 bottom-3.5 flex flex-col gap-[0.1rem]">
                        <span
                          className={`leading-[1.1] font-bold font-stretch-[90%] tracking-[-0.01em] ${
                            i === 0 ? 'text-[clamp(1.8rem,3.2vw,2.6rem)]' : 'text-[1.35rem]'
                          }`}
                        >
                          {d.name}
                        </span>
                        <span className="text-sm">
                          {d.stayCount} {d.stayCount === 1 ? 'stay' : 'stays'} from {formatPrice(d.fromPrice)}
                        </span>
                      </span>
                    </Link>
                  ))}
            </div>
          </section>

          {recentStays.length > 0 && (
            <section className={section} aria-labelledby="recent-title">
              <div className="mb-6">
                <h2 id="recent-title" className={sectionTitle}>
                  Recently viewed
                </h2>
              </div>
              <div className={stayGrid}>
                {recentStays.map((stay) => (
                  <StayCard key={stay.id} stay={stay} />
                ))}
              </div>
            </section>
          )}

          {/* Top rated */}
          <section className={section} aria-labelledby="top-title">
            <div className="mb-6 flex flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h2 id="top-title" className={sectionTitle}>
                Top-rated stays
              </h2>
              <Link to="/explore" className={textLink}>
                See all stays
              </Link>
            </div>
            <div className={stayGrid} aria-busy={loading}>
              {loading
                ? Array.from({ length: 4 }, (_, i) => <StayCardSkeleton key={i} />)
                : topRated.map((stay) => <StayCard key={stay.id} stay={stay} />)}
            </div>
            {loading ? (
              <p className="sr-only" role="status">
                Loading stays
              </p>
            ) : null}
          </section>

          {/* Call to action */}
          <section className={section} aria-labelledby="cta-title">
            <div className="flex flex-col items-start gap-6 rounded-hero bg-linear-to-br from-sky-600 via-sky-700 to-indigo-800 p-8 text-white sm:flex-row sm:items-center sm:justify-between sm:p-12">
              <div>
                <h2 id="cta-title" className="text-3xl font-bold tracking-[-0.02em]">
                  {isAuthenticated ? 'Ready for your next trip?' : 'Create your free account'}
                </h2>
                <p className="mt-2 max-w-[50ch] text-white/80">
                  {isAuthenticated
                    ? 'Explore stays, save favourites, and keep your trips organised.'
                    : 'Save stays, keep your trips in one place, and manage your preferences.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link to="/explore" className="rounded-xl bg-white px-5 py-3 font-semibold text-sky-700 no-underline transition hover:bg-white/90">
                  Explore stays
                </Link>
                {!isAuthenticated && (
                  <Link to="/register" className="rounded-xl border border-white/40 px-5 py-3 font-semibold text-white no-underline transition hover:bg-white/10">
                    Sign up
                  </Link>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  )
}