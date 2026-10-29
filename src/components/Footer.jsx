import { Link } from 'react-router-dom'
import { Compass, Heart, Briefcase, Settings, User } from 'lucide-react'
import { isApiConfigured } from '../services/StaysService'

const linkClass = 'inline-flex items-center gap-2 text-ink-2 no-underline transition hover:text-ink'

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { to: '/explore', label: 'All stays', icon: Compass },
      { to: '/wishlist', label: 'Wishlist', icon: Heart },
      { to: '/trips', label: 'My trips', icon: Briefcase },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/profile', label: 'Profile', icon: User },
      { to: '/settings', label: 'Settings', icon: Settings },
      { to: '/login', label: 'Sign in' },
      { to: '/register', label: 'Create account' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-xl font-extrabold font-stretch-[90%]">TripNest</p>
            <p className="mt-2 max-w-[36ch] text-ink-2">
              Find a place to land. Search stays, save your favourites, and keep every trip in one place.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-sm font-semibold tracking-wide text-ink uppercase">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link to={to} className={linkClass}>
                      {Icon && <Icon size={16} aria-hidden="true" />}
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-sm text-ink-2 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} TripNest. All rights reserved.</p>
          {!isApiConfigured && <p>Listings and prices shown are sample data.</p>}
        </div>
      </div>
    </footer>
  )
}