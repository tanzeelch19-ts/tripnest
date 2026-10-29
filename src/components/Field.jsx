import { forwardRef, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

const inputBase =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white'

export const inputClass = `mt-1.5 ${inputBase}`

export const buttonClass =
  'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:cursor-not-allowed disabled:opacity-60'

const iconPos = 'pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400'

export default function Field({ label, error, children }) {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-sm text-red-600">
          {error}
        </span>
      )}
    </label>
  )
}

// Text input with a leading icon. Works with react-hook-form's register().
export const IconInput = forwardRef(function IconInput({ icon: Icon, ...props }, ref) {
  return (
    <span className="relative mt-1.5 block">
      {Icon && <Icon size={18} aria-hidden="true" className={iconPos} />}
      <input ref={ref} className={`${inputBase} ${Icon ? 'pl-11' : ''}`} {...props} />
    </span>
  )
})

// Password input with a lock icon and a show/hide toggle.
export const PasswordInput = forwardRef(function PasswordInput(props, ref) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative mt-1.5 block">
      <Lock size={18} aria-hidden="true" className={iconPos} />
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        className={`${inputBase} pr-12 pl-11`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span>
  )
})