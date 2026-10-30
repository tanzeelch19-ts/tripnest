/*
 * Stays, destinations and bookings.
 *
 * Pages call these functions and never care where the data comes from.
 * There are three data sources, chosen in .env.local:
 *
 *   live    VITE_DATA_SOURCE=live   real hotels, photos and prices through the
 *                                   server functions in /api (LiteAPI + Pexels)
 *   api     VITE_API_URL=...        your own REST API
 *   sample  (nothing set)           the sample data in src/data/stays.js, with a
 *                                   short delay so loading states are visible
 */

import { api, isApiConfigured, liveApi, PATHS } from './Api'
import { AMENITIES, DESTINATIONS, STAYS, sceneImage } from '../data/stays'
import { LIVE_DESTINATIONS, findDestination } from '../data/Destinations'

export { isApiConfigured } from './Api'
export { AMENITIES, PROPERTY_TYPES } from '../data/stays'
export { LIVE_DESTINATIONS, findDestination } from '../data/Destinations'

export const dataSource = import.meta.env.VITE_DATA_SOURCE === 'live' ? 'live' : isApiConfigured ? 'api' : 'sample'
export const isLive = dataSource === 'live'

// Live prices run higher than the sample data, and the search covers up to 8 guests.
export const MAX_GUESTS = isLive ? 8 : 16
export const MAX_PRICE = isLive ? 1000 : 400
export const PRICE_STEP = isLive ? 25 : 10

const MOCK_DELAY = 350
const wait = (ms = MOCK_DELAY) => new Promise((resolve) => setTimeout(resolve, ms))

/* ------------------------------------------------------------------ */
/* Dates and prices                                                    */
/* ------------------------------------------------------------------ */

const pad = (n) => String(n).padStart(2, '0')
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Today as YYYY-MM-DD in the visitor's own time zone. */
export const todayISO = () => toISO(new Date())

export function addDays(iso, days) {
  const [y, m, d] = iso.split('-').map(Number)
  return toISO(new Date(y, m - 1, d + days))
}

/** Two nights, two weeks from now. Used for live prices until the visitor picks dates. */
export function defaultStayDates() {
  const checkIn = addDays(todayISO(), 14)
  return { checkIn, checkOut: addDays(checkIn, 2) }
}

