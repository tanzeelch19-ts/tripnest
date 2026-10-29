import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Compass, Heart, Mail, ShieldCheck } from 'lucide-react'
import Field, { IconInput, PasswordInput, buttonClass } from '../components/Field'
import { useAuth } from '../context/Authcontext'

const schema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

const PERKS = [
  { icon: Compass, title: 'Stays in real places', text: 'Browse homes, villas and riads from around the world.' },
  { icon: Heart, title: 'Save your favourites', text: 'Keep a wishlist and come back to it on any device.' },
  { icon: ShieldCheck, title: 'Your account is private', text: 'Only you can see your profile and preferences.' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (values) => {
    setServerError('')
    try {
      await login(values)
      navigate('/', { replace: true })
    } catch (err) {
      setServerError(err.message)
    }
  }

  return (
    <section className="container grid items-center gap-10 py-12 lg:min-h-[70vh] lg:grid-cols-2 lg:py-16">
      <div className="hidden rounded-3xl bg-linear-to-br from-sky-600 via-sky-700 to-indigo-800 p-10 text-white lg:block">
        <p className="text-sm font-semibold tracking-[0.2em] text-white/70 uppercase">TripNest</p>
        <h2 className="mt-4 text-4xl leading-tight font-bold">Find a place to land.</h2>
        <ul className="mt-10 space-y-6">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="block text-sm text-white/75">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto w-full max-w-md">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Sign in</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Welcome back. Enter your details to continue.</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
          <Field label="Email" error={errors.email?.message}>
            <IconInput icon={Mail} type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <PasswordInput autoComplete="current-password" placeholder="Your password" {...register('password')} />
          </Field>

          {serverError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className={buttonClass}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          New to TripNest?{' '}
          <Link to="/register" className="font-semibold text-sky-600 hover:text-sky-700">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  )
}