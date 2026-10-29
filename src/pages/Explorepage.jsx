import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigationType, useSearchParams } from 'react-router-dom'
import { Compass, SlidersHorizontal } from 'lucide-react'
import SearchPanel from '../components/Searchpanel'
import StayCard, { StayCardSkeleton } from '../components/Staycard'
import StateMessage from '../components/Statemessage'
import { btn, btnGhost, btnPrimary, page, pageTitle, stayGrid, textBtn } from '../components/ui'
import {
  AMENITIES,
  MAX_PRICE,
  PROPERTY_TYPES,
  SORT_OPTIONS,
  filterStays,
  formatPrice,
  getStays,
  nightsBetween,
} from '../services/StaysService'

const RATING_STEPS = [0, 4, 4.5, 4.8]

const toNumber = (value, fallback) => {
  if (value === null || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

const toList = (value) => (value ? value.split(',').filter(Boolean) : [])

/** Reads the search and filters out of the URL so every result page can be shared or bookmarked. */
function readFilters(params) {
  const sort = params.get('sort')
  return {
    destination: params.get('destination') ?? '',
    guests: Math.max(1, toNumber(params.get('guests'), 1)),
    maxPrice: toNumber(params.get('maxPrice'), MAX_PRICE),
    types: toList(params.get('types')),
    amenities: toList(params.get('amenities')),
    minRating: toNumber(params.get('minRating'), 0),
    sort: SORT_OPTIONS.some((o) => o.value === sort) ? sort : 'recommended',
  }
}

const isEmptyValue = (key, value) =>
  value === '' ||
  value == null ||
  (Array.isArray(value) && value.length === 0) ||
  (key === 'guests' && value <= 1) ||
  (key === 'maxPrice' && value >= MAX_PRICE) ||
  (key === 'minRating' && !value) ||
  (key === 'sort' && value === 'recommended')

/* ---- Tailwind classes ---- */

const filterGroup = 'mb-5 min-w-0'
const filterLegend = 'mb-2.5 p-0 font-bold'
const checkRow = 'flex cursor-pointer items-center gap-2.5 py-1'
const checkInput = 'm-0 size-[18px] accent-brand'

function Filters({ id, open, filters, activeCount, onChange, onClear }) {
  const toggle = (key, value) => {
    const list = filters[key]
    onChange({ [key]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] })
  }

  return (
    <aside
      id={id}
      // Below lg the panel opens and closes with the Filters button. From lg it is a sticky sidebar that scrolls on its own.
      className={`rounded-card bg-surface p-5 lg:sticky lg:top-[calc(var(--header-h)+16px)] lg:block lg:max-h-[calc(100vh-var(--header-h)-32px)] lg:overflow-auto ${
        open ? 'block' : 'hidden'
      }`}
      aria-label="Filters"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg">Filters</h2>
        {activeCount > 0 ? (
          <button type="button" className={textBtn} onClick={onClear}>
            Clear all
          </button>
        ) : null}
      </div>

      <fieldset className={filterGroup}>
        <legend className={filterLegend}>Price per night</legend>
        <input
          className="w-full accent-brand"
          type="range"
          min="50"
          max={MAX_PRICE}
          step="10"
          value={filters.maxPrice}
          onChange={(e) => onChange({ maxPrice: Number(e.target.value) })}
          aria-label="Maximum price per night"
        />
        <output className="mt-1 block text-[0.9rem] text-ink-2">
          {filters.maxPrice >= MAX_PRICE ? 'Any price' : `Up to ${formatPrice(filters.maxPrice)}`}
        </output>
      </fieldset>

      <fieldset className={filterGroup}>
        <legend className={filterLegend}>Property type</legend>
        {PROPERTY_TYPES.map((type) => (
          <label key={type} className={checkRow}>
            <input
              className={checkInput}
              type="checkbox"
              checked={filters.types.includes(type)}
              onChange={() => toggle('types', type)}
            />
            <span>{type}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className={filterGroup}>
        <legend className={filterLegend}>Rating</legend>
        {RATING_STEPS.map((step) => (
          <label key={step} className={checkRow}>
            <input
              className={checkInput}
              type="radio"
              name="minRating"
              checked={filters.minRating === step}
              onChange={() => onChange({ minRating: step })}
            />
            <span>{step === 0 ? 'Any rating' : `${step.toFixed(1)} and up`}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className={filterGroup}>
        <legend className={filterLegend}>Amenities</legend>
        {AMENITIES.map((a) => (
          <label key={a.id} className={checkRow}>
            <input
              className={checkInput}
              type="checkbox"
              checked={filters.amenities.includes(a.id)}
              onChange={() => toggle('amenities', a.id)}
            />
            <span>{a.label}</span>
          </label>
        ))}
      </fieldset>
    </aside>
  )
}

export default function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const [state, setState] = useState({ status: 'loading', stays: [], error: null })
  const [attempt, setAttempt] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const location = useLocation()
  const navigationType = useNavigationType()

  // Filters live in local state so checkboxes and the price slider respond on the
  // same frame (router updates are deferred and would make controls lag or skip
  // steps). Every change is mirrored to the URL so results stay shareable.
  const [filters, setFilters] = useState(() => readFilters(params))

  // Our own filter changes use REPLACE and are already in state. A PUSH or POP
  // (a new search, or the back button) means the URL is the source of truth again.
  useEffect(() => {
    if (navigationType !== 'REPLACE') setFilters(readFilters(params))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key])

  const checkIn = params.get('checkIn') ?? ''
  const checkOut = params.get('checkOut') ?? ''
  const nights = nightsBetween(checkIn, checkOut)

  useEffect(() => {
    document.title = filters.destination ? `Stays in ${filters.destination} | TripNest` : 'Explore stays | TripNest'
  }, [filters.destination])

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

  const results = useMemo(() => filterStays(state.stays, filters), [state.stays, filters])

  const activeCount =
    (filters.maxPrice < MAX_PRICE ? 1 : 0) +
    filters.types.length +
    filters.amenities.length +
    (filters.minRating ? 1 : 0)

  const update = (patch, { replace = true } = {}) => {
    setFilters((current) => ({ ...current, ...patch }))
    // Start from the live address, not `params`, so quick successive changes never overwrite each other.
    const next = new URLSearchParams(window.location.search)
    Object.entries(patch).forEach(([key, value]) => {
      if (isEmptyValue(key, value)) next.delete(key)
      else next.set(key, Array.isArray(value) ? value.join(',') : String(value))
    })
    setParams(next, { replace })
  }

  const resetFilters = () => update({ maxPrice: MAX_PRICE, types: [], amenities: [], minRating: 0 })
  const showEverywhere = () => update({ destination: '' })

  // Dates and guests travel with the visitor to the property page.
  const carry = new URLSearchParams()
  ;['checkIn', 'checkOut', 'guests'].forEach((key) => {
    if (params.get(key)) carry.set(key, params.get(key))
  })
  const carryOver = carry.toString()

  const loading = state.status === 'loading'
  const searchKey = `${filters.destination}|${checkIn}|${checkOut}|${filters.guests}`

  let content
  if (state.status === 'error') {
    content = (
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
    )
  } else if (loading) {
    content = (
      <>
        <div className={stayGrid} aria-busy="true">
          {Array.from({ length: 6 }, (_, i) => (
            <StayCardSkeleton key={i} />
          ))}
        </div>
        <p className="sr-only" role="status">
          Loading stays
        </p>
      </>
    )
  } else if (state.stays.length === 0) {
    content = <StateMessage title="There are no stays to show yet">Check back soon, or try again in a moment.</StateMessage>
  } else if (results.length === 0) {
    content = (
      <StateMessage
        title="No stays match your search"
        action={
          activeCount > 0 ? (
            <button type="button" className={btnPrimary} onClick={resetFilters}>
              Clear filters
            </button>
          ) : filters.destination ? (
            <button type="button" className={btnPrimary} onClick={showEverywhere}>
              Show all stays
            </button>
          ) : null
        }
      >
        Try a different destination, a higher price or fewer amenities.
      </StateMessage>
    )
  } else {
    content = (
      <div className={stayGrid}>
        {results.map((stay) => (
          <StayCard key={stay.id} stay={stay} nights={nights} search={carryOver} />
        ))}
      </div>
    )
  }

  return (
    <div className={page}>
      <div className="mb-6 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-ink">
          <Compass size={22} aria-hidden="true" />
        </span>
        <div>
          <h1 className={`${pageTitle} mb-1`}>{filters.destination ? `Stays in ${filters.destination}` : 'Explore stays'}</h1>
          <p className="text-ink-2">Filter by price, type, amenities and rating to find the right place.</p>
        </div>
      </div>

      <SearchPanel
        key={searchKey}
        variant="bar"
        defaults={{ destination: filters.destination, checkIn, checkOut, guests: filters.guests }}
        onSearch={(v) =>
          update(
            { destination: v.destination, checkIn: v.checkIn, checkOut: v.checkOut, guests: v.guests },
            { replace: false },
          )
        }
      />

      <div className="mt-7 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-10">
        <Filters
          id="filters"
          open={filtersOpen}
          filters={filters}
          activeCount={activeCount}
          onChange={update}
          onClear={resetFilters}
        />

        <section aria-label="Results">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="min-h-[1.5em] font-semibold" aria-live="polite">
              {loading || state.status === 'error'
                ? ' '
                : `${results.length} ${results.length === 1 ? 'stay' : 'stays'}${nights > 0 ? ` for ${nights} ${nights === 1 ? 'night' : 'nights'}` : ''}`}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className={`${btnGhost} lg:hidden`}
                aria-expanded={filtersOpen}
                aria-controls="filters"
                onClick={() => setFiltersOpen((v) => !v)}
              >
                <SlidersHorizontal size={18} aria-hidden="true" />
                Filters{activeCount > 0 ? ` (${activeCount})` : ''}
              </button>
              <label className="inline-flex items-center gap-2 text-[0.9375rem] text-ink-2">
                <span>Sort by</span>
                <select
                  className="min-h-11 rounded-xl border-[1.5px] border-line-strong bg-surface px-3 py-2 text-ink"
                  value={filters.sort}
                  onChange={(e) => update({ sort: e.target.value })}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          {content}
        </section>
      </div>
    </div>
  )
}