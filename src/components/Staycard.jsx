import { Link } from 'react-router-dom'
import { Heart, Scale, Star } from 'lucide-react'
import { useWishlist } from '../context/Wishlistcontext'
import { formatPrice, priceBreakdown } from '../services/StaysService'
import { addRecent, toggleCompare, useCompareIds, MAX_COMPARE } from '../services/Shortlist';

/**
 * One listing. The whole card is a link to the property page (through the
 * title), and the heart button saves it to the wishlist.
 *
 * nights: when dates are chosen, shows the trip total under the nightly price.
 * search: query string (dates and guests) to carry over to the property page.
 */
export default function StayCard({ stay, nights = 0, search = '' }) {
  const { has, toggle } = useWishlist()
  const saved = has(stay.id)
  const compareIds = useCompareIds()
  const comparing = compareIds.includes(stay.id)
  const compareFull = !comparing && compareIds.length >= MAX_COMPARE
  const to = `/stays/${stay.id}${search ? `?${search}` : ''}`
  const { total } = priceBreakdown(stay, nights)

  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative aspect-4/3 overflow-hidden rounded-card bg-surface-2">
        <img
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          src={stay.image}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = stay.fallbackImage ?? '' }}
          alt=""
          loading="lazy"
          width="800"
          height="600"
        />
        <button
          type="button"
          className={`absolute top-2.5 right-2.5 z-2 grid size-10 cursor-pointer place-items-center rounded-full bg-white/90 transition-transform hover:scale-110 ${
            saved ? 'text-[#d92d3a]' : 'text-[#0c2b33]'
          }`}
          aria-pressed={saved}
          aria-label={`${saved ? 'Remove' : 'Save'} ${stay.title} ${saved ? 'from' : 'to'} your wishlist`}
          onClick={() => toggle(stay.id)}
        >
          <Heart size={20} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
        </button>
        <button
          type="button"
          className={`absolute top-2.5 left-2.5 z-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
            comparing ? 'bg-sky-600 text-white' : 'bg-white/90 text-[#0c2b33]'
          }`}
          aria-pressed={comparing}
          disabled={compareFull}
          title={compareFull ? `You can compare up to ${MAX_COMPARE} stays` : undefined}
          onClick={() => toggleCompare(stay.id)}
        >
          <Scale size={14} aria-hidden="true" />
          {comparing ? 'Comparing' : 'Compare'}
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[1.0625rem] leading-tight font-[650] tracking-[-0.005em]">
            {/* The link's ::after covers the whole card, so the card is one big click target. */}
            <Link
              to={to}
              onClick={() => addRecent(stay.id)}
              className="text-inherit no-underline after:absolute after:inset-0 after:rounded-card hover:underline focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-3 focus-visible:after:outline-focus"
            >
              {stay.title}
            </Link>
          </h3>
          <p className="inline-flex items-center gap-1 text-[0.9375rem] font-semibold whitespace-nowrap">
            <Star size={14} className="text-accent" aria-hidden="true" fill="currentColor" />
            <span>{stay.rating.toFixed(2)}</span>
            <span className="sr-only">
              {' '}
              out of 5, {stay.reviews} reviews
            </span>
          </p>
        </div>
        <p className="text-[0.9375rem] text-ink-2">
          {stay.area ? `${stay.area}, ` : ''}
          {stay.destination}
        </p>
        <p className="text-[0.9375rem] text-ink-2">
          {stay.type}, sleeps {stay.maxGuests}
        </p>
        <p className="mt-1.5 tabular-nums">
          <strong>{formatPrice(stay.price)}</strong> a night
          {nights > 0 ? (
            <span className="block text-[0.9rem] text-ink-2">
              {' '}
              {formatPrice(total)} for {nights} {nights === 1 ? 'night' : 'nights'}
            </span>
          ) : null}
        </p>
      </div>
    </article>
  )
}

/** Loading placeholder with the same footprint as a StayCard. */
export function StayCardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="skeleton aspect-4/3 rounded-card" />
      <div className="flex flex-col gap-0.5">
        <div className="skeleton mt-2 h-3.5 rounded-md" />
        <div className="skeleton mt-2 h-3.5 w-3/5 rounded-md" />
        <div className="skeleton mt-2 h-3.5 w-3/5 rounded-md" />
      </div>
    </div>
  )
}