"use client"

import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

/**
 * Lazy Loading for Advanced-Only Components
 *
 * WHY THIS HELPS:
 * 1. Smaller initial bundle for simple mode users
 * 2. Faster first load on mobile/slow connections
 * 3. Components only loaded when actually needed
 * 4. Better memory usage on low-end devices
 *
 * HOW IT WORKS:
 * - Components are split into separate chunks
 * - Only downloaded when first rendered
 * - Shows loading spinner while loading
 * - SSR disabled for client-only components
 */

// Loading fallback component
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

// Loading fallback for larger components
function LoadingPanel() {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  )
}

/**
 * ADVANCED-ONLY COMPONENTS
 * These are only loaded when in advanced mode
 */

// Memory Manager - Full memory editor UI
export const LazyMemoryManager = dynamic(
  () => import("@/components/memory-manager").then(mod => ({ default: mod.MemoryManager })),
  {
    loading: () => <LoadingPanel />,
    ssr: false,
  }
)

// Context Window Meter - Token usage visualization
export const LazyContextWindowMeter = dynamic(
  () => import("@/components/context-window-meter").then(mod => ({ default: mod.ContextWindowMeter })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

// Model Selector Panel - Advanced model selection
export const LazyModelSelectorPanel = dynamic(
  () => import("@/components/model-selector-panel").then(mod => ({ default: mod.ModelSelectorPanel })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

// Advanced Settings Dialog - Temperature, top_p, etc.
export const LazyAdvancedSettingsContent = dynamic(
  () => import("@/components/advanced-settings-content").then(mod => mod),
  {
    loading: () => <LoadingPanel />,
    ssr: false,
  }
)

// Streaming Details Panel - Verbose streaming phases
export const LazyStreamingDetailsPanel = dynamic(
  () => import("@/components/streaming-details-panel").then(mod => ({ default: mod.StreamingDetailsPanel })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

// Search Provider Settings
export const LazySearchProviderSettings = dynamic(
  () => import("@/components/search-provider-settings").then(mod => mod),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

/**
 * SHARED COMPONENTS (loaded for both modes but lazy for performance)
 */

// Personas Dialog - Large component with many personas
export const LazyPersonasDialog = dynamic(
  () => import("@/components/personas-dialog").then(mod => ({ default: mod.PersonasDialog })),
  {
    loading: () => <LoadingPanel />,
    ssr: false,
  }
)

// User Profile Dialog
export const LazyUserProfileDialog = dynamic(
  () => import("@/components/user-profile-dialog").then(mod => ({ default: mod.UserProfileDialog })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,
  }
)

/**
 * Conditional component wrapper
 * Only renders children if feature flag is enabled
 */
export function FeatureGate({
  feature,
  isSimpleMode,
  children,
  fallback = null,
}: {
  feature: boolean
  isSimpleMode?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  if (!feature) return fallback
  return <>{children}</>
}

/**
 * Mode-aware component wrapper
 * Renders different content based on mode
 */
export function ModeSwitch({
  simple,
  advanced,
  isSimpleMode,
}: {
  simple: React.ReactNode
  advanced: React.ReactNode
  isSimpleMode: boolean
}) {
  return isSimpleMode ? <>{simple}</> : <>{advanced}</>
}
