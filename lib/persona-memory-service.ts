/**
 * Persona Memory Service
 * Allows each persona to remember past conversations with the user
 * SECURITY: All storage is user-scoped to prevent cross-user data leakage
 */

const STORAGE_KEY_PREFIX = "persona-memories" // User ID appended for security
const MAX_CONVERSATIONS_DEFAULT = 10
const MAX_CONTEXT_LENGTH = 2000 // Max characters to include in context

export interface PersonaConversation {
  id: string
  personaId: string
  timestamp: number
  summary: string // Summary of what was discussed
  topics: string[] // Key topics covered
  userMessages: string[] // Sample user messages
  assistantMessages: string[] // Sample assistant responses
}

export interface PersonaMemoryStore {
  [personaId: string]: PersonaConversation[]
}

class PersonaMemoryService {
  private memories: PersonaMemoryStore = {}
  private userId: string | null = null

  constructor() {
    // Don't load memories in constructor - wait for user ID to be set
    // This prevents showing another user's memories
  }

  /**
   * Get user-scoped storage key
   * SECURITY: Each user has their own isolated persona memory storage
   */
  private getStorageKey(): string {
    if (this.userId) {
      return `${STORAGE_KEY_PREFIX}_${this.userId}`
    }
    return `${STORAGE_KEY_PREFIX}_anonymous`
  }

  /**
   * Configure user for security isolation
   * SECURITY: Must be called when user logs in
   */
  configureUser(userId: string | null): void {
    const previousUserId = this.userId
    this.userId = userId

    // SECURITY: Clear and reload when user changes
    if (previousUserId !== userId) {
      console.log("[PersonaMemory] User changed - clearing and reloading memories")
      this.memories = {}

      // MIGRATION: Check for old non-scoped memories and migrate them
      if (userId) {
        this.migrateOldMemories(userId)
      }

      this.loadMemories()
    }

    console.log("[PersonaMemory] User configured:", userId ? "***" : null)
  }

  /**
   * MIGRATION: Migrate old non-user-scoped persona memories to user-scoped storage
   * This ensures no memories are lost when upgrading to the secure version
   */
  private migrateOldMemories(userId: string): void {
    if (typeof window === "undefined") return

    const oldKey = STORAGE_KEY_PREFIX // Old key without user ID
    const newKey = this.getStorageKey() // New key with user ID

    try {
      const oldData = localStorage.getItem(oldKey)

      if (oldData) {
        const existingNewData = localStorage.getItem(newKey)

        if (!existingNewData) {
          // No data in new location - migrate the old data
          console.log("[PersonaMemory] MIGRATION: Migrating old memories to user-scoped storage")
          localStorage.setItem(newKey, oldData)
          console.log("[PersonaMemory] MIGRATION: Successfully migrated memories for user")
        } else {
          // Data exists in both - merge (new data takes priority)
          console.log("[PersonaMemory] MIGRATION: Merging old memories with existing user memories")
          try {
            const oldMemories = JSON.parse(oldData) as PersonaMemoryStore
            const newMemories = JSON.parse(existingNewData) as PersonaMemoryStore

            // Merge persona by persona
            for (const personaId of Object.keys(oldMemories)) {
              if (!newMemories[personaId]) {
                newMemories[personaId] = oldMemories[personaId]
              } else {
                // Merge conversations for this persona
                const existingIds = new Set(newMemories[personaId].map(c => c.id))
                for (const conv of oldMemories[personaId]) {
                  if (!existingIds.has(conv.id)) {
                    newMemories[personaId].push(conv)
                  }
                }
              }
            }

            localStorage.setItem(newKey, JSON.stringify(newMemories))
            console.log("[PersonaMemory] MIGRATION: Merged memories successfully")
          } catch (mergeError) {
            console.error("[PersonaMemory] MIGRATION: Merge failed, keeping new data:", mergeError)
          }
        }

        console.log("[PersonaMemory] MIGRATION: Old key preserved for potential other users")
      }
    } catch (error) {
      console.error("[PersonaMemory] MIGRATION: Failed to migrate old memories:", error)
    }
  }

