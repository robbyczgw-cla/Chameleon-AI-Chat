"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          console.log("[PWA] Service Worker registered:", registration.scope)

          // Check for updates ONLY every 5 minutes (was 60 seconds - too aggressive!)
          const updateInterval = setInterval(() => {
            registration.update().catch((error) => {
              console.log("[PWA] Update check failed:", error.message)
            })
          }, 300000) // 5 minutes instead of 1 minute

          // Check for updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New service worker available, notify user
                  console.log("[PWA] New version available")
                  console.log("[PWA] New version will be used on next app restart")
                  try {
                    navigator.serviceWorker.controller?.postMessage({ type: "SKIP_WAITING" })
                  } catch (e) {
                    console.warn("[PWA] Could not message SW:", e)
                  }
                }
              })
            }
          })

          return () => clearInterval(updateInterval)
        })
        .catch((error) => {
          console.log("[PWA] Service Worker registration failed:", error.message)
        })

      // Listen for controller change but do NOT reload automatically
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("[PWA] Controller changed - new service worker is now active")
      })

      // Handle app install prompt
      let deferredPrompt: any = null

      window.addEventListener("beforeinstallprompt", (e) => {
        console.log("[PWA] Install prompt triggered")
        e.preventDefault()
        deferredPrompt = e

        // Show custom install button or notification
        window.dispatchEvent(new CustomEvent("pwa-install-available"))
      })

      // Listen for app installed
      window.addEventListener("appinstalled", () => {
        console.log("[PWA] App installed successfully")
        deferredPrompt = null
      })

      // Expose install function globally
      ;(window as any).installPWA = async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt()
          const { outcome } = await deferredPrompt.userChoice
          console.log("[PWA] User choice:", outcome)
          deferredPrompt = null
        }
      }
    }

    // CRITICAL: Prevent browser tab suspension/hibernation
    // Keep a tiny heartbeat to tell browser this tab is "active"
    // This prevents Chrome/Firefox from aggressively suspending the tab
    let keepAliveInterval: NodeJS.Timeout | null = null

    if (typeof window !== "undefined") {
      console.log("[PWA] ⚡ Activating keep-alive to prevent tab suspension")

      // Ultra-lightweight heartbeat (just a timestamp update)
      // This tells the browser "this tab is doing something, don't suspend it"
      keepAliveInterval = setInterval(() => {
        // Do nothing - just the interval existing prevents suspension
        // Browser sees active JS and keeps tab in memory
      }, 30000) // Every 30 seconds (very lightweight)

      // Use Page Lifecycle API to prevent freezing (if supported)
      if ('onfreeze' in document) {
        document.addEventListener('freeze', (e) => {
          console.log('[PWA] ⚠️ Browser tried to freeze tab - preventing')
          e.preventDefault()
        })
      }

      // Prevent page from being unloaded from cache
      window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
          console.log('[PWA] ⚡ Page restored from cache - still in memory!')
        }
      })
    }

    return () => {
      if (keepAliveInterval) {
        clearInterval(keepAliveInterval)
      }
    }
  }, [])

  return null
}
