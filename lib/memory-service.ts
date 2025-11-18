/**
 * Memory Service - Token-efficient long-term memory for Advanced mode
 *
 * Stores and retrieves user context, preferences, and facts to maintain
 * conversation continuity across sessions without excessive token usage.
 */

import type { Memory, MemorySettings } from "@/types"
import { generateUUID } from "@/lib/utils"

const MEMORY_STORAGE_KEY = "chat_memories"
const DEFAULT_SETTINGS: MemorySettings = {
  enabled: false,
  autoExtract: true,
  maxMemoriesInContext: 5,
  importanceThreshold: 2,
}

class MemoryService {
  private memories: Memory[] = []
  private settings: MemorySettings = DEFAULT_SETTINGS

  constructor() {
    this.loadMemories()
  }

  /**
   * Load memories from localStorage
   */
  private loadMemories() {
    // Skip during SSR
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(MEMORY_STORAGE_KEY)
      if (stored) {
        this.memories = JSON.parse(stored)
      }
    } catch (error) {
      console.error("[Memory] Load error:", error)
      this.memories = []
    }
  }

  /**
   * Save memories to localStorage
   */
  private saveMemories() {
    // Skip during SSR
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(this.memories))
    } catch (error) {
      console.error("[Memory] Save error:", error)
    }
  }

  /**
   * Add a new memory
   */
  addMemory(memory: Omit<Memory, "id" | "createdAt" | "lastAccessedAt" | "accessCount">): Memory {
    const newMemory: Memory = {
      ...memory,
      id: generateUUID(),
      createdAt: Date.now(),
      lastAccessedAt: Date.now(),
      accessCount: 0,
    }

    this.memories.push(newMemory)
    this.saveMemories()

    console.log("[Memory] Added:", newMemory.type, "-", newMemory.content.substring(0, 50))
    return newMemory
  }

  /**
   * Get all memories
   */
  getAllMemories(): Memory[] {
    return [...this.memories].sort((a, b) => b.createdAt - a.createdAt)
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

    // Tokenize query
    const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2)

    // Score each memory
    const scored = this.memories
      .filter(m => m.importance >= threshold)
      .map(memory => {
        let score = 0

        // Importance weight (0-30 points)
        score += memory.importance * 10

        // Keyword matching (0-50 points)
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
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)

    // Update access stats
    scored.forEach(({ memory }) => {
      const m = this.memories.find(mem => mem.id === memory.id)
      if (m) {
        m.lastAccessedAt = Date.now()
        m.accessCount++
      }
    })
    this.saveMemories()

    return scored.map(({ memory }) => memory)
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
    return true
  }

  /**
   * Delete a memory
   */
  deleteMemory(id: string): boolean {
    const index = this.memories.findIndex(m => m.id === id)
    if (index === -1) return false

    this.memories.splice(index, 1)
    this.saveMemories()
    return true
  }

  /**
   * Clear all memories
   */
  clearAllMemories() {
    this.memories = []
    this.saveMemories()
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
}

// Export singleton instance
export const memoryService = new MemoryService()
