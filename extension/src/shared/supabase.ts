/**
 * Supabase client for browser extension
 * Connects to the same Supabase instance as the main app
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { getStorage, setStorage } from "./storage"

// These should match your main app's Supabase config
// For production, these would come from extension settings or be bundled
const SUPABASE_URL = "https://your-project.supabase.co"
const SUPABASE_ANON_KEY = "your-anon-key"

let supabaseClient: SupabaseClient | null = null

/**
 * Get or create Supabase client
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: {
          // Use extension storage for session persistence
          getItem: async (key) => {
            const data = await getStorage<string>(key)
            return data
          },
          setItem: async (key, value) => {
            await setStorage(key, value)
          },
          removeItem: async (key) => {
            await setStorage(key, null)
          },
        },
      },
    })
  }
  return supabaseClient
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const supabase = getSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error("[Supabase] Error getting user:", error)
    return null
  }
  return user
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const supabase = getSupabase()
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
  const supabase = getSupabase()
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw error
  }
}

/**
 * Get user settings from Supabase
 */
export async function getUserSettings(userId: string) {
  const supabase = getSupabase()
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
export function onAuthStateChange(
  callback: (event: string, session: any) => void
) {
  const supabase = getSupabase()
  return supabase.auth.onAuthStateChange(callback)
}
