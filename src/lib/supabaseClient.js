import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True when the app has real Supabase credentials. When false we surface a
 * friendly setup notice instead of throwing cryptic network errors — helpful
 * while the project is still being wired up.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.warn(
    'Tornasol: Supabase is not configured yet. Copy .env.example to .env and ' +
      'add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    auth: {
      // Persist the session indefinitely so a home-screen PWA rarely shows login.
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'tornasol-auth',
    },
  }
)

// Dev-only: expose the client for debugging from the browser console.
if (import.meta.env.DEV) {
  window.supabase = supabase
}
