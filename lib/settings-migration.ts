/**
 * Settings Migration Utility
 * Migrates old localStorage keys to the new settings context system
 * This ensures all settings use a single source of truth
 */

import { removeFollowUpInstructions, hasFollowUpInstructions } from "./system-prompt-builder"

export interface MigrationResult {
  migrated: string[]
  errors: string[]
  cleaned: string[]
}

/**
 * Migrate old localStorage keys to settings context
 */
export function migrateSettingsToContext(): MigrationResult {
  const result: MigrationResult = {
    migrated: [],
    errors: [],
    cleaned: [],
  }

  if (typeof window === "undefined") {
    return result
  }

  try {
    // Get current settings
    const settingsStr = localStorage.getItem("settings")
    if (!settingsStr) {
      console.warn("[Migration] No settings found, skipping migration")
      return result
    }

    const settings = JSON.parse(settingsStr)

    // Migrate: chameleon-theme → settings.theme
    const oldTheme = localStorage.getItem("chameleon-theme")
    if (oldTheme && !settings.theme) {
      settings.theme = oldTheme
      result.migrated.push("theme")
      console.log(`[Migration] Migrated theme: ${oldTheme}`)
    }

    // Migrate: chameleon-performance-mode → settings.experimental.performanceMode
    const oldPerformanceMode = localStorage.getItem("chameleon-performance-mode")
    if (oldPerformanceMode !== null && !settings.experimental?.performanceMode) {
      if (!settings.experimental) settings.experimental = {}
      settings.experimental.performanceMode = oldPerformanceMode === "true"
      result.migrated.push("performanceMode")
      console.log(`[Migration] Migrated performance mode: ${oldPerformanceMode}`)
    }

    // Migrate: chameleon-web-search-enabled → settings.enableAutoToolUse
    const oldWebSearch = localStorage.getItem("chameleon-web-search-enabled")
    if (oldWebSearch !== null && settings.enableAutoToolUse === undefined) {
      settings.enableAutoToolUse = oldWebSearch === "true"
      result.migrated.push("enableAutoToolUse")
      console.log(`[Migration] Migrated web search: ${oldWebSearch}`)
    }

    // Migrate: app-language → settings.language
    const oldLanguage = localStorage.getItem("app-language")
    if (oldLanguage && !settings.language) {
      settings.language = oldLanguage
      result.migrated.push("language")
      console.log(`[Migration] Migrated language: ${oldLanguage}`)
    }

    // Migrate/Enable: dedicated follow-up model (v0.11+)
    // Enable by default for new and existing users
    if (!settings.experimental) settings.experimental = {}
    if (settings.experimental.useDedicatedFollowUpModel === undefined) {
      settings.experimental.useDedicatedFollowUpModel = true
      result.migrated.push("useDedicatedFollowUpModel")
      console.log(`[Migration] Enabled dedicated follow-up model by default`)

      // Set default background AI models if not set
      if (!settings.experimental.backgroundAIModels) {
        settings.experimental.backgroundAIModels = {}
      }
      if (!settings.experimental.backgroundAIModels.followUpGeneration) {
        settings.experimental.backgroundAIModels.followUpGeneration = "google/gemini-3-flash-preview"
        console.log(`[Migration] Set default follow-up generation model: google/gemini-3-flash-preview`)
      }
    }

    // Clean up system prompt - ALWAYS run this check (not just on first migration)
    // This ensures users who already migrated still get their prompts cleaned
    // NOTE: Language instructions (WICHTIG/IMPORTANT/IMPORTANTE for language)
    // may be in the stored prompt from old versions, but they're now added
    // dynamically by chat-input.tsx. If they exist in stored prompt, we keep them
    // for backward compatibility - they'll just be duplicated (harmless).
    if (settings.systemPrompt && hasFollowUpInstructions(settings.systemPrompt)) {
      const oldPrompt = settings.systemPrompt
      const cleanedPrompt = removeFollowUpInstructions(settings.systemPrompt)

      // Only update if cleaning actually changed something
      if (cleanedPrompt !== oldPrompt) {
        settings.systemPrompt = cleanedPrompt
        result.migrated.push("systemPrompt-cleanup")
        console.log(`[Migration] Cleaned up system prompt (removed follow-up instructions)`)
        console.log(`[Migration] Old length: ${oldPrompt.length} chars → New length: ${cleanedPrompt.length} chars`)

        // Log what was removed for debugging
        const removed = oldPrompt.replace(cleanedPrompt, '[REMOVED]')
        console.log(`[Migration] Removed content preview: ${removed.substring(0, 200)}...`)
      }
    }

    // Save migrated settings
    if (result.migrated.length > 0) {
      localStorage.setItem("settings", JSON.stringify(settings))
      console.log(`[Migration] Saved ${result.migrated.length} migrated settings`)
    }

    // Clean up old keys (optional - keep for backward compatibility for now)
    // Uncomment these if you want to remove old keys after migration
    /*
    if (result.migrated.includes("theme")) {
      localStorage.removeItem("chameleon-theme")
      result.cleaned.push("chameleon-theme")
    }
    if (result.migrated.includes("performanceMode")) {
      localStorage.removeItem("chameleon-performance-mode")
      result.cleaned.push("chameleon-performance-mode")
    }
    if (result.migrated.includes("enableAutoToolUse")) {
      localStorage.removeItem("chameleon-web-search-enabled")
      result.cleaned.push("chameleon-web-search-enabled")
    }
    if (result.migrated.includes("language")) {
      localStorage.removeItem("app-language")
      result.cleaned.push("app-language")
    }
    */

  } catch (error) {
    console.error("[Migration] Error during migration:", error)
    result.errors.push(error instanceof Error ? error.message : "Unknown error")
  }

  return result
}

/**
 * Run migration on app startup
 * Call this in your root layout or app component
 */
export function runMigrationOnStartup(): void {
  if (typeof window === "undefined") return

  const migrationKey = "chameleon-settings-migration-v3" // v3: Improved system prompt cleanup
  const migrationDone = localStorage.getItem(migrationKey)

  if (migrationDone) {
    console.log("[Migration] Already migrated, skipping")
    return
  }

  console.log("[Migration] Running settings migration...")
  const result = migrateSettingsToContext()

  console.log("[Migration] Results:", {
    migrated: result.migrated.length,
    errors: result.errors.length,
    cleaned: result.cleaned.length,
  })

  if (result.migrated.length > 0) {
    console.log("[Migration] ✅ Migrated settings:", result.migrated)
  }

  if (result.errors.length > 0) {
    console.error("[Migration] ❌ Errors:", result.errors)
  }

  if (result.cleaned.length > 0) {
    console.log("[Migration] 🧹 Cleaned up:", result.cleaned)
  }

  // Mark migration as done (even if there were errors, we don't want to keep trying)
  localStorage.setItem(migrationKey, "true")
}

/**
 * Reset migration flag (for testing)
 */
export function resetMigrationFlag(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem("chameleon-settings-migration-v1")
  localStorage.removeItem("chameleon-settings-migration-v2")
  localStorage.removeItem("chameleon-settings-migration-v3")
  console.log("[Migration] Reset migration flag")
}
