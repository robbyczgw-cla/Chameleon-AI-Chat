/**
 * Memory Service - Token-efficient long-term memory for Advanced mode
 *
 * Stores and retrieves user context, preferences, and facts to maintain
 * conversation continuity across sessions without excessive token usage.
 *
 * Supports optional cloud sync to Supabase for cross-device access.
 */

import type { Memory, MemorySettings } from "@/types"
import { generateUUID } from "@/lib/utils"
import { supabaseSync } from "@/lib/supabase/sync"
import { generateEmbedding, findSimilar, cosineSimilarity } from "@/lib/embedding-service"

const MEMORY_STORAGE_KEY = "chat_memories"
const EXTRACTION_MODEL = "openai/gpt-oss-20b" // Cheap, fast model for extraction
const CLASSIFIER_MODEL = "openai/gpt-oss-20b" // Same model for query classification

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
  private settings: MemorySettings = DEFAULT_SETTINGS
  private userId: string | null = null
  private syncEnabled: boolean = false

  constructor() {
    this.loadMemories()
  }

  /**
   * Configure database sync
   */
  configureDatabaseSync(userId: string | null, syncEnabled: boolean) {
    this.userId = userId
    this.syncEnabled = syncEnabled && !!userId
    console.log("[Memory] Database sync configured:", { userId: userId ? "***" : null, syncEnabled: this.syncEnabled })
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

      // Add DB memories that aren't local
      for (const dbMem of dbMemories) {
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
   * Save memories to localStorage (and optionally to database)
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
  addMemory(memory: Omit<Memory, "id" | "createdAt" | "lastAccessedAt" | "accessCount">, apiKey?: string): Memory {
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
   * Get relevant memories using semantic similarity (embedding-based)
   * Falls back to keyword matching if embeddings aren't available
   */
  async getSemanticRelevantMemories(
    query: string,
    apiKey: string,
    limit?: number
  ): Promise<Array<Memory & { similarity?: number }>> {
    const maxResults = limit || this.settings.maxMemoriesInContext
    const threshold = this.settings.similarityThreshold || 0.5

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
          // Update access stats
          for (const result of results) {
            const m = this.memories.find(mem => mem.id === result.id)
            if (m) {
              m.lastAccessedAt = Date.now()
              m.accessCount++
            }
          }
          this.saveMemories()
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

    // Update access stats
    for (const result of results) {
      const m = this.memories.find(mem => mem.id === result.id)
      if (m) {
        m.lastAccessedAt = Date.now()
        m.accessCount++
      }
    }
    this.saveMemories()

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
   * Delete a memory
   */
  deleteMemory(id: string): boolean {
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
          model: EXTRACTION_MODEL,
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

      // Step 4: Create memories from LLM output
      let createdCount = 0
      for (const memData of memoriesData) {
        try {
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

      console.log("[Memory] Successfully created", createdCount, "profile memories")
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
      console.log("[Memory] Starting LLM extraction with model:", EXTRACTION_MODEL)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-openrouter-api-key": apiKey,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: extractionPrompt }],
          model: EXTRACTION_MODEL,
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

        // Skip if too similar to existing memory
        const contentLower = item.content?.toLowerCase() || ""
        if (existingContent && existingContent.length > 0 && contentLower.length >= 30) {
          if (existingContent.includes(contentLower.substring(0, 30))) {
            console.log("[Memory] Skipping duplicate:", item.content?.substring(0, 40))
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
    const defaultResult: QueryClassification = {
      needsMemory: false,
      confidence: 0,
      reason: "No API key available",
      queryType: "factual"
    }

    if (!apiKey) {
      console.log("[Memory] No API key, skipping query classification")
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
          model: CLASSIFIER_MODEL,
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
