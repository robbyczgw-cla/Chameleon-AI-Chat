/**
 * Memory Service - Token-efficient long-term memory for Advanced mode
 *
 * Stores and retrieves user context, preferences, and facts to maintain
 * conversation continuity across sessions without excessive token usage.
 *
 * Supports optional cloud sync to Supabase for cross-device access.
 */

import type { Memory, MemorySettings, DeletedMemory } from "@/types"
import { generateUUID } from "@/lib/utils"
import { supabaseSync } from "@/lib/supabase/sync"
import { generateEmbedding, findSimilar, cosineSimilarity } from "@/lib/embedding-service"

const MEMORY_STORAGE_KEY_PREFIX = "chat_memories" // Base key - user ID appended for security
const DELETED_MEMORY_STORAGE_KEY_PREFIX = "chat_deleted_memories" // Archived memories storage

// Default models for memory tasks (can be overridden via settings)
export const DEFAULT_EXTRACTION_MODEL = "openai/gpt-oss-20b" // Cheap, fast model for extraction
export const DEFAULT_CLASSIFIER_MODEL = "openai/gpt-oss-20b" // Same model for query classification
export const DEFAULT_CONSOLIDATION_MODEL = "openai/gpt-oss-120b" // More capable model for consolidation

// Expiration constants
const DEFAULT_EXPIRATION_DAYS = 7 // Days without access before expiration
const DEFAULT_ARCHIVE_RETENTION_DAYS = 14 // Days to keep deleted memories
const MS_PER_DAY = 24 * 60 * 60 * 1000

// Query classification result
export interface QueryClassification {
  needsMemory: boolean
  confidence: number // 0-1
  reason: string
  queryType: "factual" | "personal" | "ambiguous"
}

const DEFAULT_SETTINGS: MemorySettings = {
  enabled: false,
  autoExtract: true,
  maxMemoriesInContext: 5,
  importanceThreshold: 2,
  syncToDatabase: false,
  useSemanticSearch: true, // Use embeddings for better retrieval
  similarityThreshold: 0.5, // Minimum similarity score (0-1)
  // Phase 3: Intelligent retrieval
  classificationConfidence: 0.8, // Trust classification if confidence >= this
  minRelevanceScore: 0.3, // Skip memories if best match below this
  alwaysRetrieveForPersonas: true, // Always retrieve for persona chats
  // Memory expiration settings
  expirationEnabled: true, // Enable automatic memory expiration
  expirationDays: DEFAULT_EXPIRATION_DAYS, // Days without access before expiration
  archiveRetentionDays: DEFAULT_ARCHIVE_RETENTION_DAYS, // Days to keep deleted memories
}

// Memory retrieval decision - explains why memories were/weren't retrieved
export interface MemoryRetrievalDecision {
  action: "skipped" | "retrieved" | "empty"
  reason: string
  details: {
    queryType?: "factual" | "personal" | "ambiguous"
    confidence?: number
    searchMethod?: "semantic" | "keyword"
    topSimilarity?: number
    memoryCount?: number
  }
}

class MemoryService {
  private memories: Memory[] = []
  private deletedMemories: DeletedMemory[] = []
  private settings: MemorySettings = DEFAULT_SETTINGS
  private userId: string | null = null
  private syncEnabled: boolean = false
  // Configurable models (can be set from UI settings)
  private extractionModel: string = DEFAULT_EXTRACTION_MODEL
  private classifierModel: string = DEFAULT_CLASSIFIER_MODEL
  private consolidationModel: string = DEFAULT_CONSOLIDATION_MODEL

  constructor() {
    // Don't load memories in constructor - wait for user ID to be set
    // This prevents showing another user's memories
  }

  /**
   * Set custom models for memory tasks (from UI settings)
   */
  setModels(options: { extractionModel?: string; classifierModel?: string; consolidationModel?: string }) {
    if (options.extractionModel) {
      this.extractionModel = options.extractionModel
    }
    if (options.classifierModel) {
      this.classifierModel = options.classifierModel
    }
    if (options.consolidationModel) {
      this.consolidationModel = options.consolidationModel
    }
  }

  /**
   * Get current model configuration
   */
  getModels() {
    return {
      extractionModel: this.extractionModel,
      classifierModel: this.classifierModel,
      consolidationModel: this.consolidationModel,
    }
  }

  /**
   * Get the user-scoped storage key for localStorage
   * SECURITY: Each user has their own isolated memory storage
   */
  private getStorageKey(): string {
    if (this.userId) {
      return `${MEMORY_STORAGE_KEY_PREFIX}_${this.userId}`
    }
    // Fallback for logged-out users - use a session-based key
    // This is cleared on logout and won't persist across users
    return `${MEMORY_STORAGE_KEY_PREFIX}_anonymous`
  }

  /**
   * Get the user-scoped storage key for deleted/archived memories
   */
  private getDeletedStorageKey(): string {
    if (this.userId) {
      return `${DELETED_MEMORY_STORAGE_KEY_PREFIX}_${this.userId}`
    }
    return `${DELETED_MEMORY_STORAGE_KEY_PREFIX}_anonymous`
  }

  /**
   * Configure database sync and load user-specific memories
   * SECURITY: This must be called when user logs in to load their isolated memories
   */
  configureDatabaseSync(userId: string | null, syncEnabled: boolean) {
    const previousUserId = this.userId
    this.userId = userId
    this.syncEnabled = syncEnabled && !!userId

    // SECURITY: Clear memories and reload when user changes
    // This ensures User A's memories are never shown to User B
    if (previousUserId !== userId) {
      console.log("[Memory] User changed - clearing and reloading memories")
      this.memories = [] // Clear immediately
      this.deletedMemories = [] // Clear deleted memories too

      // MIGRATION: Check for old non-scoped memories and migrate them
      if (userId) {
        this.migrateOldMemories(userId)
      }

      this.loadMemories() // Load new user's memories
      this.loadDeletedMemories() // Load deleted memories archive

      // Run cleanup on load
      this.removeDuplicates() // Remove any duplicate memories
      this.checkAndExpireMemories()
      this.cleanupExpiredArchive()
    }

    console.log("[Memory] Database sync configured:", {
      userId: userId ? "***" : null,
      syncEnabled: this.syncEnabled,
      storageKey: this.getStorageKey()
    })
  }

  /**
   * MIGRATION: Migrate old non-user-scoped memories to user-scoped storage
   * This ensures no memories are lost when upgrading to the secure version
   */
  private migrateOldMemories(userId: string): void {
    if (typeof window === 'undefined') return

    const oldKey = MEMORY_STORAGE_KEY_PREFIX // Old key without user ID (e.g., "chat_memories")
    const newKey = this.getStorageKey() // New key with user ID (e.g., "chat_memories_abc123")

    try {
      const oldData = localStorage.getItem(oldKey)

      // If there's old data and no new data yet, migrate it
      if (oldData) {
        const existingNewData = localStorage.getItem(newKey)

        if (!existingNewData) {
          // No data in new location - migrate the old data
          console.log("[Memory] MIGRATION: Migrating old memories to user-scoped storage")
          localStorage.setItem(newKey, oldData)
          console.log("[Memory] MIGRATION: Successfully migrated memories for user")
        } else {
          // Data exists in both - merge (new data takes priority, add unique old memories)
          console.log("[Memory] MIGRATION: Merging old memories with existing user memories")
          try {
            const oldMemories = JSON.parse(oldData) as Memory[]
            const newMemories = JSON.parse(existingNewData) as Memory[]
            const existingIds = new Set(newMemories.map(m => m.id))

            // Add old memories that don't exist in new storage
            let addedCount = 0
            for (const oldMem of oldMemories) {
              if (!existingIds.has(oldMem.id)) {
                newMemories.push(oldMem)
                addedCount++
              }
            }

            if (addedCount > 0) {
              localStorage.setItem(newKey, JSON.stringify(newMemories))
              console.log("[Memory] MIGRATION: Added", addedCount, "memories from old storage")
            }
          } catch (mergeError) {
            console.error("[Memory] MIGRATION: Merge failed, keeping new data:", mergeError)
          }
        }

        // Remove old key ONLY after successful migration to prevent data leakage
        // IMPORTANT: Keep the old key for now in case other users on shared device need it
        // We'll remove it only when explicitly clearing on logout
        console.log("[Memory] MIGRATION: Old key preserved for potential other users on shared device")
      }
    } catch (error) {
      console.error("[Memory] MIGRATION: Failed to migrate old memories:", error)
      // Don't delete old data on error - safety first
    }
  }

