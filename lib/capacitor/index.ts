/**
 * Capacitor Native Bridge
 * Central module for all Capacitor native functionality
 * Provides graceful fallbacks for web/PWA environments
 */

import { Capacitor } from '@capacitor/core'

// Re-export platform detection
export const isNative = Capacitor.isNativePlatform()
export const isAndroid = Capacitor.getPlatform() === 'android'
export const isIOS = Capacitor.getPlatform() === 'ios'
export const isWeb = Capacitor.getPlatform() === 'web'

// Feature detection
export const isPluginAvailable = (pluginName: string): boolean => {
  return Capacitor.isPluginAvailable(pluginName)
}

// Get the web view server URL (for native) or window origin (for web)
export const getServerUrl = (): string => {
  if (isNative) {
    // In native, we use the configured server URL
    return process.env.NEXT_PUBLIC_API_URL || 'https://chameleon-ai.vercel.app'
  }
  return typeof window !== 'undefined' ? window.location.origin : ''
}

// Convert relative API paths to absolute when in native mode
export const getApiUrl = (path: string): string => {
  if (isNative) {
    const baseUrl = getServerUrl()
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
  }
  return path
}

/**
 * Initialize Capacitor plugins and native features
 * Call this once at app startup
 */
export const initializeCapacitor = async (): Promise<void> => {
  if (!isNative) return

  try {
    // Initialize plugins in parallel
    await Promise.all([
      initializeStatusBar(),
      initializeSplashScreen(),
      initializeKeyboard(),
      initializeApp(),
      initializeNetwork(),
    ])

    console.log('[Capacitor] Native features initialized')
  } catch (error) {
    console.error('[Capacitor] Initialization error:', error)
  }
}

/**
 * Status Bar Configuration
 */
async function initializeStatusBar(): Promise<void> {
  if (!isPluginAvailable('StatusBar')) return

  const { StatusBar, Style } = await import('@capacitor/status-bar')

  try {
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#0a0a0a' })

    if (isAndroid) {
      await StatusBar.setOverlaysWebView({ overlay: false })
    }
  } catch (error) {
    console.warn('[Capacitor] StatusBar error:', error)
  }
}

/**
 * Splash Screen Configuration
 */
async function initializeSplashScreen(): Promise<void> {
  if (!isPluginAvailable('SplashScreen')) return

  const { SplashScreen } = await import('@capacitor/splash-screen')

  try {
    // Splash will auto-hide based on config, but we can manually hide after init
    await SplashScreen.hide({
      fadeOutDuration: 500,
    })
  } catch (error) {
    console.warn('[Capacitor] SplashScreen error:', error)
  }
}

/**
 * Keyboard Configuration
 */
async function initializeKeyboard(): Promise<void> {
  if (!isPluginAvailable('Keyboard')) return

  const { Keyboard } = await import('@capacitor/keyboard')

  try {
    // Configure keyboard behavior
    await Keyboard.setResizeMode({ mode: 'body' as any })

    // Listen for keyboard events
    Keyboard.addListener('keyboardWillShow', (info) => {
      document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`)
      document.body.classList.add('keyboard-visible')
    })

    Keyboard.addListener('keyboardWillHide', () => {
      document.body.style.setProperty('--keyboard-height', '0px')
      document.body.classList.remove('keyboard-visible')
    })
  } catch (error) {
    console.warn('[Capacitor] Keyboard error:', error)
  }
}

/**
 * App Lifecycle Management
 */
async function initializeApp(): Promise<void> {
  if (!isPluginAvailable('App')) return

  const { App } = await import('@capacitor/app')

  try {
    // Handle back button on Android
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back()
      } else {
        // Ask user if they want to exit
        App.exitApp()
      }
    })

    // Handle app state changes
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App came to foreground
        document.dispatchEvent(new CustomEvent('capacitor:resume'))
      } else {
        // App went to background
        document.dispatchEvent(new CustomEvent('capacitor:pause'))
      }
    })

    // Handle deep links
    App.addListener('appUrlOpen', ({ url }) => {
      console.log('[Capacitor] Deep link:', url)
      document.dispatchEvent(new CustomEvent('capacitor:deeplink', { detail: { url } }))
    })
  } catch (error) {
    console.warn('[Capacitor] App error:', error)
  }
}

/**
 * Network Status Management
 */
async function initializeNetwork(): Promise<void> {
  if (!isPluginAvailable('Network')) return

  const { Network } = await import('@capacitor/network')

  try {
    // Get initial network status
    const status = await Network.getStatus()
    updateNetworkStatus(status)

    // Listen for network changes
    Network.addListener('networkStatusChange', (status) => {
      updateNetworkStatus(status)
    })
  } catch (error) {
    console.warn('[Capacitor] Network error:', error)
  }
}

function updateNetworkStatus(status: { connected: boolean; connectionType: string }): void {
  document.body.classList.toggle('offline', !status.connected)
  document.dispatchEvent(
    new CustomEvent('capacitor:network', {
      detail: status,
    })
  )
}

// Export sub-modules
export * from './haptics'
export * from './storage'
export * from './share'
export * from './camera'
export * from './notifications'
export * from './biometric'
