import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import StateMessage from '../components/Statemessage'
import { btnPrimary, notice, page, pageHead, pageTitle } from '../components/ui'
import {
  formatDateRange,
  formatPrice,
  getBookings,
  nightsBetween,
  todayISO,
} from '../services/StaysService'

const STATUS_LABEL = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_STYLE = {
  confirmed: 'bg-ok-soft text-ok',
  pending: 'bg-warn-soft text-warn',
  completed: 'bg-brand-soft text-brand-strong',
  cancelled: 'bg-danger-soft text-danger',
}

// A trip row is a thumbnail, the details and (from md) a right-aligned status column.
const tripRow =
  'grid grid-cols-[96px_1fr] items-start gap-x-4 gap-y-[0.35rem] rounded-card border border-line bg-surface p-3 md:grid-cols-[150px_1fr_auto] md:items-center md:p-3.5'

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

function TripRow({ booking }) {
  const { stay } = booking
  const nights = nightsBetween(booking.checkIn, booking.checkOut)
  const place = stay ? [stay.area, stay.destination].filter(Boolean).join(', ') : ''

  return (
    <li className={tripRow}>
      <img
        className="row-span-2 size-24 rounded-xl object-cover md:row-auto md:h-28 md:w-37.5"
        src={stay?.image}
        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = stay?.fallbackImage ?? '' }}
        alt=""
        loading="lazy"
        width="800"
        height="600"
      />
      <div>
        <h3 className="text-lg leading-tight">
          {stay ? (
            <Link to={`/stays/${stay.id}`} className="text-inherit no-underline hover:underline">
              {stay.title}
            </Link>
          ) : (
            `Stay ${booking.stayId}`
          )}
        </h3>
        {place ? <p className="text-[0.9375rem] text-ink-2">{place}</p> : null}
        <p className="text-[0.9375rem] text-ink-2">
          {formatDateRange(booking.checkIn, booking.checkOut)}
          {nights > 0 ? `, ${plural(nights, 'night')}` : ''}, {plural(booking.guests, 'guest')}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 md:flex-col md:items-end md:gap-1 md:text-right">
        <span
          className={`inline-block rounded-full px-3 py-1 text-[0.8125rem] font-bold ${
            STATUS_STYLE[booking.status] ?? 'bg-brand-soft text-brand-strong'
          }`}
        >
          {STATUS_LABEL[booking.status] ?? booking.status}
        </span>
        <p className="font-bold tabular-nums">{formatPrice(booking.total)}</p>
        <p className="text-[0.9375rem] text-ink-2">Reference {booking.reference}</p>
        {booking.id ? (
          <Link to={`/trips/${booking.id}`} className="text-sm font-semibold text-brand-strong">
            Trip details
          </Link>
        ) : null}
      </div>
    </li>
  )
}

export default function BookingsPage() {
  const [state, setState] = useState({ status: 'loading', bookings: [], error: null })
  const [attempt, setAttempt] = useState(0)
  const [tab, setTab] = useState('upcoming')

  useEffect(() => {
    document.title = 'My trips | TripNest'
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getBookings({ signal: controller.signal })
      .then((bookings) => setState({ status: 'ready', bookings, error: null }))
      .catch((error) => {
        if (!controller.signal.aborted) setState({ status: 'error', bookings: [], error })
      })
    return () => controller.abort()
  }, [attempt])

  const retry = () => {
    setState({ status: 'loading', bookings: [], error: null })
    setAttempt((n) => n + 1)
  }

  const { upcoming, past } = useMemo(() => {
    const today = todayISO()
    const isPast = (b) =>
      b.status === 'completed' || b.status === 'cancelled' || (b.checkOut !== '' && b.checkOut < today)
    return {
      upcoming: state.bookings.filter((b) => !isPast(b)).sort((a, b) => a.checkIn.localeCompare(b.checkIn)),
      past: state.bookings.filter(isPast).sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
    }
  }, [state.bookings])

  const shown = tab === 'upcoming' ? upcoming : past
  const hasDemo = state.bookings.some((b) => b.isDemo)

  const tabButton = (pressed) =>
    `inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full px-4 py-1.5 font-semibold ${
      pressed ? 'bg-brand text-brand-ink' : 'bg-transparent text-ink-2'
    }`

  let content
  if (state.status === 'error') {
    content = (
      <StateMessage
        tone="error"
        title="We couldn't load your trips"
        action={
          <button type="button" className={btnPrimary} onClick={retry}>
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
        <ul className="grid gap-4" aria-busy="true" aria-hidden="true">
          {[0, 1].map((i) => (
            <li key={i} className={tripRow}>
              <div className="skeleton row-span-2 size-24 rounded-xl md:row-auto md:h-28 md:w-37.5" />
              <div>
                <div className="skeleton mt-2 h-3.5 rounded-md" />
                <div className="skeleton mt-2 h-3.5 w-3/5 rounded-md" />
              </div>
            </li>
          ))}
        </ul>
        <p className="sr-only" role="status">
          Loading your trips
        </p>
      </>
    )
  } else if (shown.length === 0) {
    content = (
      <StateMessage
        title={tab === 'upcoming' ? 'No upcoming trips' : 'No past trips yet'}
        action={
          <Link to="/explore" className={btnPrimary}>
            Explore stays
          </Link>
        }
      >
        {tab === 'upcoming' ? 'Reserve a stay and it will show up here.' : 'Trips you have taken will be listed here.'}
      </StateMessage>
    )
  } else {
    content = (
      <ul className="grid gap-4">
        {shown.map((b) => (
          <TripRow key={b.id} booking={b} />
        ))}
      </ul>
    )
  }

  return (
    <div className={page}>
      <div className={pageHead}>
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-ink">
            <Briefcase size={22} aria-hidden="true" />
          </span>
          <div>
            <h1 className={`${pageTitle} mb-1`}>My trips</h1>
            <p className="text-ink-2">Your upcoming and past reservations in one place.</p>
          </div>
        </div>
        <div className="inline-flex gap-1 rounded-full bg-surface p-1" role="group" aria-label="Show trips">
          <button type="button" className={tabButton(tab === 'upcoming')} aria-pressed={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
            Upcoming <span className="text-[0.8125rem] tabular-nums">{upcoming.length}</span>
          </button>
          <button type="button" className={tabButton(tab === 'past')} aria-pressed={tab === 'past'} onClick={() => setTab('past')}>
            Past <span className="text-[0.8125rem] tabular-nums">{past.length}</span>
          </button>
        </div>
      </div>

      {hasDemo ? (
        <p className={notice}>
          These trips are samples. A reservation you make here appears in this list until you reload the page.
        </p>
      ) : null}

      {content}
    </div>
  )
}