  /**
   * Clear memories on logout - SECURITY CRITICAL
   * This prevents logged-out users from seeing previous user's data
   */
  clearOnLogout() {
    console.log("[Memory] Clearing memories on logout for security")
    this.memories = []
    // Also clear the anonymous key to prevent leakage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`${MEMORY_STORAGE_KEY_PREFIX}_anonymous`)
    }
    this.userId = null
    this.syncEnabled = false
  }

  /**
   * Load memories from database (for initial sync)
   */
  async loadFromDatabase(): Promise<void> {
    if (!this.userId || !this.syncEnabled) {
      console.log("[Memory] Database sync disabled, skipping load")
      return
    }

    try {
      console.log("[Memory] Loading memories from database...")
      const dbMemories = await supabaseSync.syncMemories(this.userId)

      // Merge with local memories (database takes priority for conflicts)
      const localMemoryIds = new Set(this.memories.map(m => m.id))
      const dbMemoryIds = new Set(dbMemories.map(m => m.id))

      // CRITICAL: Get deleted memory IDs to prevent zombie memories from coming back
      const deletedMemoryIds = new Set(this.deletedMemories.map(m => m.id))

      // Add DB memories that aren't local AND weren't deleted
      for (const dbMem of dbMemories) {
        // Skip if this memory was deleted locally - don't bring it back!
        if (deletedMemoryIds.has(dbMem.id)) {
          console.log("[Memory] Skipping deleted memory from DB:", dbMem.content?.substring(0, 40))
          // Also try to delete it from the database since it's in our deleted list
          supabaseSync.deleteMemory(this.userId!, dbMem.id).catch(err => {
            console.error("[Memory] Failed to sync deletion to database:", err)
          })
          continue
        }

        if (!localMemoryIds.has(dbMem.id)) {
          this.memories.push(dbMem)
        } else {
          // Update local with DB version (DB is source of truth)
          const idx = this.memories.findIndex(m => m.id === dbMem.id)
          if (idx !== -1) {
            this.memories[idx] = dbMem
          }
        }
      }

      // Upload local-only memories to database
      for (const localMem of this.memories) {
        if (!dbMemoryIds.has(localMem.id)) {
          try {
            await supabaseSync.createMemory(this.userId, localMem)
          } catch (err) {
            console.error("[Memory] Failed to upload local memory:", err)
          }
        }
      }

      this.saveMemories() // Update localStorage with merged data
      console.log("[Memory] Database sync complete. Total memories:", this.memories.length)
    } catch (error) {
      console.error("[Memory] Failed to load from database:", error)
    }
  }

  /**
   * Load memories from localStorage (user-scoped)
   * SECURITY: Uses user-specific storage key
   */
  private loadMemories() {
    // Skip during SSR
    if (typeof window === 'undefined') return

    const storageKey = this.getStorageKey()
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        this.memories = JSON.parse(stored)
        console.log("[Memory] Loaded", this.memories.length, "memories from", storageKey)
      } else {
        console.log("[Memory] No memories found for", storageKey)
      }
    } catch (error) {
      console.error("[Memory] Load error:", error)
      this.memories = []
    }
  }

  /**
   * Save memories to localStorage (user-scoped)
   * SECURITY: Uses user-specific storage key
   */
  private saveMemories() {
    // Skip during SSR
    if (typeof window === 'undefined') return

    const storageKey = this.getStorageKey()
    try {
      localStorage.setItem(storageKey, JSON.stringify(this.memories))
    } catch (error) {
      console.error("[Memory] Save error:", error)
    }
  }

  /**
   * Load deleted memories from localStorage and optionally merge with database
   */
  private loadDeletedMemories() {
    if (typeof window === 'undefined') return

    const storageKey = this.getDeletedStorageKey()
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        this.deletedMemories = JSON.parse(stored)
        console.log("[Memory] Loaded", this.deletedMemories.length, "deleted memories from local archive")
      } else {
        this.deletedMemories = []
      }

      // If sync is enabled, also fetch from database and merge
      if (this.syncEnabled && this.userId) {
        this.syncDeletedMemoriesFromDatabase()
      }
    } catch (error) {
      console.error("[Memory] Load deleted memories error:", error)
      this.deletedMemories = []
    }
  }

  /**
   * Sync deleted memories from database and merge with local
   */
  private async syncDeletedMemoriesFromDatabase() {
    if (!this.syncEnabled || !this.userId) return

    try {
      const dbDeletedMemories = await supabaseSync.syncDeletedMemories(this.userId)
      console.log("[Memory] Fetched", dbDeletedMemories.length, "deleted memories from database")

      // Merge: database takes priority, add any local-only items
      const dbIds = new Set(dbDeletedMemories.map(m => m.id))
      const localOnlyMemories = this.deletedMemories.filter(m => !dbIds.has(m.id))

      // Combine: DB memories + local-only memories
      this.deletedMemories = [...dbDeletedMemories, ...localOnlyMemories]

      // If there were local-only memories, sync them to database
      for (const localMemory of localOnlyMemories) {
        supabaseSync.createDeletedMemory(this.userId!, localMemory).catch(err => {
          console.error("[Memory] Failed to sync local deleted memory to database:", err)
        })
      }

      this.saveDeletedMemories()
      console.log("[Memory] Merged deleted memories:", {
        fromDB: dbDeletedMemories.length,
        localOnly: localOnlyMemories.length,
        total: this.deletedMemories.length
      })
    } catch (error) {
      console.error("[Memory] Failed to sync deleted memories from database:", error)
    }
  }

  /**
   * Save deleted memories to localStorage
   */
  private saveDeletedMemories() {
    if (typeof window === 'undefined') return

    const storageKey = this.getDeletedStorageKey()
    try {
      localStorage.setItem(storageKey, JSON.stringify(this.deletedMemories))
    } catch (error) {
      console.error("[Memory] Save deleted memories error:", error)
    }
  }

  /**
   * Check for expired memories and archive/demote them
   * High importance (3) memories get demoted to 2 first
   * Other memories get archived directly
   *
   * EXCEPTION: Profile-based memories (source: "profile" or category: "personal_info")
   * are NEVER expired automatically - they represent permanent user information
   */
  checkAndExpireMemories(): { expired: number; demoted: number; skippedProfile: number } {
    if (!this.settings.expirationEnabled) {
      return { expired: 0, demoted: 0, skippedProfile: 0 }
    }

    const expirationDays = this.settings.expirationDays ?? DEFAULT_EXPIRATION_DAYS
    const archiveRetentionDays = this.settings.archiveRetentionDays ?? DEFAULT_ARCHIVE_RETENTION_DAYS
    const expirationThreshold = Date.now() - (expirationDays * MS_PER_DAY)

    let expiredCount = 0
    let demotedCount = 0
    let skippedProfileCount = 0
    const memoriesToArchive: Memory[] = []
    const memoriesToDemote: Memory[] = []

    for (const memory of this.memories) {
      if (memory.lastAccessedAt < expirationThreshold) {
        // NEVER expire profile-based memories - they represent permanent user info
        // This includes memories from profile integration OR memories about personal_info
        if (memory.source === "profile" || memory.category === "personal_info") {
          skippedProfileCount++
          console.log("[Memory] Skipping decay for profile memory:", memory.content.substring(0, 40))
          // Refresh the lastAccessedAt to prevent repeated checks
          memory.lastAccessedAt = Date.now()
          continue
        }

        if (memory.importance === 3) {
          // High importance memories get demoted to level 2 first
          memoriesToDemote.push(memory)
        } else {
          // Other memories get archived
          memoriesToArchive.push(memory)
        }
      }
    }

    // Demote high importance memories
    for (const memory of memoriesToDemote) {
      memory.importance = 2
      // Reset lastAccessedAt to give it another week
      memory.lastAccessedAt = Date.now()
      demotedCount++
      console.log("[Memory] Demoted high-importance memory:", memory.content.substring(0, 40))
    }

    // Archive other expired memories
    for (const memory of memoriesToArchive) {
      this.archiveMemory(memory.id, "expired")
      expiredCount++
    }

    if (demotedCount > 0 || expiredCount > 0 || skippedProfileCount > 0) {
      this.saveMemories()
      console.log("[Memory] Expiration check:", {
        expired: expiredCount,
        demoted: demotedCount,
        skippedProfile: skippedProfileCount
      })
    }

    return { expired: expiredCount, demoted: demotedCount, skippedProfile: skippedProfileCount }
  }

  /**
   * Dynamically adjust memory importance based on usage patterns
   * - Frequently accessed memories get boosted (if not already max)
   * - Rarely accessed memories get reduced (if not profile-based)
   *
   * Call this periodically (e.g., daily) to keep importance aligned with actual usefulness
   */
  adjustMemoryImportance(): { boosted: number; reduced: number; skipped: number } {
    const now = Date.now()
    let boostedCount = 0
    let reducedCount = 0
    let skippedCount = 0

    for (const memory of this.memories) {
      // Skip profile-based memories - their importance is permanent
      if (memory.source === "profile" || memory.category === "personal_info") {
        skippedCount++
        continue
      }

      const daysSinceCreated = (now - memory.createdAt) / MS_PER_DAY
      const daysSinceAccessed = (now - memory.lastAccessedAt) / MS_PER_DAY

      // Only adjust memories that are at least 7 days old (need time to establish pattern)
      if (daysSinceCreated < 7) {
        continue
      }

      // BOOST: Frequently accessed memories (10+ accesses and used recently)
      if (memory.accessCount >= 10 && daysSinceAccessed < 7 && memory.importance < 3) {
        memory.importance = Math.min(3, memory.importance + 1) as 1 | 2 | 3
        boostedCount++
        console.log("[Memory] Boosted importance:", memory.content.substring(0, 40),
          `(accessCount: ${memory.accessCount}, importance: ${memory.importance})`)
      }

      // REDUCE: Rarely accessed memories (0 accesses in 30+ days, not already low)
      else if (daysSinceAccessed > 30 && memory.accessCount === 0 && memory.importance > 1) {
        memory.importance = Math.max(1, memory.importance - 1) as 1 | 2 | 3
        reducedCount++
        console.log("[Memory] Reduced importance:", memory.content.substring(0, 40),
          `(daysSinceAccessed: ${Math.floor(daysSinceAccessed)}, importance: ${memory.importance})`)
      }
    }

    if (boostedCount > 0 || reducedCount > 0) {
      this.saveMemories()
      console.log("[Memory] Importance adjustment:", {
        boosted: boostedCount,
        reduced: reducedCount,
        skipped: skippedCount
      })
    }

    return { boosted: boostedCount, reduced: reducedCount, skipped: skippedCount }
  }

  /**
   * Consolidate duplicate/similar memories using LLM
   * Finds semantically similar memories and merges them to reduce clutter
   *
   * @param apiKey - OpenRouter API key for LLM calls
   * @param dryRun - If true, only return what would be consolidated without making changes
   * @returns Summary of consolidation actions
   */
  async consolidateMemories(
    apiKey: string,
    dryRun: boolean = false
  ): Promise<{
    success: boolean
    consolidated: number
    kept: number
    error?: string
    details?: Array<{ kept: Memory; merged: Memory[]; reason: string }>
  }> {
    if (!apiKey) {
      return { success: false, consolidated: 0, kept: 0, error: "No API key provided" }
    }

    if (this.memories.length < 2) {
      return { success: true, consolidated: 0, kept: this.memories.length, error: "Not enough memories to consolidate" }
    }

    try {
      console.log("[Memory] Starting consolidation with", this.memories.length, "memories")

      // Group memories by type for better consolidation
      const memoryGroups: Record<string, Memory[]> = {
        preference: this.memories.filter(m => m.type === "preference"),
        fact: this.memories.filter(m => m.type === "fact"),
        context: this.memories.filter(m => m.type === "context"),
        skill: this.memories.filter(m => m.type === "skill"),
        goal: this.memories.filter(m => m.type === "goal"),
      }

      const consolidationActions: Array<{ kept: Memory; merged: Memory[]; reason: string }> = []
      let totalConsolidated = 0

      // Process each type separately
      for (const [type, memories] of Object.entries(memoryGroups)) {
        if (memories.length < 2) continue

        console.log(`[Memory] Analyzing ${memories.length} ${type} memories for consolidation`)

        // Prepare memory list for LLM
        const memoryList = memories.map((m, idx) => ({
          index: idx,
          id: m.id,
          content: m.content,
          importance: m.importance,
          accessCount: m.accessCount,
          createdAt: new Date(m.createdAt).toISOString(),
        }))

        const prompt = `You are a memory consolidation system. Analyze these ${type} memories and identify duplicates or highly overlapping memories that should be merged.

MEMORIES:
${JSON.stringify(memoryList, null, 2)}

RULES:
1. Only merge memories that are clearly about the same thing
2. "User likes TypeScript" and "User prefers TS over JS" should merge
3. "User lives in NYC" and "User lives in San Francisco" are CONFLICTING - do NOT merge (flag as conflict)
4. Prefer keeping the memory with:
   - More detail/specificity
   - Higher access count (more useful)
   - More recent creation date (if same detail level)
5. When merging, combine access counts and keep the better content

Return a JSON array of consolidation groups. Each group should have:
- "keep": index of memory to keep
- "merge": array of indices to merge into it
- "reason": brief explanation
- "isConflict": true if these are conflicting (don't actually merge, just flag)

Example output:
[
  {
    "keep": 0,
    "merge": [2, 5],
    "reason": "All about TypeScript preference, #0 has most detail",
    "isConflict": false
  },
  {
    "keep": 3,
    "merge": [4],
    "reason": "Same location info, #3 is more recent",
    "isConflict": false
  }
]

Return ONLY the JSON array, no markdown or explanation. If no consolidation needed, return [].`

        // Call LLM
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-openrouter-api-key": apiKey,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: prompt }],
            model: this.consolidationModel,
            temperature: 0.2, // Low temp for consistent consolidation decisions
            maxTokens: 2000,
            stream: false,
          }),
        })

        if (!response.ok) {
          console.error(`[Memory] Consolidation API error for ${type}:`, response.status)
          continue
        }

        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ""

        // Parse JSON from response
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (!jsonMatch) {
          console.log(`[Memory] No consolidation groups found for ${type}`)
          continue
        }

        const groups = JSON.parse(jsonMatch[0])

        if (!Array.isArray(groups) || groups.length === 0) {
          console.log(`[Memory] No consolidation needed for ${type}`)
          continue
        }

        console.log(`[Memory] Found ${groups.length} consolidation groups for ${type}`)

        // Process each consolidation group
        for (const group of groups) {
          // Skip conflicts - just log them
          if (group.isConflict) {
            console.warn(`[Memory] CONFLICT detected:`, group.reason)
            continue
          }

          const keepMemory = memories[group.keep]
          const mergeMemories = group.merge.map((idx: number) => memories[idx]).filter(Boolean)

          if (!keepMemory || mergeMemories.length === 0) continue

          // Merge access counts
          const totalAccessCount = keepMemory.accessCount +
            mergeMemories.reduce((sum: number, m: Memory) => sum + m.accessCount, 0)

          consolidationActions.push({
            kept: keepMemory,
            merged: mergeMemories,
            reason: group.reason
          })

          if (!dryRun) {
            // Update the kept memory
            keepMemory.accessCount = totalAccessCount

            // Use the most recent lastAccessedAt
            const allMemories = [keepMemory, ...mergeMemories]
            keepMemory.lastAccessedAt = Math.max(...allMemories.map(m => m.lastAccessedAt))

            // Delete the merged memories
            for (const mergedMemory of mergeMemories) {
              this.permanentlyDeleteMemory(mergedMemory.id)
              totalConsolidated++
            }

            console.log(`[Memory] Consolidated ${mergeMemories.length} memories into:`,
              keepMemory.content.substring(0, 50),
              `(total access count: ${totalAccessCount})`)
          }
        }
      }

      if (!dryRun && totalConsolidated > 0) {
        this.saveMemories()
      }

      const keptCount = this.memories.length
      console.log("[Memory] Consolidation complete:", {
        consolidated: totalConsolidated,
        kept: keptCount,
        dryRun
      })

      return {
        success: true,
        consolidated: totalConsolidated,
        kept: keptCount,
        details: consolidationActions
      }

    } catch (error) {
      console.error("[Memory] Consolidation error:", error)
      return {
        success: false,
        consolidated: 0,
        kept: this.memories.length,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  /**
   * Archive a memory (move to deleted memories)
   */
  archiveMemory(id: string, reason: DeletedMemory["deletionReason"]): boolean {
    const memoryIndex = this.memories.findIndex(m => m.id === id)
    if (memoryIndex === -1) return false

    const memory = this.memories[memoryIndex]
    const archiveRetentionDays = this.settings.archiveRetentionDays ?? DEFAULT_ARCHIVE_RETENTION_DAYS

    const deletedMemory: DeletedMemory = {
      ...memory,
      deletedAt: Date.now(),
      expiresAt: Date.now() + (archiveRetentionDays * MS_PER_DAY),
      deletionReason: reason,
      originalImportance: reason === "demoted" ? 3 : memory.importance,
    }

    // Remove from active memories
    this.memories.splice(memoryIndex, 1)
    this.saveMemories()

    // Add to deleted memories archive
    this.deletedMemories.push(deletedMemory)
    this.saveDeletedMemories()

    console.log("[Memory] Archived memory:", {
      id: id.substring(0, 8),
      reason,
      expiresAt: new Date(deletedMemory.expiresAt).toISOString()
    })

    // Sync to database if enabled
    if (this.syncEnabled && this.userId) {
      // Delete from active memories table
      supabaseSync.deleteMemory(this.userId, id).catch(err => {
        console.error("[Memory] Failed to sync memory deletion to database:", err)
      })
      // Add to deleted memories archive table
      supabaseSync.createDeletedMemory(this.userId, deletedMemory).catch(err => {
        console.error("[Memory] Failed to sync deleted memory to database:", err)
      })
    }

    return true
  }

  /**
   * Restore a deleted memory back to active memories
   */
  restoreMemory(id: string): boolean {
    const deletedIndex = this.deletedMemories.findIndex(m => m.id === id)
    if (deletedIndex === -1) return false

    const deletedMemory = this.deletedMemories[deletedIndex]

    // Create a restored memory (remove deleted metadata)
    const restoredMemory: Memory = {
      id: deletedMemory.id,
      type: deletedMemory.type,
      content: deletedMemory.content,
      category: deletedMemory.category,
      importance: deletedMemory.originalImportance || deletedMemory.importance,
      createdAt: deletedMemory.createdAt,
      lastAccessedAt: Date.now(), // Reset access time
      accessCount: deletedMemory.accessCount,
      source: deletedMemory.source,
      metadata: deletedMemory.metadata,
      embedding: deletedMemory.embedding,
    }

    // Remove from deleted memories
    this.deletedMemories.splice(deletedIndex, 1)
    this.saveDeletedMemories()

    // Add back to active memories
    this.memories.push(restoredMemory)
    this.saveMemories()

    console.log("[Memory] Restored memory:", restoredMemory.content.substring(0, 40))

    // Sync to database if enabled
    if (this.syncEnabled && this.userId) {
      // Remove from deleted memories table
      supabaseSync.removeDeletedMemory(this.userId, id).catch(err => {
        console.error("[Memory] Failed to remove deleted memory from database:", err)
      })
      // Add back to active memories table
      supabaseSync.createMemory(this.userId, restoredMemory).catch(err => {
        console.error("[Memory] Failed to sync restored memory to database:", err)
      })
    }

    return true
  }

  /**
   * Permanently remove memories from archive that have passed their expiration
   */
  cleanupExpiredArchive(): number {
    const now = Date.now()
    const initialCount = this.deletedMemories.length

    this.deletedMemories = this.deletedMemories.filter(m => m.expiresAt > now)

    const removedCount = initialCount - this.deletedMemories.length
    if (removedCount > 0) {
      this.saveDeletedMemories()
      console.log("[Memory] Permanently removed", removedCount, "expired memories from archive")

      // Sync cleanup to database if enabled
      if (this.syncEnabled && this.userId) {
        supabaseSync.cleanupExpiredDeletedMemories(this.userId).catch(err => {
          console.error("[Memory] Failed to cleanup expired memories in database:", err)
        })
      }
    }

    return removedCount
  }

  /**
   * Get all deleted memories
   */
  getDeletedMemories(): DeletedMemory[] {
    return [...this.deletedMemories].sort((a, b) => b.deletedAt - a.deletedAt)
  }

  /**
   * Get deleted memory statistics
   */
  getDeletedStats() {
    return {
      total: this.deletedMemories.length,
      byReason: {
        expired: this.deletedMemories.filter(m => m.deletionReason === "expired").length,
        manual: this.deletedMemories.filter(m => m.deletionReason === "manual").length,
        demoted: this.deletedMemories.filter(m => m.deletionReason === "demoted").length,
      },
      expiringWithin24h: this.deletedMemories.filter(m =>
        m.expiresAt - Date.now() < MS_PER_DAY
      ).length,
    }
  }

  /**
   * Clear all deleted memories permanently
   */
  clearDeletedMemories() {
    this.deletedMemories = []
    this.saveDeletedMemories()
    console.log("[Memory] Cleared all deleted memories")

    // Sync to database if enabled
    if (this.syncEnabled && this.userId) {
      supabaseSync.clearDeletedMemories(this.userId).catch(err => {
        console.error("[Memory] Failed to clear deleted memories in database:", err)
      })
    }
  }

  /**
   * Add a new memory (with deduplication check)
   */
  addMemory(memory: Omit<Memory, "id" | "createdAt" | "lastAccessedAt" | "accessCount">, apiKey?: string): Memory {
    // Check for duplicates before adding
    if (memory.content && this.isMemoryDuplicate(memory.content, this.memories)) {
      console.log("[Memory] Skipping duplicate memory:", memory.content.substring(0, 40))
      // Return the existing memory that matches
      const existing = this.memories.find(m =>
        m.content.toLowerCase().trim() === memory.content.toLowerCase().trim()
      )
      if (existing) return existing
    }

    const newMemory: Memory = {
      ...memory,
      id: generateUUID(),
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
    }

    this.memories.push(newMemory)
    this.saveMemories()

    // Sync to database if enabled
    if (this.syncEnabled && this.userId) {
      supabaseSync.createMemory(this.userId, newMemory).catch(err => {
        console.error("[Memory] Failed to sync new memory to database:", err)
      })
    }

    // Generate embedding asynchronously (don't block)
    if (apiKey && this.settings.useSemanticSearch !== false) {
      this.embedMemory(newMemory.id, newMemory.content, apiKey).catch(err => {
        console.error("[Memory] Failed to generate embedding:", err)
      })
    }

    console.log("[Memory] Added:", newMemory.type, "-", newMemory.content.substring(0, 50))
    return newMemory
  }

  /**
   * Generate and store embedding for a memory
   */
  async embedMemory(memoryId: string, content: string, apiKey: string): Promise<void> {
    try {
      console.log("[Memory] Generating embedding for:", memoryId.substring(0, 8))
      const startTime = Date.now()

      const embedding = await generateEmbedding(content, apiKey)

      // Update local memory
      const memoryIndex = this.memories.findIndex(m => m.id === memoryId)
      if (memoryIndex !== -1) {
        this.memories[memoryIndex].embedding = embedding
        this.saveMemories()
      }

      // Update in database if enabled
      if (this.syncEnabled && this.userId) {
        await supabaseSync.updateMemoryEmbedding(this.userId, memoryId, embedding)
      }

      console.log("[Memory] Embedding generated:", {
        memoryId: memoryId.substring(0, 8),
        dimensions: embedding.length,
        latency: `${Date.now() - startTime}ms`
      })
    } catch (error) {
      console.error("[Memory] Embedding generation failed:", error)
      throw error
    }
  }

  /**
   * Generate embeddings for all memories that don't have one
   */
  async embedAllMemories(apiKey: string): Promise<{ success: number; failed: number }> {
    const memoriesWithoutEmbedding = this.memories.filter(m => !m.embedding || m.embedding.length === 0)

    console.log("[Memory] Embedding", memoriesWithoutEmbedding.length, "memories without embeddings")

    let success = 0
    let failed = 0

    for (const memory of memoriesWithoutEmbedding) {
      try {
        await this.embedMemory(memory.id, memory.content, apiKey)
        success++
      } catch (err) {
        failed++
      }
    }

    console.log("[Memory] Batch embedding complete:", { success, failed })
    return { success, failed }
  }

  /**
   * Get all memories
   */
  getAllMemories(): Memory[] {
    return [...this.memories].sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * Remove duplicate memories (keeps the oldest one)
   * Call this to clean up existing duplicates
   */
  removeDuplicates(): number {
    const seen = new Map<string, Memory>()
    const duplicateIds: string[] = []

    // Sort by createdAt ascending (oldest first) so we keep the original
    const sorted = [...this.memories].sort((a, b) => a.createdAt - b.createdAt)

    for (const memory of sorted) {
      const normalizedContent = memory.content.toLowerCase().trim()

      if (seen.has(normalizedContent)) {
        // This is a duplicate - mark for removal
        duplicateIds.push(memory.id)
        console.log("[Memory] Found duplicate:", memory.content.substring(0, 40))
      } else {
        seen.set(normalizedContent, memory)
      }
    }

    // Remove duplicates
    if (duplicateIds.length > 0) {
      this.memories = this.memories.filter(m => !duplicateIds.includes(m.id))
      this.saveMemories()

      // Sync deletions to database
      if (this.syncEnabled && this.userId) {
        for (const id of duplicateIds) {
          supabaseSync.deleteMemory(this.userId, id).catch(err => {
            console.error("[Memory] Failed to delete duplicate from DB:", err)
          })
        }
      }

      console.log(`[Memory] Removed ${duplicateIds.length} duplicate memories`)
    }

    return duplicateIds.length
  }

  /**
   * Get memories by type
   */
  getMemoriesByType(type: Memory["type"]): Memory[] {
    return this.memories.filter((m) => m.type === type)
  }

  /**
   * Get relevant memories for a query (token-efficient)
   * Uses keyword matching and importance scoring
   */
  getRelevantMemories(query: string, limit?: number): Memory[] {
    const maxResults = limit || this.settings.maxMemoriesInContext
    const threshold = this.settings.importanceThreshold
    const minScore = 15 // Minimum score to be considered relevant

    // Tokenize query
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)

    // Score each memory
    const scored = this.memories
      .filter(m => m.importance >= threshold)
      .map(memory => {
        let score = 0

        // Importance weight (0-15 points) - reduced from 10x to 5x to reduce bias
        score += memory.importance * 5

        // Keyword matching (0-50 points) - now more influential
        const contentLower = memory.content.toLowerCase()
        const categoryLower = (memory.category || "").toLowerCase()

        for (const token of queryTokens) {
          if (contentLower.includes(token)) score += 10
          if (categoryLower.includes(token)) score += 5
        }

        // Recency bonus (0-20 points)
        const daysSinceCreated = (Date.now() - memory.createdAt) / (1000 * 60 * 60 * 24)
        if (daysSinceCreated < 7) score += 20
        else if (daysSinceCreated < 30) score += 10
        else if (daysSinceCreated < 90) score += 5

        return { memory, score }
      })
      .filter(({ score }) => score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)

    // Update access stats for retrieved memories
    scored.forEach(({ memory }) => {
      const m = this.memories.find(mem => mem.id === memory.id)
      if (m) {
        m.lastAccessedAt = Date.now()
        m.accessCount++
      }
    })
    if (scored.length > 0) {
      this.saveMemories()
      console.log("[Memory] Updated access stats for", scored.length, "memories (keyword search)")
    }

    return scored.map(({ memory }) => memory)
  }

  /**
   * Get relevant memories using semantic similarity (embedding-based)
   * Falls back to keyword matching if embeddings aren't available
   */
  async getSemanticRelevantMemories(
    query: string,
    apiKey: string,
    limit?: number
  ): Promise<Array<Memory & { similarity?: number }>> {
    const maxResults = limit || this.settings.maxMemoriesInContext
    // Use minRelevanceScore for semantic search threshold (typically lower than similarityThreshold)
    // This allows for more flexible matching of semantically related content
    const threshold = this.settings.minRelevanceScore || 0.25

    // First, try database-level semantic search if enabled
    if (this.syncEnabled && this.userId) {
      try {
        console.log("[Memory] Attempting database semantic search...")
        const queryEmbedding = await generateEmbedding(query, apiKey)

        const results = await supabaseSync.semanticSearchMemories(
          this.userId,
          queryEmbedding,
          { threshold, limit: maxResults }
        )

        if (results.length > 0) {
          console.log("[Memory] Database semantic search returned", results.length, "memories")
          // Update access stats for retrieved memories
          let statsUpdated = 0
          for (const result of results) {
            const m = this.memories.find(mem => mem.id === result.id)
            if (m) {
              m.lastAccessedAt = Date.now()
              m.accessCount++
              statsUpdated++
            }
          }
          this.saveMemories()
          console.log("[Memory] Updated access stats for", statsUpdated, "memories")
          return results
        }

        // Fallback to client-side if database returned nothing
        console.log("[Memory] Database returned no results, trying client-side search...")
        return this.clientSideSemanticSearch(queryEmbedding, maxResults, threshold)
      } catch (error) {
        console.error("[Memory] Database semantic search failed:", error)
        // Fall through to client-side search
      }
    }

    // Client-side semantic search
    try {
      console.log("[Memory] Using client-side semantic search...")
      const queryEmbedding = await generateEmbedding(query, apiKey)
      return this.clientSideSemanticSearch(queryEmbedding, maxResults, threshold)
    } catch (error) {
      console.error("[Memory] Client-side semantic search failed:", error)
      // Ultimate fallback: keyword matching
      console.log("[Memory] Falling back to keyword matching")
      return this.getRelevantMemories(query, limit)
    }
  }

  /**
   * Client-side semantic search using local embeddings
   */
  private clientSideSemanticSearch(
    queryEmbedding: number[],
    maxResults: number,
    threshold: number
  ): Array<Memory & { similarity: number }> {
    const memoriesWithEmbeddings = this.memories.filter(
      m => m.embedding && m.embedding.length > 0
    )

    if (memoriesWithEmbeddings.length === 0) {
      console.log("[Memory] No memories with embeddings for client-side search")
      return []
    }

    const results = findSimilar(queryEmbedding, memoriesWithEmbeddings, {
      threshold,
      maxResults,
    })

    console.log("[Memory] Client-side semantic search found", results.length, "memories")

    // Update access stats for retrieved memories
    let statsUpdated = 0
    for (const result of results) {
      const m = this.memories.find(mem => mem.id === result.id)
      if (m) {
        m.lastAccessedAt = Date.now()
        m.accessCount++
        statsUpdated++
      }
    }
    if (statsUpdated > 0) {
      this.saveMemories()
      console.log("[Memory] Updated access stats for", statsUpdated, "memories (client-side search)")
    }

    return results
  }

  /**
   * Format memories for LLM context (token-efficient)
   */
  formatMemoriesForContext(memories: Memory[]): string {
    if (memories.length === 0) return ""

    const grouped: Record<Memory["type"], Memory[]> = {
      preference: [],
      fact: [],
      context: [],
      skill: [],
      goal: [],
    }

    memories.forEach(m => grouped[m.type].push(m))

    const sections: string[] = []

    if (grouped.preference.length > 0) {
      sections.push(`Preferences: ${grouped.preference.map(m => m.content).join("; ")}`)
    }
    if (grouped.fact.length > 0) {
      sections.push(`Facts: ${grouped.fact.map(m => m.content).join("; ")}`)
    }
    if (grouped.context.length > 0) {
      sections.push(`Context: ${grouped.context.map(m => m.content).join("; ")}`)
    }
    if (grouped.skill.length > 0) {
      sections.push(`Skills: ${grouped.skill.map(m => m.content).join("; ")}`)
    }
    if (grouped.goal.length > 0) {
      sections.push(`Goals: ${grouped.goal.map(m => m.content).join("; ")}`)
    }

    return `<user_memory>\n${sections.join("\n")}\n</user_memory>`
  }

  /**
   * Update an existing memory
   */
  updateMemory(id: string, updates: Partial<Memory>): boolean {
    const index = this.memories.findIndex(m => m.id === id)
    if (index === -1) return false

    this.memories[index] = {
      ...this.memories[index],
      ...updates,
    }
    this.saveMemories()

    // Sync to database if enabled
    if (this.syncEnabled && this.userId) {
      supabaseSync.updateMemory(this.userId, this.memories[index]).catch(err => {
        console.error("[Memory] Failed to sync memory update to database:", err)
      })
    }

    return true
  }

  /**
   * Delete a memory (archives it to deleted memories for potential restoration)
   */
  deleteMemory(id: string): boolean {
    // Archive the memory instead of permanently deleting
    // This allows users to restore it within the archive retention period
    return this.archiveMemory(id, "manual")
  }

  /**
   * Permanently delete a memory without archiving
   * Use this for immediate permanent deletion (bypasses archive)
   */
  permanentlyDeleteMemory(id: string): boolean {
    const index = this.memories.findIndex(m => m.id === id)
    if (index === -1) return false

    this.memories.splice(index, 1)
    this.saveMemories()

    // Sync to database if enabled
    if (this.syncEnabled && this.userId) {
      supabaseSync.deleteMemory(this.userId, id).catch(err => {
        console.error("[Memory] Failed to sync memory deletion to database:", err)
      })
    }

    return true
  }

  /**
   * Permanently delete a memory from the archive
   */
  permanentlyDeleteFromArchive(id: string): boolean {
    const index = this.deletedMemories.findIndex(m => m.id === id)
    if (index === -1) return false

    this.deletedMemories.splice(index, 1)
    this.saveDeletedMemories()

    console.log("[Memory] Permanently deleted memory from archive:", id.substring(0, 8))

    // Sync to database if enabled
    if (this.syncEnabled && this.userId) {
      supabaseSync.removeDeletedMemory(this.userId, id).catch(err => {
        console.error("[Memory] Failed to remove deleted memory from database:", err)
      })
    }

    return true
  }

  /**
   * Clear all memories
   */
  clearAllMemories() {
    this.memories = []
    this.saveMemories()

    // Sync to database if enabled
    if (this.syncEnabled && this.userId) {
      supabaseSync.deleteAllMemories(this.userId).catch(err => {
        console.error("[Memory] Failed to sync memory clear to database:", err)
      })
    }
  }

  /**
   * Integrate profile information into memory system
   * Uses LLM to intelligently categorize and assign importance
   */
  async integrateProfile(profile: any, apiKey: string): Promise<{ success: boolean; memoriesCreated: number; error?: string }> {
    try {
      console.log("[Memory] Integrating profile into memory system...")

      // Step 1: Delete existing profile memories
      const existingProfileMemories = this.memories.filter(m => m.source === "profile")
      for (const memory of existingProfileMemories) {
        this.deleteMemory(memory.id)
      }
      console.log("[Memory] Removed", existingProfileMemories.length, "old profile memories")

      // Step 2: Prepare profile data for LLM processing
      const profileData: Record<string, any> = {}
      if (profile.name) profileData.name = profile.name
      if (profile.age) profileData.age = profile.age
      if (profile.occupation) profileData.occupation = profile.occupation
      if (profile.location) profileData.location = profile.location
      if (profile.aboutMe) profileData.aboutMe = profile.aboutMe
      if (profile.interests?.length > 0) profileData.interests = profile.interests
      if (profile.goals?.length > 0) profileData.goals = profile.goals
      if (profile.preferences?.communicationStyle) profileData.communicationStyle = profile.preferences.communicationStyle
      if (profile.preferences?.topicsToAvoid?.length > 0) profileData.topicsToAvoid = profile.preferences.topicsToAvoid

      // If no profile data, nothing to do
      if (Object.keys(profileData).length === 0) {
        console.log("[Memory] No profile data to integrate")
        return { success: true, memoriesCreated: 0 }
      }

      // Step 3: Use LLM to categorize profile information
      const prompt = `You are a memory categorization system. Given user profile information, convert each piece of information into structured memory entries.

For each piece of profile information, determine:
1. Memory type: "fact" (concrete information), "preference" (likes/dislikes), "goal" (aspirations), "context" (background), or "skill" (abilities)
2. Importance: 1 (low), 2 (medium), or 3 (high)
3. Clear, concise content (one fact per memory)

Guidelines:
- Name, age, occupation, location are typically "fact" type with importance 3 (high)
- Interests and hobbies are "preference" type with importance 2 (medium)
- Goals and aspirations are "goal" type with importance 2-3
- Communication style is "preference" type with importance 2
- Break lists (interests, goals) into individual memories
- Make content clear and searchable (e.g., "User's name is John" not just "John")

Profile data:
${JSON.stringify(profileData, null, 2)}

Return a JSON array of memory objects with this structure:
[
  {
    "type": "fact" | "preference" | "goal" | "context" | "skill",
    "content": "clear, searchable description",
    "category": "personal_info" | "interests" | "goals" | "communication" | "background",
    "importance": 1 | 2 | 3
  }
]

Return ONLY the JSON array, no other text.`

      // Call LLM
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== "undefined" ? window.location.href : "https://chameleon-ai.chat",
        },
        body: JSON.stringify({
          model: this.extractionModel,
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.3, // Low temperature for consistent categorization
        }),
      })

      if (!response.ok) {
        throw new Error(`LLM request failed: ${response.statusText}`)
      }

      const data = await response.json()
      const llmResponse = data.choices?.[0]?.message?.content?.trim()

      if (!llmResponse) {
        throw new Error("Empty LLM response")
      }

      // Parse LLM response (extract JSON from markdown if needed)
      let memoriesData: any[]
      try {
        // Remove markdown code blocks if present
        const jsonMatch = llmResponse.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) ||
                         llmResponse.match(/(\[[\s\S]*?\])/)
        const jsonStr = jsonMatch ? jsonMatch[1] : llmResponse
        memoriesData = JSON.parse(jsonStr)
      } catch (parseError) {
        console.error("[Memory] Failed to parse LLM response:", llmResponse)
        throw new Error("Failed to parse LLM response as JSON")
      }

      if (!Array.isArray(memoriesData)) {
        throw new Error("LLM response is not an array")
      }

      // Step 4: Create memories from LLM output (with deduplication)
      // Get non-profile memories to check for duplicates
      const nonProfileMemories = this.memories.filter(m => m.source !== "profile")

      let createdCount = 0
      let skippedDuplicates = 0
      for (const memData of memoriesData) {
        try {
          // Check for duplicates before adding
          if (this.isMemoryDuplicate(memData.content, nonProfileMemories)) {
            console.log("[Memory] Skipping duplicate profile memory:", memData.content.substring(0, 40))
            skippedDuplicates++
            continue
          }

          const memory = this.addMemory({
            type: memData.type,
            content: memData.content,
            category: memData.category,
            importance: memData.importance,
            source: "profile",
            metadata: { profileField: "auto-categorized" }
          }, apiKey)

          // Generate embedding if API key provided and sync enabled
          if (apiKey && this.settings.useSemanticSearch) {
            try {
              await this.embedMemory(memory.id, memory.content, apiKey)
            } catch (embedError) {
              console.warn("[Memory] Failed to generate embedding for profile memory:", embedError)
              // Continue even if embedding fails
            }
          }

          createdCount++
        } catch (error) {
          console.error("[Memory] Failed to create memory from LLM output:", memData, error)
          // Continue with other memories
        }
      }

      console.log("[Memory] Profile integration complete:", createdCount, "created,", skippedDuplicates, "duplicates skipped")
      return { success: true, memoriesCreated: createdCount }

    } catch (error) {
      console.error("[Memory] Profile integration failed:", error)
      return {
        success: false,
        memoriesCreated: 0,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  /**
   * Get memory statistics
   */
  getStats() {
    return {
      total: this.memories.length,
      byType: {
        preference: this.memories.filter(m => m.type === "preference").length,
        fact: this.memories.filter(m => m.type === "fact").length,
        context: this.memories.filter(m => m.type === "context").length,
        skill: this.memories.filter(m => m.type === "skill").length,
        goal: this.memories.filter(m => m.type === "goal").length,
      },
      byImportance: {
        high: this.memories.filter(m => m.importance === 3).length,
        medium: this.memories.filter(m => m.importance === 2).length,
        low: this.memories.filter(m => m.importance === 1).length,
      },
    }
  }

  /**
   * Check if a memory is a duplicate of an existing memory
   * Uses multiple strategies to detect duplicates:
   * 1. Exact match (case-insensitive)
   * 2. Key-value pattern matching (e.g., "name is X", "age is Y")
   * 3. Same key type with high value overlap (catches "John Smith" vs "John")
   * 4. High substring overlap (>75% similar)
   */
  isMemoryDuplicate(newContent: string, existingMemories: Memory[]): boolean {
    if (!newContent || existingMemories.length === 0) return false

    const newContentLower = newContent.toLowerCase().trim()
    const newContentNormalized = this.normalizeMemoryContent(newContentLower)

    // Extract key-value from new content once
    const newKeyValue = this.extractKeyValue(newContentLower)

    for (const existing of existingMemories) {
      const existingLower = existing.content.toLowerCase().trim()
      const existingNormalized = this.normalizeMemoryContent(existingLower)

      // Strategy 1: Exact match (normalized)
      if (newContentNormalized === existingNormalized) {
        console.log("[Memory] Duplicate: exact match")
        return true
      }

      // Strategy 2: Key-value pattern matching (for profile-like data)
      const existingKeyValue = this.extractKeyValue(existingLower)
      if (newKeyValue && existingKeyValue && newKeyValue.key === existingKeyValue.key) {
        // Same key type - check if values match or overlap significantly
        if (newKeyValue.value === existingKeyValue.value) {
          console.log("[Memory] Duplicate: same key-value pair", newKeyValue.key, "=", newKeyValue.value)
          return true
        }

        // For name/age/location, check if one value contains the other
        // This catches: "John" vs "John Smith" or "35" vs "35 years"
        if (MemoryService.CRITICAL_KEYS.includes(newKeyValue.key)) {
          const newVal = newKeyValue.value
          const existingVal = existingKeyValue.value

          // Check containment (one is substring of other)
          if (newVal.includes(existingVal) || existingVal.includes(newVal)) {
            console.log("[Memory] Duplicate: same key with overlapping value",
              newKeyValue.key, ":", existingVal, "~=", newVal)
            return true
          }

          // For age specifically, check if numeric values match
          if (newKeyValue.key === "age") {
            const newAge = newVal.match(/\d+/)?.[0]
            const existingAge = existingVal.match(/\d+/)?.[0]
            if (newAge && existingAge && newAge === existingAge) {
              console.log("[Memory] Duplicate: same age value", newAge)
              return true
            }
          }

          // Check high similarity between values of same key
          const valueSimilarity = this.calculateSimilarity(newVal, existingVal)
          if (valueSimilarity > 0.7) {
            console.log("[Memory] Duplicate: same key with similar value",
              newKeyValue.key, valueSimilarity.toFixed(2))
            return true
          }
        }
      }

      // Strategy 3: High substring overlap (for longer content)
      // Lowered from 0.85 to 0.75 to catch more variations
      const similarity = this.calculateSimilarity(newContentNormalized, existingNormalized)
      if (similarity > 0.75) {
        console.log("[Memory] Duplicate: high similarity", similarity.toFixed(2))
        return true
      }

      // Strategy 4: Check if both memories contain the same core information
      // e.g., both mention "Vienna" for location, or both mention "developer" for occupation
      if (newKeyValue && existingKeyValue &&
          newKeyValue.key === existingKeyValue.key &&
          MemoryService.CRITICAL_KEYS.includes(newKeyValue.key)) {
        // Extract core words (3+ chars) and check overlap
        const newWords = new Set(newKeyValue.value.split(/\s+/).filter(w => w.length >= 3))
        const existingWords = new Set(existingKeyValue.value.split(/\s+/).filter(w => w.length >= 3))

        if (newWords.size > 0 && existingWords.size > 0) {
          const intersection = [...newWords].filter(w => existingWords.has(w))
          // If any significant word overlaps, consider it a duplicate
          if (intersection.length > 0) {
            console.log("[Memory] Duplicate: same key with shared core word",
              newKeyValue.key, ":", intersection.join(", "))
            return true
          }
        }
      }
    }

    return false
  }

  // Helper constant for critical keys used in duplicate detection
  private static readonly CRITICAL_KEYS = ["name", "age", "location", "occupation"]

  /**
   * Normalize memory content for comparison
   * Removes common filler words and punctuation
   */
  private normalizeMemoryContent(content: string): string {
    return content
      .replace(/user's?|the user|my/gi, "")
      .replace(/\bis\b|\bare\b|\bhas\b|\bhave\b/gi, "")
      .replace(/['".,!?:;]/g, "")
      .replace(/\s+/g, " ")
      .trim()
  }

  /**
   * Extract key-value pattern from memory content
   * Handles many variations like: "name is John", "user's age: 35", "location: Vienna"
   * Also extracts the raw value for comparison
   */
  private extractKeyValue(content: string): { key: string; value: string; rawValue: string } | null {
    // Comprehensive patterns for common profile fields
    // Each pattern group maps to a specific key
    const patternGroups: Array<{ key: string; patterns: RegExp[] }> = [
      {
        key: "name",
        patterns: [
          /(?:user'?s?\s+)?name\s*(?:is|:)\s*(.+)/i,
          /(?:called|named)\s+(.+)/i,
          /(?:goes by|known as)\s+(.+)/i,
          /(.+?)\s+is\s+(?:the\s+)?(?:user'?s?\s+)?name/i,
        ]
      },
      {
        key: "age",
        patterns: [
          /(?:user'?s?\s+)?age\s*(?:is|:)\s*(\d+)/i,
          /(\d+)\s*years?\s*old/i,
          /(?:is|are)\s+(\d+)\s*(?:years?\s*old)?/i,
          /born\s+in\s+(\d{4})/i, // Will extract birth year
          /age:\s*(\d+)/i,
        ]
      },
      {
        key: "location",
        patterns: [
          /(?:user\s+)?(?:lives?|living|located|based)\s+(?:in|at)\s+(.+)/i,
          /(?:from|city|location|hometown)\s*(?:is|:)\s*(.+)/i,
          /(?:resides?|residing)\s+(?:in|at)\s+(.+)/i,
          /(?:in|at|from)\s+([A-Z][a-z]+(?:\s*,\s*[A-Z][a-z]+)?)/i, // City, Country pattern
        ]
      },
      {
        key: "occupation",
        patterns: [
          /(?:user\s+)?(?:works?|working)\s+(?:as\s+)?(?:a\s+)?(.+)/i,
          /(?:job|occupation|profession|role|career)\s*(?:is|:)\s*(.+)/i,
          /(?:is\s+a|am\s+a)\s+(.+?)(?:\s+(?:at|for|in)|$)/i,
          /(?:employed|hired)\s+(?:as\s+)?(?:a\s+)?(.+)/i,
        ]
      },
      {
        key: "interests",
        patterns: [
          /(?:user\s+)?(?:interested?|likes?|enjoys?|loves?)\s+(.+)/i,
          /(?:interests?|hobbies?|passions?)\s*(?:is|are|:)\s*(.+)/i,
          /(?:into|fond of|fan of)\s+(.+)/i,
        ]
      },
      {
        key: "goals",
        patterns: [
          /(?:user\s+)?(?:wants?|wishes?|hopes?)\s+to\s+(.+)/i,
          /(?:goals?|aspirations?|objectives?)\s*(?:is|are|:)\s*(.+)/i,
          /(?:trying|planning|aiming)\s+to\s+(.+)/i,
          /(?:dreams?\s+of|strives?\s+for)\s+(.+)/i,
        ]
      },
      {
        key: "communication",
        patterns: [
          /(?:prefers?|likes?)\s+(.+?)\s*(?:communication|responses?|style)/i,
          /(?:communication\s+style|tone)\s*(?:is|:)\s*(.+)/i,
        ]
      }
    ]

    for (const group of patternGroups) {
      for (const pattern of group.patterns) {
        const match = content.match(pattern)
        if (match && match[1]) {
          const rawValue = match[1].trim()
          // Normalize the value: lowercase, remove trailing punctuation
          const value = rawValue.toLowerCase()
            .replace(/[.,;:!?]+$/, '')
            .trim()
          return { key: group.key, value, rawValue }
        }
      }
    }

    return null
  }

  /**
   * Calculate Jaccard similarity between two strings
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 2))
    const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 2))

    if (words1.size === 0 && words2.size === 0) return 1
    if (words1.size === 0 || words2.size === 0) return 0

    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])

    return intersection.size / union.size
  }

  /**
   * Extract memories from conversation (auto-extract feature)
   * Returns suggested memories that user can review and save
   */
  extractMemoriesFromConversation(userMessage: string, assistantMessage: string): Memory[] {
    const suggestions: Omit<Memory, "id" | "createdAt" | "lastAccessedAt" | "accessCount">[] = []

    // Preference patterns
    const preferencePatterns = [
      /I (?:prefer|like|love|enjoy|want) (.+?)(?:\.|$)/gi,
      /I don't (?:like|want|prefer|enjoy) (.+?)(?:\.|$)/gi,
      /My preference is (.+?)(?:\.|$)/gi,
    ]

    // Fact patterns
    const factPatterns = [
      /I (?:am|work as|study|live in) (.+?)(?:\.|$)/gi,
      /My (?:name|job|role|hobby|interest) is (.+?)(?:\.|$)/gi,
      /I have (.+?)(?:\.|$)/gi,
    ]

    // Goal patterns
    const goalPatterns = [
      /I (?:want to|need to|plan to|goal is to) (.+?)(?:\.|$)/gi,
      /I'm (?:trying to|working on|learning) (.+?)(?:\.|$)/gi,
    ]

    const combined = `${userMessage} ${assistantMessage}`.toLowerCase()

    // Extract preferences
    preferencePatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(combined)) !== null) {
        const content = match[1].trim()
        if (content.length > 10 && content.length < 200) {
          suggestions.push({
            type: "preference",
            content: `User ${match[0].includes("don't") ? "doesn't" : ""} prefers: ${content}`,
            importance: 2,
          })
        }
      }
    })

    // Extract facts
    factPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(combined)) !== null) {
        const content = match[1].trim()
        if (content.length > 3 && content.length < 200) {
          suggestions.push({
            type: "fact",
            content: `User ${match[0].split(" ")[1]}: ${content}`,
            importance: 2,
          })
        }
      }
    })

    // Extract goals
    goalPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(combined)) !== null) {
        const content = match[1].trim()
        if (content.length > 10 && content.length < 200) {
          suggestions.push({
            type: "goal",
            content: `User wants to: ${content}`,
            importance: 3,
          })
        }
      }
    })

    // Convert to full Memory objects (without saving yet)
    return suggestions.map(s => ({
      ...s,
      id: generateUUID(),
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
    }))
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<MemorySettings>) {
    this.settings = {
      ...this.settings,
      ...settings,
    }
  }

  /**
   * Get current settings
   */
  getSettings(): MemorySettings {
    return { ...this.settings }
  }

  /**
   * Extract memories using LLM (like Claude/ChatGPT do)
   * Uses a cheap model to analyze conversation and extract key facts
   */
  async extractMemoriesWithLLM(
    userMessage: string,
    assistantMessage: string,
    apiKey?: string
  ): Promise<Memory[]> {
    if (!apiKey) {
      console.log("[Memory] No API key, skipping LLM extraction")
      return []
    }

    // Get existing memories to avoid duplicates
    const existingMemories = this.getAllMemories()
    const existingContent = existingMemories.map(m => m.content.toLowerCase()).join("; ")

    const extractionPrompt = `Analyze this conversation and extract key facts about the user that should be remembered long-term.

EXISTING MEMORIES (do NOT duplicate these):
${existingContent || "None yet"}

CONVERSATION:
User: "${userMessage}"
Assistant: "${assistantMessage}"

RULES:
1. Only extract NEW information not already in existing memories
2. Only include truly important, long-term relevant facts
3. Focus on: preferences, personal facts, goals, skills, work context
4. Ignore: temporary questions, greetings, one-time requests
5. Be concise - each memory should be 5-15 words
6. Return empty array [] if nothing worth remembering

Return ONLY a valid JSON array (no markdown, no explanation):
[{"type": "preference|fact|goal|skill|context", "content": "...", "importance": 1|2|3}]

importance: 1=low (nice to know), 2=medium (useful), 3=high (very important)`

    try {
      console.log("[Memory] Starting LLM extraction with model:", this.extractionModel)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openrouter-api-key": apiKey,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: extractionPrompt }],
          model: this.extractionModel,
          temperature: 0.3, // Low temp for consistent extraction
          maxTokens: 500,
          stream: false,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[Memory] Extraction API error:", response.status, errorText)
        return []
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ""
      console.log("[Memory] LLM response:", content)

      // Parse JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        console.log("[Memory] No valid JSON in extraction response:", content.substring(0, 100))
        return []
      }

      let extracted
      try {
        extracted = JSON.parse(jsonMatch[0])
      } catch (parseError) {
        // Try to fix common JSON issues from LLMs
        console.log("[Memory] JSON parse failed, attempting to fix...")
        let fixedJson = jsonMatch[0]
        // Fix missing commas between properties (e.g., "value"key" -> "value","key")
        fixedJson = fixedJson.replace(/"(\s*)([a-zA-Z])/g, '","$2')
        // Fix missing quotes around property names
        fixedJson = fixedJson.replace(/,\s*([a-zA-Z_]+)\s*:/g, ',"$1":')
        // Fix truncated strings that break JSON
        fixedJson = fixedJson.replace(/([^\\])"([^"]*?)([a-zA-Z]+)":/g, '$1"$2","$3":')

        try {
          extracted = JSON.parse(fixedJson)
          console.log("[Memory] Fixed JSON parsed successfully")
        } catch (secondError) {
          console.error("[Memory] LLM extraction error:", parseError)
          console.log("[Memory] Could not fix malformed JSON, skipping extraction")
          return []
        }
      }
      console.log("[Memory] Parsed extraction:", extracted)

      if (!Array.isArray(extracted) || extracted.length === 0) {
        console.log("[Memory] No memories extracted (empty array)")
        return []
      }

      // Convert to Memory objects and deduplicate
      const newMemories: Memory[] = []

      for (const item of extracted) {
        console.log("[Memory] Processing item:", item)

        // Enhanced deduplication - check for semantic similarity, not just first 30 chars
        const contentLower = item.content?.toLowerCase() || ""
        if (existingContent && existingContent.length > 0 && contentLower.length > 0) {
          // Check if this exact content or very similar content already exists
          const isDuplicate = this.isMemoryDuplicate(item.content, existingMemories)
          if (isDuplicate) {
            console.log("[Memory] Skipping duplicate:", item.content?.substring(0, 50))
            continue
          }
        }

        // Validate structure
        if (!item.type || !item.content || item.importance === undefined) {
          console.log("[Memory] Skipping invalid item (missing fields):", item)
          continue
        }

        if (!["preference", "fact", "goal", "skill", "context"].includes(item.type)) {
          console.log("[Memory] Skipping invalid type:", item.type)
          continue
        }

        if (![1, 2, 3].includes(item.importance)) {
          console.log("[Memory] Invalid importance, defaulting to 2:", item.importance)
          item.importance = 2
        }

        const memory: Memory = {
          id: generateUUID(),
          type: item.type,
          content: item.content,
          importance: item.importance,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          accessCount: 0,
        }

        newMemories.push(memory)
        console.log("[Memory] Added to newMemories:", memory.type, "-", memory.content)
      }

      // Auto-save the new memories
      for (const memory of newMemories) {
        this.memories.push(memory)
        console.log("[Memory] Auto-saved:", memory.type, "-", memory.content)
      }

      if (newMemories.length > 0) {
        this.saveMemories()
      }

      return newMemories
    } catch (error) {
      console.error("[Memory] LLM extraction error:", error)
      return []
    }
  }

  /**
   * Check if conversation qualifies for memory extraction
   * Requires 4+ messages (2 user + 2 assistant minimum)
   */
  shouldExtractMemories(messageCount: number): boolean {
    const shouldExtract = this.settings.enabled && this.settings.autoExtract && messageCount >= 4
    console.log("[Memory] shouldExtractMemories check:", {
      enabled: this.settings.enabled,
      autoExtract: this.settings.autoExtract,
      messageCount,
      required: 4,
      result: shouldExtract
    })
    return shouldExtract
  }

  /**
   * Classify if a query needs memory context using LLM
   * This is the intelligent gating mechanism that decides whether to retrieve memories
   */
  async classifyQueryForMemory(
    query: string,
    apiKey?: string
  ): Promise<QueryClassification> {
    // Default: don't use memory if we can't classify
    // Use confidence=1.0 so that factual queries get skipped (confidence >= threshold)
    const defaultResult: QueryClassification = {
      needsMemory: false,
      confidence: 1.0,
      reason: "No API key available - assuming factual query",
      queryType: "factual"
    }

    if (!apiKey) {
      console.log("[Memory] No API key, skipping query classification (will skip memory retrieval)")
      return defaultResult
    }

    // Skip classification for very short queries (likely commands or simple questions)
    if (query.trim().length < 5) {
      console.log("[Memory] Query too short, skipping memory")
      return {
        needsMemory: false,
        confidence: 0.95,
        reason: "Query too short",
        queryType: "factual"
      }
    }

    const classificationPrompt = `You are a query classifier. Determine if this user query would benefit from knowing personal information about the user (their preferences, facts about them, goals, skills, etc).

QUERY: "${query}"

CLASSIFICATION RULES:
- "factual": Generic questions with objective answers. Math, definitions, facts, code syntax, translations, conversions. NO memory needed.
- "personal": Questions about recommendations, preferences, projects, or anything where knowing the user helps. Memory NEEDED.
- "ambiguous": Could go either way - lean towards NO memory to save tokens.

EXAMPLES:
- "What is 2+2?" → factual (math, no personalization needed)
- "Convert 5kg to lbs" → factual (conversion, no personalization)
- "What's the capital of France?" → factual (trivia, no personalization)
- "Explain async/await in JavaScript" → factual (education, no personalization)
- "Recommend a book for me" → personal (needs preferences)
- "Help me with my project" → personal (needs context about their project)
- "What should I learn next?" → personal (needs their goals/skills)
- "Write an email to my boss" → personal (needs work context)
- "Continue what we discussed" → personal (explicit memory reference)
- "Based on my preferences..." → personal (explicit memory reference)

Respond with ONLY valid JSON (no markdown):
{"needsMemory": true/false, "confidence": 0.0-1.0, "reason": "brief explanation", "queryType": "factual|personal|ambiguous"}`

    try {
      console.log("[Memory] Classifying query:", query.substring(0, 50))
      const startTime = Date.now()

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openrouter-api-key": apiKey,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: classificationPrompt }],
          model: this.classifierModel,
          temperature: 0.1, // Very low temp for consistent classification
          maxTokens: 100, // Classification is tiny
          stream: false,
        }),
      })

      const latency = Date.now() - startTime
      console.log("[Memory] Classification latency:", latency, "ms")

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[Memory] Classification API error:", response.status, errorText)
        return defaultResult
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ""
      console.log("[Memory] Classification response:", content)

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.log("[Memory] No valid JSON in classification response")
        return defaultResult
      }

      const result = JSON.parse(jsonMatch[0]) as QueryClassification

      // Validate and normalize
      const classification: QueryClassification = {
        needsMemory: Boolean(result.needsMemory),
        confidence: Math.min(1, Math.max(0, result.confidence || 0.5)),
        reason: result.reason || "Unknown",
        queryType: ["factual", "personal", "ambiguous"].includes(result.queryType)
          ? result.queryType
          : "ambiguous"
      }

      console.log("[Memory] Query classified:", {
        query: query.substring(0, 30),
        ...classification,
        latency: `${latency}ms`
      })

      return classification
    } catch (error) {
      console.error("[Memory] Classification error:", error)
      return defaultResult
    }
  }

  /**
   * Phase 3: Intelligent memory retrieval with combined classification + semantic search
   *
   * Flow:
   * 1. Classify query intent (factual/personal/ambiguous)
   * 2. If factual with high confidence → skip memory entirely
   * 3. If personal or low confidence → do semantic search
   * 4. Apply minimum relevance filter (skip if top result < minRelevanceScore)
   * 5. Return memories with detailed decision info
   *
   * @param query - The user's query
   * @param apiKey - OpenRouter API key for classification and embeddings
   * @param limit - Max memories to return
   * @param isPersonaChat - If true, always retrieve (override classification)
   */
  async getRelevantMemoriesWithClassification(
    query: string,
    apiKey?: string,
    limit?: number,
    isPersonaChat?: boolean
  ): Promise<{
    memories: Memory[]
    classification: QueryClassification
    skipped: boolean
    searchMethod?: "semantic" | "keyword"
    decision: MemoryRetrievalDecision
  }> {
    const confidenceThreshold = this.settings.classificationConfidence ?? 0.8
    const minRelevance = this.settings.minRelevanceScore ?? 0.3

    // Phase 3: Persona override - always retrieve for persona chats if enabled
    if (isPersonaChat && this.settings.alwaysRetrieveForPersonas !== false) {
      console.log("[Memory] 👤 Persona chat detected - bypassing classification")
      return this.performMemoryRetrieval(query, apiKey, limit, {
        needsMemory: true,
        confidence: 1.0,
        reason: "Persona chat - always retrieve",
        queryType: "personal"
      }, "Persona chat override")
    }

    // Step 1: Classify the query
    const classification = await this.classifyQueryForMemory(query, apiKey)

    // Step 2: Decide based on classification + confidence threshold
    // Only skip if: factual AND confidence >= threshold
    const shouldSkip = !classification.needsMemory &&
                       classification.confidence >= confidenceThreshold

    if (shouldSkip) {
      console.log("[Memory] ⏭️ Skipping memory retrieval:", classification.reason,
        `(confidence: ${classification.confidence.toFixed(2)} >= ${confidenceThreshold})`)

      return {
        memories: [],
        classification,
        skipped: true,
        decision: {
          action: "skipped",
          reason: classification.reason,
          details: {
            queryType: classification.queryType,
            confidence: classification.confidence,
          }
        }
      }
    }

    // Step 3: Low confidence or personal query - retrieve memories
    if (!classification.needsMemory && classification.confidence < confidenceThreshold) {
      console.log("[Memory] 🤔 Low confidence classification - retrieving anyway",
        `(confidence: ${classification.confidence.toFixed(2)} < ${confidenceThreshold})`)
    }

    return this.performMemoryRetrieval(query, apiKey, limit, classification,
      classification.needsMemory ? "Personal query" : "Low confidence - retrieving anyway")
  }

  /**
   * Internal method to perform memory retrieval with relevance filtering
   */
  private async performMemoryRetrieval(
    query: string,
    apiKey: string | undefined,
    limit: number | undefined,
    classification: QueryClassification,
    retrievalReason: string
  ): Promise<{
    memories: Memory[]
    classification: QueryClassification
    skipped: boolean
    searchMethod?: "semantic" | "keyword"
    decision: MemoryRetrievalDecision
  }> {
    const minRelevance = this.settings.minRelevanceScore ?? 0.3
    console.log("[Memory] ✅ Retrieving memories:", retrievalReason)

    let memories: Array<Memory & { similarity?: number }> = []
    let searchMethod: "semantic" | "keyword" = "keyword"
    let topSimilarity: number | undefined

    // Try semantic search first if enabled and API key available
    if (apiKey && this.settings.useSemanticSearch !== false) {
      try {
        console.log("[Memory] Using semantic search (embedding-based)")
        const semanticResults = await this.getSemanticRelevantMemories(query, apiKey, limit)
        memories = semanticResults
        searchMethod = "semantic"

        // Get top similarity score
        if (semanticResults.length > 0) {
          const similarities = semanticResults
            .filter((m): m is Memory & { similarity: number } => 'similarity' in m)
            .map(m => m.similarity)

          if (similarities.length > 0) {
            topSimilarity = Math.max(...similarities)
            console.log("[Memory] Semantic search top similarity:", topSimilarity.toFixed(3))
          }
        }
      } catch (error) {
        console.error("[Memory] Semantic search failed, falling back to keyword:", error)
        memories = this.getRelevantMemories(query, limit)
        searchMethod = "keyword"
      }
    } else {
      // Fall back to keyword matching
      console.log("[Memory] Using keyword matching (no API key or semantic disabled)")
      memories = this.getRelevantMemories(query, limit)
    }

    // Step 4: Apply minimum relevance filter for semantic search
    if (searchMethod === "semantic" && topSimilarity !== undefined && topSimilarity < minRelevance) {
      console.log("[Memory] 📉 Top similarity", topSimilarity.toFixed(3),
        "< minRelevance", minRelevance, "- skipping all memories")

      return {
        memories: [],
        classification,
        skipped: false, // Not skipped by classification, but by relevance
        searchMethod,
        decision: {
          action: "empty",
          reason: `Best match similarity (${topSimilarity.toFixed(2)}) below threshold (${minRelevance})`,
          details: {
            queryType: classification.queryType,
            confidence: classification.confidence,
            searchMethod,
            topSimilarity,
            memoryCount: 0
          }
        }
      }
    }

    // Success - return memories
    console.log("[Memory] Retrieved", memories.length, "memories via", searchMethod, "search")

    return {
      memories,
      classification,
      skipped: false,
      searchMethod,
      decision: {
        action: memories.length > 0 ? "retrieved" : "empty",
        reason: memories.length > 0
          ? `Retrieved ${memories.length} relevant memories via ${searchMethod} search`
          : "No memories matched the query",
        details: {
          queryType: classification.queryType,
          confidence: classification.confidence,
          searchMethod,
          topSimilarity,
          memoryCount: memories.length
        }
      }
    }
  }
}

// Export singleton instance
export const memoryService = new MemoryService()
