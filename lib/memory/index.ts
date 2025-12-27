/**
 * Memory Module - Main Entry Point
 *
 * This module provides long-term memory for AI conversations.
 * It's been refactored from a 2,584-line monolith into smaller,
 * focused modules for better maintainability.
 *
 * Modules:
 * - types.ts: Type definitions and constants
 * - storage.ts: Local and cloud storage layer
 * - retrieval.ts: Keyword and semantic search
 * - classification.ts: Query intent classification
 *
 * Usage:
 * ```typescript
 * import { memoryModule } from '@/lib/memory'
 *
 * // Configure for user
 * memoryModule.configure(userId, settings, { syncEnabled: true })
 *
 * // Get relevant memories
 * const memories = await memoryModule.getRelevantMemories(query, apiKey)
 * ```
 */

import type {
  Memory,
  MemorySettings,
  DeletedMemory,
  QueryClassification,
  MemoryRetrievalDecision,
  MemoryRetrievalResult,
  ScoredMemory,
} from './types'
import { DEFAULT_MEMORY_SETTINGS, MEMORY_MODELS } from './types'
import { memoryStorage } from './storage'
import { getRelevantByKeyword, getRelevantBySemantic, updateAccessStats } from './retrieval'
import { classifyQuery, classifyQuerySync } from './classification'
import { loggers } from '@/lib/logger'
import { generateUUID } from '@/lib/utils'

const log = loggers.memory

// Re-export types
export * from './types'
export { memoryStorage } from './storage'
export { classifyQuery, classifyQuerySync } from './classification'
export { getRelevantByKeyword, getRelevantBySemantic } from './retrieval'

/**
 * Memory Module - Main class
 *
 * Orchestrates all memory operations
 */
class MemoryModule {
  private memories: Memory[] = []
  private deletedMemories: DeletedMemory[] = []
  private settings: MemorySettings = DEFAULT_MEMORY_SETTINGS
  private initialized: boolean = false

  /**
   * Configure the memory module
   */
  configure(
    userId: string | null,
    settings?: Partial<MemorySettings>,
    options?: { syncEnabled?: boolean }
  ): void {
    // Configure storage layer
    memoryStorage.configure(userId, options?.syncEnabled ?? false)

    // Update settings
    if (settings) {
      this.settings = { ...this.settings, ...settings }
    }

    // Load memories from storage
    this.loadMemories()

    this.initialized = true
    log.info('Memory module configured', {
      userId: userId ? 'set' : 'null',
      syncEnabled: options?.syncEnabled,
      memoryCount: this.memories.length,
    })
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<MemorySettings>): void {
    this.settings = { ...this.settings, ...settings }
    log.debug('Settings updated:', settings)
  }

  /**
   * Get current settings
   */
  getSettings(): MemorySettings {
    return { ...this.settings }
  }

  /**
   * Load memories from storage
   */
  private loadMemories(): void {
    this.memories = memoryStorage.loadFromLocal()
    this.deletedMemories = memoryStorage.loadDeletedFromLocal()
  }

  /**
   * Save memories to storage
   */
  private saveMemories(): void {
    memoryStorage.saveToLocal(this.memories)
    memoryStorage.saveDeletedToLocal(this.deletedMemories)
  }

  /**
   * Sync with cloud storage
   */
  async syncWithCloud(): Promise<void> {
    if (!memoryStorage.isSyncEnabled()) {
      log.debug('Cloud sync not enabled')
      return
    }

    try {
      const cloudMemories = await memoryStorage.loadFromCloud()
      this.memories = memoryStorage.mergeMemories(this.memories, cloudMemories)
      this.saveMemories()
      log.info('Synced with cloud:', this.memories.length, 'memories')
    } catch (error) {
      log.error('Cloud sync failed:', error)
    }
  }

  /**
   * Get all memories
   */
  getAllMemories(): Memory[] {
    return [...this.memories]
  }

  /**
   * Get a memory by ID
   */
  getMemory(id: string): Memory | undefined {
    return this.memories.find(m => m.id === id)
  }

  /**
   * Add a new memory
   */
  async addMemory(memory: Omit<Memory, 'id' | 'createdAt' | 'lastAccessedAt' | 'accessCount'>): Promise<Memory> {
    const newMemory: Memory = {
      ...memory,
      id: generateUUID(),
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
    }

    this.memories.push(newMemory)
    this.saveMemories()

    // Sync to cloud if enabled
    if (memoryStorage.isSyncEnabled()) {
      await memoryStorage.saveToCloud(newMemory)
    }

    log.debug('Added memory:', newMemory.content.slice(0, 50))
    return newMemory
  }

  /**
   * Update a memory
   */
  async updateMemory(id: string, updates: Partial<Memory>): Promise<Memory | null> {
    const index = this.memories.findIndex(m => m.id === id)
    if (index === -1) return null

    this.memories[index] = { ...this.memories[index], ...updates }
    this.saveMemories()

    // Sync to cloud if enabled
    if (memoryStorage.isSyncEnabled()) {
      await memoryStorage.saveToCloud(this.memories[index])
    }

    return this.memories[index]
  }

