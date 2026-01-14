/**
 * Memory Service - Token-efficient long-term memory for Advanced mode
 *
 * Stores and retrieves user context, preferences, and facts to maintain
 * conversation continuity across sessions without excessive token usage.
 *
 * Supports optional cloud sync to Supabase for cross-device access.
 *
 * This service acts as a stateful facade that delegates to modular services:
 * - storage-service.ts: localStorage/database persistence
 * - maintenance-service.ts: expiration, consolidation, importance adjustment
 * - retrieval-service.ts: query classification and memory retrieval
 * - extraction-service.ts: LLM-based memory extraction
 * - duplicate-detection.ts: duplicate detection logic
 */

import type { Memory, MemorySettings, DeletedMemory } from "@/types"
import { generateUUID } from "@/lib/utils"
import { supabaseSync } from "@/lib/supabase/sync"
import { generateEmbedding } from "@/lib/embedding-service"

// Storage service imports
import {
  loadMemoriesFromStorage,
  saveMemoriesToStorage,
  loadDeletedMemoriesFromStorage,
  saveDeletedMemoriesToStorage,
  migrateOldMemories,
  clearAnonymousStorage,
  DatabaseSync,
} from "@/lib/memory/storage-service"

// Maintenance service imports
import {
  checkAndExpireMemories as checkExpiration,
  adjustMemoryImportance as adjustImportance,
  consolidateMemories as consolidate,
  shouldRunMaintenance as checkMaintenance,
  cleanupExpiredArchive,
  removeDuplicates as dedupMemories,
} from "@/lib/memory/maintenance-service"

// Retrieval service imports
import {
  getRelevantMemoriesKeyword,
  getRelevantMemoriesSemantic,
  getRelevantMemoriesWithClassification,
  formatMemoriesForContext,
  type RetrievalConfig,
  type RetrievalResult,
} from "@/lib/memory/retrieval-service"

// Extraction service imports
import {
  extractMemoriesFromConversation as patternExtract,
  extractMemoriesWithLLM as llmExtract,
  integrateProfile as profileIntegrate,
  shouldExtractMemories as checkExtraction,
} from "@/lib/memory/extraction-service"

// Duplicate detection imports
import { isMemoryDuplicate } from "@/lib/memory/duplicate-detection"

// Classification imports
import { classifyQuery } from "@/lib/memory/classification"

// Re-export types for backward compatibility
import type { QueryClassification } from "@/lib/memory/types"
export type { QueryClassification }

// Default models for memory tasks (can be overridden via settings)
export const DEFAULT_EXTRACTION_MODEL = "openai/gpt-oss-20b"
export const DEFAULT_CLASSIFIER_MODEL = "openai/gpt-oss-20b"
export const DEFAULT_CONSOLIDATION_MODEL = "openai/gpt-oss-120b"
export const DEFAULT_EMBEDDING_MODEL = "openai/text-embedding-3-small"

// Expiration constants
const DEFAULT_EXPIRATION_DAYS = 7
const DEFAULT_ARCHIVE_RETENTION_DAYS = 14
const MS_PER_DAY = 24 * 60 * 60 * 1000

