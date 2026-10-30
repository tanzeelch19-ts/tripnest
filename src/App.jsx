import { Suspense, lazy, useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import StateMessage from './components/Statemessage'
import { btnPrimary, page } from './components/ui'
const HomePage = lazy(() => import('./pages/Homepage'))
const ExplorePage = lazy(() => import('./pages/Explorepage'))
const WishlistPage = lazy(() => import('./pages/Wishlistpage'))
const ComparePage = lazy(() => import('./pages/Comparepage'))
const TripPage = lazy(() => import('./pages/Trippage'))
import CompareBar from './components/Comparebar'
const BookingsPage = lazy(() => import('./pages/Bookingspage'))
const PropertyPage = lazy(() => import('./pages/Propertypage'))
const LoginPage = lazy(() => import('./pages/Loginpage'))
const RegisterPage = lazy(() => import('./pages/Registerpage'))
const ProfilePage = lazy(() => import('./pages/Profilepage'))
const SettingsPage = lazy(() => import('./pages/Settingspage'))
import RequireAuth from './components/Requireauth'

function PageLoader() {
  return (
    <div className="container flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <p className="text-ink-2">Loading…</p>
    </div>
  )
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function NotFound() {
  useEffect(() => {
    document.title = 'Page not found | TripNest'
  }, [])
  return (
    <div className={page}>
      <StateMessage
        title="We couldn't find that page"
        action={
          <Link to="/" className={btnPrimary}>
            Go to the home page
          </Link>
        }
      >
        The link may be out of date, or the address may have a typo.
      </StateMessage>
    </div>
  )
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <ScrollToTop />
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/trips" element={<BookingsPage />} />
          <Route path="/trips/:id" element={<TripPage />} />
          <Route path="/stays/:id" element={<PropertyPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      <CompareBar />
      <Footer />
    </div>
  )
}