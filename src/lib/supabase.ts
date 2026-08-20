import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(url && anonKey)

const REMEMBER_KEY = 'effectio.auth.remember'

export function setRememberMe(remember: boolean): void {
  localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false')
}

export function getRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_KEY) !== 'false'
}

/** Routes the auth session to localStorage (persist) or sessionStorage (browser session only). */
const authStorage = {
  getItem(key: string): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key)
  },
  setItem(key: string, value: string): void {
    if (getRememberMe()) {
      localStorage.setItem(key, value)
      sessionStorage.removeItem(key)
    } else {
      sessionStorage.setItem(key, value)
      localStorage.removeItem(key)
    }
  },
  removeItem(key: string): void {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: authStorage,
      },
    })
  : null
