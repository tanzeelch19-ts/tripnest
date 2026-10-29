/*
 * REST API helper.
 *
 * All HTTP calls go through this file, so the rest of the app never touches
 * fetch directly. It handles the base URL, query strings, JSON bodies, JSON
 * parsing, timeouts and a single error type (ApiError).
 *
 * Two clients are exported:
 *   liveApi  talks to this project's own server functions in /api (live hotels).
 *            Same origin, so there are no keys and no CORS in the browser.
 *   api      talks to your own REST API, when VITE_API_URL is set.
 */

const BASE_URL = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
const TOKEN_KEY = 'tripnest-token'
const TIMEOUT_MS = 30000

/** True when VITE_API_URL is set (your own REST API). */
export const isApiConfigured = BASE_URL.length > 0

/** Endpoint paths of your own REST API. Override them in .env.local if it names them differently. */
export const PATHS = {
  properties: import.meta.env.VITE_API_PROPERTIES_PATH || '/properties',
  bookings: import.meta.env.VITE_API_BOOKINGS_PATH || '/bookings',
}

export class ApiError extends Error {
  constructor(message, { status = 0, data = null, code = '', details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.code = code
    this.details = details
  }
}

// Phase 2 will store a real token here after sign-in.
function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

function buildUrl(baseUrl, path, params) {
  const url = new URL(baseUrl + (path.startsWith('/') ? path : `/${path}`), window.location.origin)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value))
      }
    })
  }
  return url.toString()
}

async function parseBody(response) {
  if (response.status === 204) return null
  const type = response.headers.get('content-type') || ''
  if (type.includes('application/json')) {
    try {
      return await response.json()
    } catch {
      return null
    }
  }
  const text = await response.text()
  return text || null
}

/** Reads a message from { error: { message } }, { message } or { error: "text" }. */
function errorParts(data, status) {
  if (data && typeof data === 'object') {
    const e = data.error
    if (e && typeof e === 'object') {
      return { message: e.message || `Request failed with status ${status}.`, code: e.code || '', details: e }
    }
    if (typeof data.message === 'string' && data.message) return { message: data.message, code: '', details: null }
    if (typeof e === 'string' && e) return { message: e, code: '', details: null }
  }
  return { message: `Request failed with status ${status}.`, code: '', details: null }
}

function createClient(baseUrl, { auth = false, name = 'API', expectJson = false } = {}) {
  async function request(path, { method = 'GET', params, body, headers, signal } = {}) {
    if (baseUrl === null) {
      throw new ApiError('No API is configured. Set VITE_API_URL in .env.local.')
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
    if (signal) signal.addEventListener('abort', () => controller.abort(), { once: true })

    const token = auth ? getToken() : null
    const init = {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }

    let response
    try {
      response = await fetch(buildUrl(baseUrl, path, params), init)
    } catch (error) {
      if (signal?.aborted) throw error // the caller cancelled on purpose
      const timedOut = error.name === 'AbortError'
      throw new ApiError(
        timedOut
          ? 'The server took too long to respond. Try again.'
          : 'Could not reach the server. Check your connection and try again.',
      )
    } finally {
      clearTimeout(timer)
    }

    const data = await parseBody(response)
    if (!response.ok) {
      const { message, code, details } = errorParts(data, response.status)
      throw new ApiError(message, { status: response.status, data, code, details })
    }
    // A host without server functions answers every address with the web page itself.
    if (expectJson && response.status !== 204 && (data === null || typeof data === 'string')) {
      throw new ApiError(
        `The ${name} did not answer with data. Run the project with "npm run dev" or deploy it to Vercel so the /api functions are available.`,
        { status: response.status },
      )
    }
    return data
  }

  return {
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
    patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
  }
}

/** Your own REST API (VITE_API_URL). */
export const api = createClient(isApiConfigured ? BASE_URL : null, { auth: true })

/** This project's server functions in /api. */
export const liveApi = createClient('/api', { name: 'server functions', expectJson: true })