/*
 * TripNest sample data (Phase 1).
 *
 * Every listing and destination here is made up. The pictures are small
 * landscapes drawn in code (see sceneImage) so the app has no external image
 * dependencies. In Phase 2 these are replaced by data from your API, and
 * services/staysService.js falls back to a generated scene whenever a listing
 * has no photo of its own.
 */

/* ------------------------------------------------------------------ */
/* Generated scene art                                                 */
/* ------------------------------------------------------------------ */

const W = 800
const H = 600
const f = (n) => Math.round(n * 10) / 10

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
const mix = (a, b, t) => {
  const A = hexToRgb(a)
  const B = hexToRgb(b)
  return (
    '#' +
    A.map((v, i) =>
      Math.round(v + (B[i] - v) * t)
        .toString(16)
        .padStart(2, '0'),
    ).join('')
  )
}

// Small seeded random generator so a scene always looks the same.
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TIMES = {
  noon: { top: '#5DB6E0', bottom: '#E4F5F6', sun: '#FFF9DA' },
  dusk: { top: '#2E3772', bottom: '#F6A57B', sun: '#FFD98A' },
  dawn: { top: '#F2B5A0', bottom: '#FDEFD8', sun: '#FFF3D0' },
  night: { top: '#06122B', bottom: '#2D4A78', sun: '#EAF2FF' },
}
const TIME_ORDER = ['noon', 'dusk', 'dawn', 'night']
const SUN_Y = { noon: 130, dusk: 305, dawn: 295, night: 120 }

function sky(r, t, time) {
  const sx = 150 + r() * 500
  const sy = SUN_Y[time]
  const rad = time === 'night' ? 34 : 50 + r() * 20
  let s = `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.top}"/><stop offset="1" stop-color="${t.bottom}"/></linearGradient></defs>`
  s += `<rect width="${W}" height="${H}" fill="url(#g)"/>`
  if (time === 'night') {
    for (let i = 0; i < 44; i++) {
      s += `<circle cx="${f(r() * W)}" cy="${f(r() * H * 0.55)}" r="${f(0.8 + r() * 1.4)}" fill="#fff" opacity="${f(0.35 + r() * 0.6)}"/>`
    }
  }
  s += `<circle cx="${f(sx)}" cy="${sy}" r="${f(rad * 2.6)}" fill="${t.sun}" opacity="0.16"/>`
  s += `<circle cx="${f(sx)}" cy="${sy}" r="${f(rad * 1.6)}" fill="${t.sun}" opacity="0.22"/>`
  s += `<circle cx="${f(sx)}" cy="${sy}" r="${f(rad)}" fill="${t.sun}"/>`
  return { s, sx, sy }
}

function palm(x, y, h, lean, color) {
  const tx = x + lean
  const ty = y - h
  const mx = x + lean * 0.2
  const my = y - h * 0.55
  // Tapered trunk
  let s = `<path d="M${f(x - 6)} ${f(y)}Q${f(mx - 4)} ${f(my)} ${f(tx - 3)} ${f(ty)}L${f(tx + 3)} ${f(ty)}Q${f(mx + 4)} ${f(my)} ${f(x + 6)} ${f(y)}Z" fill="${color}"/>`
  // Leaf blades fanning out and drooping
  for (const a of [-176, -150, -124, -94, -62, -34, -6]) {
    const rad = (a * Math.PI) / 180
    const dx = Math.cos(rad) * 108
    const dy = Math.sin(rad) * 34 + 64
    const ex = tx + dx
    const ey = ty + dy
    s += `<path d="M${f(tx)} ${f(ty)}Q${f(tx + dx * 0.5)} ${f(ty - 46 + Math.sin(rad) * 12)} ${f(ex)} ${f(ey)}Q${f(tx + dx * 0.5)} ${f(ty - 12)} ${f(tx)} ${f(ty)}Z" fill="${color}"/>`
  }
  return s
}