const DEFAULT_SETTINGS: MemorySettings = {
  enabled: false,
  autoExtract: true,
  maxMemoriesInContext: 3,
  importanceThreshold: 2,
  syncToDatabase: false,
  useSemanticSearch: true,
  similarityThreshold: 0.65,
  classificationConfidence: 0.7,
  minRelevanceScore: 0.45,
  alwaysRetrieveForPersonas: true,
  expirationEnabled: true,
  expirationDays: DEFAULT_EXPIRATION_DAYS,
  archiveRetentionDays: DEFAULT_ARCHIVE_RETENTION_DAYS,
  autoConsolidation: false,
  autoImportanceAdjustment: true,
  lastMaintenanceRun: 0,
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
  // Flag to track when database sync is in progress to prevent race conditions
  private syncInProgress: boolean = false
  // Configurable models (can be set from UI settings)
  private extractionModel: string = DEFAULT_EXTRACTION_MODEL
  private classifierModel: string = DEFAULT_CLASSIFIER_MODEL
  private consolidationModel: string = DEFAULT_CONSOLIDATION_MODEL
  private embeddingModel: string = DEFAULT_EMBEDDING_MODEL

  constructor() {
    // Don't load memories in constructor - wait for user ID to be set
  }

  /**
   * Set custom models for memory tasks (from UI settings)
   */
  setModels(options: { extractionModel?: string; classifierModel?: string; consolidationModel?: string; embeddingModel?: string }) {
    if (options.extractionModel) this.extractionModel = options.extractionModel
    if (options.classifierModel) this.classifierModel = options.classifierModel
    if (options.consolidationModel) this.consolidationModel = options.consolidationModel
    if (options.embeddingModel) this.embeddingModel = options.embeddingModel
  }

  /**
   * Get current model configuration
   */
  getModels() {
    return {
      extractionModel: this.extractionModel,
      classifierModel: this.classifierModel,
      consolidationModel: this.consolidationModel,
      embeddingModel: this.embeddingModel,
    }
  }

  /**
   * Configure database sync and load user-specific memories
   */
  configureDatabaseSync(userId: string | null, syncEnabled: boolean) {
    const previousUserId = this.userId
    this.userId = userId
    this.syncEnabled = syncEnabled && !!userId

    if (previousUserId !== userId) {
      console.log("[Memory] User changed - clearing and reloading memories")
      this.memories = []
      this.deletedMemories = []

      if (userId) {
        migrateOldMemories(userId)
      }

      this.loadMemories()
      this.loadDeletedMemories()

      this.removeDuplicates()
      this.checkAndExpireMemories()
      this.cleanupExpiredArchive()

      const maintenanceCheck = this.shouldRunMaintenance()
      if (maintenanceCheck.should) {
        console.log("[Memory] Maintenance due (last run:", maintenanceCheck.hoursSinceLastRun, "hours ago)")
      }
    }

    console.log("[Memory] Database sync configured:", {
      userId: userId ? "***" : null,
      syncEnabled: this.syncEnabled,
    })
  }

  /**
   * Clear memories on logout
   */
  clearOnLogout() {
    console.log("[Memory] Clearing memories on logout for security")
    this.memories = []
    clearAnonymousStorage()
    this.userId = null
    this.syncEnabled = false
  }

  /**
   * Load memories from database (for initial sync)
   * Uses a flag to prevent race conditions with concurrent memory additions
   */
  async loadFromDatabase(): Promise<void> {
    if (!this.userId || !this.syncEnabled) {
      console.log("[Memory] Database sync disabled, skipping load")
      return
    }

    // Prevent concurrent sync operations
    if (this.syncInProgress) {
      console.log("[Memory] Database sync already in progress, skipping")
      return
    }

    this.syncInProgress = true
    const memoriesBeforeSync = [...this.memories] // Snapshot current state

    try {
      const deletedMemoryIds = new Set(this.deletedMemories.map(m => m.id))
      const mergedFromDatabase = await DatabaseSync.loadFromDatabase(
        this.userId,
        memoriesBeforeSync, // Use snapshot, not live reference
        deletedMemoryIds
      )

      // After async operation, merge with any memories added during sync
      // Get IDs of memories that were added during sync (not in our snapshot)
      const snapshotIds = new Set(memoriesBeforeSync.map(m => m.id))
      const addedDuringSync = this.memories.filter(m => !snapshotIds.has(m.id))

      if (addedDuringSync.length > 0) {
        console.log("[Memory] Preserving", addedDuringSync.length, "memories added during sync")
      }

      // Combine database results with any locally-added memories
      const mergedIds = new Set(mergedFromDatabase.map(m => m.id))
      const finalMemories = [
        ...mergedFromDatabase,
        ...addedDuringSync.filter(m => !mergedIds.has(m.id)) // Avoid duplicates
      ]

      this.memories = finalMemories
      this.saveMemories()
      console.log("[Memory] Database sync complete. Total memories:", this.memories.length)
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Load memories from localStorage (delegates to storage-service)
   */
  private loadMemories() {
    this.memories = loadMemoriesFromStorage(this.userId)
    console.log("[Memory] Loaded", this.memories.length, "memories")
  }

  /**
   * Save memories to localStorage (delegates to storage-service)
   */
  private saveMemories() {
    saveMemoriesToStorage(this.memories, this.userId)
  }

  /**
   * Load deleted memories from localStorage
   */
  private loadDeletedMemories() {
    this.deletedMemories = loadDeletedMemoriesFromStorage(this.userId)

    if (this.syncEnabled && this.userId) {
      this.syncDeletedMemoriesFromDatabase()
    }
  }

  /**
   * Sync deleted memories from database
   */
  private async syncDeletedMemoriesFromDatabase() {
    if (!this.syncEnabled || !this.userId) return

    this.deletedMemories = await DatabaseSync.syncDeletedMemories(
      this.userId,
      this.deletedMemories
    )
    this.saveDeletedMemories()
  }

  /**
   * Save deleted memories to localStorage
   */
  private saveDeletedMemories() {
    saveDeletedMemoriesToStorage(this.deletedMemories, this.userId)
  }

  /**
   * Check for expired memories and archive/demote them (delegates to maintenance-service)
   */
  checkAndExpireMemories(): { expired: number; demoted: number; skippedProfile: number } {
    const result = checkExpiration(
      this.memories,
      this.settings,
      (id, reason) => this.archiveMemory(id, reason)
    )

    if (result.demoted > 0 || result.expired > 0) {
      this.saveMemories()
    }

    return result
  }

  /**
   * Dynamically adjust memory importance (delegates to maintenance-service)
   */
  adjustMemoryImportance(): { boosted: number; reduced: number; skipped: number } {
    const result = adjustImportance(this.memories)

    if (result.boosted > 0 || result.reduced > 0) {
      this.saveMemories()
    }

    return result
  }

  /**
   * Consolidate duplicate/similar memories using LLM (delegates to maintenance-service)
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
    const result = await consolidate(
      this.memories,
      apiKey,
      this.consolidationModel,
      dryRun,
      (id) => this.permanentlyDeleteMemory(id)
    )

    if (!dryRun && result.consolidated > 0) {
      this.saveMemories()
    }

    return result
  }

  /**
   * Run automatic maintenance tasks
   */
  async runMaintenance(
    apiKey?: string,
    force: boolean = false
  ): Promise<{
    success: boolean
    ranImportanceAdjustment: boolean
    ranConsolidation: boolean
    importanceResults?: { boosted: number; reduced: number; skipped: number }
    consolidationResults?: { consolidated: number; kept: number; details?: any[] }
    error?: string
  }> {
    const maintenanceCheck = checkMaintenance(this.settings)

    if (!force && !maintenanceCheck.should) {
      console.log(`[Memory] Maintenance already ran ${maintenanceCheck.hoursSinceLastRun}h ago.`)
      return {
        success: false,
        ranImportanceAdjustment: false,
        ranConsolidation: false,
        error: `Maintenance already ran ${maintenanceCheck.hoursSinceLastRun} hours ago`
      }
    }

    console.log("[Memory] Starting automatic maintenance...")

    let ranImportanceAdjustment = false
    let ranConsolidation = false
    let importanceResults
    let consolidationResults
    let hadError = false
    let errorMessage

    try {
      if (this.settings.autoImportanceAdjustment !== false) {
        importanceResults = this.adjustMemoryImportance()
        ranImportanceAdjustment = true
      }

      if (this.settings.autoConsolidation && apiKey) {
        const result = await this.consolidateMemories(apiKey, false)
        if (result.success) {
          consolidationResults = {
            consolidated: result.consolidated,
            kept: result.kept,
            details: result.details
          }
          ranConsolidation = true
        } else {
          hadError = true
          errorMessage = result.error
        }
      }

      this.checkAndExpireMemories()

      this.settings.lastMaintenanceRun = Date.now()
      this.saveMemories()

      return {
        success: !hadError,
        ranImportanceAdjustment,
        ranConsolidation,
        importanceResults,
        consolidationResults,
        error: errorMessage
      }

    } catch (error) {
      console.error("[Memory] Maintenance error:", error)
      return {
        success: false,
        ranImportanceAdjustment,
        ranConsolidation,
        importanceResults,
        consolidationResults,
        error: error instanceof Error ? error.message : "Unknown error"
      }
    }
  }

  /**
   * Check if maintenance should run (delegates to maintenance-service)
   */
  shouldRunMaintenance(): { should: boolean; hoursSinceLastRun: number; hoursUntilNext: number } {
    return checkMaintenance(this.settings)
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

    this.memories.splice(memoryIndex, 1)
    this.saveMemories()

    this.deletedMemories.push(deletedMemory)
    this.saveDeletedMemories()

    console.log("[Memory] Archived memory:", { id: id.substring(0, 8), reason })

    if (this.syncEnabled && this.userId) {
      DatabaseSync.deleteMemory(this.userId, id)
      DatabaseSync.createDeletedMemory(this.userId, deletedMemory)
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

    const restoredMemory: Memory = {
      id: deletedMemory.id,
      type: deletedMemory.type,
      content: deletedMemory.content,
      category: deletedMemory.category,
      importance: deletedMemory.originalImportance || deletedMemory.importance,
      createdAt: deletedMemory.createdAt,
      lastAccessedAt: Date.now(),
      accessCount: deletedMemory.accessCount,
      source: deletedMemory.source,
      metadata: deletedMemory.metadata,
      embedding: deletedMemory.embedding,
    }

    this.deletedMemories.splice(deletedIndex, 1)
    this.saveDeletedMemories()

    this.memories.push(restoredMemory)
    this.saveMemories()

    console.log("[Memory] Restored memory:", restoredMemory.content.substring(0, 40))

    if (this.syncEnabled && this.userId) {
      DatabaseSync.removeDeletedMemory(this.userId, id)
      DatabaseSync.syncMemory(this.userId, restoredMemory)
    }

    return true
  }

  /**
   * Permanently remove memories from archive that have passed their expiration
   */
  cleanupExpiredArchive(): number {
    const cleaned = cleanupExpiredArchive(this.deletedMemories)
    const removedCount = this.deletedMemories.length - cleaned.length

    if (removedCount > 0) {
      this.deletedMemories = cleaned
      this.saveDeletedMemories()

      if (this.syncEnabled && this.userId) {
        DatabaseSync.cleanupExpiredDeletedMemories(this.userId)
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

    if (this.syncEnabled && this.userId) {
      DatabaseSync.clearDeletedMemories(this.userId)
    }
  }

  /**
   * Add a new memory (with deduplication check)
   */
  addMemory(memory: Omit<Memory, "id" | "createdAt" | "lastAccessedAt" | "accessCount">, apiKey?: string): Memory {
    // Check for duplicates before adding (delegates to duplicate-detection)
    if (memory.content && isMemoryDuplicate(memory.content, this.memories)) {
      console.log("[Memory] Skipping duplicate memory:", memory.content.substring(0, 40))
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

    if (this.syncEnabled && this.userId) {
      DatabaseSync.syncMemory(this.userId, newMemory)
    }

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

      const memoryIndex = this.memories.findIndex(m => m.id === memoryId)
      if (memoryIndex !== -1) {
        this.memories[memoryIndex].embedding = embedding
        this.saveMemories()
      }

      if (this.syncEnabled && this.userId) {
        await DatabaseSync.updateMemoryEmbedding(this.userId, memoryId, embedding)
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

    return { success, failed }
  }

  /**
   * Get all memories
   */
  getAllMemories(): Memory[] {
    return [...this.memories].sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * Remove duplicate memories (delegates to maintenance-service)
   */
  removeDuplicates(): number {
    const { deduped, removedIds } = dedupMemories(this.memories)

    if (removedIds.length > 0) {
      this.memories = deduped
      this.saveMemories()

      if (this.syncEnabled && this.userId) {
        for (const id of removedIds) {
          DatabaseSync.deleteMemory(this.userId, id)
        }
      }
    }

    return removedIds.length
  }

  /**
   * Get memories by type
   */
  getMemoriesByType(type: Memory["type"]): Memory[] {
    return this.memories.filter((m) => m.type === type)
  }

  /**
   * Get relevant memories for a query (delegates to retrieval-service)
   */
  getRelevantMemories(query: string, limit?: number): Memory[] {
    const config = this.getRetrievalConfig()
    const maxResults = limit || config.maxMemoriesInContext

    const memories = getRelevantMemoriesKeyword(query, this.memories, { ...config, maxMemoriesInContext: maxResults })

    // Update access stats for retrieved memories
    this.updateAccessStats(memories.map(m => m.id))

    return memories
  }

  /**
   * Get relevant memories using semantic similarity (delegates to retrieval-service)
   */
  async getSemanticRelevantMemories(
    query: string,
    apiKey: string,
    limit?: number
  ): Promise<Array<Memory & { similarity?: number }>> {
    const config = this.getRetrievalConfig()
    const maxResults = limit || config.maxMemoriesInContext

    const dbSearchFn = this.syncEnabled && this.userId
      ? (queryEmbedding: number[], options: { threshold: number; limit: number }) =>
          DatabaseSync.semanticSearchMemories(this.userId!, queryEmbedding, options)
      : undefined

    const memories = await getRelevantMemoriesSemantic(
      query,
      this.memories,
      apiKey,
      { ...config, maxMemoriesInContext: maxResults },
      this.embeddingModel,
      dbSearchFn
    )

    // Update access stats for retrieved memories
    this.updateAccessStats(memories.map(m => m.id))

    return memories
  }

  /**
   * Format memories for LLM context (delegates to retrieval-service)
   */
  formatMemoriesForContext(memories: Memory[]): string {
    return formatMemoriesForContext(memories)
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

    if (this.syncEnabled && this.userId) {
      DatabaseSync.updateMemory(this.userId, this.memories[index])
    }

    return true
  }

  /**
   * Delete a memory (archives it to deleted memories for potential restoration)
   */
  deleteMemory(id: string): boolean {
    return this.archiveMemory(id, "manual")
  }

  /**
   * Permanently delete a memory without archiving
   */
  permanentlyDeleteMemory(id: string): boolean {
    const index = this.memories.findIndex(m => m.id === id)
    if (index === -1) return false

    this.memories.splice(index, 1)
    this.saveMemories()

    if (this.syncEnabled && this.userId) {
      DatabaseSync.deleteMemory(this.userId, id)
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

    if (this.syncEnabled && this.userId) {
      DatabaseSync.removeDeletedMemory(this.userId, id)
    }

    return true
  }

  /**
   * Clear all memories
   */
  clearAllMemories() {
    this.memories = []
    this.saveMemories()

    if (this.syncEnabled && this.userId) {
      DatabaseSync.deleteAllMemories(this.userId)
    }
  }

  /**
   * Integrate profile information into memory system (delegates to extraction-service)
   */
  async integrateProfile(profile: any, apiKey: string): Promise<{ success: boolean; memoriesCreated: number; error?: string }> {
    // Delete existing profile memories first
    const existingProfileMemories = this.memories.filter(m => m.source === "profile")
    for (const memory of existingProfileMemories) {
      this.deleteMemory(memory.id)
    }
    console.log("[Memory] Removed", existingProfileMemories.length, "old profile memories")

    const nonProfileMemories = this.memories.filter(m => m.source !== "profile")

    return profileIntegrate(
      profile,
      apiKey,
      this.extractionModel,
      nonProfileMemories,
      (memData, key) => this.addMemory(memData, key),
      (content, memories) => isMemoryDuplicate(content, memories),
      async (memoryId, content, key) => {
        await this.embedMemory(memoryId, content, key)
      }
    )
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
   * Check if a memory is a duplicate (delegates to duplicate-detection)
   */
  isMemoryDuplicate(newContent: string, existingMemories: Memory[]): boolean {
    return isMemoryDuplicate(newContent, existingMemories)
  }

  /**
   * Extract memories from conversation using pattern matching (delegates to extraction-service)
   */
  extractMemoriesFromConversation(userMessage: string, assistantMessage: string): Memory[] {
    return patternExtract(userMessage, assistantMessage)
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
   * Extract memories using LLM (delegates to extraction-service)
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

    const existingMemories = this.getAllMemories()

    const newMemories = await llmExtract(
      userMessage,
      assistantMessage,
      apiKey,
      this.extractionModel,
      existingMemories,
      (content, memories) => isMemoryDuplicate(content, memories)
    )

    // Auto-save the new memories
    for (const memory of newMemories) {
      this.memories.push(memory)
      console.log("[Memory] Auto-saved:", memory.type, "-", memory.content)
    }

    if (newMemories.length > 0) {
      this.saveMemories()
    }

    return newMemories
  }

  /**
   * Check if conversation qualifies for memory extraction (delegates to extraction-service)
   */
  shouldExtractMemories(messageCount: number): boolean {
    return checkExtraction(messageCount, this.settings.enabled, this.settings.autoExtract)
  }

  /**
   * Classify if a query needs memory context (delegates to classification module)
   */
  async classifyQueryForMemory(
    query: string,
    apiKey?: string
  ): Promise<QueryClassification> {
    console.log("[Memory] Classifying query:", query.substring(0, 50))
    const startTime = Date.now()

    const classification = await classifyQuery(query, apiKey, this.classifierModel)

    const latency = Date.now() - startTime
    console.log("[Memory] Query classified:", {
      query: query.substring(0, 30),
      ...classification,
      latency: `${latency}ms`
    })

    return classification
  }

  /**
   * Intelligent memory retrieval with classification (delegates to retrieval-service)
   */
  async getRelevantMemoriesWithClassification(
    query: string,
    apiKey?: string,
    limit?: number,
    isPersonaChat?: boolean,
    recentMessages?: Array<{ role: string; content: string }>
  ): Promise<RetrievalResult> {
    const config = this.getRetrievalConfig()
    const maxResults = limit || config.maxMemoriesInContext

    const dbSearchFn = this.syncEnabled && this.userId
      ? (queryEmbedding: number[], options: { threshold: number; limit: number }) =>
          DatabaseSync.semanticSearchMemories(this.userId!, queryEmbedding, options)
      : undefined

    const result = await getRelevantMemoriesWithClassification(
      query,
      this.memories,
      apiKey,
      { ...config, maxMemoriesInContext: maxResults },
      {
        isPersonaChat,
        recentMessages: recentMessages?.map(m => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content
        })),
        classifierModel: this.classifierModel,
        embeddingModel: this.embeddingModel,
        dbSearchFn,
        updateAccessStats: (memoryIds) => this.updateAccessStats(memoryIds)
      }
    )

    return result
  }

  /**
   * Get retrieval configuration from settings
   */
  private getRetrievalConfig(): RetrievalConfig {
    return {
      maxMemoriesInContext: this.settings.maxMemoriesInContext,
      importanceThreshold: this.settings.importanceThreshold,
      similarityThreshold: this.settings.similarityThreshold ?? 0.65,
      minRelevanceScore: this.settings.minRelevanceScore ?? 0.45,
      classificationConfidence: this.settings.classificationConfidence ?? 0.7,
      useSemanticSearch: this.settings.useSemanticSearch !== false,
      alwaysRetrieveForPersonas: this.settings.alwaysRetrieveForPersonas !== false,
    }
  }

  /**
   * Update access statistics for retrieved memories
   */
  private updateAccessStats(memoryIds: string[]) {
    let updated = false
    for (const id of memoryIds) {
      const memory = this.memories.find(m => m.id === id)
      if (memory) {
        memory.lastAccessedAt = Date.now()
        memory.accessCount++
        updated = true
      }
    }
    if (updated) {
      this.saveMemories()
    }
  }
}

// Export singleton instance
export const memoryService = new MemoryService()
