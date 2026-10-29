import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, Minus, Plus, Search, Users } from 'lucide-react'
import { DESTINATIONS } from '../data/stays.js'
import { todayISO } from '../services/StaysService'
import { btnPrimaryLarge } from './ui'

const MAX_GUESTS = 16

export const searchSchema = z
  .object({
    destination: z.string().trim().max(60, 'Use 60 characters or fewer for the destination.'),
    checkIn: z.string(),
    checkOut: z.string(),
    guests: z
      .number()
      .int()
      .min(1, 'Add at least one guest.')
      .max(MAX_GUESTS, `Searches cover up to ${MAX_GUESTS} guests.`),
  })
  .superRefine((value, ctx) => {
    const { checkIn, checkOut } = value
    if (checkIn && checkIn < todayISO()) {
      ctx.addIssue({ code: 'custom', path: ['checkIn'], message: 'Check-in can be today or later.' })
    }
    if (checkOut && !checkIn) {
      ctx.addIssue({ code: 'custom', path: ['checkIn'], message: 'Add a check-in date.' })
    }
    if (checkIn && !checkOut) {
      ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'Add a check-out date.' })
    }
    if (checkIn && checkOut && checkOut <= checkIn) {
      ctx.addIssue({ code: 'custom', path: ['checkOut'], message: 'Check-out must be after check-in.' })
    }
  })

/* ---- Tailwind classes ---- */

// One field cell. From the lg breakpoint the cells sit in a row with thin dividers between them.
const field =
  'flex min-w-0 flex-col justify-center gap-[0.15rem] rounded-[14px] px-4 py-2.5 hover:bg-surface-2 lg:relative'
// Cells that hold a text or date input are <label>s: clicking anywhere focuses the input.
const labelField =
  'cursor-text focus-within:bg-surface-2 focus-within:outline-3 focus-within:-outline-offset-1 focus-within:outline-focus'
const divider = 'lg:before:absolute lg:before:inset-y-[22%] lg:before:left-0 lg:before:w-px lg:before:bg-line'
const labelText = (invalid) =>
  `inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold ${invalid ? 'text-danger' : 'text-ink-2'}`
const input =
  'min-h-7 w-full min-w-0 border-0 bg-transparent p-0 text-base font-semibold outline-none placeholder:font-medium placeholder:text-ink-2 placeholder:opacity-100'
const stepperBtn =
  'grid size-9 cursor-pointer place-items-center rounded-full border-[1.5px] border-line-strong bg-transparent enabled:hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-40 sm:size-7'

/**
 * Destination, dates and guests.
 *
 * By default it sends the visitor to /explore with the search in the URL.
 * Pass onSearch to handle the values yourself (the Explore page does this so
 * filters are kept).
 */
export default function SearchPanel({ defaults = {}, onSearch, variant = 'hero' }) {
  const navigate = useNavigate()
  const uid = useId()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      destination: defaults.destination ?? '',
      checkIn: defaults.checkIn ?? '',
      checkOut: defaults.checkOut ?? '',
      guests: defaults.guests ?? 1,
    },
  })

  const guests = watch('guests')
  const checkIn = watch('checkIn')
  const today = todayISO()
  const messages = Object.values(errors)
    .map((e) => e?.message)
    .filter(Boolean)

  const setGuests = (next) => setValue('guests', next, { shouldValidate: true })

  const submit = (values) => {
    if (onSearch) {
      onSearch(values)
      return
    }
    const qs = new URLSearchParams()
    if (values.destination) qs.set('destination', values.destination)
    if (values.checkIn) qs.set('checkIn', values.checkIn)
    if (values.checkOut) qs.set('checkOut', values.checkOut)
    if (values.guests > 1) qs.set('guests', String(values.guests))
    const query = qs.toString()
    navigate(query ? `/explore?${query}` : '/explore')
  }

  return (
    <form
      className={`rounded-[22px] bg-surface p-3 ${variant === 'bar' ? 'border border-line shadow-soft' : 'shadow-lift'}`}
      onSubmit={handleSubmit(submit)}
      noValidate
      aria-label="Search stays"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.1fr_auto] lg:items-stretch lg:gap-0">
        <label className={`${field} ${labelField} sm:col-span-full lg:col-span-1`} htmlFor={`${uid}-destination`}>
          <span className={labelText(errors.destination)}>
            <MapPin size={16} aria-hidden="true" />
            Where
          </span>
          <input
            id={`${uid}-destination`}
            className={input}
            type="text"
            list={`${uid}-destinations`}
            placeholder="City or region"
            autoComplete="off"
            aria-invalid={errors.destination ? 'true' : undefined}
            {...register('destination')}
          />
          <datalist id={`${uid}-destinations`}>
            {DESTINATIONS.map((d) => (
              <option key={d.slug} value={d.name} />
            ))}
          </datalist>
        </label>

        <label className={`${field} ${labelField} ${divider}`} htmlFor={`${uid}-checkin`}>
          <span className={labelText(errors.checkIn)}>
            <CalendarDays size={16} aria-hidden="true" />
            Check in
          </span>
          <input
            id={`${uid}-checkin`}
            className={input}
            type="date"
            min={today}
            aria-invalid={errors.checkIn ? 'true' : undefined}
            {...register('checkIn')}
          />
        </label>

        <label className={`${field} ${labelField} ${divider}`} htmlFor={`${uid}-checkout`}>
          <span className={labelText(errors.checkOut)}>
            <CalendarDays size={16} aria-hidden="true" />
            Check out
          </span>
          <input
            id={`${uid}-checkout`}
            className={input}
            type="date"
            min={checkIn || today}
            aria-invalid={errors.checkOut ? 'true' : undefined}
            {...register('checkOut')}
          />
        </label>

        <div className={`${field} ${divider}`} role="group" aria-labelledby={`${uid}-guests`}>
          <span className={labelText(false)} id={`${uid}-guests`}>
            <Users size={16} aria-hidden="true" />
            Guests
          </span>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className={stepperBtn}
              onClick={() => setGuests(Math.max(1, guests - 1))}
              disabled={guests <= 1}
              aria-label="Remove a guest"
            >
              <Minus size={16} aria-hidden="true" />
            </button>
            <output className="min-w-[5.5ch] text-center font-semibold tabular-nums" aria-live="polite">
              {guests} {guests === 1 ? 'guest' : 'guests'}
            </output>
            <button
              type="button"
              className={stepperBtn}
              onClick={() => setGuests(Math.min(MAX_GUESTS, guests + 1))}
              disabled={guests >= MAX_GUESTS}
              aria-label="Add a guest"
            >
              <Plus size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <button type="submit" className={`${btnPrimaryLarge} m-1`}>
          <Search size={18} aria-hidden="true" />
          Search
        </button>
      </div>

      {messages.length > 0 ? (
        <ul className="mx-1 mt-2 mb-1 rounded-xl bg-danger-soft px-3.5 py-2.5 text-[0.9rem] text-danger" role="alert">
          {messages.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : null}
    </form>
  )
}