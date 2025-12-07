"use client"

import { useEffect } from "react"

/**
 * Handles chunk loading errors that occur after redeployments.
 *
 * When Vercel redeploys, old JavaScript chunks are deleted but users
 * may have cached HTML referencing those old chunk hashes. This causes
 * "Failed to load chunk" errors. The solution is to reload the page
 * to get fresh HTML with correct chunk references.
 */
export function ChunkErrorHandler() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event.message || ""
      const isChunkError =
        message.includes("Failed to load chunk") ||
        message.includes("Loading chunk") ||
        message.includes("ChunkLoadError") ||
        (event.error?.name === "ChunkLoadError")

      if (isChunkError) {
        console.warn("[ChunkErrorHandler] Chunk loading error detected, reloading page...")

        // Prevent infinite reload loops by checking sessionStorage
        const reloadKey = "chunk_error_reload"
        const lastReload = sessionStorage.getItem(reloadKey)
        const now = Date.now()

        // Only reload if we haven't reloaded in the last 10 seconds
        if (!lastReload || now - parseInt(lastReload) > 10000) {
          sessionStorage.setItem(reloadKey, now.toString())
          // Force reload bypassing cache
          window.location.reload()
        } else {
          console.error("[ChunkErrorHandler] Already reloaded recently, not reloading again to prevent loop")
        }
      }
    }

    // Handle unhandled promise rejections (dynamic imports fail this way)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const isChunkError =
        reason?.message?.includes("Failed to load chunk") ||
        reason?.message?.includes("Loading chunk") ||
        reason?.name === "ChunkLoadError"

      if (isChunkError) {
        console.warn("[ChunkErrorHandler] Chunk loading rejection detected, reloading page...")

        const reloadKey = "chunk_error_reload"
        const lastReload = sessionStorage.getItem(reloadKey)
        const now = Date.now()

        if (!lastReload || now - parseInt(lastReload) > 10000) {
          sessionStorage.setItem(reloadKey, now.toString())
          window.location.reload()
        }
      }
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
    }
  }, [])

  return null
}
