/*
 * Real photos of real places, fetched at runtime. Nothing is downloaded by hand.
 *
 * Order for every place:
 *   1. Your own photos in public/photos/ (if you added any)
 *   2. Unsplash API (VITE_UNSPLASH_KEY)
 *   3. Pixabay API (VITE_PIXABAY_KEY)
 *   4. Wikipedia (en.wikipedia.org, no key)
 *
 * A source with no key, or one that fails, is skipped. Results are cached per page load.
 */

const UNSPLASH_KEY = (import.meta.env.VITE_UNSPLASH_KEY || '').trim()
const PIXABAY_KEY = (import.meta.env.VITE_PIXABAY_KEY || '').trim()
const WIKI_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary/'
const WIKI_API = 'https://en.wikipedia.org/w/api.php'

const cache = new Map()
const placeCache = new Map()

export const photosEnabled = true

// Wikimedia thumbnails resize by changing the width in the URL.
const bigger = (url) => url.replace(/\/\d+px-/, '/1200px-')
// Skip logos, flags, maps and icons that are not photos of the place.
const NOT_A_PHOTO = /(flag|logo|map|icon|coat|seal|emblem|locator|location|signature)/i
const articleUrl = (title) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`

// On the deployed site, photo files load through /api/image, so they work even when the
// visitor's network cannot reach the image host. In npm run dev they load directly.
const PROXY_HOSTS = ['upload.wikimedia.org', 'images.unsplash.com', 'cdn.pixabay.com']
function viaProxy(url) {
  if (!url || import.meta.env.DEV) return url
  try {
    return PROXY_HOSTS.includes(new URL(url).hostname) ? `/api/image?url=${encodeURIComponent(url)}` : url
  } catch {
    return url
  }
}

/* ---------------- APIs with keys ---------------- */

async function unsplashPhotos(query, limit, signal) {
  if (!UNSPLASH_KEY) return []
  const url = new URL('https://api.unsplash.com/search/photos')
  url.searchParams.set('query', query)
  url.searchParams.set('per_page', String(limit))
  url.searchParams.set('orientation', 'landscape')
  const response = await fetch(url, { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` }, signal })
  if (!response.ok) return []
  const data = await response.json()
  return (data.results ?? [])
    .map((p) => ({
      src: viaProxy(p.urls?.regular),
      alt: p.alt_description || query,
      photographer: `Unsplash: ${p.user?.name ?? 'photographer'}`,
      pageUrl: p.links?.html,
    }))
    .filter((p) => p.src)
}

async function pixabayPhotos(query, limit, signal) {
  if (!PIXABAY_KEY) return []
  const url = new URL('https://pixabay.com/api/')
  url.searchParams.set('key', PIXABAY_KEY)
  url.searchParams.set('q', query)
  url.searchParams.set('image_type', 'photo')
  url.searchParams.set('orientation', 'horizontal')
  url.searchParams.set('safesearch', 'true')
  url.searchParams.set('per_page', String(Math.max(3, limit)))
  const response = await fetch(url, { signal })
  if (!response.ok) return []
  const data = await response.json()
  return (data.hits ?? [])
    .map((h) => ({
      src: viaProxy(h.largeImageURL || h.webformatURL),
      alt: query,
      photographer: `Pixabay: ${h.user}`,
      pageUrl: h.pageURL,
    }))
    .filter((p) => p.src)
}

// Unsplash first; if it has no key, fails or returns nothing, Pixabay.
async function apiPhotos(query, limit, signal) {
  const fromUnsplash = await unsplashPhotos(query, limit, signal).catch(() => [])
  if (fromUnsplash.length) return fromUnsplash
  return pixabayPhotos(query, limit, signal).catch(() => [])
}

/* ---------------- Wikipedia (no key) ---------------- */

