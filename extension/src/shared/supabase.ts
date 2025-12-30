/**
 * Supabase client for browser extension
 * Connects to the same Supabase instance as the main app
 *
 * NOTE: Supabase auth is optional. The extension works with just API keys.
 * Configure Supabase via:
 * 1. Environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) at build time
 * 2. Extension settings (Advanced Settings section) at runtime
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { getStorage, setStorage, getSettings } from "./storage"

// Build-time environment variables (from .env file)
const ENV_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ""
const ENV_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ""

let supabaseClient: SupabaseClient | null = null
let currentSupabaseUrl: string = ""
let currentSupabaseKey: string = ""

/**
 * Check if URL/key are valid Supabase credentials
 */
function isValidSupabaseConfig(url?: string, key?: string): boolean {
  return !!(
    url && key &&
    url.includes("supabase") &&
    !url.includes("your-project") &&
    !key.includes("your-anon-key") &&
    key.length > 20
  )
}

/**
 * Get Supabase config - checks env vars first, then settings
 */
async function getSupabaseConfig(): Promise<{ url: string; key: string }> {
  // First check if env vars are configured
  if (isValidSupabaseConfig(ENV_SUPABASE_URL, ENV_SUPABASE_ANON_KEY)) {
    return { url: ENV_SUPABASE_URL, key: ENV_SUPABASE_ANON_KEY }
  }

  // Fall back to settings
  const settings = await getSettings()
  return {
    url: settings?.supabaseUrl || "",
    key: settings?.supabaseAnonKey || "",
  }
}

/**
 * Get or create Supabase client
 * Returns null if Supabase is not configured
 */
export async function getSupabaseAsync(): Promise<SupabaseClient | null> {
  const { url, key } = await getSupabaseConfig()

  if (!isValidSupabaseConfig(url, key)) {
    return null
  }

  // Recreate client if credentials changed
  if (supabaseClient && (url !== currentSupabaseUrl || key !== currentSupabaseKey)) {
    supabaseClient = null
  }

  if (!supabaseClient) {
    currentSupabaseUrl = url
    currentSupabaseKey = key
    supabaseClient = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: {
          // Use extension storage for session persistence
          getItem: async (k) => {
            const data = await getStorage<string>(k)
            return data
          },
          setItem: async (k, value) => {
            await setStorage(k, value)
          },
          removeItem: async (k) => {
            await setStorage(k, null)
          },
        },
      },
    })
  }
  return supabaseClient
}

/**
 * Synchronous version - returns cached client or null
 */
export function getSupabase(): SupabaseClient | null {
  return supabaseClient
}

/**
 * Check if Supabase is available (async check)
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  const { url, key } = await getSupabaseConfig()
  return isValidSupabaseConfig(url, key)
}

/**
 * Get current authenticated user
 * Returns null if Supabase is not configured or user is not logged in
 */
export async function getCurrentUser() {
  const supabase = await getSupabaseAsync()
  if (!supabase) {
    return null
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      // Don't log auth session missing errors - they're expected when not logged in
      if (!error.message?.includes("session missing")) {
        console.error("[Supabase] Error getting user:", error)
      }
      return null
    }
    return user
  } catch (e) {
    // Network errors are expected when Supabase isn't reachable
    return null
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const supabase = await getSupabaseAsync()
  if (!supabase) {
    throw new Error("Supabase is not configured. Add Supabase URL and key in Advanced Settings.")
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) {
    throw error
  }
  return data
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = await getSupabaseAsync()
  if (!supabase) {
    return // No-op if Supabase isn't configured
  }

  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

/**
 * Get user settings from Supabase
 */
export async function getUserSettings(userId: string) {
  const supabase = await getSupabaseAsync()
  if (!supabase) {
    return null
  }

  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (error) {
    console.error("[Supabase] Error fetching settings:", error)
    return null
  }
  return data
}

/**
 * Listen for auth state changes
 */
export async function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const supabase = await getSupabaseAsync()
  if (!supabase) {
    // Return a no-op unsubscribe function
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
  return supabase.auth.onAuthStateChange(callback)
}