  /**
   * Clear memories on logout - SECURITY CRITICAL
   */
  clearOnLogout(): void {
    console.log("[PersonaMemory] Clearing memories on logout for security")
    this.memories = {}
    if (typeof window !== "undefined") {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}_anonymous`)
    }
    this.userId = null
  }

  /**
   * Load memories from localStorage (user-scoped)
   * SECURITY: Uses user-specific storage key
   */
  private loadMemories(): void {
    if (typeof window === "undefined") return

    const storageKey = this.getStorageKey()
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        this.memories = JSON.parse(stored)
        console.log("[PersonaMemory] Loaded memories for", Object.keys(this.memories).length, "personas from", storageKey)
      } else {
        console.log("[PersonaMemory] No memories found for", storageKey)
      }
    } catch (error) {
      console.error("[PersonaMemory] Failed to load memories:", error)
      this.memories = {}
    }
  }

  /**
   * Save memories to localStorage (user-scoped)
   * SECURITY: Uses user-specific storage key
   */
  private saveMemories(): void {
    if (typeof window === "undefined") return

    const storageKey = this.getStorageKey()
    try {
      localStorage.setItem(storageKey, JSON.stringify(this.memories))
    } catch (error) {
      console.error("[PersonaMemory] Failed to save memories:", error)
    }
  }

  /**
   * Add a conversation to persona's memory
   */
  addConversation(
    personaId: string,
    summary: string,
    topics: string[],
    userMessages: string[],
    assistantMessages: string[],
    maxConversations: number = MAX_CONVERSATIONS_DEFAULT
  ): void {
    if (!this.memories[personaId]) {
      this.memories[personaId] = []
    }

    const conversation: PersonaConversation = {
      id: `conv-${Date.now()}`,
      personaId,
      timestamp: Date.now(),
      summary,
      topics,
      userMessages: userMessages.slice(0, 3), // Keep first 3 messages
      assistantMessages: assistantMessages.slice(0, 3),
    }

    this.memories[personaId].unshift(conversation)

    // Limit to max conversations
    if (this.memories[personaId].length > maxConversations) {
      this.memories[personaId] = this.memories[personaId].slice(0, maxConversations)
    }

    this.saveMemories()
    console.log(`[PersonaMemory] Added conversation for ${personaId}. Total: ${this.memories[personaId].length}`)
  }

  /**
   * Get all conversations for a persona
   */
  getConversations(personaId: string): PersonaConversation[] {
    return this.memories[personaId] || []
  }

  /**
   * Get relevant past conversations based on current query
   */
  getRelevantConversations(personaId: string, query: string, maxResults: number = 3): PersonaConversation[] {
    const conversations = this.getConversations(personaId)
    if (conversations.length === 0) return []

    const queryLower = query.toLowerCase()
    const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 3)

    // Score each conversation based on relevance
    const scored = conversations.map((conv) => {
      let score = 0
      const convText = `${conv.summary} ${conv.topics.join(" ")}`.toLowerCase()

      // Check topic overlap
      queryWords.forEach((word) => {
        if (convText.includes(word)) {
          score += 2
        }
      })

      // Prefer recent conversations (recency boost)
      const ageInDays = (Date.now() - conv.timestamp) / (1000 * 60 * 60 * 24)
      if (ageInDays < 1) score += 3
      else if (ageInDays < 7) score += 2
      else if (ageInDays < 30) score += 1

      return { conversation: conv, score }
    })

    // Sort by score and return top results
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .filter((item) => item.score > 0)
      .map((item) => item.conversation)
  }

  /**
   * Format conversations for context injection
   */
  formatConversationsForContext(conversations: PersonaConversation[]): string {
    if (conversations.length === 0) return ""

    let context = "📚 Past Conversations (Persona Memory):\n\n"

    conversations.forEach((conv, index) => {
      const timeAgo = this.getTimeAgo(conv.timestamp)
      context += `[${index + 1}] ${timeAgo}:\n`
      context += `Summary: ${conv.summary}\n`
      if (conv.topics.length > 0) {
        context += `Topics: ${conv.topics.join(", ")}\n`
      }
      context += "\n"
    })

    // Limit context length
    if (context.length > MAX_CONTEXT_LENGTH) {
      context = `${context.substring(0, MAX_CONTEXT_LENGTH)  }...(truncated)`
    }

    return `${context  }\nPlease reference these past conversations when relevant, showing continuity and memory.`
  }

  /**
   * Generate a summary of a conversation (simplified version)
   * In production, this could use an LLM to generate better summaries
   */
  generateSummary(userMessages: string[], assistantMessages: string[]): string {
    const allText = [...userMessages, ...assistantMessages].join(" ")

    // Extract first meaningful sentence or first 100 chars
    const firstSentence = allText.split(/[.!?]/)[0]
    if (firstSentence && firstSentence.length > 10) {
      return firstSentence.trim().substring(0, 150)
    }

    return allText.substring(0, 150).trim()
  }

  /**
   * Extract topics from conversation
   */
  extractTopics(userMessages: string[], assistantMessages: string[]): string[] {
    const allText = [...userMessages, ...assistantMessages].join(" ").toLowerCase()

    // Simple keyword extraction (could be improved with NLP)
    const commonWords = new Set([
      "the",
      "is",
      "at",
      "which",
      "on",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "with",
      "to",
      "for",
      "of",
      "as",
      "by",
      "that",
      "this",
      "it",
      "from",
      "they",
      "we",
      "you",
      "me",
      "i",
      "my",
    ])

    const words = allText.match(/\b\w{4,}\b/g) || []
    const wordFreq = new Map<string, number>()

    words.forEach((word) => {
      if (!commonWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
      }
    })

    // Get top 5 most frequent words as topics
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word)
  }

  /**
   * Get time ago string
   */
  private getTimeAgo(timestamp: number): string {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 60) return `${minutes} minutes ago`
    if (hours < 24) return `${hours} hours ago`
    if (days === 1) return "yesterday"
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  /**
   * Clear all memories for a persona
   */
  clearPersonaMemories(personaId: string): void {
    delete this.memories[personaId]
    this.saveMemories()
    console.log(`[PersonaMemory] Cleared memories for ${personaId}`)
  }

  /**
   * Clear all memories
   */
  clearAllMemories(): void {
    this.memories = {}
    this.saveMemories()
    console.log("[PersonaMemory] Cleared all persona memories")
  }

  /**
   * Get statistics about persona memories
   */
  getStats(personaId: string): { totalConversations: number; oldestTimestamp: number; newestTimestamp: number } {
    const conversations = this.getConversations(personaId)

    if (conversations.length === 0) {
      return { totalConversations: 0, oldestTimestamp: 0, newestTimestamp: 0 }
    }

    const timestamps = conversations.map((c) => c.timestamp)
    return {
      totalConversations: conversations.length,
      oldestTimestamp: Math.min(...timestamps),
      newestTimestamp: Math.max(...timestamps),
    }
  }
}

// Export singleton instance
export const personaMemoryService = new PersonaMemoryService()
