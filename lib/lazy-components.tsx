"use client"

import dynamic from "next/dynamic"
import { CircleNotch } from "@phosphor-icons/react";

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
      <CircleNotch className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}

// Loading fallback for larger components
function LoadingPanel() {
  return (
    <div className="flex flex-col items-center justify-center p-12 gap-2">
      <CircleNotch className="h-8 w-8 animate-spin text-violet-500" />
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

// NOTE: Removed dead lazy imports for non-existent components:
// - LazyModelSelectorPanel (model-selector-panel.tsx never created)
// - LazyAdvancedSettingsContent (advanced-settings-content.tsx never created)
// - LazyStreamingDetailsPanel (streaming-details-panel.tsx never created)
// - LazySearchProviderSettings (search-provider-settings.tsx never created)

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
