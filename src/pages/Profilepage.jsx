import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarDays, CheckCircle2, Download, Heart, LogOut, Mail, Plane } from 'lucide-react'
import Field, { buttonClass, inputClass } from '../components/Field'
import { useAuth } from '../context/Authcontext'
import { useWishlist } from '../context/Wishlistcontext'
import { formatDateRange, getBookings, todayISO } from '../services/StaysService'
import { SettingsPanel, downloadUserData } from './Settingspage'
import { PAYMENT_OPTIONS, getTripNotes } from '../services/Trips'

const schema = z.object({
  name: z.string().trim().min(2, 'Enter your name.'),
  phone: z.string().trim().max(20, 'Phone number is too long.'),
  bio: z.string().max(300, 'Keep your bio under 300 characters.'),
})

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <Icon size={20} className="text-sky-600" aria-hidden="true" />
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  )
}

function Card({ title, description, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}

export default function ProfilePage() {
  const { user, updateAccount, logout } = useAuth()
  const { count } = useWishlist()
  const navigate = useNavigate()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [trips, setTrips] = useState({ status: 'loading', list: [] })
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, phone: user.phone ?? '', bio: user.bio ?? '' },
  })

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(() => setSaved(false), 2500)
    return () => clearTimeout(timer)
  }, [saved])

  useEffect(() => {
    const controller = new AbortController()
    getBookings({ signal: controller.signal })
      .then((list) => setTrips({ status: 'ready', list }))
      .catch(() => {
        if (!controller.signal.aborted) setTrips({ status: 'error', list: [] })
      })
    return () => controller.abort()
  }, [])

  const onSubmit = async (values) => {
    setSaveError('')
    try {
      await updateAccount(values)
      reset(values)
      setSaved(true)
    } catch (err) {
      setSaveError(err.message)
    }
  }

  const [paymentError, setPaymentError] = useState('')
  const defaultPayment = user.settings?.defaultPayment ?? 'at-property'

  const savePayment = (value) => {
    setPaymentError('')
    Promise.resolve(updateAccount({ settings: { defaultPayment: value } })).catch((err) => setPaymentError(err.message))
  }

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  // Profile completeness: name is required, so the other three fields make up the rest.
  const checklist = [
    { label: 'Full name', done: Boolean(user.name) },
    { label: 'Phone number', done: Boolean(user.phone) },
    { label: 'About you', done: Boolean(user.bio) },
  ]
  const completed = checklist.filter((c) => c.done).length
  const percent = Math.round((completed / checklist.length) * 100)

  const today = todayISO()
  const upcoming = trips.list
    .filter((b) => b.checkIn >= today && b.status !== 'cancelled')
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  return (
    <section className="container py-10">
      <div className="flex flex-col gap-6 rounded-3xl bg-linear-to-br from-sky-600 to-indigo-700 p-6 text-white sm:flex-row sm:items-center sm:p-8">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-white/20 text-3xl font-bold">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <p className="text-sm text-white/80">Welcome back</p>
          <h1 className="text-2xl font-bold sm:text-3xl">{user.name}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-white/80">
            <Mail size={16} aria-hidden="true" />
            {user.email}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 self-start rounded-full bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25 sm:self-center"
        >
          <LogOut size={16} aria-hidden="true" />
          Sign out
        </button>
      </div>

      <div className="mt-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Heart} label="Saved stays" value={count} />
        <StatCard icon={Plane} label="Trips booked" value={trips.status === 'loading' ? '…' : trips.list.length} />
        <StatCard icon={CheckCircle2} label="Profile complete" value={`${percent}%`} />
        <StatCard icon={CalendarDays} label="Member since" value={memberSince} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Upcoming trips" description="Your next bookings, with dates.">
            {trips.status === 'loading' ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Loading your trips…</p>
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No upcoming trips yet.{' '}
                <Link to="/explore" className="font-semibold text-sky-600">
                  Find a stay
                </Link>
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {upcoming.slice(0, 3).map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{b.stay?.title || 'Your stay'}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateRange(b.checkIn, b.checkOut)}</p>
                    </div>
                    <Link to="/trips" className="text-sm font-semibold text-sky-600">
                      Details
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Payment methods" description="Your default method and the one chosen for each trip. Demo only: no payment is taken.">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Default payment method
              <select value={defaultPayment} onChange={(e) => savePayment(e.target.value)} className={inputClass}>
                {PAYMENT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {paymentError && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {paymentError}
              </p>
            )}
            {trips.list.length > 0 ? (
              <ul className="mt-5 divide-y divide-slate-200 dark:divide-slate-800">
                {trips.list.slice(0, 5).map((b) => {
                  const method = getTripNotes(b.id).payment
                  const label = PAYMENT_OPTIONS.find((o) => o.value === method)?.label ?? 'Pay at the property'
                  return (
                    <li key={b.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                      <span className="font-semibold text-slate-900 dark:text-white">{b.stay?.title || b.reference}</span>
                      <span className="text-slate-500 dark:text-slate-400">{label}</span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Your trips and their payment methods will appear here.</p>
            )}
          </Card>

          <Card title="Personal details" description="How you appear on your trips and messages.">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <Field label="Full name" error={errors.name?.message}>
                <input className={inputClass} {...register('name')} />
              </Field>
              <Field label="Phone" error={errors.phone?.message}>
                <input type="tel" className={inputClass} {...register('phone')} />
              </Field>
              <Field label="About you" error={errors.bio?.message}>
                <textarea rows={4} className={inputClass} {...register('bio')} />
              </Field>
              <div className="flex flex-wrap items-center gap-4">
                <button type="submit" disabled={isSubmitting || !isDirty} className={`${buttonClass} w-auto px-6`}>
                  Save changes
                </button>
                {saved && (
                  <span role="status" className="text-sm font-medium text-green-600">
                    Saved
                  </span>
                )}
                {saveError && (
                  <span role="alert" className="text-sm text-red-600">
                    {saveError}
                  </span>
                )}
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Profile completeness" description="Fill these in to make your profile complete.">
            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" aria-hidden="true">
              <div className="h-2 rounded-full bg-sky-600 transition-all" style={{ width: `${percent}%` }} />
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  <CheckCircle2
                    size={16}
                    aria-hidden="true"
                    className={c.done ? 'text-green-600' : 'text-slate-300 dark:text-slate-600'}
                  />
                  <span className={c.done ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}>
                    {c.label}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Preferences" description="Changes save instantly.">
            <SettingsPanel />
          </Card>

          <Card title="Account">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Email</dt>
                <dd className="truncate font-medium text-slate-900 dark:text-white">{user.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Phone</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{user.phone || 'Not added'}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Currency</dt>
                <dd className="font-medium text-slate-900 dark:text-white">{user.settings?.currency ?? 'USD'}</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold">
              <Link to="/trips" className="text-sky-600">My trips</Link>
              <Link to="/wishlist" className="text-sky-600">Wishlist</Link>
              <button
                type="button"
                onClick={() => downloadUserData(user)}
                className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700"
              >
                <Download size={14} aria-hidden="true" />
                Download my data
              </button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}