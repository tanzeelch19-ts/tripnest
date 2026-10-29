import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bell, Download, Globe, Languages, Mail, RotateCcw, Ruler, Tag } from 'lucide-react'
import { inputClass } from '../components/Field'
import { useAuth } from '../context/Authcontext'

const CURRENCIES = ['USD', 'EUR', 'GBP', 'PKR']
const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'ur', label: 'اردو' },
  { value: 'ar', label: 'العربية' },
]
const UNITS = [
  { value: 'metric', label: 'Metric (km, °C)' },
  { value: 'imperial', label: 'Imperial (mi, °F)' },
]
export const DEFAULT_SETTINGS = {
  currency: 'USD',
  language: 'en',
  units: 'metric',
  emailUpdates: true,
  marketing: false,
  dealAlerts: false,
}

// Downloads the signed-in visitor's profile and preferences as a JSON file.
export function downloadUserData(user) {
  const data = {
    exportedAt: new Date().toISOString(),
    profile: {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      bio: user.bio || '',
      memberSince: user.createdAt,
    },
    settings: { ...DEFAULT_SETTINGS, ...user.settings },
  }
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'tripnest-data.json'
  link.click()
  URL.revokeObjectURL(url)
}

function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
        checked ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : ''
        }`}
      />
    </button>
  )
}

function Select({ label, value, options, onChange }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

function Row({ icon: Icon, title, description, children }) {
  return (
    <div className="flex items-center justify-between gap-6 py-5">
      <div className="flex gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-400">
          <Icon size={20} aria-hidden="true" />
        </span>
        <div>
          <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

// Preferences list, used on the profile page and the settings page.
export function SettingsPanel() {
  const { user, updateAccount } = useAuth()
  const [error, setError] = useState('')
  const settings = { ...DEFAULT_SETTINGS, ...user.settings }
  const save = (changes) => {
    setError('')
    Promise.resolve(updateAccount({ settings: changes })).catch((err) => setError(err.message))
  }

  return (
    <div className="divide-y divide-slate-200 dark:divide-slate-800">
      <Row icon={Globe} title="Currency" description="Used for prices once conversion is added.">
        <Select
          label="Preferred currency"
          value={settings.currency}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          onChange={(v) => save({ currency: v })}
        />
      </Row>
      <Row icon={Languages} title="Language" description="Saved to your account. Full translation is coming soon.">
        <Select label="Language" value={settings.language} options={LANGUAGES} onChange={(v) => save({ language: v })} />
      </Row>
      <Row icon={Ruler} title="Units" description="Distances and temperatures.">
        <Select label="Units" value={settings.units} options={UNITS} onChange={(v) => save({ units: v })} />
      </Row>
      <Row icon={Bell} title="Email updates" description="Booking confirmations and trip reminders.">
        <Switch label="Email updates" checked={Boolean(settings.emailUpdates)} onChange={(v) => save({ emailUpdates: v })} />
      </Row>
      <Row icon={Mail} title="Offers and news" description="Occasional travel ideas and special offers.">
        <Switch label="Offers and news" checked={Boolean(settings.marketing)} onChange={(v) => save({ marketing: v })} />
      </Row>
      <Row icon={Tag} title="Deal alerts" description="Occasional price drops on stays in your wishlist.">
        <Switch label="Deal alerts" checked={Boolean(settings.dealAlerts)} onChange={(v) => save({ dealAlerts: v })} />
      </Row>
      {error && (
        <p role="alert" className="py-4 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { user, updateAccount } = useAuth()
  const [notice, setNotice] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)

  const reset = async () => {
    setBusy(true)
    setNotice({ type: '', text: '' })
    try {
      await updateAccount({ settings: DEFAULT_SETTINGS })
      setNotice({ type: 'ok', text: 'Preferences restored to the defaults.' })
    } catch (err) {
      setNotice({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="container max-w-3xl py-10">
      <Link to="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 hover:text-sky-700">
        <ArrowLeft size={16} aria-hidden="true" />
        Back to profile
      </Link>
      <h1 className="mt-5 text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Manage how TripNest works for you. Changes save instantly.</p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
        <SettingsPanel />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your data</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Download a copy of your details, or restore the default preferences.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => downloadUserData(user)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Download size={16} aria-hidden="true" />
            Download my data
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Restore defaults
          </button>
        </div>
        {notice.text && (
          <p role={notice.type === 'error' ? 'alert' : 'status'} className={`mt-4 text-sm ${notice.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {notice.text}
          </p>
        )}
      </div>
    </section>
  )
}