/* ---- mountains ---- */

function ridge(r, baseY, amp, step, fill, snow) {
  const P = []
  let x = -40
  let up = true
  while (x < W + 60) {
    const y = up ? baseY - amp * (0.55 + r() * 0.45) : baseY - amp * 0.18 * r()
    P.push([x, y])
    up = !up
    x += step * (0.7 + r() * 0.6)
  }
  const d =
    `M-40 ${H}` + P.map(([px, py]) => `L${f(px)} ${f(py)}`).join('') + `L${W + 60} ${H}Z`
  let out = `<path d="${d}" fill="${fill}"/>`
  if (snow) {
    for (let i = 1; i < P.length - 1; i++) {
      const [bx, by] = P[i]
      if (by > baseY - amp * 0.7) continue // valleys and low peaks stay bare
      const [ax, ay] = P[i - 1]
      const [cx, cy] = P[i + 1]
      const lx = bx + (ax - bx) * 0.36
      const ly = by + (ay - by) * 0.36
      const rx = bx + (cx - bx) * 0.36
      const ry = by + (cy - by) * 0.36
      const my = (ly + ry) / 2
      const w = rx - lx
      out += `<path d="M${f(lx)} ${f(ly)}L${f(lx + w * 0.28)} ${f(my + 16)}L${f(lx + w * 0.5)} ${f(my + 4)}L${f(lx + w * 0.72)} ${f(my + 18)}L${f(rx)} ${f(ry)}L${f(bx)} ${f(by)}Z" fill="${snow}"/>`
    }
  }
  return out
}

function mountain(r, t, time, flavor) {
  const base = flavor === 'snow' ? '#4B6D8F' : flavor === 'forest' ? '#2C5B46' : '#3E6572'
  const snow = flavor === 'snow' ? mix('#FFFFFF', t.bottom, time === 'night' ? 0.55 : 0.12) : null
  let out = sky(r, t, time).s
  const layers = [
    [335, 200, 130],
    [395, 160, 105],
    [455, 125, 90],
    [525, 85, 70],
  ]
  layers.forEach(([y, a, st], i) => {
    const fill = i < 3 ? mix(base, t.bottom, 0.8 - i * 0.3) : mix(base, '#071418', 0.4)
    out += ridge(r, y, a, st, fill, i < 2 ? snow : null)
  })
  return out
}

/* ---- coast ---- */

function coast(r, t, time) {
  const { s, sx } = sky(r, t, time)
  const hy = 352
  const sea = mix('#2088A3', t.bottom, 0.3)
  const deep = mix('#0C4560', t.top, 0.25)
  let out = s
  out += `<defs><linearGradient id="w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sea}"/><stop offset="1" stop-color="${deep}"/></linearGradient></defs>`
  out += `<rect y="${hy}" width="${W}" height="${H - hy}" fill="url(#w)"/>`
  for (let i = 0; i < 9; i++) {
    const w = 120 - i * 10
    out += `<rect x="${f(sx - w / 2)}" y="${hy + 10 + i * 17}" width="${w}" height="3" rx="1.5" fill="${t.sun}" opacity="${f(0.55 - i * 0.05)}"/>`
  }
  for (let i = 0; i < 16; i++) {
    out += `<rect x="${f(r() * W)}" y="${f(hy + 20 + r() * (H - hy - 30))}" width="${f(30 + r() * 60)}" height="2" rx="1" fill="#fff" opacity="0.16"/>`
  }

  const top = [
    [-10, 285],
    [130, 272],
    [225, 318],
    [330, 428],
    [430, 470],
  ]
  const yAt = (x) => {
    for (let i = 0; i < top.length - 1; i++) {
      const [x1, y1] = top[i]
      const [x2, y2] = top[i + 1]
      if (x >= x1 && x <= x2) return y1 + (y2 - y1) * ((x - x1) / (x2 - x1))
    }
    return top[top.length - 1][1]
  }
  const land = mix('#CDB99B', t.bottom, 0.18)
  const shade = mix('#8C7455', t.top, 0.3)
  const white = mix('#FFFFFF', t.top, time === 'noon' ? 0.02 : 0.22)
  const white2 = mix(white, '#000000', 0.08)

  let g = `<path d="M-10 ${H}${top.map(([x, y]) => `L${x} ${y}`).join('')}L470 ${H}Z" fill="${land}"/>`
  g += `<path d="M-10 ${H}L-10 520L300 500L470 ${H}Z" fill="${shade}" opacity="0.45"/>`
  for (let x = 6; x < 330; x += 40 + r() * 14) {
    const w = 34 + r() * 22
    const h = 22 + r() * 18
    const y = yAt(Math.min(x + w, 430))
    g += `<rect x="${f(x)}" y="${f(y - h)}" width="${f(w)}" height="${f(h + 14)}" fill="${r() < 0.5 ? white : white2}"/>`
    if (r() < 0.45) {
      const dr = (w - 12) / 2
      g += `<path d="M${f(x + 6)} ${f(y - h)}a${f(dr)} ${f(dr)} 0 0 1 ${f(w - 12)} 0Z" fill="#2E6DB4"/>`
    }
  }
  out += r() < 0.5 ? g : `<g transform="translate(${W} 0) scale(-1 1)">${g}</g>`
  return out
}

