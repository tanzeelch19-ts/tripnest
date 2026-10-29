import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, ShieldCheck, User } from 'lucide-react'
import Field, { IconInput, PasswordInput, buttonClass } from '../components/Field'
import { useAuth } from '../context/Authcontext'

const schema = z
  .object({
    name: z.string().trim().min(2, 'Enter your name.'),
    email: z.string().trim().email('Enter a valid email address.'),
    password: z.string().min(8, 'Use at least 8 characters.'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ['confirm'],
    message: 'Passwords do not match.',
  })

// Scores 0 to 4 from length and character variety.
function passwordScore(pw = '') {
  let score = 0
  if (pw.length >= 8) score++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}
const STRENGTH = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const BAR_COLORS = ['bg-red-500', 'bg-amber-500', 'bg-amber-400', 'bg-emerald-500']

export default function RegisterPage() {
  const { register: createAccount } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const password = watch('password')
  const score = passwordScore(password)

  const onSubmit = async ({ name, email, password }) => {
    setServerError('')
    try {
      await createAccount({ name, email, password })
      navigate('/profile', { replace: true })
    } catch (err) {
      setServerError(err.message)
    }
  }

  return (
    <section className="container grid items-center gap-10 py-12 lg:min-h-[70vh] lg:grid-cols-2 lg:py-16">
      <div className="hidden rounded-3xl bg-linear-to-br from-indigo-700 via-sky-700 to-sky-600 p-10 text-white lg:block">
        <p className="text-sm font-semibold tracking-[0.2em] text-white/70 uppercase">Join TripNest</p>
        <h2 className="mt-4 text-4xl leading-tight font-bold">Your trips, in one place.</h2>
        <ul className="mt-10 space-y-6">
          <li className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <User size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block font-semibold">A profile that is yours</span>
              <span className="block text-sm text-white/75">Update your details and preferences whenever you like.</span>
            </span>
          </li>
          <li className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <ShieldCheck size={20} aria-hidden="true" />
            </span>
            <span>
              <span className="block font-semibold">Secure by default</span>
              <span className="block text-sm text-white/75">Use a strong password. We never show it back to you.</span>
            </span>
          </li>
        </ul>
      </div>

      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Create your account</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">It takes less than a minute.</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
          <Field label="Full name" error={errors.name?.message}>
            <IconInput icon={User} autoComplete="name" placeholder="Your name" {...register('name')} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <IconInput icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <PasswordInput autoComplete="new-password" placeholder="At least 8 characters" {...register('password')} />
          </Field>

          {password && (
            <div className="-mt-2" aria-live="polite">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <span
                    key={n}
                    className={`h-1.5 flex-1 rounded-full ${score >= n ? BAR_COLORS[score - 1] : 'bg-slate-200 dark:bg-slate-800'}`}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Strength: {STRENGTH[score]}</p>
            </div>
          )}

          <Field label="Confirm password" error={errors.confirm?.message}>
            <PasswordInput autoComplete="new-password" placeholder="Type it again" {...register('confirm')} />
          </Field>

          {serverError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className={buttonClass}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-sky-600 hover:text-sky-700">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  )
}