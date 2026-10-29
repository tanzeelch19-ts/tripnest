/*
 * Trip tools: calendar file, sharing a stay, and per-trip notes, checklist and payment choice.
 * Notes are saved in this browser, per booking.
 */

const NOTES_KEY = 'tripnest-trip-notes'

// Payment choices are recorded for the trip only. No payment is taken in this app yet.
export const PAYMENT_OPTIONS = [
  { value: 'at-property', label: 'Pay at the property' },
  { value: 'card', label: 'Credit or debit card' },
  { value: 'bank', label: 'Bank transfer' },
  { value: 'wallet', label: 'JazzCash or Easypaisa' },
]

const EMPTY_PLAN = { checklist: [], notes: '', payment: 'at-property' }

function readAll() {
  try {
    const value = JSON.parse(localStorage.getItem(NOTES_KEY))
    return value && typeof value === 'object' ? value : {}
  } catch {
    return {}
  }
}

export function getTripNotes(id) {
  return { ...EMPTY_PLAN, ...(readAll()[id] ?? {}) }
}

export function saveTripNotes(id, plan) {
  const all = readAll()
  all[id] = plan
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(all))
  } catch {
    /* storage blocked: the change is kept on screen only */
  }
}

/* ---------- Calendar file (.ics) ---------- */

const escapeIcs = (text = '') =>
  String(text).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
const compactDate = (iso) => iso.replace(/-/g, '')

export function buildIcs(booking) {
  const stay = booking.stay
  const place = stay ? [stay.area, stay.destination].filter(Boolean).join(', ') : ''
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TripNest//Trips//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(booking.id)}@tripnest`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compactDate(booking.checkIn)}`,
    `DTEND;VALUE=DATE:${compactDate(booking.checkOut)}`,
    `SUMMARY:${escapeIcs(`Stay: ${stay?.title ?? 'TripNest booking'}`)}`,
    `LOCATION:${escapeIcs(place)}`,
    `DESCRIPTION:${escapeIcs(`Reference ${booking.reference}. Guests: ${booking.guests}.`)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

export function downloadIcs(booking) {
  const blob = new Blob([buildIcs(booking)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `tripnest-${booking.reference}.ics`
  link.click()
  URL.revokeObjectURL(url)
}

/* ---------- Sharing ---------- */

/** Opens the phone's share sheet, or copies the link. Returns 'shared', 'copied', 'cancelled' or 'failed'. */
export async function shareStay(stay) {
  const url = `${window.location.origin}/stays/${stay.id}`
  const title = stay.title || 'TripNest stay'
  try {
    if (navigator.share) {
      await navigator.share({ title, text: `Take a look at ${title} on TripNest`, url })
      return 'shared'
    }
  } catch (error) {
    if (error?.name === 'AbortError') return 'cancelled'
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}