/* ---- city ---- */

function mosque(r, fill) {
  const cx = 220 + r() * 360
  let g = `<rect x="${f(cx - 70)}" y="330" width="140" height="90" fill="${fill}"/>`
  g += `<path d="M${f(cx - 58)} 330a58 58 0 0 1 116 0Z" fill="${fill}"/>`
  g += `<path d="M${f(cx - 6)} 272L${f(cx)} 248L${f(cx + 6)} 272Z" fill="${fill}"/>`
  for (const dx of [-98, 98]) {
    g += `<rect x="${f(cx + dx - 6)}" y="245" width="12" height="175" fill="${fill}"/>`
    g += `<rect x="${f(cx + dx - 10)}" y="290" width="20" height="5" fill="${fill}"/>`
    g += `<path d="M${f(cx + dx - 8)} 245L${f(cx + dx)} 205L${f(cx + dx + 8)} 245Z" fill="${fill}"/>`
  }
  for (const dx of [-70, 70]) {
    g += `<path d="M${f(cx + dx - 26)} 360a26 26 0 0 1 52 0Z" fill="${fill}"/>`
  }
  return g
}

function city(r, t, time, flavor) {
  const night = time === 'night' || time === 'dusk'
  const farC = mix('#52657D', t.bottom, 0.55)
  const midC = mix('#324559', t.bottom, 0.25)
  const nearC = mix('#1C2B3C', t.top, 0.2)
  let out = sky(r, t, time).s

  const row = (baseY, minH, maxH, wMin, wMax, fill, lit, chance) => {
    let g = ''
    let x = -8
    while (x < W + 8) {
      const w = wMin + r() * (wMax - wMin)
      const h = minH + r() * (maxH - minH)
      g += `<rect x="${f(x)}" y="${f(baseY - h)}" width="${f(w)}" height="${f(h + H - baseY)}" fill="${fill}"/>`
      if (lit) {
        const cols = Math.floor((w - 8) / 11)
        const rows = Math.floor((h - 10) / 15)
        for (let c = 0; c < cols; c++) {
          for (let q = 0; q < rows; q++) {
            if (r() < chance) {
              g += `<rect x="${f(x + 6 + c * 11)}" y="${f(baseY - h + 8 + q * 15)}" width="5" height="7" fill="${lit}" opacity="${night ? 0.85 : 0.3}"/>`
            }
          }
        }
      }
      x += w + r() * 5
    }
    return g
  }

  out += row(400, 60, 170, 38, 80, farC, null, 0)
  if (flavor === 'domes') out += mosque(r, mix(farC, '#2A3447', 0.38))
  out += row(485, 50, 150, 36, 70, midC, night ? t.sun : mix(midC, '#FFFFFF', 0.35), 0.28)
  out += row(565, 30, 110, 40, 90, nearC, night ? t.sun : mix(nearC, '#FFFFFF', 0.3), 0.34)
  return out
}

