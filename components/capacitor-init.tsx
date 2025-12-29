'use client'

import { useEffect, useRef } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Capacitor Initialization Component
 * Initializes all native capabilities when running in Capacitor
 * Must be placed near the root of the app
 */
export function CapacitorInit() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const init = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.log('[Capacitor] Running in web mode')
        return
      }

      console.log('[Capacitor] Initializing native features...')

      try {
        // Import and initialize main Capacitor module
        const { initializeCapacitor } = await import('@/lib/capacitor')
        await initializeCapacitor()

        // Migrate localStorage to native storage
        const { nativeStorage } = await import('@/lib/capacitor/storage')
        await nativeStorage.migrate()

        // Initialize notifications
        const { nativeNotifications } = await import('@/lib/capacitor/notifications')
        await nativeNotifications.initialize()

        // Request notification permissions
        const permission = await nativeNotifications.checkPermissions()
        if (permission === 'prompt') {
          await nativeNotifications.requestPermissions()
        }

        // Initialize network monitoring
        const { nativeNetwork } = await import('@/lib/capacitor/network')
        await nativeNetwork.initialize()

        // Initialize keyboard handling
        const { nativeKeyboard } = await import('@/lib/capacitor/keyboard')
        await nativeKeyboard.initialize()

        // Initialize theme management
        const { nativeTheme } = await import('@/lib/capacitor/theme')
        nativeTheme.initialize()

        // Initialize TTS
        const { nativeTTS } = await import('@/lib/capacitor/tts')
        await nativeTTS.initialize()

        // Hide splash screen after initialization
        if (Capacitor.isPluginAvailable('SplashScreen')) {
          const { SplashScreen } = await import('@capacitor/splash-screen')
          await SplashScreen.hide({ fadeOutDuration: 500 })
        }

        // Setup deep link handling
        setupDeepLinkHandling()

        // Setup back button handling for Android
        setupBackButtonHandling()

        console.log('[Capacitor] Native features initialized successfully')
      } catch (error) {
        console.error('[Capacitor] Initialization error:', error)
      }
    }

    init()
  }, [])

  return null
}

/**
 * Setup deep link handling for authentication and share targets
 */
function setupDeepLinkHandling() {
  document.addEventListener('capacitor:deeplink', (e: any) => {
    const url = e.detail?.url
    if (!url) return

    console.log('[Capacitor] Deep link received:', url)

    try {
      const parsed = new URL(url)

      // Handle auth callbacks
      if (parsed.pathname.includes('/auth/callback')) {
        window.location.href = parsed.pathname + parsed.search
        return
      }

      // Handle share intents
      if (parsed.pathname.includes('/share')) {
        window.location.href = parsed.pathname + parsed.search
        return
      }

      // Handle custom protocol (web+chameleon://)
      if (url.startsWith('web+chameleon://')) {
        const action = url.replace('web+chameleon://', '')
        handleCustomProtocol(action)
        return
      }

      // Default: navigate to the path
      if (parsed.pathname && parsed.pathname !== '/') {
        window.location.href = parsed.pathname + parsed.search
      }
    } catch (error) {
      console.warn('[Capacitor] Failed to parse deep link:', error)
    }
  })
}

/**
 * Handle custom protocol actions
 */
function handleCustomProtocol(action: string) {
  switch (action) {
    case 'new-chat':
      window.dispatchEvent(new CustomEvent('chameleon:new-chat'))
      break
    case 'simple-mode':
      window.dispatchEvent(new CustomEvent('chameleon:mode-change', { detail: 'simple' }))
      break
    case 'debate-mode':
      window.dispatchEvent(new CustomEvent('chameleon:mode-change', { detail: 'debate' }))
      break
    default:
      console.log('[Capacitor] Unknown protocol action:', action)
  }
}

/**
 * Setup back button handling for Android
 */
async function setupBackButtonHandling() {
  if (!Capacitor.isPluginAvailable('App')) return

  const { App } = await import('@capacitor/app')

  // Track navigation state
  let canGoBack = false

  // Update canGoBack based on history state
  window.addEventListener('popstate', () => {
    canGoBack = window.history.length > 1
  })

  // Listen for Android back button
  App.addListener('backButton', async () => {
    // First, try to close any open dialogs/modals
    const closeEvent = new CustomEvent('chameleon:close-dialog')
    const handled = document.dispatchEvent(closeEvent)

    if (handled) return

    // Then try normal navigation
    if (window.history.length > 1) {
      window.history.back()
    } else {
      // Confirm exit
      const { Dialog } = await import('@capacitor/dialog')
      const { value } = await Dialog.confirm({
        title: 'Exit App',
        message: 'Are you sure you want to exit Chameleon AI?',
        okButtonTitle: 'Exit',
        cancelButtonTitle: 'Stay',
      })

      if (value) {
        App.exitApp()
      }
    }
  })
}

export default CapacitorInit
