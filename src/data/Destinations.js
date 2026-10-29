/*
 * Cities you can search for live hotels (VITE_DATA_SOURCE=live).
 * `slug` is sent to the server function as the destination. Keep slugs
 * lowercase, and check them against what /api/stays expects.
 */

export const LIVE_DESTINATIONS = [
  { name: 'Santorini', slug: 'santorini', country: 'Greece' },
  { name: 'Lisbon', slug: 'lisbon', country: 'Portugal' },
  { name: 'Kyoto', slug: 'kyoto', country: 'Japan' },
  { name: 'Bali', slug: 'bali', country: 'Indonesia' },
  { name: 'Istanbul', slug: 'istanbul', country: 'Turkey' },
  { name: 'Marrakech', slug: 'marrakech', country: 'Morocco' },
  { name: 'Hunza Valley', slug: 'hunza-valley', country: 'Pakistan' },
  { name: 'Reykjavik', slug: 'reykjavik', country: 'Iceland' },
]

/** Finds a destination by its name or slug, ignoring case. Returns null if none matches. */
export function findDestination(value = '') {
  const key = String(value).trim().toLowerCase()
  if (!key) return null
  return LIVE_DESTINATIONS.find((d) => d.name.toLowerCase() === key || d.slug === key) ?? null
}