/* ---- desert ---- */

function desert(r, t, time, flavor) {
  const base = '#D9953F'
  let out = sky(r, t, time).s
  const rows = [380, 430, 485, 545]
  rows.forEach((y, i) => {
    const fill = i < 3 ? mix(base, t.bottom, 0.68 - i * 0.24) : mix(base, '#4A2308', 0.3)
    const p = () => f(y - 55 + r() * 85)
    out += `<path d="M-20 ${H}L-20 ${p()}Q120 ${f(y - 80 - r() * 40)} 230 ${p()}T440 ${p()}T650 ${p()}T830 ${p()}L830 ${H}Z" fill="${fill}"/>`
    if (i === 1 && flavor === 'camp') {
      const tx = 260 + r() * 260
      const ty = y + 6
      const tent = mix('#F4E3C1', t.bottom, 0.15)
      out += `<path d="M${f(tx - 70)} ${f(ty + 46)}L${f(tx)} ${f(ty - 30)}L${f(tx + 70)} ${f(ty + 46)}Z" fill="${tent}"/>`
      out += `<path d="M${f(tx - 14)} ${f(ty + 46)}L${f(tx)} ${f(ty + 6)}L${f(tx + 14)} ${f(ty + 46)}Z" fill="${mix('#3A1A06', t.top, 0.2)}"/>`
    }
  })
  if (flavor !== 'camp') {
    const c = mix('#2A1608', t.top, 0.12)
    out += palm(110 + r() * 80, 600, 250 + r() * 50, 26, c)
    out += palm(560 + r() * 140, 600, 200 + r() * 50, -20, c)
  }
  return out
}

/* ---- jungle and rice terraces ---- */

function jungle(r, t, time) {
  const base = '#1F6C4B'
  let out = sky(r, t, time).s
  const hills = [
    [390, 0.72],
    [450, 0.45],
    [515, 0.2],
  ]
  hills.forEach(([y, k], i) => {
    const p = () => f(y - 50 + r() * 80)
    out += `<path d="M-20 ${H}L-20 ${p()}Q130 ${f(y - 95 - r() * 30)} 250 ${p()}T470 ${p()}T660 ${p()}T830 ${p()}L830 ${H}Z" fill="${mix(base, t.bottom, k)}"/>`
    if (i === 1) {
      const lines = mix('#A6D86F', t.bottom, 0.25)
      for (let q = 0; q < 7; q++) {
        const ly = 462 + q * 13
        out += `<path d="M${90 + q * 16} ${ly}Q300 ${ly - 16} ${560 - q * 10} ${ly}" stroke="${lines}" stroke-width="3" fill="none" opacity="0.55"/>`
      }
    }
  })
  const c = mix('#0F2E22', t.top, 0.12)
  out += palm(80 + r() * 90, 600, 290 + r() * 50, 30, c)
  out += palm(580 + r() * 120, 600, 230 + r() * 50, -26, c)
  return out
}

const SCENES = { mountain, coast, city, desert, jungle }
const KIND_SALT = { mountain: 11, coast: 23, city: 37, desert: 53, jungle: 71 }

/**
 * Returns an SVG landscape as a data URI that works anywhere an image URL does.
 * kind: 'mountain' | 'coast' | 'city' | 'desert' | 'jungle'
 * opts: { time: 'noon' | 'dusk' | 'dawn' | 'night', flavor: string }
 */
