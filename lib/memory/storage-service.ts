/**
 * Memory Storage Service
 *
 * Handles all persistence operations for the memory system:
 * - localStorage read/write with user scoping
 * - Supabase database sync
 * - Migration of legacy data
 *
 * SECURITY: All storage is scoped by user ID to prevent data leakage
 */

import type { Memory, MemorySettings, DeletedMemory } from '@/types'
import { supabaseSync } from '@/lib/supabase/sync'
import { loggers } from '@/lib/logger'

const log = loggers.memory

const MEMORY_STORAGE_KEY_PREFIX = 'chat_memories'
const DELETED_MEMORY_STORAGE_KEY_PREFIX = 'chat_deleted_memories'

export interface StorageConfig {
  userId: string | null
  syncEnabled: boolean
}

/**
 * Get user-scoped storage key for localStorage
 */
export function getStorageKey(userId: string | null): string {
  if (userId) {
    return `${MEMORY_STORAGE_KEY_PREFIX}_${userId}`
  }
  return `${MEMORY_STORAGE_KEY_PREFIX}_anonymous`
}

/**
 * Get user-scoped storage key for deleted memories
 */
export function getDeletedStorageKey(userId: string | null): string {
  if (userId) {
    return `${DELETED_MEMORY_STORAGE_KEY_PREFIX}_${userId}`
  }
  return `${DELETED_MEMORY_STORAGE_KEY_PREFIX}_anonymous`
}

/**
 * Load memories from localStorage
 */
export function loadMemoriesFromStorage(userId: string | null): Memory[] {
  if (typeof window === 'undefined') return []

  const storageKey = getStorageKey(userId)
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const memories = JSON.parse(stored)
      log.debug(`Loaded ${memories.length} memories from ${storageKey}`)
      return memories
    }
    log.debug(`No memories found for ${storageKey}`)
    return []
  } catch (error) {
    log.error('Load error:', error)
    return []
  }
}

/**
 * Save memories to localStorage
 */
export function saveMemoriesToStorage(memories: Memory[], userId: string | null): void {
  if (typeof window === 'undefined') return

  const storageKey = getStorageKey(userId)
  try {
    localStorage.setItem(storageKey, JSON.stringify(memories))
  } catch (error) {
    log.error('Save error:', error)
  }
}

/**
 * Load deleted memories from localStorage
 */
export function loadDeletedMemoriesFromStorage(userId: string | null): DeletedMemory[] {
  if (typeof window === 'undefined') return []

  const storageKey = getDeletedStorageKey(userId)
  try {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      const memories = JSON.parse(stored)
      log.debug(`Loaded ${memories.length} deleted memories from local archive`)
      return memories
    }
    return []
  } catch (error) {
    log.error('Load deleted memories error:', error)
    return []
  }
}

/**
 * Save deleted memories to localStorage
 */
export function saveDeletedMemoriesToStorage(deletedMemories: DeletedMemory[], userId: string | null): void {
  if (typeof window === 'undefined') return

  const storageKey = getDeletedStorageKey(userId)
  try {
    localStorage.setItem(storageKey, JSON.stringify(deletedMemories))
  } catch (error) {
    log.error('Save deleted memories error:', error)
  }
}

/**
 * Clear anonymous memories on logout
 */
export function clearAnonymousStorage(): void {
  if (typeof window === 'undefined') return

  localStorage.removeItem(`${MEMORY_STORAGE_KEY_PREFIX}_anonymous`)
  localStorage.removeItem(`${DELETED_MEMORY_STORAGE_KEY_PREFIX}_anonymous`)
}

/**
 * Migrate old non-user-scoped memories to user-scoped storage
 */
export function migrateOldMemories(userId: string): void {
  if (typeof window === 'undefined') return

  const oldKey = MEMORY_STORAGE_KEY_PREFIX
  const newKey = getStorageKey(userId)

  try {
    const oldData = localStorage.getItem(oldKey)
    if (!oldData) return

    const existingNewData = localStorage.getItem(newKey)

    if (!existingNewData) {
      log.info('MIGRATION: Migrating old memories to user-scoped storage')
      localStorage.setItem(newKey, oldData)
      log.info('MIGRATION: Successfully migrated memories for user')
    } else {
      log.info('MIGRATION: Merging old memories with existing user memories')
      try {
        const oldMemories = JSON.parse(oldData) as Memory[]
        const newMemories = JSON.parse(existingNewData) as Memory[]
        const existingIds = new Set(newMemories.map(m => m.id))

        let addedCount = 0
        for (const oldMem of oldMemories) {
          if (!existingIds.has(oldMem.id)) {
            newMemories.push(oldMem)
            addedCount++
          }
        }

        if (addedCount > 0) {
          localStorage.setItem(newKey, JSON.stringify(newMemories))
          log.info(`MIGRATION: Added ${addedCount} memories from old storage`)
        }
      } catch (mergeError) {
        log.error('MIGRATION: Merge failed, keeping new data:', mergeError)
      }
    }
    log.info('MIGRATION: Old key preserved for potential other users on shared device')
  } catch (error) {
    log.error('MIGRATION: Failed to migrate old memories:', error)
  }
}

/**
 * Database sync operations
 */
