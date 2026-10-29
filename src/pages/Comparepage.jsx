import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Scale, Trash2 } from 'lucide-react'
import StateMessage from '../components/Statemessage'
import { btnPrimary, page, pageTitle } from '../components/ui'
import { amenityLabel, formatPrice, getStays } from '../services/StaysService'
import { MAX_COMPARE, toggleCompare, useCompareIds } from '../services/Shortlist'

const ROWS = [
  { label: 'Price per night', value: (s) => formatPrice(s.price, s.currency || 'USD') },
  { label: 'Rating', value: (s) => (s.rating > 0 ? `${s.rating.toFixed(2)} out of 5 (${s.reviews} reviews)` : 'New') },
  { label: 'Property type', value: (s) => s.type },
  { label: 'Location', value: (s) => [s.area, s.destination].filter(Boolean).join(', ') },
  { label: 'Sleeps', value: (s) => `${s.maxGuests} guests` },
  { label: 'Bedrooms', value: (s) => s.bedrooms ?? '—' },
  { label: 'Bathrooms', value: (s) => s.baths ?? '—' },
  { label: 'Amenities', value: (s) => (s.amenities.length ? s.amenities.map(amenityLabel).join(', ') : '—') },
]

export default function ComparePage() {
  const ids = useCompareIds()
  const [state, setState] = useState({ status: 'loading', stays: [] })

  useEffect(() => {
    document.title = 'Compare stays | TripNest'
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getStays({ signal: controller.signal })
      .then((stays) => setState({ status: 'ready', stays }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error', stays: [] })
      })
    return () => controller.abort()
  }, [])

  const stays = ids.map((id) => state.stays.find((s) => s.id === id)).filter(Boolean)

  if (state.status === 'loading') {
    return (
      <div className={page}>
        <p className="text-ink-2" role="status">Loading stays…</p>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className={page}>
        <StateMessage tone="error" title="We couldn't load these stays">
          Please try again in a moment.
        </StateMessage>
      </div>
    )
  }

  if (stays.length === 0) {
    return (
      <div className={page}>
        <StateMessage
          title="Nothing to compare yet"
          action={
            <Link to="/explore" className={btnPrimary}>
              Explore stays
            </Link>
          }
        >
          Press Compare on up to {MAX_COMPARE} stays and they will appear here side by side.
        </StateMessage>
      </div>
    )
  }

  return (
    <section className={page}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-ink">
            <Scale size={22} aria-hidden="true" />
          </span>
          <div>
            <h1 className={`${pageTitle} mb-1`}>Compare stays</h1>
            <p className="text-ink-2">Up to {MAX_COMPARE} stays side by side.</p>
          </div>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto rounded-card border border-line">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <caption className="sr-only">Comparison of selected stays</caption>
          <thead>
            <tr>
              <th scope="col" className="w-44 bg-surface p-4 font-semibold text-ink-2">Stay</th>
              {stays.map((s) => (
                <th key={s.id} scope="col" className="bg-surface p-4 align-top">
                  <img
                    src={s.image}
                    alt=""
                    className="mb-3 h-32 w-full rounded-xl object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null
                      e.currentTarget.src = s.fallbackImage ?? ''
                    }}
                  />
                  <Link to={`/stays/${s.id}`} className="font-bold text-ink no-underline hover:underline">
                    {s.title}
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleCompare(s.id)}
                    className="mt-2 flex items-center gap-1 text-xs font-semibold text-ink-2 hover:text-ink"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    Remove
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t border-line">
                <th scope="row" className="bg-surface p-4 font-semibold text-ink-2">{row.label}</th>
                {stays.map((s) => (
                  <td key={s.id} className="p-4 align-top text-ink">{row.value(s)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}