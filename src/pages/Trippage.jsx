import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarPlus, Printer, Share2, Trash2 } from 'lucide-react'
import StateMessage from '../components/Statemessage'
import { btnPrimary, page } from '../components/ui'
import { formatDateRange, formatPrice, getBookings } from '../services/StaysService'
import { PAYMENT_OPTIONS, downloadIcs, getTripNotes, saveTripNotes, shareStay } from '../services/Trips'

const SHARE_MESSAGES = {
  shared: 'Shared.',
  copied: 'Link copied to your clipboard.',
  failed: 'Could not share on this device.',
}

const actionBtn =
  'inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2 disabled:opacity-50 print:hidden'

export default function TripPage() {
  const { id } = useParams()
  const [state, setState] = useState({ status: 'loading', booking: null })
  const [plan, setPlan] = useState(() => getTripNotes(id))
  const [newItem, setNewItem] = useState('')
  const [shareMessage, setShareMessage] = useState('')

  useEffect(() => {
    document.title = 'Trip details | TripNest'
  }, [])

  useEffect(() => {
    setPlan(getTripNotes(id))
    const controller = new AbortController()
    getBookings({ signal: controller.signal })
      .then((list) => setState({ status: 'ready', booking: list.find((b) => b.id === id) ?? null }))
      .catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error', booking: null })
      })
    return () => controller.abort()
  }, [id])

  const update = (next) => {
    setPlan(next)
    saveTripNotes(id, next)
  }

  const addItem = (e) => {
    e.preventDefault()
    const text = newItem.trim()
    if (!text) return
    update({ ...plan, checklist: [...plan.checklist, { id: crypto.randomUUID(), text, done: false }] })
    setNewItem('')
  }

  if (state.status === 'loading') {
    return (
      <div className={page}>
        <p className="text-ink-2" role="status">Loading your trip…</p>
      </div>
    )
  }

  if (state.status === 'error' || !state.booking) {
    return (
      <div className={page}>
        <StateMessage
          title={state.status === 'error' ? 'We couldn\'t load this trip' : 'Trip not found'}
          action={
            <Link to="/trips" className={btnPrimary}>
              Back to my trips
            </Link>
          }
        >
          Check the link, or open the trip from your list of trips.
        </StateMessage>
      </div>
    )
  }

  const { booking } = state
  const stay = booking.stay
  const doneCount = plan.checklist.filter((i) => i.done).length
  const canCalendar = Boolean(booking.checkIn && booking.checkOut)

  const share = async () => {
    const result = await shareStay(stay || { id: booking.stayId, title: 'TripNest stay' })
    setShareMessage(SHARE_MESSAGES[result] ?? '')
  }

  return (
    <section className={`${page} max-w-4xl`}>
      <style>{`@media print {
        header, footer, [aria-label="Stays to compare"] { display: none !important; }
        body { background: #fff !important; }
      }`}</style>

      <Link to="/trips" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-strong print:hidden">
        <ArrowLeft size={16} aria-hidden="true" />
        All trips
      </Link>

      {/* Ticket */}
      <article className="mt-5 rounded-hero border border-line bg-surface p-6 sm:p-8">
        <p className="text-sm font-semibold tracking-wide text-ink-2 uppercase">Booking confirmation</p>
        <p className="mt-1 text-3xl font-extrabold tracking-wide tabular-nums">{booking.reference}</p>
        <h1 className="mt-4 text-2xl font-bold">{stay?.title ?? `Stay ${booking.stayId}`}</h1>
        {stay && <p className="text-ink-2">{[stay.area, stay.destination].filter(Boolean).join(', ')}</p>}

        <dl className="mt-6 grid gap-5 sm:grid-cols-3">
          <div>
            <dt className="text-sm text-ink-2">Dates</dt>
            <dd className="font-semibold">{formatDateRange(booking.checkIn, booking.checkOut)}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-2">Guests</dt>
            <dd className="font-semibold">{booking.guests}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-2">Total</dt>
            <dd className="font-semibold tabular-nums">{formatPrice(booking.total, booking.currency || 'USD')}</dd>
          </div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className={actionBtn} onClick={() => downloadIcs(booking)} disabled={!canCalendar}>
            <CalendarPlus size={16} aria-hidden="true" />
            Add to calendar
          </button>
          <button type="button" className={actionBtn} onClick={() => window.print()}>
            <Printer size={16} aria-hidden="true" />
            Print or save as PDF
          </button>
          {stay && (
            <button type="button" className={actionBtn} onClick={share}>
              <Share2 size={16} aria-hidden="true" />
              Share stay
            </button>
          )}
        </div>
        <p role="status" className="mt-3 text-sm text-ink-2 print:hidden">{shareMessage}</p>
      </article>

      {/* Payment method (recorded only) */}
      <section className="mt-6 rounded-card border border-line bg-surface p-6 print:hidden">
        <h2 className="text-lg font-bold">Payment method</h2>
        <p className="mt-1 text-sm text-ink-2">
          Choose how you plan to pay. Demo only: no payment is taken on this page.
        </p>
        <fieldset className="mt-4 grid gap-2 sm:grid-cols-2">
          <legend className="sr-only">Payment method</legend>
          {PAYMENT_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm font-medium has-checked:border-brand has-checked:bg-brand-soft"
            >
              <input
                type="radio"
                name="payment"
                value={option.value}
                checked={plan.payment === option.value}
                onChange={() => update({ ...plan, payment: option.value })}
                className="accent-sky-600"
              />
              {option.label}
            </label>
          ))}
        </fieldset>
      </section>

      {/* Checklist */}
      <section className="mt-6 rounded-card border border-line bg-surface p-6 print:hidden">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Packing and trip checklist</h2>
          <p className="text-sm text-ink-2">
            {doneCount} of {plan.checklist.length} done
          </p>
        </div>

        <form onSubmit={addItem} className="mt-4 flex gap-2">
          <label className="sr-only" htmlFor="new-item">Add an item</label>
          <input
            id="new-item"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="For example: passport, adapter, medicines"
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-4 py-2.5 text-ink outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
          />
          <button type="submit" className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-ink">
            Add
          </button>
        </form>

        {plan.checklist.length > 0 && (
          <ul className="mt-4 divide-y divide-line">
            {plan.checklist.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() =>
                      update({
                        ...plan,
                        checklist: plan.checklist.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)),
                      })
                    }
                    className="size-4 accent-sky-600"
                  />
                  <span className={item.done ? 'text-ink-2 line-through' : 'text-ink'}>{item.text}</span>
                </label>
                <button
                  type="button"
                  aria-label={`Remove ${item.text}`}
                  onClick={() => update({ ...plan, checklist: plan.checklist.filter((i) => i.id !== item.id) })}
                  className="rounded-lg p-2 text-ink-2 hover:text-red-600"
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Notes */}
      <section className="mt-6 rounded-card border border-line bg-surface p-6 print:hidden">
        <h2 className="text-lg font-bold">Notes</h2>
        <p className="mt-1 text-sm text-ink-2">Check-in time, host contact, directions, anything you need.</p>
        <label className="sr-only" htmlFor="trip-notes">Trip notes</label>
        <textarea
          id="trip-notes"
          rows={5}
          value={plan.notes}
          onChange={(e) => update({ ...plan, notes: e.target.value })}
          className="mt-4 w-full rounded-xl border border-line bg-surface px-4 py-3 text-ink outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15"
        />
      </section>
    </section>
  )
}