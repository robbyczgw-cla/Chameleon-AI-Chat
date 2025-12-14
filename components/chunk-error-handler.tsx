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
    const triggerReload = (source: string) => {
      console.warn(`[ChunkErrorHandler] ${source} - reloading page...`)

      const reloadKey = "chunk_error_reload"
      const lastReload = sessionStorage.getItem(reloadKey)
      const now = Date.now()

      // Only reload if we haven't reloaded in the last 10 seconds
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem(reloadKey, now.toString())
        // Force reload bypassing cache
        window.location.reload()
      } else {
        console.error("[ChunkErrorHandler] Already reloaded recently, not reloading again")
      }
    }

    const isChunkError = (message: string, filename?: string) => {
      const msgLower = (message || "").toLowerCase()
      const fileLower = (filename || "").toLowerCase()

      return (
        msgLower.includes("failed to load chunk") ||
        msgLower.includes("loading chunk") ||
        msgLower.includes("chunkloaderror") ||
        msgLower.includes("loading failed") ||
        // Check for Next.js chunk paths
        fileLower.includes("/_next/static/chunks/") ||
        // Check for module loading errors
        msgLower.includes("from module")
      )
    }

    // Handle script load errors (these fire before ErrorEvent)
    const handleScriptError = (event: Event) => {
      const target = event.target as HTMLScriptElement
      if (target?.tagName === "SCRIPT" && target?.src?.includes("/_next/static/chunks/")) {
        triggerReload(`Script chunk failed to load: ${  target.src}`)
      }
    }

    const handleError = (event: ErrorEvent) => {
      const message = event.message || ""
      const filename = event.filename || ""
      const errorName = event.error?.name || ""

      if (isChunkError(message, filename) || errorName === "ChunkLoadError") {
        triggerReload(`Error: ${  message}`)
      }
    }

    // Handle unhandled promise rejections (dynamic imports fail this way)
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = reason?.message || String(reason) || ""
      const errorName = reason?.name || ""

      if (isChunkError(message) || errorName === "ChunkLoadError") {
        triggerReload(`Rejection: ${  message}`)
      }
    }

    // Capture script errors at the capture phase (before they bubble)
    document.addEventListener("error", handleScriptError, true)
    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleRejection)

    return () => {
      document.removeEventListener("error", handleScriptError, true)
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
    }
  }, [])

  return null
}
