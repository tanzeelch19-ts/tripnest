import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Bath,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Flame,
  Heart,
  Laptop,
  MapPin,
  Mountain,
  PawPrint,
  Snowflake,
  Star,
  Thermometer,
  Utensils,
  WashingMachine,
  Waves,
  Wifi,
} from 'lucide-react'
import StateMessage from '../components/Statemessage'
import { useWishlist } from '../context/Wishlistcontext'
import {
  amenityLabel,
  createBooking,
  formatDateRange,
  formatPrice,
  getStay,
  nightsBetween,
  priceBreakdown,
  todayISO,
} from '../services/StaysService.js'
import { PAYMENT_OPTIONS, getTripNotes, saveTripNotes } from '../services/Trips'
import { useAuth } from '../context/Authcontext'

const AMENITY_ICONS = {
  wifi: Wifi,
  kitchen: Utensils,
  pool: Waves,
  ac: Snowflake,
  heating: Thermometer,
  parking: Car,
  washer: WashingMachine,
  workspace: Laptop,
  breakfast: Coffee,
  fireplace: Flame,
  hottub: Bath,
  pets: PawPrint,
  view: Mountain,
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

/* ------------------------------------------------------------------ */
/* Gallery                                                             */
/* ------------------------------------------------------------------ */

function Gallery({ images, title }) {
  const [index, setIndex] = useState(0)
  const count = images.length
  const step = (delta) => setIndex((index + delta + count) % count)

  return (
    <section className="gallery" aria-label={`Photos of ${title}`}>
      <div className="gallery-main">
        <img src={images[index]} alt={`${title}, photo ${index + 1} of ${count}`} width="800" height="600" />
        {count > 1 ? (
          <>
            <button type="button" className="gallery-nav gallery-prev" onClick={() => step(-1)} aria-label="Previous photo">
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button type="button" className="gallery-nav gallery-next" onClick={() => step(1)} aria-label="Next photo">
              <ChevronRight size={22} aria-hidden="true" />
            </button>
            <p className="gallery-count" aria-hidden="true">
              {index + 1} / {count}
            </p>
          </>
        ) : null}
      </div>
      {count > 1 ? (
        <ul className="gallery-thumbs">
          {images.map((src, i) => (
            <li key={i}>
              <button
                type="button"
                className={`thumb${i === index ? ' is-active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
              >
                <img src={src} alt="" loading="lazy" width="160" height="120" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Booking panel                                                       */
/* ------------------------------------------------------------------ */

function makeBookingSchema(maxGuests) {
  return z
    .object({
      checkIn: z.string().min(1, 'Add a check-in date.'),
      payment: z.string().min(1, 'Choose a payment method.'),
      checkOut: z.string().min(1, 'Add a check-out date.'),
      guests: z
        .number()
        .int()
        .min(1, 'Add at least one guest.')
        .max(maxGuests, `This stay sleeps up to ${maxGuests} guests.`),
    })
    .superRefine((value, ctx) => {
      if (value.checkIn && value.checkIn < todayISO()) {
        ctx.addIssue({ code: 'custom', path: ['checkIn'], message: 'Check-in can be today or later.' })
      }
      if (value.checkIn && value.checkOut && value.checkOut <= value.checkIn) {
        ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'Check-out must be after check-in.' })
      }
    })
}

function BookingPanel({ stay, defaults }) {
  const { user } = useAuth()
  const defaultPayment = user?.settings?.defaultPayment ?? 'at-property'
  const [booking, setBooking] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const schema = useMemo(() => makeBookingSchema(stay.maxGuests), [stay.maxGuests])

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      checkIn: defaults.checkIn,
      checkOut: defaults.checkOut,
      guests: Math.min(Math.max(defaults.guests, 1), stay.maxGuests),
      payment: defaultPayment,
    },
  })

  const checkIn = watch('checkIn')
  const checkOut = watch('checkOut')
  const nights = nightsBetween(checkIn, checkOut)
  const { subtotal, cleaning, service, total } = priceBreakdown(stay, nights)
  const messages = [...new Set(Object.values(errors).map((e) => e?.message).filter(Boolean))]

  const onSubmit = async (values) => {
    setSubmitError('')
    try {
      const result = await createBooking({
        stay,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        guests: values.guests,
      })
      saveTripNotes(result.id, { ...getTripNotes(result.id), payment: values.payment })
      setBooking({ ...result, payment: values.payment })
    } catch (error) {
      setSubmitError(error.message || 'We could not reserve this stay. Try again.')
    }
  }

  if (booking) {
    return (
      <div className="panel confirm" role="status">
        <p className="confirm-mark">
          <Check size={20} aria-hidden="true" />
        </p>
        <h2 className="confirm-title">Reserved</h2>
        <dl className="summary">
          <div>
            <dt>Reference</dt>
            <dd>{booking.reference}</dd>
          </div>
          <div>
            <dt>Dates</dt>
            <dd>{formatDateRange(booking.checkIn, booking.checkOut)}</dd>
          </div>
          <div>
            <dt>Guests</dt>
            <dd>{booking.guests}</dd>
          </div>
          <div>
            <dt>Payment</dt>
            <dd>{PAYMENT_OPTIONS.find((o) => o.value === booking.payment)?.label ?? 'Pay at the property'}</dd>
          </div>
          <div className="summary-total">
            <dt>Total</dt>
            <dd>{formatPrice(booking.total)}</dd>
          </div>
        </dl>
        {booking.isDemo ? (
          <p className="notice">This is a demo reservation. It is not saved and disappears when you reload the page.</p>
        ) : null}
        <div className="confirm-actions">
          <Link to="/trips" className="btn btn-primary">
            View my trips
          </Link>
          <Link to="/explore" className="btn btn-ghost">
            Keep browsing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form className="panel booking" onSubmit={handleSubmit(onSubmit)} noValidate aria-label="Reserve this stay">
      <p className="booking-price">
        <strong>{formatPrice(stay.price)}</strong> a night
      </p>

      <div className="booking-fields">
        <label className="field">
          <span>Check in</span>
          <input
            type="date"
            min={todayISO()}
            aria-invalid={errors.checkIn ? 'true' : undefined}
            {...register('checkIn')}
          />
        </label>
        <label className="field">
          <span>Check out</span>
          <input
            type="date"
            min={checkIn || todayISO()}
            aria-invalid={errors.checkOut ? 'true' : undefined}
            {...register('checkOut')}
          />
        </label>
        <label className="field field-wide">
          <span>Guests</span>
          <select aria-invalid={errors.guests ? 'true' : undefined} {...register('guests', { valueAsNumber: true })}>
            {Array.from({ length: stay.maxGuests }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {plural(n, 'guest')}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-wide">
          <span>Payment method (demo)</span>
          <select aria-invalid={errors.payment ? 'true' : undefined} {...register('payment')}>
            {PAYMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {messages.length > 0 ? (
        <ul className="field-errors" role="alert">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : null}

      <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
        {isSubmitting ? 'Reserving' : 'Reserve'}
      </button>

      {submitError ? (
        <p className="field-errors" role="alert">
          {submitError}
        </p>
      ) : null}

      {nights > 0 ? (
        <dl className="summary">
          <div>
            <dt>
              {formatPrice(stay.price)} &times; {plural(nights, 'night')}
            </dt>
            <dd>{formatPrice(subtotal)}</dd>
          </div>
          {cleaning > 0 ? (
            <div>
              <dt>Cleaning fee</dt>
              <dd>{formatPrice(cleaning)}</dd>
            </div>
          ) : null}
          <div>
            <dt>Service fee</dt>
            <dd>{formatPrice(service)}</dd>
          </div>
          <div className="summary-total">
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
      ) : (
        <p className="muted small">Add your dates to see the total.</p>
      )}
    </form>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PropertyPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { has, toggle } = useWishlist()
  const [state, setState] = useState({ status: 'loading', stay: null, error: null })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getStay(id, { signal: controller.signal })
      .then((stay) => setState({ status: stay ? 'ready' : 'missing', stay, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return
        setState({ status: error.status === 404 ? 'missing' : 'error', stay: null, error })
      })
    return () => controller.abort()
  }, [id, attempt])

  useEffect(() => {
    document.title = state.stay ? `${state.stay.title} | TripNest` : 'Stay | TripNest'
  }, [state.stay])

  const retry = () => {
    setState({ status: 'loading', stay: null, error: null })
    setAttempt((n) => n + 1)
  }

  if (state.status === 'loading') {
    return (
      <div className="container page" aria-busy="true">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-gallery" />
        <p className="sr-only" role="status">
          Loading stay
        </p>
      </div>
    )
  }

  if (state.status === 'missing') {
    return (
      <div className="container page">
        <StateMessage
          title="We couldn't find that stay"
          action={
            <Link to="/explore" className="btn btn-primary">
              Explore stays
            </Link>
          }
        >
          It may have been removed, or the link may have a typo.
        </StateMessage>
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="container page">
        <StateMessage
          tone="error"
          title="We couldn't load this stay"
          action={
            <button type="button" className="btn btn-primary" onClick={retry}>
              Try again
            </button>
          }
        >
          {state.error?.message || 'Something went wrong while loading.'}
        </StateMessage>
      </div>
    )
  }

  const { stay } = state
  const saved = has(stay.id)
  const defaults = {
    checkIn: params.get('checkIn') ?? '',
    checkOut: params.get('checkOut') ?? '',
    guests: Number(params.get('guests')) || 1,
  }
  const place = [stay.area, stay.destination, stay.country].filter(Boolean).join(', ')

  return (
    <div className="container page property">
      <Link to="/explore" className="back-link">
        <ChevronLeft size={18} aria-hidden="true" />
        Back to stays
      </Link>

      <header className="property-head">
        <div>
          <h1 className="property-title">{stay.title}</h1>
          <p className="property-sub">
            <span className="property-rating">
              <Star size={16} aria-hidden="true" fill="currentColor" />
              <strong>{stay.rating.toFixed(2)}</strong>
              <span className="muted">({plural(stay.reviews, 'review')})</span>
            </span>
            <span className="property-place">
              <MapPin size={16} aria-hidden="true" />
              {place}
            </span>
          </p>
        </div>
        <button
          type="button"
          className={`btn btn-ghost save-btn${saved ? ' is-saved' : ''}`}
          aria-pressed={saved}
          onClick={() => toggle(stay.id)}
        >
          <Heart size={18} aria-hidden="true" fill={saved ? 'currentColor' : 'none'} />
          Save
        </button>
      </header>

      <Gallery images={stay.images} title={stay.title} />

      <div className="property-layout">
        <div className="property-main">
          <section className="property-section" aria-labelledby="about-title">
            <h2 id="about-title">
              {stay.type} hosted by {stay.host.name}
            </h2>
            <p className="facts">
              {plural(stay.maxGuests, 'guest')}, {plural(stay.bedrooms, 'bedroom')}, {plural(stay.beds, 'bed')},{' '}
              {plural(stay.baths, 'bath')}
            </p>
            {stay.host.since ? <p className="muted">Hosting since {stay.host.since}.</p> : null}
            {stay.description ? <p className="property-text">{stay.description}</p> : null}
          </section>

          {stay.amenities.length > 0 ? (
            <section className="property-section" aria-labelledby="amenities-title">
              <h2 id="amenities-title">What this stay offers</h2>
              <ul className="amenities">
                {stay.amenities.map((a) => {
                  const Icon = AMENITY_ICONS[a] ?? Check
                  return (
                    <li key={a}>
                      <Icon size={20} aria-hidden="true" />
                      <span>{amenityLabel(a)}</span>
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="property-aside">
          <BookingPanel key={stay.id} stay={stay} defaults={defaults} />
        </aside>
      </div>
    </div>
  )
}