import { createClient } from '@supabase/supabase-js'

// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (and in your hosting dashboard).
// When these are empty, the app uses a local demo account system instead.
const url = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

export const isSupabaseConfigured = Boolean(url && anonKey)
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null