// Lead photo of one Wikipedia article, or null if it has none or is ambiguous.
async function articleImage(title, signal) {
  const response = await fetch(WIKI_SUMMARY + encodeURIComponent(title.replace(/ /g, '_')), {
    headers: { Accept: 'application/json' },
    signal,
  })
  if (!response.ok) return null
  const data = await response.json()
  if (data.type === 'disambiguation' || !data.thumbnail?.source) return null
  return {
    src: viaProxy(bigger(data.thumbnail.source)),
    alt: data.title,
    photographer: `Wikipedia: ${data.title}`,
    pageUrl: data.content_urls?.desktop?.page ?? articleUrl(data.title),
  }
}

// Photos that appear inside one Wikipedia article.
async function articleGallery(title, limit, signal) {
  const url = new URL(WIKI_API)
  const params = {
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'images',
    titles: title,
    gimlimit: '30',
    prop: 'imageinfo',
    iiprop: 'url|mime',
    iiurlwidth: '1200',
  }
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const response = await fetch(url, { signal })
  if (!response.ok) return []
  const data = await response.json()
  return Object.values(data.query?.pages ?? {})
    .filter((p) => p.imageinfo?.[0]?.mime === 'image/jpeg' && p.imageinfo[0].thumburl)
    .filter((p) => !NOT_A_PHOTO.test(p.title))
    .sort((a, b) => a.index - b.index)
    .slice(0, limit)
    .map((p) => ({
      src: viaProxy(p.imageinfo[0].thumburl),
      alt: p.title.replace(/^File:/, '').replace(/\.[a-z]+$/i, '').replace(/_/g, ' '),
      photographer: `Wikipedia: ${title}`,
      pageUrl: articleUrl(title),
    }))
}

/* ---------------- Your own photos ---------------- */

const LOCAL_DIR = '/photos/destinations/'
const slugOf = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

async function checkLocal(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    const type = response.headers.get('content-type') || ''
    return response.ok && type.startsWith('image/') ? url : null
  } catch {
    return null
  }
}

async function localPhoto(title) {
  return checkLocal(`${LOCAL_DIR}${slugOf(title)}.jpg`)
}

// Your own photos for one stay: public/photos/stays/<stay-id>.jpg, plus -2, -3, -4.
const STAY_SUFFIXES = ['', '-2', '-3', '-4']

export async function localStayPhotos(stayId) {
  const found = await Promise.all(STAY_SUFFIXES.map((s) => checkLocal(`/photos/stays/${stayId}${s}.jpg`)))
  return found.filter(Boolean)
}

/* ---------------- Public functions ---------------- */

/**
 * places: names, most specific first (e.g. ['Alfama', 'Lisbon']).
 * Returns up to `perPage` real photos, each with src, alt, photographer and pageUrl.
 */
export async function searchPlacePhotos(places, { perPage = 4, signal } = {}) {
  const titles = [...new Set(places.filter(Boolean))]
  const cacheKey = `${titles.join('|')}|${perPage}`
  if (cache.has(cacheKey)) return cache.get(cacheKey)

  const seen = new Set()
  const photos = []
  const add = (photo) => {
    if (photo && photos.length < perPage && !seen.has(photo.src)) {
      seen.add(photo.src)
      photos.push(photo)
    }
  }

  if (titles.length) {
    const fromApi = await apiPhotos(titles.join(' '), perPage, signal)
    fromApi.forEach(add)
  }

  if (photos.length < perPage) {
    const leads = await Promise.all(titles.map((t) => articleImage(t, signal).catch(() => null)))
    leads.forEach(add)
  }

  for (const title of titles) {
    if (photos.length >= perPage) break
    const gallery = await articleGallery(title, perPage * 2, signal).catch(() => [])
    gallery.forEach(add)
  }

  cache.set(cacheKey, photos)
  return photos
}

/** One real photo for a place: your own file, then the APIs, then Wikipedia. */
export async function placeImage(title) {
  if (placeCache.has(title)) return placeCache.get(title)
  const src =
    (await localPhoto(title)) ??
    (await apiPhotos(`${title} travel`, 1).then((p) => p[0]?.src ?? null).catch(() => null)) ??
    (await articleImage(title).then((p) => p?.src ?? null).catch(() => null))
  placeCache.set(title, src)
  return src
}