/** Number of nights between two YYYY-MM-DD dates, or 0 if either is missing or the range is invalid. */
export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0
  const a = Date.parse(`${checkIn}T00:00:00Z`)
  const b = Date.parse(`${checkOut}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 0
  return Math.round((b - a) / 86400000)
}

/** exact: show cents. Use it for totals; nightly prices are shown in whole units. */
export function formatPrice(amount, currency = 'USD', { exact = false } = {}) {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: exact ? 2 : 0,
      maximumFractionDigits: exact ? 2 : 0,
    }).format(amount)
  } catch {
    return `${currency} ${Number(amount).toFixed(exact ? 2 : 0)}`
  }
}

export function formatDate(iso, options = { month: 'short', day: 'numeric' }) {
  if (!iso) return ''
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('en-US', options).format(new Date(y, m - 1, d))
}

export function formatDateRange(checkIn, checkOut) {
  if (!checkIn || !checkOut) return ''
  const year = { year: 'numeric' }
  return `${formatDate(checkIn)} to ${formatDate(checkOut, { month: 'short', day: 'numeric', ...year })}`
}

/** Itemised price for a stay. Fees are estimates until the API provides real ones. */
export function priceBreakdown(stay, nights) {
  const subtotal = stay.price * nights
  const cleaning = nights > 0 ? stay.cleaningFee || 0 : 0
  const service = Math.round(subtotal * 0.1)
  return { nights, subtotal, cleaning, service, total: subtotal + cleaning + service }
}

/* ------------------------------------------------------------------ */
/* Normalising API data                                                */
/* ------------------------------------------------------------------ */

/**
 * Maps one record from your own API onto the shape the UI expects.
 * Adjust the field names here if your backend differs; nothing else needs to change.
 */
export function normalizeStay(raw = {}) {
  const id = String(raw.id ?? raw._id ?? raw.slug ?? '')
  const destination = raw.destination ?? raw.city ?? raw.location?.city ?? 'Unknown'
  const images = [
    ...(Array.isArray(raw.images) ? raw.images : []),
    ...(raw.image ? [raw.image] : []),
    ...(raw.imageUrl ? [raw.imageUrl] : []),
  ]
    .map((img) => (typeof img === 'string' ? img : img?.url))
    .filter(Boolean)

  // Listings without photos get a generated landscape so cards never look broken.
  const fallback = sceneImage('coast', [...id].reduce((n, c) => n + c.charCodeAt(0), 7))

  return {
    id,
    title: raw.title ?? raw.name ?? 'Untitled stay',
    destination,
    country: raw.country ?? raw.location?.country ?? '',
    area: raw.area ?? raw.neighborhood ?? '',
    type: raw.type ?? raw.propertyType ?? 'Apartment',
    rating: Number(raw.rating ?? raw.averageRating ?? 0),
    reviews: Number(raw.reviews ?? raw.reviewCount ?? 0),
    price: Number(raw.price ?? raw.pricePerNight ?? 0),
    cleaningFee: Number(raw.cleaningFee ?? 0),
    maxGuests: Number(raw.maxGuests ?? raw.guests ?? 2),
    bedrooms: Number(raw.bedrooms ?? 1),
    beds: Number(raw.beds ?? raw.bedrooms ?? 1),
    baths: Number(raw.baths ?? raw.bathrooms ?? 1),
    amenities: Array.isArray(raw.amenities)
      ? raw.amenities.map((a) => (typeof a === 'string' ? a : a?.id)).filter(Boolean)
      : [],
    host: raw.host ?? { name: 'Your host', since: null },
    description: raw.description ?? '',
    image: images[0] ?? fallback,
    images: images.length ? images : [fallback],
  }
}

/**
 * A stay from /api/stays or /api/stay. The server already shaped it, so this only
 * fills gaps. Facts the hotel service does not provide stay null and are hidden in the UI,
 * and a missing photo stays empty so <Photo> can show its built-in artwork.
 */
function normalizeLiveStay(raw = {}) {
  return {
    id: String(raw.id ?? ''),
    title: raw.title || 'Hotel',
    destination: raw.destination || '',
    country: raw.country || '',
    area: raw.area || '',
    address: raw.address || '',
    type: raw.type || 'Hotel',
    stars: Number(raw.stars) || 0,
    rating: Number(raw.rating) || 0,
    reviews: Number(raw.reviews) || 0,
    price: Number(raw.price) || 0,
    total: Number(raw.total) || 0,
    nights: Number(raw.nights) || 0,
    currency: raw.currency || 'USD',
    refundable: Boolean(raw.refundable),
    cleaningFee: 0,
    maxGuests: Number(raw.maxGuests) || 2,
    bedrooms: raw.bedrooms ?? null,
    beds: raw.beds ?? null,
    baths: raw.baths ?? null,
    amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
    extraAmenities: Array.isArray(raw.extraAmenities) ? raw.extraAmenities : [],
    host: raw.host ?? { name: 'Hotel', since: null },
    description: raw.description || '',
    image: raw.image || '',
    images: Array.isArray(raw.images) ? raw.images.filter(Boolean).slice(0, 24) : [],
    checkInFrom: raw.checkInFrom || '',
    checkOutBy: raw.checkOutBy || '',
    source: 'live',
  }
}

function unwrapList(data) {
  if (Array.isArray(data)) return data
  return data?.items ?? data?.properties ?? data?.bookings ?? data?.data ?? data?.results ?? []
}

// A single property, either bare or wrapped as { property } or { data }.
function unwrapProperty(data) {
  return data?.property ?? data?.data ?? data
}

// A single booking, either bare or wrapped as { booking } or { data }.
// Do not look for `property` here: a booking usually embeds its property.
function unwrapBooking(data) {
  return data?.booking ?? data?.data ?? data
}

function normalizeBooking(raw = {}) {
  const stayRaw = raw.property ?? raw.stay ?? null
  const stay = stayRaw ? normalizeStay(stayRaw) : null
  return {
    id: String(raw.id ?? raw._id ?? ''),
    reference: raw.reference ?? raw.confirmationCode ?? String(raw.id ?? raw._id ?? '').slice(-6).toUpperCase(),
    status: raw.status ?? 'confirmed',
    checkIn: raw.checkIn ?? raw.startDate ?? '',
    checkOut: raw.checkOut ?? raw.endDate ?? '',
    guests: Number(raw.guests ?? 1),
    total: Number(raw.total ?? raw.totalPrice ?? 0),
    currency: raw.currency ?? 'USD',
    stayId: String(raw.propertyId ?? stay?.id ?? ''),
    stay,
    isDemo: false,
  }
}

/* ------------------------------------------------------------------ */
/* Filtering and sorting (runs in the browser for every data source)   */
/* ------------------------------------------------------------------ */

export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'price-asc', label: 'Price, low to high' },
  { value: 'price-desc', label: 'Price, high to low' },
  { value: 'rating', label: 'Top rated' },
]

export const DEFAULT_FILTERS = {
  destination: '',
  guests: 1,
  maxPrice: MAX_PRICE,
  types: [],
  amenities: [],
  minRating: 0,
  sort: 'recommended',
}

export function filterStays(stays, filters = {}) {
  const f = { ...DEFAULT_FILTERS, ...filters }
  const query = f.destination.trim().toLowerCase()

  const result = stays.filter((s) => {
    if (query) {
      const haystack = `${s.destination} ${s.country} ${s.area} ${s.title}`.toLowerCase()
      if (!haystack.includes(query)) return false
    }
    if (s.maxGuests < f.guests) return false
    if (f.maxPrice < MAX_PRICE && s.price > f.maxPrice) return false
    if (f.types.length && !f.types.includes(s.type)) return false
    if (f.minRating && s.rating < f.minRating) return false
    if (f.amenities.length && !f.amenities.every((a) => s.amenities.includes(a))) return false
    return true
  })

  const sorted = [...result]
  if (f.sort === 'price-asc') sorted.sort((a, b) => a.price - b.price)
  else if (f.sort === 'price-desc') sorted.sort((a, b) => b.price - a.price)
  else if (f.sort === 'rating') sorted.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews)
  else sorted.sort((a, b) => b.rating * Math.log10(b.reviews + 10) - a.rating * Math.log10(a.reviews + 10))
  return sorted
}

/* ------------------------------------------------------------------ */
/* Test-mode flag (live mode)                                          */
/* ------------------------------------------------------------------ */

// The server says whether it is talking to the hotel service's sandbox. The banner listens for it.
let liveState = { sandbox: null }
const listeners = new Set()

function setSandbox(sandbox) {
  if (liveState.sandbox === sandbox) return
  liveState = { ...liveState, sandbox }
  listeners.forEach((listener) => listener())
}

export const subscribeLive = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
export const getLiveState = () => liveState

/* ------------------------------------------------------------------ */
/* Public API: stays                                                   */
/* ------------------------------------------------------------------ */

const clampGuests = (guests) => Math.min(Math.max(Number(guests) || 1, 1), MAX_GUESTS)

/** All stays (sample data or your own API). Filtering happens in the browser with filterStays(). */
export async function getStays({ signal } = {}) {
  if (isLive) return (await getFeaturedStays({ signal })).stays
  if (isApiConfigured) {
    const data = await api.get(PATHS.properties, { signal })
    return unwrapList(data).map(normalizeStay)
  }
  await wait()
  return STAYS
}

/**
 * Stays for a search. In live mode this asks the hotel service for real prices for
 * the chosen city and dates; otherwise it returns every stay and the page filters.
 * Returns { stays, meta } where meta describes the search that was run.
 */
export async function searchStays({ signal, destination = '', checkIn = '', checkOut = '', guests = 1 } = {}) {
  if (isLive) {
    const place = findDestination(destination)
    if (!place) throw new Error('Choose one of the available cities to search.')
    const dates = checkIn && checkOut ? { checkIn, checkOut } : defaultStayDates()
    const data = await liveApi.get('/stays', {
      params: { destination: place.slug, ...dates, guests: clampGuests(guests) },
      signal,
    })
    setSandbox(Boolean(data?.sandbox))
    return {
      stays: unwrapList(data).map(normalizeLiveStay),
      meta: {
        nights: Number(data?.nights) || nightsBetween(dates.checkIn, dates.checkOut),
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        guests: clampGuests(guests),
        currency: data?.currency || 'USD',
        sandbox: Boolean(data?.sandbox),
        usedDefaultDates: !(checkIn && checkOut),
        place,
      },
    }
  }

  const stays = await getStays({ signal })
  return {
    stays,
    meta: {
      nights: nightsBetween(checkIn, checkOut),
      checkIn,
      checkOut,
      guests,
      currency: 'USD',
      sandbox: false,
      usedDefaultDates: false,
      place: null,
    },
  }
}

/** Stays for the home page. In live mode: the first city in src/data/destinations.js. */
export function getFeaturedStays({ signal } = {}) {
  if (isLive) return searchStays({ signal, destination: LIVE_DESTINATIONS[0].name, guests: 2 })
  return getStays({ signal }).then((stays) => ({ stays, meta: { nights: 0, currency: 'USD', place: null } }))
}

/**
 * One stay. In live mode the result also carries the room offers for the chosen
 * dates (`offers`), guest reviews (`reviews`) and the search it was priced for (`quote`).
 */
export async function getStay(id, { signal, checkIn = '', checkOut = '', guests = 1 } = {}) {
  if (isLive) {
    const dates = checkIn && checkOut ? { checkIn, checkOut } : defaultStayDates()
    const data = await liveApi.get('/stay', {
      params: { id, ...dates, guests: clampGuests(guests) },
      signal,
    })
    if (!data?.offersError) setSandbox(Boolean(data?.sandbox))
    return {
      ...normalizeLiveStay(data?.stay),
      offers: Array.isArray(data?.offers) ? data.offers : [],
      offersError: data?.offersError ?? null,
      // `reviews` on a stay is the review count, so the written reviews have their own name.
      reviewList: Array.isArray(data?.reviews) ? data.reviews : [],
      sandbox: Boolean(data?.sandbox),
      quote: {
        checkIn: data?.checkIn || dates.checkIn,
        checkOut: data?.checkOut || dates.checkOut,
        nights: Number(data?.nights) || nightsBetween(dates.checkIn, dates.checkOut),
        guests: Number(data?.guests) || clampGuests(guests),
        usedDefaultDates: !(checkIn && checkOut),
      },
    }
  }
  if (isApiConfigured) {
    const data = await api.get(`${PATHS.properties}/${encodeURIComponent(id)}`, { signal })
    return normalizeStay(unwrapProperty(data))
  }
  await wait(250)
  return STAYS.find((s) => s.id === id) ?? null
}

/** Destination tiles, with a stay count and starting price worked out from the stays you pass in. */
export function buildDestinations(stays) {
  return DESTINATIONS.map((d) => {
    const here = stays.filter((s) => s.destination === d.name)
    return {
      ...d,
      stayCount: here.length,
      fromPrice: here.length ? Math.min(...here.map((s) => s.price)) : null,
    }
  }).filter((d) => d.stayCount > 0)
}

/* ------------------------------------------------------------------ */
/* Public API: bookings                                                */
/* ------------------------------------------------------------------ */

// Sample trips for the My Trips page, with dates relative to today.
function sampleBookings() {
  const today = todayISO()
  const pick = (id) => STAYS.find((s) => s.id === id)
  const make = (id, ref, status, inOffset, nights, guests) => {
    const stay = pick(id)
    const checkIn = addDays(today, inOffset)
    const checkOut = addDays(checkIn, nights)
    const { total } = priceBreakdown(stay, nights)
    return { id: ref, reference: ref, status, checkIn, checkOut, guests, total, currency: 'USD', stayId: id, stay, isDemo: true }
  }
  return [
    make('oia-caldera-cave-suite', 'TN-48213', 'confirmed', 34, 5, 2),
    make('fushimi-garden-machiya', 'TN-47790', 'confirmed', 71, 6, 4),
    make('alfama-terrace-loft', 'TN-39402', 'completed', -58, 4, 3),
  ]
}

// Bookings made during this visit (sample mode). They last until the page is reloaded.
let sessionBookings = []

/* ---- Live bookings are remembered in this browser until accounts exist (phase 2) ---- */

const BOOKINGS_KEY = 'tripnest-bookings'

function readLocalBookings() {
  try {
    const list = JSON.parse(localStorage.getItem(BOOKINGS_KEY) || '[]')
    return Array.isArray(list) ? list.filter((b) => b && typeof b.id === 'string') : []
  } catch {
    return []
  }
}

function saveLocalBooking(booking) {
  try {
    const rest = readLocalBookings().filter((b) => b.id !== booking.id)
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify([booking, ...rest].slice(0, 50)))
  } catch {
    // Private browsing can refuse storage. The booking is still confirmed with the hotel service.
  }
}

export async function getBookings({ signal } = {}) {
  if (isLive) {
    const local = readLocalBookings()
    if (local.length === 0) return []

    // Ask the server for the current status. If that fails, show what this browser remembers.
    let fresh = []
    try {
      const data = await liveApi.get('/bookings', {
        params: { ids: local.slice(0, 10).map((b) => b.id).join(',') },
        signal,
      })
      fresh = unwrapList(data)
    } catch (error) {
      if (signal?.aborted) throw error
    }
    const byId = new Map(fresh.map((b) => [b.id, b]))
    return local.map((b) => {
      const f = byId.get(b.id)
      if (!f) return b
      return {
        ...b,
        status: f.status || b.status,
        total: f.total || b.total,
        currency: f.currency || b.currency,
        checkIn: f.checkIn || b.checkIn,
        checkOut: f.checkOut || b.checkOut,
        isTest: f.isTest ?? b.isTest,
      }
    })
  }
  if (isApiConfigured) {
    const data = await api.get(PATHS.bookings, { signal })
    return unwrapList(data).map(normalizeBooking)
  }
  await wait()
  return [...sessionBookings, ...sampleBookings()]
}

/**
 * Creates a booking. With your own API configured it POSTs to the bookings endpoint.
 * Without one it returns a clearly marked demo booking that is not saved anywhere.
 */
export async function createBooking({ stay, checkIn, checkOut, guests }) {
  const nights = nightsBetween(checkIn, checkOut)
  const { total } = priceBreakdown(stay, nights)

  if (isApiConfigured && !isLive) {
    const data = await api.post(PATHS.bookings, {
      propertyId: stay.id,
      checkIn,
      checkOut,
      guests,
      total,
    })
    const booking = normalizeBooking(unwrapBooking(data))
    // If the server leaves a field out of its response, fall back to what was just submitted.
    return {
      ...booking,
      checkIn: booking.checkIn || checkIn,
      checkOut: booking.checkOut || checkOut,
      stay: booking.stay ?? stay,
      stayId: booking.stayId || stay.id,
      total: booking.total || total,
    }
  }

  await wait(600)
  const reference = `TN-${Math.floor(10000 + Math.random() * 89999)}`
  const booking = {
    id: reference,
    reference,
    status: 'confirmed',
    checkIn,
    checkOut,
    guests,
    total,
    currency: 'USD',
    stayId: stay.id,
    stay,
    isDemo: true,
  }
  sessionBookings = [booking, ...sessionBookings]
  return booking
}

/**
 * Reserves one room offer (live mode). The server locks the price first and refuses
 * to book if it changed; that case rejects with error.code === 'PRICE_CHANGED'
 * and error.details.newTotal.
 */
export async function reserveOffer({ stay, offer, quote, holder, specialRequests, clientReference }) {
  const data = await liveApi.post('/book', {
    offerId: offer.offerId,
    hotelId: stay.id,
    expectedTotal: offer.total,
    expectedCurrency: offer.currency,
    holder,
    specialRequests: specialRequests || undefined,
    clientReference,
    stay: {
      title: stay.title,
      destination: stay.destination,
      country: stay.country,
      image: stay.image && stay.image.length <= 600 ? stay.image : undefined,
    },
  })

  const raw = data?.booking ?? {}
  const booking = {
    id: String(raw.id),
    reference: String(raw.reference ?? raw.id),
    status: raw.status || 'confirmed',
    checkIn: raw.checkIn || quote.checkIn,
    checkOut: raw.checkOut || quote.checkOut,
    guests: raw.guests || quote.guests,
    total: Number(raw.total) || offer.total,
    currency: raw.currency || offer.currency,
    stayId: String(raw.stayId || stay.id),
    stay: {
      id: stay.id,
      title: raw.stay?.title || stay.title,
      destination: raw.stay?.destination || stay.destination,
      country: raw.stay?.country || stay.country,
      image: raw.stay?.image || stay.image || '',
    },
    freeCancellationUntil: raw.freeCancellationUntil ?? offer.freeCancellationUntil ?? null,
    isTest: Boolean(raw.isTest),
    isDemo: false,
  }
  saveLocalBooking(booking)
  return booking
}

export const amenityLabel = (id) => AMENITIES.find((a) => a.id === id)?.label ?? id