  /**
   * Delete a memory
   */
  async deleteMemory(id: string, permanent: boolean = false): Promise<boolean> {
    const index = this.memories.findIndex(m => m.id === id)
    if (index === -1) return false

    const memory = this.memories[index]

    if (!permanent) {
      // Archive instead of permanent delete
      const deletedMemory: DeletedMemory = {
        ...memory,
        deletedAt: Date.now(),
        expiresAt: Date.now() + (this.settings.archiveRetentionDays || 14) * 24 * 60 * 60 * 1000,
        deletionReason: 'manual',
      }
      this.deletedMemories.push(deletedMemory)
    }

    this.memories.splice(index, 1)
    this.saveMemories()

    // Delete from cloud if enabled
    if (memoryStorage.isSyncEnabled()) {
      await memoryStorage.deleteFromCloud(id)
    }

    log.debug('Deleted memory:', id, permanent ? '(permanent)' : '(archived)')
    return true
  }

  /**
   * Get relevant memories using keyword matching
   */
  getRelevantByKeyword(query: string): ScoredMemory[] {
    const results = getRelevantByKeyword(this.memories, query, this.settings)

    // Update access stats
    updateAccessStats(this.memories, results.map(m => m.id))
    this.saveMemories()

    return results
  }

  /**
   * Get relevant memories using semantic search
   */
  async getRelevantBySemantic(query: string, apiKey: string): Promise<ScoredMemory[]> {
    const results = await getRelevantBySemantic(
      this.memories,
      query,
      apiKey,
      this.settings,
      {
        userId: memoryStorage.getUserId() || undefined,
        syncEnabled: memoryStorage.isSyncEnabled(),
      }
    )

    // Update access stats
    updateAccessStats(this.memories, results.map(m => m.id))
    this.saveMemories()

    return results
  }

  /**
   * Get relevant memories with classification
   * (intelligent retrieval that skips unnecessary lookups)
   */
  async getRelevantMemoriesWithClassification(
    query: string,
    apiKey?: string,
    options?: {
      limit?: number
      isPersonaChat?: boolean
    }
  ): Promise<MemoryRetrievalResult> {
    const confidenceThreshold = this.settings.classificationConfidence ?? 0.8

    // Persona override
    if (options?.isPersonaChat && this.settings.alwaysRetrieveForPersonas !== false) {
      log.debug('Persona chat - bypassing classification')
      const classification: QueryClassification = {
        needsMemory: true,
        confidence: 1.0,
        reason: 'Persona chat - always retrieve',
        queryType: 'personal',
      }
      return this.performRetrieval(query, apiKey, classification, 'Persona chat override')
    }

    // Classify query
    const classification = await classifyQuery(query, apiKey)

    // Skip if factual with high confidence
    if (!classification.needsMemory && classification.confidence >= confidenceThreshold) {
      log.debug('Skipping retrieval:', classification.reason)
      return {
        memories: [],
        classification,
        skipped: true,
        decision: {
          action: 'skipped',
          reason: classification.reason,
          details: {
            queryType: classification.queryType,
            confidence: classification.confidence,
          },
        },
      }
    }

    return this.performRetrieval(
      query,
      apiKey,
      classification,
      classification.needsMemory ? 'Personal query' : 'Low confidence - retrieving anyway'
    )
  }

  /**
   * Perform memory retrieval
   */
  private async performRetrieval(
    query: string,
    apiKey: string | undefined,
    classification: QueryClassification,
    reason: string
  ): Promise<MemoryRetrievalResult> {
    log.debug('Retrieving memories:', reason)

    let memories: ScoredMemory[] = []
    let searchMethod: 'semantic' | 'keyword' = 'keyword'
    let topSimilarity: number | undefined

    // Try semantic search if API key available
    if (apiKey && this.settings.useSemanticSearch !== false) {
      try {
        memories = await this.getRelevantBySemantic(query, apiKey)
        searchMethod = 'semantic'

        if (memories.length > 0 && memories[0].similarity) {
          topSimilarity = memories[0].similarity
        }
      } catch (error) {
        log.warn('Semantic search failed, using keyword:', error)
        memories = this.getRelevantByKeyword(query)
      }
    } else {
      memories = this.getRelevantByKeyword(query)
    }

    // Check minimum relevance
    const minRelevance = this.settings.minRelevanceScore ?? 0.3
    if (searchMethod === 'semantic' && topSimilarity !== undefined && topSimilarity < minRelevance) {
      log.debug(`Top similarity ${topSimilarity} < ${minRelevance} - skipping`)
      return {
        memories: [],
        classification,
        skipped: false,
        searchMethod,
        decision: {
          action: 'empty',
          reason: `Best match (${topSimilarity.toFixed(2)}) below threshold (${minRelevance})`,
          details: {
            queryType: classification.queryType,
            confidence: classification.confidence,
            searchMethod,
            topSimilarity,
            memoryCount: 0,
          },
        },
      }
    }

    return {
      memories,
      classification,
      skipped: false,
      searchMethod,
      decision: {
        action: memories.length > 0 ? 'retrieved' : 'empty',
        reason: memories.length > 0
          ? `Retrieved ${memories.length} memories via ${searchMethod}`
          : 'No matching memories',
        details: {
          queryType: classification.queryType,
          confidence: classification.confidence,
          searchMethod,
          topSimilarity,
          memoryCount: memories.length,
        },
      },
    }
  }

  /**
   * Get memory count
   */
  getMemoryCount(): number {
    return this.memories.length
  }

  /**
   * Clear all memories
   */
  clearAll(): void {
    this.memories = []
    this.deletedMemories = []
    memoryStorage.clearLocal()
    log.info('All memories cleared')
  }

  /**
   * Check if module is enabled
   */
  isEnabled(): boolean {
    return this.settings.enabled
  }
}

// Singleton instance
export const memoryModule = new MemoryModule()

// Default export
export default memoryModule
