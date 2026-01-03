"use client"

import { useMemo } from "react"
import { useApp } from "@/contexts/app-context"
import {
  type FeatureFlags,
  getFeatureFlags,
  getSimpleModeFeatures,
  getAdvancedModeFeatures,
} from "@/lib/feature-flags"

/**
 * Hook to access feature flags based on current mode
 *
 * Usage:
 * ```tsx
 * const { features, isSimpleMode, can } = useFeatureFlags()
 *
 * // Check specific feature
 * if (can('showSlashCommands')) {
 *   // Show slash commands UI
 * }
 *
 * // Access all flags
 * {features.showMemoryManager && <MemoryManager />}
 * ```
 */
export function useFeatureFlags() {
  const { settings } = useApp()

  // Determine mode - check multiple sources for reliability
  const isSimpleMode = useMemo(() => {
    // Primary: settings.simpleMode
    if (settings.simpleMode !== undefined) {
      return settings.simpleMode
    }

    // Fallback: localStorage app-mode
    if (typeof window !== "undefined") {
      const appMode = localStorage.getItem("app-mode")
      return appMode !== "advanced"
    }

    // Default to simple mode for new users
    return true
  }, [settings.simpleMode])

  // Get feature flags for current mode
  const features = useMemo(() => {
    return getFeatureFlags(isSimpleMode)
  }, [isSimpleMode])

  // Helper function to check a specific feature
  const can = useMemo(() => {
    return (feature: keyof FeatureFlags): boolean => features[feature]
  }, [features])

  return {
    features,
    isSimpleMode,
    isAdvancedMode: !isSimpleMode,
    can,
    // Expose mode-specific flag getters for reference
    simpleModeFeatures: getSimpleModeFeatures(),
    advancedModeFeatures: getAdvancedModeFeatures(),
  }
}

/**
 * Lightweight hook that just checks if in simple mode
 * Use this when you don't need full feature flags
 */
export function useIsSimpleMode(): boolean {
  const { settings } = useApp()

  return useMemo(() => {
    if (settings.simpleMode !== undefined) {
      return settings.simpleMode
    }
    if (typeof window !== "undefined") {
      const appMode = localStorage.getItem("app-mode")
      return appMode !== "advanced"
    }
    return true
  }, [settings.simpleMode])
}
