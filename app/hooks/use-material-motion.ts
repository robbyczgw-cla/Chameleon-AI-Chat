/**
 * Material Motion Hook for Chameleon AI
 * Initializes Material Design animations and 120Hz detection
 */

import { useEffect } from 'react'

declare global {
  interface Window {
    __nativeRefreshRate?: number
    __supports120Hz?: boolean
    __chameleonReady?: boolean
    ChameleonNative?: {
      haptic: (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning') => void
      getDisplayInfo: () => string
      supports120Hz: () => boolean
    }
  }
}

export function useMaterialMotion() {
  useEffect(() => {
    // Initialize Material Motion system
    const init = () => {
      // Detect 120Hz support
      const refreshRate = window.__nativeRefreshRate || 60
      const supports120Hz = window.__supports120Hz || refreshRate >= 115

      // Set data attribute for CSS targeting
      document.documentElement.setAttribute(
        'data-supports-120hz',
        supports120Hz ? 'true' : 'false'
      )

      // Set data attribute for refresh rate
      document.documentElement.setAttribute(
        'data-refresh-rate',
        refreshRate.toString()
      )

      // Log initialization info
      console.log('Material Motion initialized:', {
        refreshRate,
        supports120Hz,
        hasNativeInterface: !!window.ChameleonNative,
      })

      // Signal that the app is ready for native events
      window.__chameleonReady = true

      // Dispatch ready event for Android MainActivity
      window.dispatchEvent(new CustomEvent('chameleon:ready'))
    }

    // Initialize immediately if DOM is ready
    if (document.readyState === 'complete') {
      init()
    } else {
      // Wait for DOM to be ready
      window.addEventListener('load', init)
      return () => window.removeEventListener('load', init)
    }
  }, [])
}

/**
 * Hook to trigger haptic feedback (Android only)
 */
export function useHaptic() {
  return (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') => {
    if (window.ChameleonNative?.haptic) {
      try {
        window.ChameleonNative.haptic(type)
      } catch (error) {
        console.warn('Haptic feedback failed:', error)
      }
    }
  }
}

/**
 * Hook to get display information
 */
export function useDisplayInfo() {
  const refreshRate = window.__nativeRefreshRate || 60
  const supports120Hz = window.__supports120Hz || false

  return {
    refreshRate,
    supports120Hz,
    isHighRefreshRate: refreshRate >= 90,
  }
}
