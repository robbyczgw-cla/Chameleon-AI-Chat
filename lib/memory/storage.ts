/**
 * Memory Module - Storage Layer
 *
 * Handles local storage and cloud sync for memories
 */

import type { Memory, DeletedMemory, MemorySettings } from './types'
import { STORAGE_KEYS, DEFAULT_MEMORY_SETTINGS } from './types'
import { loggers } from '@/lib/logger'
import { supabaseSync } from '@/lib/supabase/sync'

const log = loggers.memory

export class MemoryStorage {
  private userId: string | null = null
  private syncEnabled: boolean = false

  /**
   * Configure storage for a specific user
   */
  configure(userId: string | null, syncEnabled: boolean): void {
    this.userId = userId
    this.syncEnabled = syncEnabled && !!userId
    log.debug('Storage configured:', { userId: userId ? 'set' : 'null', syncEnabled: this.syncEnabled })
  }

  /**
   * Get the user-scoped storage key
   */
  private getStorageKey(baseKey: string): string {
    if (this.userId) {
      return `${baseKey}_${this.userId}`
    }
    return `${baseKey}_anonymous`
  }

  /**
   * Load memories from localStorage
   */
  loadFromLocal(): Memory[] {
    if (typeof window === 'undefined') return []

    try {
      const key = this.getStorageKey(STORAGE_KEYS.memories)
      const data = localStorage.getItem(key)
      const memories = data ? JSON.parse(data) : []
      log.debug(`Loaded ${memories.length} memories from localStorage`)
      return memories
    } catch (error) {
      log.error('Failed to load memories from localStorage:', error)
      return []
    }
  }

  /**
   * Load deleted memories from localStorage
   */
  loadDeletedFromLocal(): DeletedMemory[] {
    if (typeof window === 'undefined') return []

    try {
      const key = this.getStorageKey(STORAGE_KEYS.deletedMemories)
      const data = localStorage.getItem(key)
      return data ? JSON.parse(data) : []
    } catch (error) {
      log.error('Failed to load deleted memories:', error)
      return []
    }
  }

  /**
   * Save memories to localStorage
   */
  saveToLocal(memories: Memory[]): void {
    if (typeof window === 'undefined') return

    try {
      const key = this.getStorageKey(STORAGE_KEYS.memories)
      localStorage.setItem(key, JSON.stringify(memories))
      log.debug(`Saved ${memories.length} memories to localStorage`)
    } catch (error) {
      log.error('Failed to save memories to localStorage:', error)
    }
  }

  /**
   * Save deleted memories to localStorage
   */
  saveDeletedToLocal(deletedMemories: DeletedMemory[]): void {
    if (typeof window === 'undefined') return

    try {
      const key = this.getStorageKey(STORAGE_KEYS.deletedMemories)
      localStorage.setItem(key, JSON.stringify(deletedMemories))
    } catch (error) {
      log.error('Failed to save deleted memories:', error)
    }
  }

  /**
   * Load memories from Supabase
   */
  async loadFromCloud(): Promise<Memory[]> {
    if (!this.syncEnabled || !this.userId) {
      return []
    }

    try {
      log.debug('Loading memories from Supabase...')
      const memories = await supabaseSync.getMemories(this.userId)
      log.info(`Loaded ${memories.length} memories from Supabase`)
      return memories
    } catch (error) {
      log.error('Failed to load memories from Supabase:', error)
      return []
    }
  }

  /**
   * Save a single memory to Supabase
   */
  async saveToCloud(memory: Memory): Promise<boolean> {
    if (!this.syncEnabled || !this.userId) {
      return false
    }

    try {
      await supabaseSync.saveMemory(this.userId, memory)
      return true
    } catch (error) {
      log.error('Failed to save memory to Supabase:', error)
      return false
    }
  }

  /**
   * Delete a memory from Supabase
   */
  async deleteFromCloud(memoryId: string): Promise<boolean> {
    if (!this.syncEnabled || !this.userId) {
      return false
    }

    try {
      await supabaseSync.deleteMemory(this.userId, memoryId)
      return true
    } catch (error) {
      log.error('Failed to delete memory from Supabase:', error)
      return false
    }
  }

  /**
   * Merge local and cloud memories
   */
  mergeMemories(local: Memory[], cloud: Memory[]): Memory[] {
    const merged = new Map<string, Memory>()

    // Add all cloud memories first
    for (const memory of cloud) {
      merged.set(memory.id, memory)
    }

    // Override or add local memories (local wins for conflicts)
    for (const memory of local) {
      const existing = merged.get(memory.id)
      if (!existing || memory.lastAccessedAt > existing.lastAccessedAt) {
        merged.set(memory.id, memory)
      }
    }

    return Array.from(merged.values())
  }

  /**
   * Clear all memories (local only)
   */
  clearLocal(): void {
    if (typeof window === 'undefined') return

    const key = this.getStorageKey(STORAGE_KEYS.memories)
    const deletedKey = this.getStorageKey(STORAGE_KEYS.deletedMemories)

    localStorage.removeItem(key)
    localStorage.removeItem(deletedKey)

    log.info('Cleared local memory storage')
  }

  /**
   * Get sync status
   */
  isSyncEnabled(): boolean {
    return this.syncEnabled
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId
  }
}

// Singleton instance
export const memoryStorage = new MemoryStorage()
