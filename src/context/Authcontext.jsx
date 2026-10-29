import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { isSupabaseConfigured, supabase } from '../services/supabase'

const AuthContext = createContext(null)
const ACCOUNTS_KEY = 'tripnest-accounts'
const SESSION_KEY = 'tripnest-session'
const DEFAULT_SETTINGS = { currency: 'USD', emailUpdates: true, dealAlerts: false }

const merge = (account, changes) => ({
  ...account,
  ...changes,
  settings: { ...account.settings, ...changes.settings },
})

/* ------------------------------------------------------------------ */
/* Live accounts: Supabase Auth + the profiles table (see supabase/schema.sql) */
/* ------------------------------------------------------------------ */

function SupabaseAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async (session) => {
    if (!session?.user) {
      setUser(null)
      return
    }
    const { data: row } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
    setUser({
      id: session.user.id,
      email: session.user.email,
      createdAt: session.user.created_at,
      name: row?.name ?? session.user.user_metadata?.name ?? '',
      phone: row?.phone ?? '',
      bio: row?.bio ?? '',
      settings: {
        currency: row?.currency ?? 'USD',
        emailUpdates: row?.email_updates ?? true,
        dealAlerts: row?.deal_alerts ?? false,
      },
    })
  }, [])

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => loadUser(data.session))
      .finally(() => setLoading(false))
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session)
    })
    return () => data.subscription.unsubscribe()
  }, [loadUser])

  const register = useCallback(
    async ({ name, email, password }) => {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      })
      if (error) throw new Error(error.message)
      if (!data.session) throw new Error('We sent a confirmation link to your email. Confirm it, then sign in.')
      await loadUser(data.session)
    },
    [loadUser],
  )

  const login = useCallback(
    async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw new Error('Email or password is incorrect.')
      await loadUser(data.session)
    },
    [loadUser],
  )

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  const updateAccount = useCallback(
    async (changes) => {
      if (!user) return
      const row = {}
      if (changes.name !== undefined) row.name = changes.name
      if (changes.phone !== undefined) row.phone = changes.phone
      if (changes.bio !== undefined) row.bio = changes.bio
      if (changes.settings?.currency !== undefined) row.currency = changes.settings.currency
      if (changes.settings?.emailUpdates !== undefined) row.email_updates = changes.settings.emailUpdates
      if (changes.settings?.dealAlerts !== undefined) row.deal_alerts = changes.settings.dealAlerts
      const { error } = await supabase.from('profiles').update(row).eq('id', user.id)
      if (error) throw new Error('Could not save your changes. Please try again.')
      setUser((prev) => merge(prev, changes))
    },
    [user],
  )

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), register, login, logout, updateAccount }),
    [user, loading, register, login, logout, updateAccount],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ------------------------------------------------------------------ */
/* Local demo accounts (used only when Supabase is not configured).   */
/* Passwords are stored in plain text in this browser. Development only. */
/* ------------------------------------------------------------------ */

const load = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}
const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage blocked or full */
  }
}
const toSession = ({ password, ...account }) => account

function LocalAuthProvider({ children }) {
  const [accounts, setAccounts] = useState(() => load(ACCOUNTS_KEY, []))
  const [user, setUser] = useState(() => load(SESSION_KEY, null))

  useEffect(() => save(ACCOUNTS_KEY, accounts), [accounts])
  useEffect(() => save(SESSION_KEY, user), [user])

  const register = useCallback(
    async ({ name, email, password }) => {
      const address = email.trim().toLowerCase()
      if (accounts.some((a) => a.email === address)) {
        throw new Error('An account with this email already exists.')
      }
      const account = {
        id: crypto.randomUUID(),
        name: name.trim(),
        email: address,
        password,
        phone: '',
        bio: '',
        settings: { ...DEFAULT_SETTINGS },
        createdAt: new Date().toISOString(),
      }
      setAccounts((prev) => [...prev, account])
      setUser(toSession(account))
    },
    [accounts],
  )

  const login = useCallback(
    async ({ email, password }) => {
      const address = email.trim().toLowerCase()
      const account = accounts.find((a) => a.email === address && a.password === password)
      if (!account) throw new Error('Email or password is incorrect.')
      setUser(toSession(account))
    },
    [accounts],
  )

  const logout = useCallback(async () => setUser(null), [])

  const updateAccount = useCallback(
    async (changes) => {
      if (!user) return
      setAccounts((prev) => prev.map((a) => (a.id === user.id ? merge(a, changes) : a)))
      setUser((prev) => merge(prev, changes))
    },
    [user],
  )

  const value = useMemo(
    () => ({ user, loading: false, isAuthenticated: Boolean(user), register, login, logout, updateAccount }),
    [user, register, login, logout, updateAccount],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }) {
  return isSupabaseConfigured ? (
    <SupabaseAuthProvider>{children}</SupabaseAuthProvider>
  ) : (
    <LocalAuthProvider>{children}</LocalAuthProvider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}