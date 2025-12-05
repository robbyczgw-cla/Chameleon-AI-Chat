"use client"

import { useEffect, useCallback, useRef } from "react"

/**
 * iOS PWA Optimization Hook
 *
 * Handles iOS PWA-specific issues:
 * 1. App suspension/resume - iOS aggressively suspends PWAs
 * 2. localStorage persistence - can be unreliable on iOS
 * 3. Service worker communication for caching
 * 4. Visibility change handling
 *
 * WHY THIS IS NEEDED:
 * - iOS treats PWAs like disposable apps, killing them aggressively
 * - localStorage can be cleared when device is low on memory
 * - Service worker needs to be kept alive for reliable caching
 */

interface UseIOSPWAOptions {
  onResume?: () => void
  onSuspend?: () => void
  isSimpleMode?: boolean
}

export function useIOSPWA(options: UseIOSPWAOptions = {}) {
  const { onResume, onSuspend, isSimpleMode = false } = options
  const lastActiveRef = useRef(Date.now())
  const isInitializedRef = useRef(false)

  // Detect if running as iOS PWA
  const isIOSPWA = useCallback(() => {
    if (typeof window === "undefined") return false

    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
    const isStandalone = (window.navigator as any).standalone === true ||
                         window.matchMedia("(display-mode: standalone)").matches

    return isIOS && isStandalone
  }, [])

  // Send message to service worker
  const sendToSW = useCallback((type: string, data?: any) => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker?.controller) {
      return
    }

    navigator.serviceWorker.controller.postMessage({ type, ...data })
  }, [])

  // Save critical data before iOS suspends the app
  const persistCriticalData = useCallback(() => {
    if (typeof localStorage === "undefined") return

    try {
      // Save timestamp to detect suspension
      localStorage.setItem("chameleon-last-active", Date.now().toString())

      // Notify service worker
      sendToSW("PERSIST_DATA")

      console.log("[iOS PWA] Critical data persisted before suspension")
    } catch (error) {
      console.error("[iOS PWA] Failed to persist data:", error)
    }
  }, [sendToSW])

  // Check if app was suspended and restored
  const checkResumption = useCallback(() => {
    if (typeof localStorage === "undefined") return false

    const lastActive = localStorage.getItem("chameleon-last-active")
    if (!lastActive) return false

    const lastActiveTime = parseInt(lastActive, 10)
    const timeSinceSuspension = Date.now() - lastActiveTime

    // If more than 30 seconds since last active, consider it a resumption
    if (timeSinceSuspension > 30000) {
      console.log("[iOS PWA] App resumed after", Math.round(timeSinceSuspension / 1000), "seconds")
      return true
    }

    return false
  }, [])

  // Initialize iOS PWA optimizations
  useEffect(() => {
    if (typeof window === "undefined") return
    if (isInitializedRef.current) return
    isInitializedRef.current = true

    const isPWA = isIOSPWA()

    console.log("[iOS PWA] Initialization:", { isIOSPWA: isPWA, isSimpleMode })

    // Initialize simple mode caching if applicable
    if (isSimpleMode) {
      sendToSW("SIMPLE_MODE_INIT")
    }

    // Clear stale caches on startup
    sendToSW("CLEAR_STALE_CACHE")

    // Check if we're resuming from suspension
    if (checkResumption()) {
      sendToSW("APP_RESUMED")
      onResume?.()
    }

    // Visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App going to background - persist data
        persistCriticalData()
        onSuspend?.()
      } else {
        // App coming to foreground
        const wasResumed = checkResumption()
        if (wasResumed) {
          sendToSW("APP_RESUMED")
          onResume?.()
        }
        // Update last active time
        localStorage.setItem("chameleon-last-active", Date.now().toString())
      }
    }

    // Page unload handler (iOS Safari doesn't always fire this)
    const handleBeforeUnload = () => {
      persistCriticalData()
    }

    // Heartbeat to keep service worker alive
    let heartbeatInterval: NodeJS.Timeout | null = null
    if (isPWA) {
      heartbeatInterval = setInterval(() => {
        sendToSW("HEARTBEAT")
        lastActiveRef.current = Date.now()
      }, 30000) // Every 30 seconds
    }

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    // iOS-specific: Page hide event (more reliable than beforeunload on iOS)
    window.addEventListener("pagehide", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("pagehide", handleBeforeUnload)
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
      }
    }
  }, [isIOSPWA, isSimpleMode, sendToSW, persistCriticalData, checkResumption, onResume, onSuspend])

  return {
    isIOSPWA: isIOSPWA(),
    sendToSW,
    persistCriticalData,
  }
}

/**
 * Simplified hook just for detecting iOS PWA
 */
export function useIsIOSPWA(): boolean {
  if (typeof window === "undefined") return false

  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent)
  const isStandalone = (window.navigator as any).standalone === true ||
                       window.matchMedia("(display-mode: standalone)").matches

  return isIOS && isStandalone
}
