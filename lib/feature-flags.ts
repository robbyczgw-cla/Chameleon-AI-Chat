/**
 * Feature Flags System
 *
 * Centralizes feature availability based on mode (simple vs advanced) and access tier.
 * This ensures simple mode users get a streamlined experience while
 * advanced users get all features.
 *
 * Access Tiers:
 * - standard: Normal users with full mode selection
 * - hifi: Team users with locked simple mode and HiFi persona only
 *
 * WHY THIS HELPS:
 * 1. Reduces bundle size for simple mode (lazy loading can skip unused code)
 * 2. Simplifies UI - fewer options = less confusion for casual users
 * 3. Fewer code paths = fewer bugs and more reliable behavior
 * 4. Easier testing - can test each mode independently
 * 5. Performance - fewer features = faster load times on mobile
 */

import type { AccessTier } from "@/types"

export interface FeatureFlags {
  // UI Features
  showSlashCommands: boolean      // /summarize, /translate, etc.
  showModelSelector: boolean      // Choose from multiple models
  showAdvancedSettings: boolean   // Temperature, top_p, etc.
  showRAGUpload: boolean          // Upload documents for RAG
  showCodeHighlighting: boolean   // Syntax highlighting in code blocks
  showMessageStats: boolean       // Token counts, cost, timing
  showStreamingDetails: boolean   // Verbose streaming phases
  showContextMeter: boolean       // Token usage meter

  // Memory Features
  showMemoryManager: boolean      // Full memory editor UI
  enableAutoMemoryExtraction: boolean  // Auto-extract facts from chat

  // Search Features
  showSearchProviderChoice: boolean  // Choose between Tavily/Serper/etc
  enableHeuristicAutoSearch: boolean // AI decides when to search

  // Voice Features
  showVoiceInput: boolean         // Microphone button
  showVoiceOutput: boolean        // Text-to-speech

  // Export/Import
  showExportChat: boolean         // Export conversations
  showImportChat: boolean         // Import conversations

  // Experimental
  showExperimentalFeatures: boolean  // Beta features toggle

  // Access Tier Features
  showPersonaPicker: boolean        // Allow persona selection
  showModeSelector: boolean         // Allow mode switching
  showLanguageSelector: boolean     // Allow language selection
  showFullProfile: boolean          // Show full profile options (not just name)
}

/**
 * Get feature flags for simple mode
 * Simple mode = streamlined, essential features only
 */
export function getSimpleModeFeatures(): FeatureFlags {
  return {
    // UI - Keep it clean
    showSlashCommands: false,        // Too complex for casual users
    showModelSelector: false,        // Use default model
    showAdvancedSettings: false,     // Hide temperature, etc.
    showRAGUpload: false,           // Advanced feature
    showCodeHighlighting: true,      // Keep - useful for everyone
    showMessageStats: false,         // Hide token counts
    showStreamingDetails: false,     // Hide verbose phases
    showContextMeter: false,         // Hide technical details

    // Memory - Automatic and invisible
    showMemoryManager: false,        // Memory works in background
    enableAutoMemoryExtraction: true, // Auto-learn about user

    // Search - Just works
    showSearchProviderChoice: false, // Use default provider
    enableHeuristicAutoSearch: true, // AI decides automatically

    // Voice - Keep accessible
    showVoiceInput: true,           // Useful for everyone
    showVoiceOutput: true,          // Useful for everyone

    // Export/Import - Hide
    showExportChat: false,          // Advanced feature
    showImportChat: false,          // Advanced feature

    // Experimental - Hide
    showExperimentalFeatures: false, // Only for advanced users

    // Access Tier - Standard users can change everything
    showPersonaPicker: true,         // Allow persona selection
    showModeSelector: true,          // Allow mode switching
    showLanguageSelector: true,      // Allow language selection
    showFullProfile: true,           // Show full profile options
  }
}

/**
 * Get feature flags for advanced mode
 * Advanced mode = all features available
 */
export function getAdvancedModeFeatures(): FeatureFlags {
  return {
    // UI - Full control
    showSlashCommands: true,
    showModelSelector: true,
    showAdvancedSettings: true,
    showRAGUpload: true,
    showCodeHighlighting: true,
    showMessageStats: true,
    showStreamingDetails: true,
    showContextMeter: true,

    // Memory - Full control
    showMemoryManager: true,
    enableAutoMemoryExtraction: true,

    // Search - Full control
    showSearchProviderChoice: true,
    enableHeuristicAutoSearch: true,

    // Voice - Full control
    showVoiceInput: true,
    showVoiceOutput: true,

    // Export/Import - Available
    showExportChat: true,
    showImportChat: true,

    // Experimental - Available
    showExperimentalFeatures: true,

    // Access Tier - Standard users can change everything
    showPersonaPicker: true,         // Allow persona selection
    showModeSelector: true,          // Allow mode switching
    showLanguageSelector: true,      // Allow language selection
    showFullProfile: true,           // Show full profile options
  }
}

/**
 * Get feature flags for hifi mode (team access)
 * HiFi mode = simple mode with fixed persona and German only
 */
export function getHifiModeFeatures(): FeatureFlags {
  // Start with simple mode features
  const simpleFeatures = getSimpleModeFeatures()

  return {
    ...simpleFeatures,

    // Override: HiFi users cannot change these
    showPersonaPicker: false,        // Locked to HiFi persona
    showModeSelector: false,         // Cannot switch modes
    showLanguageSelector: false,     // German only
    showFullProfile: false,          // Simplified profile (name only)
  }
}

/**
 * Get current feature flags based on mode and access tier
 */
export function getFeatureFlags(isSimpleMode: boolean, accessTier?: AccessTier): FeatureFlags {
  // HiFi tier always uses HiFi mode features
  if (accessTier === "hifi") {
    return getHifiModeFeatures()
  }
  return isSimpleMode ? getSimpleModeFeatures() : getAdvancedModeFeatures()
}

/**
 * Check if a specific feature is enabled
 * Usage: if (isFeatureEnabled('showSlashCommands', settings.simpleMode, settings.accessTier)) { ... }
 */
export function isFeatureEnabled(
  feature: keyof FeatureFlags,
  isSimpleMode: boolean,
  accessTier?: AccessTier
): boolean {
  const flags = getFeatureFlags(isSimpleMode, accessTier)
  return flags[feature]
}

/**
 * Hook-friendly feature flag getter
 * Returns a function that checks features
 */
export function createFeatureChecker(isSimpleMode: boolean, accessTier?: AccessTier) {
  const flags = getFeatureFlags(isSimpleMode, accessTier)
  return (feature: keyof FeatureFlags): boolean => flags[feature]
}

/**
 * Check if user is in HiFi tier (team access)
 */
export function isHifiTier(accessTier?: AccessTier): boolean {
  return accessTier === "hifi"
}