export function sceneImage(kind, seed = 1, opts = {}) {
  const draw = SCENES[kind] || SCENES.mountain
  const time = opts.time || TIME_ORDER[seed % TIME_ORDER.length]
  const r = rng(seed * 9973 + (KIND_SALT[kind] || 1))
  const drawn = draw(r, TIMES[time], time, opts.flavor)
  const body = opts.flip ? `<g transform="translate(${W} 0) scale(-1 1)">${drawn}</g>` : drawn
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${body}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function gallery(scene, count = 5) {
  const first = scene.time || TIME_ORDER[scene.seed % TIME_ORDER.length]
  const rest = TIME_ORDER.filter((x) => x !== first)
  return Array.from({ length: count }, (_, i) =>
    sceneImage(scene.kind, scene.seed + i * 7, {
      flavor: scene.flavor,
      time: i === 0 ? first : rest[(i - 1) % rest.length],
      flip: i % 2 === 1,
    }),
  )
}

/* ------------------------------------------------------------------ */
/* Reference lists                                                     */
/* ------------------------------------------------------------------ */

export const AMENITIES = [
  { id: 'wifi', label: 'Wi-Fi' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'pool', label: 'Pool' },
  { id: 'ac', label: 'Air conditioning' },
  { id: 'heating', label: 'Heating' },
  { id: 'parking', label: 'Free parking' },
  { id: 'washer', label: 'Washer' },
  { id: 'workspace', label: 'Dedicated workspace' },
  { id: 'breakfast', label: 'Breakfast included' },
  { id: 'fireplace', label: 'Fireplace' },
  { id: 'hottub', label: 'Hot tub' },
  { id: 'pets', label: 'Pets allowed' },
  { id: 'view', label: 'Scenic view' },
]

export const PROPERTY_TYPES = ['Apartment', 'Villa', 'Cabin', 'Hotel', 'Guesthouse']

export const DESTINATIONS = [
  { slug: 'santorini', name: 'Santorini', country: 'Greece', scene: { kind: 'coast', seed: 12, time: 'dusk' } },
  { slug: 'kyoto', name: 'Kyoto', country: 'Japan', scene: { kind: 'mountain', flavor: 'forest', seed: 8, time: 'dawn' } },
  { slug: 'bali', name: 'Bali', country: 'Indonesia', scene: { kind: 'jungle', seed: 5, time: 'noon' } },
  { slug: 'lisbon', name: 'Lisbon', country: 'Portugal', scene: { kind: 'city', seed: 3, time: 'dusk' } },
  { slug: 'istanbul', name: 'Istanbul', country: 'Türkiye', scene: { kind: 'city', flavor: 'domes', seed: 6, time: 'dawn' } },
  { slug: 'marrakech', name: 'Marrakech', country: 'Morocco', scene: { kind: 'desert', seed: 2, time: 'noon' } },
  { slug: 'hunza', name: 'Hunza Valley', country: 'Pakistan', scene: { kind: 'mountain', flavor: 'snow', seed: 9, time: 'noon' } },
  { slug: 'reykjavik', name: 'Reykjavik', country: 'Iceland', scene: { kind: 'mountain', flavor: 'snow', seed: 14, time: 'night' } },
].map((d) => ({ ...d, image: sceneImage(d.scene.kind, d.scene.seed, d.scene) }))

/* ------------------------------------------------------------------ */
/* Listings                                                            */
/* ------------------------------------------------------------------ */

const RAW_STAYS = [
  {
    id: 'alfama-terrace-loft',
    title: 'Terrace loft above the Alfama rooftops',
    destination: 'Lisbon',
    country: 'Portugal',
    area: 'Alfama',
    type: 'Apartment',
    scene: { kind: 'city', seed: 3, time: 'dusk' },
    rating: 4.86,
    reviews: 312,
    price: 128,
    cleaningFee: 35,
    maxGuests: 4,
    bedrooms: 2,
    beds: 3,
    baths: 1,
    amenities: ['wifi', 'kitchen', 'ac', 'washer', 'workspace', 'view'],
    host: { name: 'Inês', since: 2019 },
    description:
      'A bright top-floor loft with a private terrace that looks over the river. Tram 28 stops at the end of the street, and the miradouros are a short walk uphill.',
  },
  {
    id: 'baixa-boutique-hotel',
    title: 'Baixa boutique hotel with courtyard breakfast',
    destination: 'Lisbon',
    country: 'Portugal',
    area: 'Baixa',
    type: 'Hotel',
    scene: { kind: 'city', seed: 21, time: 'noon' },
    rating: 4.72,
    reviews: 528,
    price: 164,
    cleaningFee: 0,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    amenities: ['wifi', 'ac', 'heating', 'breakfast'],
    host: { name: 'Hotel Rua Augusta', since: 2016 },
    description:
      'Twenty-two rooms in a restored pombaline building, a few minutes from the metro and the waterfront. Breakfast is served in the tiled courtyard.',
  },
  {
    id: 'fushimi-garden-machiya',
    title: 'Wooden machiya with a moss garden',
    destination: 'Kyoto',
    country: 'Japan',
    area: 'Fushimi',
    type: 'Guesthouse',
    scene: { kind: 'mountain', flavor: 'forest', seed: 8, time: 'dawn' },
    rating: 4.93,
    reviews: 204,
    price: 152,
    cleaningFee: 40,
    maxGuests: 5,
    bedrooms: 2,
    beds: 4,
    baths: 1,
    amenities: ['wifi', 'kitchen', 'heating', 'washer', 'workspace', 'view'],
    host: { name: 'Haruka', since: 2018 },
    description:
      'A restored townhouse with tatami rooms, a deep soaking tub and a small garden. The shrine gates are a ten-minute walk, and the station is five.',
  },
  {
    id: 'gion-tea-house-suite',
    title: 'Quiet suite in a Gion tea house',
    destination: 'Kyoto',
    country: 'Japan',
    area: 'Gion',
    type: 'Hotel',
    scene: { kind: 'mountain', flavor: 'forest', seed: 17, time: 'noon' },
    rating: 4.81,
    reviews: 167,
    price: 210,
    cleaningFee: 0,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    amenities: ['wifi', 'ac', 'heating', 'breakfast'],
    host: { name: 'Tea House Gion', since: 2014 },
    description:
      'One suite above a working tea house, with sliding screens onto a lantern-lit lane. Breakfast is a traditional set meal brought to the room.',
  },
  {
    id: 'ubud-rice-terrace-villa',
    title: 'Villa above the rice terraces',
    destination: 'Bali',
    country: 'Indonesia',
    area: 'Ubud',
    type: 'Villa',
    scene: { kind: 'jungle', seed: 5, time: 'noon' },
    rating: 4.95,
    reviews: 389,
    price: 145,
    cleaningFee: 30,
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    baths: 2,
    amenities: ['wifi', 'pool', 'kitchen', 'ac', 'parking', 'breakfast', 'view'],
    host: { name: 'Made', since: 2017 },
    description:
      'Three open-plan bedrooms around a long pool that faces the terraces. A cook comes each morning, and the village market is a short scooter ride away.',
  },
  {
    id: 'uluwatu-cliff-pool-villa',
    title: 'Cliff-edge villa with an infinity pool',
    destination: 'Bali',
    country: 'Indonesia',
    area: 'Uluwatu',
    type: 'Villa',
    scene: { kind: 'coast', seed: 19, time: 'dusk' },
    rating: 4.89,
    reviews: 141,
    price: 260,
    cleaningFee: 55,
    maxGuests: 8,
    bedrooms: 4,
    beds: 5,
    baths: 4,
    amenities: ['wifi', 'pool', 'ac', 'kitchen', 'parking', 'hottub', 'view'],
    host: { name: 'Wayan', since: 2020 },
    description:
      'Four suites stepped down a limestone cliff toward the surf break. Sunset is best from the pool deck, and a driver can be arranged for beach days.',
  },
  {
    id: 'oia-caldera-cave-suite',
    title: 'Cave suite facing the caldera',
    destination: 'Santorini',
    country: 'Greece',
    area: 'Oia',
    type: 'Hotel',
    scene: { kind: 'coast', seed: 12, time: 'dusk' },
    rating: 4.91,
    reviews: 276,
    price: 310,
    cleaningFee: 0,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    amenities: ['wifi', 'ac', 'breakfast', 'pool', 'view'],
    host: { name: 'Cave House Oia', since: 2015 },
    description:
      'A white-washed suite carved into the cliff with a private plunge pool on its terrace. Breakfast arrives on a tray at whatever time you choose.',
  },
  {
    id: 'fira-whitewash-studio',
    title: 'Whitewashed studio near the Fira path',
    destination: 'Santorini',
    country: 'Greece',
    area: 'Fira',
    type: 'Apartment',
    scene: { kind: 'coast', seed: 25, time: 'noon' },
    rating: 4.68,
    reviews: 233,
    price: 142,
    cleaningFee: 28,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    amenities: ['wifi', 'kitchen', 'ac', 'view'],
    host: { name: 'Eleni', since: 2018 },
    description:
      'A compact studio with a shaded balcony and a view across the water. The cliff path to the old port starts two doors down.',
  },
  {
    id: 'galata-rooftop-hotel',
    title: 'Galata hotel with a rooftop breakfast room',
    destination: 'Istanbul',
    country: 'Türkiye',
    area: 'Galata',
    type: 'Hotel',
    scene: { kind: 'city', flavor: 'domes', seed: 6, time: 'dawn' },
    rating: 4.77,
    reviews: 611,
    price: 178,
    cleaningFee: 0,
    maxGuests: 3,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    amenities: ['wifi', 'ac', 'heating', 'breakfast', 'view'],
    host: { name: 'Galata Terrace', since: 2013 },
    description:
      'Rooms on a steep cobbled street below the tower, with breakfast served on the roof above the old city skyline.',
  },
  {
    id: 'cihangir-bosphorus-studio',
    title: 'Light-filled studio in Cihangir',
    destination: 'Istanbul',
    country: 'Türkiye',
    area: 'Cihangir',
    type: 'Apartment',
    scene: { kind: 'city', flavor: 'domes', seed: 29, time: 'dusk' },
    rating: 4.64,
    reviews: 198,
    price: 96,
    cleaningFee: 25,
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    baths: 1,
    amenities: ['wifi', 'kitchen', 'ac', 'washer', 'workspace', 'view'],
    host: { name: 'Deniz', since: 2021 },
    description:
      'A quiet studio with tall windows and a view toward the strait. Cafes, a bakery and the ferry stop are all within a few minutes on foot.',
  },
  {
    id: 'medina-courtyard-riad',
    title: 'Courtyard riad with a plunge pool',
    destination: 'Marrakech',
    country: 'Morocco',
    area: 'Medina',
    type: 'Guesthouse',
    scene: { kind: 'desert', seed: 2, time: 'noon' },
    rating: 4.88,
    reviews: 342,
    price: 112,
    cleaningFee: 20,
    maxGuests: 6,
    bedrooms: 3,
    beds: 4,
    baths: 3,
    amenities: ['wifi', 'ac', 'pool', 'breakfast', 'view'],
    host: { name: 'Yasmine', since: 2016 },
    description:
      'Three bedrooms around a tiled courtyard with orange trees and a small pool. The riad sits down a quiet lane, ten minutes from the main square.',
  },
  {
    id: 'agafay-dunes-camp-suite',
    title: 'Desert camp suite in the Agafay stones',
    destination: 'Marrakech',
    country: 'Morocco',
    area: 'Agafay Desert',
    type: 'Hotel',
    scene: { kind: 'desert', flavor: 'camp', seed: 15, time: 'dusk' },
    rating: 4.83,
    reviews: 119,
    price: 138,
    cleaningFee: 0,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    amenities: ['heating', 'parking', 'breakfast', 'pets', 'view'],
    host: { name: 'Camp Agafay', since: 2019 },
    description:
      'Canvas suites with real beds and wood stoves, set apart across the plateau. Dinner is cooked over coals, and the sky is very dark at night.',
  },
  {
    id: 'karimabad-apricot-guesthouse',
    title: 'Orchard guesthouse in Karimabad',
    destination: 'Hunza Valley',
    country: 'Pakistan',
    area: 'Karimabad',
    type: 'Guesthouse',
    scene: { kind: 'mountain', flavor: 'snow', seed: 9, time: 'noon' },
    rating: 4.9,
    reviews: 96,
    price: 58,
    cleaningFee: 10,
    maxGuests: 4,
    bedrooms: 2,
    beds: 3,
    baths: 1,
    amenities: ['wifi', 'heating', 'parking', 'breakfast', 'pets', 'view'],
    host: { name: 'Gulmit family', since: 2017 },
    description:
      'A family-run guesthouse among apricot trees, with snow peaks across the valley from the terrace. Breakfast is bread, apricot jam and tea.',
  },
  {
    id: 'attabad-lakeview-cabin',
    title: 'Timber cabin by the turquoise lake',
    destination: 'Hunza Valley',
    country: 'Pakistan',
    area: 'Attabad',
    type: 'Cabin',
    scene: { kind: 'mountain', flavor: 'snow', seed: 22, time: 'dawn' },
    rating: 4.74,
    reviews: 73,
    price: 74,
    cleaningFee: 12,
    maxGuests: 5,
    bedrooms: 2,
    beds: 3,
    baths: 1,
    amenities: ['wifi', 'kitchen', 'fireplace', 'heating', 'parking', 'view'],
    host: { name: 'Karim', since: 2021 },
    description:
      'A two-bedroom cabin a few steps from the shore, with a wood fire for cold evenings. Boat rides leave from the jetty next door.',
  },
  {
    id: 'reykjavik-old-harbour-loft',
    title: 'Harbor loft in the Old Harbour',
    destination: 'Reykjavik',
    country: 'Iceland',
    area: 'Old Harbour',
    type: 'Apartment',
    scene: { kind: 'mountain', flavor: 'snow', seed: 14, time: 'night' },
    rating: 4.8,
    reviews: 257,
    price: 155,
    cleaningFee: 38,
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    baths: 1,
    amenities: ['wifi', 'kitchen', 'heating', 'washer', 'workspace', 'view'],
    host: { name: 'Sigrún', since: 2018 },
    description:
      'A warm loft above the harbor, close to the whale-watching boats and a good bakery. Large windows face the bay and the mountains beyond it.',
  },
  {
    id: 'thingvellir-glass-cabin',
    title: 'Glass-roofed cabin with a hot tub',
    destination: 'Reykjavik',
    country: 'Iceland',
    area: 'Golden Circle',
    type: 'Cabin',
    scene: { kind: 'mountain', flavor: 'snow', seed: 31, time: 'dusk' },
    rating: 4.96,
    reviews: 88,
    price: 189,
    cleaningFee: 45,
    maxGuests: 4,
    bedrooms: 1,
    beds: 2,
    baths: 1,
    amenities: ['wifi', 'hottub', 'fireplace', 'heating', 'parking', 'view'],
    host: { name: 'Ólafur', since: 2020 },
    description:
      'A small cabin with a glass roof over the bed and a hot tub on the deck. It is about an hour from the city, and the northern lights are visible from the tub on clear nights.',
  },
]

export const STAYS = RAW_STAYS.map((s) => {
  const images = gallery(s.scene)
  return { ...s, image: images[0], images }
})