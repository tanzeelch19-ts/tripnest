import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Menu, Moon, Settings, Sun, X } from 'lucide-react'
import { useTheme } from '../context/Themecontext'
import { useWishlist } from '../context/Wishlistcontext'
import { useAuth } from '../context/Authcontext'
import { iconBtn } from './ui'

function LogoMark() {
  return (
    <svg viewBox="0 0 64 64" width="32" height="32" aria-hidden="true" focusable="false">
      <rect className="fill-brand" width="64" height="64" rx="16" />
      <path className="stroke-brand-ink" d="M12 34c4 14 36 14 40 0" fill="none" strokeWidth="5" strokeLinecap="round" />
      <path
        className="stroke-brand-ink opacity-60"
        d="M18 37c5 8 23 8 28 0"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle className="fill-accent" cx="32" cy="23" r="8" />
    </svg>
  )
}

const LINKS = [
  { to: '/explore', label: 'Explore' },
  { to: '/wishlist', label: 'Wishlist', showCount: true },
  { to: '/trips', label: 'My trips' },
]

// On phones the nav is a dropdown under the header; from the md breakpoint it sits inline.
const navClasses =
  'absolute inset-x-0 top-full flex-col gap-0.5 border-b border-line bg-page px-(--gutter) pt-2 pb-4 ' +
  'md:static md:ml-5 md:flex md:flex-row md:gap-1 md:border-b-0 md:bg-transparent md:p-0'

const linkBase =
  'inline-flex min-h-11 items-center rounded-full px-4 py-3 text-[1.0625rem] font-semibold no-underline md:py-2 md:text-base'

export default function Header() {
  const { theme, toggleTheme } = useTheme()
  const { count } = useWishlist()
  const { isAuthenticated, user } = useAuth()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // Close the mobile menu after navigating.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const dark = theme === 'dark'

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-page/85 backdrop-blur-md backdrop-saturate-150">
      <a
        className="absolute -top-16 left-4 z-100 rounded-[10px] bg-brand px-4 py-2.5 font-bold text-brand-ink no-underline focus:top-4"
        href="#main"
      >
        Skip to content
      </a>
      <div className="container flex min-h-(--header-h) items-center gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 text-[1.35rem] font-extrabold font-stretch-[90%] tracking-[-0.02em] text-ink no-underline"
          aria-label="TripNest home"
        >
          <LogoMark />
          <span>TripNest</span>
        </Link>

        <nav id="site-nav" className={`${navClasses} ${open ? 'flex' : 'hidden'}`} aria-label="Main">
          {LINKS.map(({ to, label, showCount }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${linkBase} ${isActive ? 'bg-brand-soft text-ink' : 'text-ink-2 hover:bg-surface hover:text-ink'}`
              }
            >
              {label}
              {showCount && count > 0 ? (
                <span className="ml-2 min-w-[1.35rem] rounded-full bg-accent px-1.5 text-center text-xs leading-[1.35rem] font-extrabold text-accent-ink">
                  {count}
                  <span className="sr-only"> saved</span>
                </span>
              ) : null}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <div className="ml-1 flex items-center gap-1">
              <NavLink
                to="/settings"
                aria-label="Settings"
                title="Settings"
                className={({ isActive }) => `${iconBtn} ${isActive ? 'bg-brand-soft text-ink' : ''}`}
              >
                <Settings size={20} aria-hidden="true" />
              </NavLink>
              <NavLink
                to="/profile"
                aria-label="Your profile"
                title="Your profile"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full no-underline md:h-10 md:w-10"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || '?'}
                </span>
              </NavLink>
            </div>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? 'bg-brand-soft text-ink' : 'text-ink-2 hover:bg-surface hover:text-ink'}`
              }
            >
              Sign in
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className={iconBtn}
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {dark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className={`${iconBtn} md:hidden`}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="site-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  )
}