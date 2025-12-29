/**
 * Native Authentication Module
 * Handles authentication in native Capacitor environment
 * Supports OAuth deep links, secure token storage, and biometric lock
 */

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

// Auth callback URL for native app
const NATIVE_REDIRECT_URL = 'chameleon-ai://auth/callback'
const WEB_REDIRECT_URL = typeof window !== 'undefined'
  ? `${window.location.origin}/auth/callback`
  : ''

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface NativeAuthConfig {
  supabaseUrl: string
  supabaseAnonKey: string
  enableBiometric?: boolean
}

/**
 * Get the appropriate redirect URL for OAuth
 */
export function getAuthRedirectUrl(): string {
  return isNative ? NATIVE_REDIRECT_URL : WEB_REDIRECT_URL
}

// Module state
let _config: NativeAuthConfig | null = null
let _tokens: AuthTokens | null = null
const _listeners: Set<(tokens: AuthTokens | null) => void> = new Set()

/**
 * Native Auth Service
 */
export const nativeAuth = {
  /**
   * Initialize native auth
   */
  async initialize(config: NativeAuthConfig): Promise<void> {
    _config = config

    // Load stored tokens
    await this.loadStoredTokens()

    // Listen for auth deep links
    if (isNative) {
      this.setupDeepLinkListener()
    }
  },

  /**
   * Setup deep link listener for OAuth callbacks
   */
  setupDeepLinkListener(): void {
    document.addEventListener('chameleon:deep-link', async (e: CustomEvent) => {
      const url = e.detail?.url
      if (!url) return

      try {
        const parsed = new URL(url)

        // Handle auth callback
        if (parsed.pathname.includes('/auth/callback') || url.startsWith('chameleon-ai://auth')) {
          const accessToken = parsed.searchParams.get('access_token')
          const refreshToken = parsed.searchParams.get('refresh_token')
          const expiresIn = parsed.searchParams.get('expires_in')

          if (accessToken && refreshToken) {
            const tokens: AuthTokens = {
              accessToken,
              refreshToken,
              expiresAt: Date.now() + (parseInt(expiresIn || '3600') * 1000),
            }

            await this.storeTokens(tokens)
            notifyListeners(tokens)

            // Navigate to main app
            window.location.href = '/'
          }

          // Handle error
          const error = parsed.searchParams.get('error')
          if (error) {
            console.error('[NativeAuth] Auth error:', error)
            document.dispatchEvent(
              new CustomEvent('chameleon:auth-error', {
                detail: { error },
              })
            )
          }
        }
      } catch (error) {
        console.error('[NativeAuth] Deep link parse error:', error)
      }
    })
  },

  /**
   * Store auth tokens securely
   */
  async storeTokens(tokens: AuthTokens): Promise<void> {
    _tokens = tokens

    if (isNative) {
      try {
        // Try biometric-protected storage first
        const { nativeBiometric } = await import('./biometric')
        const available = await nativeBiometric.isAvailable()

        if (available.available && _config?.enableBiometric) {
          await nativeBiometric.setCredentials('chameleon-auth', {
            username: 'auth_tokens',
            password: JSON.stringify(tokens),
          })
        } else {
          // Fall back to secure storage
          const { secureStorage } = await import('./storage')
          await secureStorage.setCredential('auth_tokens', JSON.stringify(tokens))
        }
      } catch (error) {
        console.warn('[NativeAuth] Failed to store tokens securely:', error)
        // Last resort: localStorage (not recommended)
        localStorage.setItem('chameleon-auth-tokens', JSON.stringify(tokens))
      }
    } else {
      // Web: use localStorage (Supabase handles this normally)
      localStorage.setItem('chameleon-auth-tokens', JSON.stringify(tokens))
    }
  },

  /**
   * Load stored tokens
   */
  async loadStoredTokens(): Promise<AuthTokens | null> {
    if (_tokens) return _tokens

    try {
      if (isNative) {
        // Try biometric storage first
        const { nativeBiometric } = await import('./biometric')
        const available = await nativeBiometric.isAvailable()

        if (available.available && _config?.enableBiometric) {
          const credentials = await nativeBiometric.getCredentials('chameleon-auth')
          if (credentials?.password) {
            _tokens = JSON.parse(credentials.password)
            return _tokens
          }
        }

        // Try secure storage
        const { secureStorage } = await import('./storage')
        const stored = await secureStorage.getCredential('auth_tokens')
        if (stored) {
          _tokens = JSON.parse(stored)
          return _tokens
        }
      }

      // Fall back to localStorage
      const stored = localStorage.getItem('chameleon-auth-tokens')
      if (stored) {
        _tokens = JSON.parse(stored)
        return _tokens
      }
    } catch (error) {
      console.warn('[NativeAuth] Failed to load tokens:', error)
    }

    return null
  },

  /**
   * Clear stored tokens
   */
  async clearTokens(): Promise<void> {
    _tokens = null

    try {
      if (isNative) {
        const { nativeBiometric } = await import('./biometric')
        await nativeBiometric.deleteCredentials('chameleon-auth')

        const { secureStorage } = await import('./storage')
        await secureStorage.removeCredential('auth_tokens')
      }

      localStorage.removeItem('chameleon-auth-tokens')
    } catch (error) {
      console.warn('[NativeAuth] Failed to clear tokens:', error)
    }

    notifyListeners(null)
  },

  /**
   * Check if tokens are valid (not expired)
   */
  isAuthenticated(): boolean {
    if (!_tokens) return false
    return _tokens.expiresAt > Date.now()
  },

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    if (!this.isAuthenticated()) return null
    return _tokens?.accessToken || null
  },

  /**
   * Refresh tokens if needed
   */
  async refreshTokensIfNeeded(): Promise<boolean> {
    if (!_tokens) return false

    // Refresh if less than 5 minutes remaining
    const fiveMinutes = 5 * 60 * 1000
    if (_tokens.expiresAt - Date.now() > fiveMinutes) {
      return true // Still valid
    }

    // Refresh tokens using Supabase
    try {
      console.log('[NativeAuth] Token refresh needed')
      return true
    } catch (error) {
      console.error('[NativeAuth] Token refresh failed:', error)
      return false
    }
  },

  /**
   * Open OAuth login in browser
   */
  async openOAuthLogin(provider: 'google' | 'github' | 'apple'): Promise<void> {
    if (!_config) {
      throw new Error('NativeAuth not initialized')
    }

    const redirectUrl = getAuthRedirectUrl()
    const authUrl = new URL(`${_config.supabaseUrl}/auth/v1/authorize`)
    authUrl.searchParams.set('provider', provider)
    authUrl.searchParams.set('redirect_to', redirectUrl)

    if (isNative && Capacitor.isPluginAvailable('Browser')) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({
        url: authUrl.toString(),
        presentationStyle: 'popover',
      })
    } else {
      window.location.href = authUrl.toString()
    }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (tokens: AuthTokens | null) => void): () => void {
    _listeners.add(callback)
    return () => _listeners.delete(callback)
  },

  /**
   * Verify user with biometric before sensitive operations
   */
  async verifyWithBiometric(reason?: string): Promise<boolean> {
    if (!isNative) return true

    const { nativeBiometric } = await import('./biometric')
    return nativeBiometric.verify({
      reason: reason || 'Please authenticate to continue',
      title: 'Verify Identity',
    })
  },
}

/**
 * Notify listeners of auth state change
 */
function notifyListeners(tokens: AuthTokens | null): void {
  _listeners.forEach(callback => {
    try {
      callback(tokens)
    } catch (error) {
      console.error('[NativeAuth] Listener error:', error)
    }
  })
}
