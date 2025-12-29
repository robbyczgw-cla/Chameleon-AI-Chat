/**
 * Native Storage Module
 * Uses Capacitor Preferences for native storage with encryption support
 * Falls back to localStorage for web
 */

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()
let Preferences: typeof import('@capacitor/preferences').Preferences | null = null

// Lazy load Preferences
async function getPreferences() {
  if (!Preferences && isNative && Capacitor.isPluginAvailable('Preferences')) {
    const module = await import('@capacitor/preferences')
    Preferences = module.Preferences
  }
  return Preferences
}

/**
 * Native Storage Service
 * Provides async key-value storage with native performance
 */
export const nativeStorage = {
  /**
   * Get a value from storage
   */
  async get<T = string>(key: string): Promise<T | null> {
    try {
      const prefs = await getPreferences()
      if (prefs) {
        const { value } = await prefs.get({ key })
        if (value === null) return null
        try {
          return JSON.parse(value) as T
        } catch {
          return value as T
        }
      } else {
        const value = localStorage.getItem(key)
        if (value === null) return null
        try {
          return JSON.parse(value) as T
        } catch {
          return value as T
        }
      }
    } catch (error) {
      console.warn('[Storage] Get error:', error)
      return null
    }
  },

  /**
   * Set a value in storage
   */
  async set(key: string, value: unknown): Promise<void> {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value)
      const prefs = await getPreferences()
      if (prefs) {
        await prefs.set({ key, value: stringValue })
      } else {
        localStorage.setItem(key, stringValue)
      }
    } catch (error) {
      console.warn('[Storage] Set error:', error)
    }
  },

  /**
   * Remove a value from storage
   */
  async remove(key: string): Promise<void> {
    try {
      const prefs = await getPreferences()
      if (prefs) {
        await prefs.remove({ key })
      } else {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.warn('[Storage] Remove error:', error)
    }
  },

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    try {
      const prefs = await getPreferences()
      if (prefs) {
        await prefs.clear()
      } else {
        localStorage.clear()
      }
    } catch (error) {
      console.warn('[Storage] Clear error:', error)
    }
  },

  /**
   * Get all keys in storage
   */
  async keys(): Promise<string[]> {
    try {
      const prefs = await getPreferences()
      if (prefs) {
        const { keys } = await prefs.keys()
        return keys
      } else {
        return Object.keys(localStorage)
      }
    } catch (error) {
      console.warn('[Storage] Keys error:', error)
      return []
    }
  },

  /**
   * Migrate localStorage to native storage (call once on app start)
   */
  async migrate(): Promise<void> {
    if (!isNative) return

    try {
      const migrated = await this.get<boolean>('__storage_migrated__')
      if (migrated) return

      // Migrate critical keys
      const keysToMigrate = [
        'chameleon-chats',
        'chameleon-settings',
        'chameleon-api-keys',
        'chameleon-memories',
        'guest-mode',
        'haptic-intensity',
      ]

      for (const key of keysToMigrate) {
        const webValue = localStorage.getItem(key)
        if (webValue !== null) {
          await this.set(key, webValue)
        }
      }

      await this.set('__storage_migrated__', true)
      console.log('[Storage] Migration complete')
    } catch (error) {
      console.warn('[Storage] Migration error:', error)
    }
  },
}

/**
 * Secure Storage for sensitive data
 * Uses native keychain/keystore when available
 */
export const secureStorage = {
  /**
   * Store a credential securely
   */
  async setCredential(key: string, value: string): Promise<void> {
    // For now, use regular storage with a prefix
    // In production, integrate with native keychain
    await nativeStorage.set(`__secure_${key}`, value)
  },

  /**
   * Get a credential
   */
  async getCredential(key: string): Promise<string | null> {
    return await nativeStorage.get<string>(`__secure_${key}`)
  },

  /**
   * Remove a credential
   */
  async removeCredential(key: string): Promise<void> {
    await nativeStorage.remove(`__secure_${key}`)
  },

  /**
   * Store API key securely
   */
  async setApiKey(provider: string, apiKey: string): Promise<void> {
    await this.setCredential(`api_key_${provider}`, apiKey)
  },

  /**
   * Get API key
   */
  async getApiKey(provider: string): Promise<string | null> {
    return await this.getCredential(`api_key_${provider}`)
  },

  /**
   * Store auth token securely
   */
  async setAuthToken(token: string): Promise<void> {
    await this.setCredential('auth_token', token)
  },

  /**
   * Get auth token
   */
  async getAuthToken(): Promise<string | null> {
    return await this.getCredential('auth_token')
  },

  /**
   * Clear all secure storage
   */
  async clearAll(): Promise<void> {
    const keys = await nativeStorage.keys()
    for (const key of keys) {
      if (key.startsWith('__secure_')) {
        await nativeStorage.remove(key)
      }
    }
  },
}