export const DatabaseSync = {
  /**
   * Load memories from database and merge with local
   */
  async loadFromDatabase(
    userId: string,
    localMemories: Memory[],
    deletedMemoryIds: Set<string>
  ): Promise<Memory[]> {
    try {
      log.debug('Loading memories from database...')
      const dbMemories = await supabaseSync.syncMemories(userId)

      const localMemoryIds = new Set(localMemories.map(m => m.id))
      const dbMemoryIds = new Set(dbMemories.map(m => m.id))
      const mergedMemories = [...localMemories]

      // Add DB memories that aren't local AND weren't deleted
      for (const dbMem of dbMemories) {
        if (deletedMemoryIds.has(dbMem.id)) {
          log.debug('Skipping deleted memory from DB:', dbMem.content?.substring(0, 40))
          supabaseSync.deleteMemory(userId, dbMem.id).catch(err => {
            log.error('Failed to sync deletion to database:', err)
          })
          continue
        }

        if (!localMemoryIds.has(dbMem.id)) {
          mergedMemories.push(dbMem)
        } else {
          const idx = mergedMemories.findIndex(m => m.id === dbMem.id)
          if (idx !== -1) {
            mergedMemories[idx] = dbMem
          }
        }
      }

      // Upload local-only memories to database
      for (const localMem of localMemories) {
        if (!dbMemoryIds.has(localMem.id)) {
          try {
            await supabaseSync.createMemory(userId, localMem)
          } catch (err) {
            log.error('Failed to upload local memory:', err)
          }
        }
      }

      log.info(`Database sync complete. Total memories: ${mergedMemories.length}`)
      return mergedMemories
    } catch (error) {
      log.error('Failed to load from database:', error)
      return localMemories
    }
  },

  /**
   * Sync deleted memories from database
   */
  async syncDeletedMemories(
    userId: string,
    localDeletedMemories: DeletedMemory[]
  ): Promise<DeletedMemory[]> {
    try {
      const dbDeletedMemories = await supabaseSync.syncDeletedMemories(userId)
      log.debug(`Fetched ${dbDeletedMemories.length} deleted memories from database`)

      const dbIds = new Set(dbDeletedMemories.map(m => m.id))
      const localOnlyMemories = localDeletedMemories.filter(m => !dbIds.has(m.id))

      const mergedDeletedMemories = [...dbDeletedMemories, ...localOnlyMemories]

      // Sync local-only deleted memories to database
      for (const localMemory of localOnlyMemories) {
        supabaseSync.createDeletedMemory(userId, localMemory).catch(err => {
          log.error('Failed to sync local deleted memory to database:', err)
        })
      }

      log.debug('Merged deleted memories:', {
        fromDB: dbDeletedMemories.length,
        localOnly: localOnlyMemories.length,
        total: mergedDeletedMemories.length
      })

      return mergedDeletedMemories
    } catch (error) {
      log.error('Failed to sync deleted memories from database:', error)
      return localDeletedMemories
    }
  },

  /**
   * Sync single memory to database
   */
  async syncMemory(userId: string, memory: Memory): Promise<void> {
    try {
      await supabaseSync.createMemory(userId, memory)
    } catch (err) {
      log.error('Failed to sync new memory to database:', err)
    }
  },

  /**
   * Update memory in database
   */
  async updateMemory(userId: string, memory: Memory): Promise<void> {
    try {
      await supabaseSync.updateMemory(userId, memory)
    } catch (err) {
      log.error('Failed to sync memory update to database:', err)
    }
  },

  /**
   * Delete memory from database
   */
  async deleteMemory(userId: string, memoryId: string): Promise<void> {
    try {
      await supabaseSync.deleteMemory(userId, memoryId)
    } catch (err) {
      log.error('Failed to sync memory deletion to database:', err)
    }
  },

  /**
   * Delete all memories from database
   */
  async deleteAllMemories(userId: string): Promise<void> {
    try {
      await supabaseSync.deleteAllMemories(userId)
    } catch (err) {
      log.error('Failed to sync memory clear to database:', err)
    }
  },

  /**
   * Sync deleted memory to archive table
   */
  async createDeletedMemory(userId: string, deletedMemory: DeletedMemory): Promise<void> {
    try {
      await supabaseSync.createDeletedMemory(userId, deletedMemory)
    } catch (err) {
      log.error('Failed to sync deleted memory to database:', err)
    }
  },

  /**
   * Remove from deleted memories archive
   */
  async removeDeletedMemory(userId: string, memoryId: string): Promise<void> {
    try {
      await supabaseSync.removeDeletedMemory(userId, memoryId)
    } catch (err) {
      log.error('Failed to remove deleted memory from database:', err)
    }
  },

  /**
   * Cleanup expired deleted memories
   */
  async cleanupExpiredDeletedMemories(userId: string): Promise<void> {
    try {
      await supabaseSync.cleanupExpiredDeletedMemories(userId)
    } catch (err) {
      log.error('Failed to cleanup expired memories in database:', err)
    }
  },

  /**
   * Clear all deleted memories
   */
  async clearDeletedMemories(userId: string): Promise<void> {
    try {
      await supabaseSync.clearDeletedMemories(userId)
    } catch (err) {
      log.error('Failed to clear deleted memories in database:', err)
    }
  },

  /**
   * Update memory embedding in database
   */
  async updateMemoryEmbedding(userId: string, memoryId: string, embedding: number[]): Promise<void> {
    try {
      await supabaseSync.updateMemoryEmbedding(userId, memoryId, embedding)
    } catch (err) {
      log.error('Failed to update memory embedding in database:', err)
    }
  },

  /**
   * Semantic search in database
   */
  async semanticSearchMemories(
    userId: string,
    queryEmbedding: number[],
    options: { threshold: number; limit: number }
  ): Promise<Array<Memory & { similarity: number }>> {
    return supabaseSync.semanticSearchMemories(userId, queryEmbedding, options)
  }
}
