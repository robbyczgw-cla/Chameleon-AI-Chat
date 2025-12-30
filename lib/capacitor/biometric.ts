/**
 * Native Biometric Authentication Module
 * Uses capacitor-native-biometric for fingerprint/face authentication
 * Provides secure credential storage with biometric lock
 */

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

export interface BiometricCredentials {
  username: string
  password: string
}

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'multiple' | 'none'

/**
 * Native Biometric Service
 */
export const nativeBiometric = {
  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<{ available: boolean; biometryType: BiometricType }> {
    if (!isNative) {
      return { available: false, biometryType: 'none' }
    }

    try {
      const { NativeBiometric, BiometryType } = await import('capacitor-native-biometric')
      const result = await NativeBiometric.isAvailable()

      let biometryType: BiometricType = 'none'
      switch (result.biometryType) {
        case BiometryType.FINGERPRINT:
          biometryType = 'fingerprint'
          break
        case BiometryType.FACE_AUTHENTICATION:
          biometryType = 'face'
          break
        case BiometryType.IRIS_AUTHENTICATION:
          biometryType = 'iris'
          break
        case BiometryType.MULTIPLE:
          biometryType = 'multiple'
          break
      }

      return {
        available: result.isAvailable,
        biometryType,
      }
    } catch (error) {
      console.warn('[Biometric] Availability check failed:', error)
      return { available: false, biometryType: 'none' }
    }
  },

  /**
   * Verify user with biometric authentication
   */
  async verify(options?: {
    reason?: string
    title?: string
    subtitle?: string
    description?: string
    negativeButtonText?: string
    maxAttempts?: number
  }): Promise<boolean> {
    if (!isNative) return false

    try {
      const { NativeBiometric } = await import('capacitor-native-biometric')

      await NativeBiometric.verifyIdentity({
        reason: options?.reason || 'Authenticate to access Chameleon AI',
        title: options?.title || 'Biometric Login',
        subtitle: options?.subtitle || 'Use your fingerprint or face to continue',
        description: options?.description || '',
        negativeButtonText: options?.negativeButtonText || 'Cancel',
        maxAttempts: options?.maxAttempts || 3,
      })

      return true
    } catch (error: any) {
      // User cancelled or failed
      console.log('[Biometric] Verification failed:', error.message)
      return false
    }
  },

  /**
   * Store credentials securely with biometric protection
   */
  async setCredentials(
    server: string,
    credentials: BiometricCredentials
  ): Promise<boolean> {
    if (!isNative) return false

    try {
      const { NativeBiometric } = await import('capacitor-native-biometric')

      await NativeBiometric.setCredentials({
        server,
        username: credentials.username,
        password: credentials.password,
      })

      return true
    } catch (error) {
      console.warn('[Biometric] Failed to store credentials:', error)
      return false
    }
  },

  /**
   * Retrieve credentials after biometric verification
   */
  async getCredentials(server: string): Promise<BiometricCredentials | null> {
    if (!isNative) return null

    try {
      const { NativeBiometric } = await import('capacitor-native-biometric')

      const credentials = await NativeBiometric.getCredentials({
        server,
      })

      return {
        username: credentials.username,
        password: credentials.password,
      }
    } catch (error) {
      console.warn('[Biometric] Failed to get credentials:', error)
      return null
    }
  },

  /**
   * Delete stored credentials
   */
  async deleteCredentials(server: string): Promise<boolean> {
    if (!isNative) return false

    try {
      const { NativeBiometric } = await import('capacitor-native-biometric')
      await NativeBiometric.deleteCredentials({ server })
      return true
    } catch (error) {
      console.warn('[Biometric] Failed to delete credentials:', error)
      return false
    }
  },

  // Convenience methods for Chameleon AI

  /**
   * Store API key with biometric protection
   */
  async storeApiKey(provider: string, apiKey: string): Promise<boolean> {
    return this.setCredentials(`chameleon-ai-${provider}`, {
      username: provider,
      password: apiKey,
    })
  },

  /**
   * Get API key after biometric verification
   */
  async getApiKey(provider: string): Promise<string | null> {
    const verified = await this.verify({
      reason: `Authenticate to access your ${provider} API key`,
      title: 'Access API Key',
    })

    if (!verified) return null

    const credentials = await this.getCredentials(`chameleon-ai-${provider}`)
    return credentials?.password || null
  },

  /**
   * Store auth session with biometric protection
   */
  async storeAuthSession(userId: string, token: string): Promise<boolean> {
    return this.setCredentials('chameleon-ai-auth', {
      username: userId,
      password: token,
    })
  },

  /**
   * Get auth session after biometric verification
   */
  async getAuthSession(): Promise<{ userId: string; token: string } | null> {
    const verified = await this.verify({
      reason: 'Authenticate to access Chameleon AI',
      title: 'Biometric Login',
    })

    if (!verified) return null

    const credentials = await this.getCredentials('chameleon-ai-auth')
    if (!credentials) return null

    return {
      userId: credentials.username,
      token: credentials.password,
    }
  },

  /**
   * Clear all stored auth data
   */
  async clearAll(): Promise<void> {
    await this.deleteCredentials('chameleon-ai-auth')
    // Add other credential servers as needed
    const providers = ['openrouter', 'tavily', 'serper', 'exa']
    for (const provider of providers) {
      await this.deleteCredentials(`chameleon-ai-${provider}`)
    }
  },
}
