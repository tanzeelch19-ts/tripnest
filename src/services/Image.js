/*
 * Image proxy (Vercel serverless function).
 *
 * Some networks cannot reach image hosts such as upload.wikimedia.org. Vercel's
 * servers can, so the deployed site loads photos through /api/image instead.
 * Only the hosts listed below are allowed, so this cannot be used as an open proxy.
 */

const ALLOWED_HOSTS = ['upload.wikimedia.org', 'images.unsplash.com', 'cdn.pixabay.com']

export default async function handler(req, res) {
  let target
  try {
    target = new URL(String(req.query.url || ''))
  } catch {
    return res.status(400).send('Missing or invalid url')
  }

  if (target.protocol !== 'https:' || !ALLOWED_HOSTS.includes(target.hostname)) {
    return res.status(403).send('Host not allowed')
  }

  try {
    const upstream = await fetch(target, {
      headers: { 'User-Agent': 'TripNest/1.0 (photo proxy)', Accept: 'image/*' },
    })
    if (!upstream.ok) {
      return res.status(upstream.status).send('Upstream image not available')
    }
    const type = upstream.headers.get('content-type') || ''
    if (!type.startsWith('image/')) {
      return res.status(415).send('Not an image')
    }
    const bytes = Buffer.from(await upstream.arrayBuffer())
    res.setHeader('Content-Type', type)
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400')
    return res.status(200).send(bytes)
  } catch {
    return res.status(502).send('Could not fetch the image')
  }
}