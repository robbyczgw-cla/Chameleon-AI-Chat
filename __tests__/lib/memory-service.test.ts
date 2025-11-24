/**
 * Memory Service Tests
 * Tests for lib/memory-service.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { memoryService } from "@/lib/memory-service"

describe("MemoryService", () => {
  beforeEach(() => {
    // Clear all memories before each test
    memoryService.clearAllMemories()
  })

  describe("addMemory", () => {
    it("should add a memory with generated id and timestamps", () => {
      const memory = memoryService.addMemory({
        type: "preference",
        content: "User prefers dark mode",
        importance: 2,
      })

      expect(memory.id).toBeDefined()
      expect(memory.createdAt).toBeDefined()
      expect(memory.lastAccessedAt).toBeDefined()
      expect(memory.accessCount).toBe(0)
      expect(memory.type).toBe("preference")
      expect(memory.content).toBe("User prefers dark mode")
    })

    it("should add memory with category", () => {
      const memory = memoryService.addMemory({
        type: "fact",
        content: "User works at Tech Company",
        importance: 2,
        category: "work",
      })

      expect(memory.category).toBe("work")
    })

    it("should persist to localStorage", () => {
      memoryService.addMemory({
        type: "preference",
        content: "Test memory",
        importance: 1,
      })

      const stored = localStorage.getItem("chat_memories")
      expect(stored).toBeDefined()
      const parsed = JSON.parse(stored!)
      expect(parsed).toHaveLength(1)
    })
  })

  describe("getAllMemories", () => {
    it("should return all memories sorted by creation date (newest first)", () => {
      memoryService.addMemory({
        type: "preference",
        content: "First memory",
        importance: 1,
      })

      // Small delay to ensure different timestamps
      memoryService.addMemory({
        type: "fact",
        content: "Second memory",
        importance: 2,
      })

      const memories = memoryService.getAllMemories()
      expect(memories).toHaveLength(2)
      expect(memories[0].content).toBe("Second memory")
      expect(memories[1].content).toBe("First memory")
    })

    it("should return empty array when no memories exist", () => {
      const memories = memoryService.getAllMemories()
      expect(memories).toHaveLength(0)
    })
  })

  describe("getMemoriesByType", () => {
    beforeEach(() => {
      memoryService.addMemory({ type: "preference", content: "Pref 1", importance: 1 })
      memoryService.addMemory({ type: "preference", content: "Pref 2", importance: 2 })
      memoryService.addMemory({ type: "fact", content: "Fact 1", importance: 1 })
      memoryService.addMemory({ type: "goal", content: "Goal 1", importance: 3 })
    })

    it("should return only preferences", () => {
      const prefs = memoryService.getMemoriesByType("preference")
      expect(prefs).toHaveLength(2)
      expect(prefs.every((m) => m.type === "preference")).toBe(true)
    })

    it("should return only facts", () => {
      const facts = memoryService.getMemoriesByType("fact")
      expect(facts).toHaveLength(1)
      expect(facts[0].content).toBe("Fact 1")
    })

    it("should return empty array for type with no memories", () => {
      const skills = memoryService.getMemoriesByType("skill")
      expect(skills).toHaveLength(0)
    })
  })

  describe("getRelevantMemories", () => {
    beforeEach(() => {
      // Add various memories with different importance levels
      memoryService.addMemory({
        type: "preference",
        content: "User prefers TypeScript over JavaScript",
        importance: 3,
        category: "coding",
      })
      memoryService.addMemory({
        type: "fact",
        content: "User is a software developer",
        importance: 2,
        category: "work",
      })
      memoryService.addMemory({
        type: "preference",
        content: "User likes dark mode",
        importance: 1,
        category: "ui",
      })
      memoryService.addMemory({
        type: "goal",
        content: "User wants to learn Python programming",
        importance: 3,
        category: "learning",
      })
    })

    it("should return memories matching query keywords", () => {
      const relevant = memoryService.getRelevantMemories("TypeScript code")

      expect(relevant.length).toBeGreaterThan(0)
      expect(relevant.some((m) => m.content.includes("TypeScript"))).toBe(true)
    })

    it("should prioritize high importance memories", () => {
      const relevant = memoryService.getRelevantMemories("user preferences")

      // High importance memories should come first
      if (relevant.length > 1) {
        expect(relevant[0].importance).toBeGreaterThanOrEqual(relevant[relevant.length - 1].importance)
      }
    })

    it("should match category keywords", () => {
      const relevant = memoryService.getRelevantMemories("coding preferences")

      expect(relevant.some((m) => m.category === "coding")).toBe(true)
    })

    it("should respect limit parameter", () => {
      const relevant = memoryService.getRelevantMemories("user", 2)
      expect(relevant.length).toBeLessThanOrEqual(2)
    })

    it("should update access stats on retrieval", () => {
      const relevant = memoryService.getRelevantMemories("TypeScript")

      if (relevant.length > 0) {
        expect(relevant[0].accessCount).toBeGreaterThan(0)
      }
    })

    it("should filter by importance threshold", () => {
      memoryService.updateSettings({ importanceThreshold: 3 })
      const relevant = memoryService.getRelevantMemories("user")

      // Should only return memories with importance >= 3
      expect(relevant.every((m) => m.importance >= 3)).toBe(true)
    })
  })

  describe("formatMemoriesForContext", () => {
    it("should format memories grouped by type", () => {
      const memories = [
        {
          id: "1",
          type: "preference" as const,
          content: "Likes dark mode",
          importance: 2 as const,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          accessCount: 0,
        },
        {
          id: "2",
          type: "fact" as const,
          content: "Is a developer",
          importance: 2 as const,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          accessCount: 0,
        },
      ]

      const formatted = memoryService.formatMemoriesForContext(memories)

      expect(formatted).toContain("<user_memory>")
      expect(formatted).toContain("Preferences:")
      expect(formatted).toContain("Facts:")
      expect(formatted).toContain("Likes dark mode")
      expect(formatted).toContain("Is a developer")
      expect(formatted).toContain("</user_memory>")
    })

    it("should return empty string for empty memories array", () => {
      const formatted = memoryService.formatMemoriesForContext([])
      expect(formatted).toBe("")
    })

    it("should join multiple memories of same type with semicolons", () => {
      const memories = [
        {
          id: "1",
          type: "preference" as const,
          content: "Likes dark mode",
          importance: 2 as const,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          accessCount: 0,
        },
        {
          id: "2",
          type: "preference" as const,
          content: "Prefers TypeScript",
          importance: 2 as const,
          createdAt: Date.now(),
          lastAccessedAt: Date.now(),
          accessCount: 0,
        },
      ]

      const formatted = memoryService.formatMemoriesForContext(memories)
      expect(formatted).toContain("Likes dark mode; Prefers TypeScript")
    })
  })

  describe("updateMemory", () => {
    it("should update memory content", () => {
      const memory = memoryService.addMemory({
        type: "fact",
        content: "Original content",
        importance: 1,
      })

      const success = memoryService.updateMemory(memory.id, {
        content: "Updated content",
      })

      expect(success).toBe(true)

      const all = memoryService.getAllMemories()
      expect(all[0].content).toBe("Updated content")
    })

    it("should return false for non-existent memory", () => {
      const success = memoryService.updateMemory("non-existent-id", {
        content: "Updated",
      })
      expect(success).toBe(false)
    })

    it("should update importance level", () => {
      const memory = memoryService.addMemory({
        type: "fact",
        content: "Test",
        importance: 1,
      })

      memoryService.updateMemory(memory.id, { importance: 3 })

      const all = memoryService.getAllMemories()
      expect(all[0].importance).toBe(3)
    })
  })

  describe("deleteMemory", () => {
    it("should delete memory by id", () => {
      const memory = memoryService.addMemory({
        type: "fact",
        content: "To be deleted",
        importance: 1,
      })

      const success = memoryService.deleteMemory(memory.id)
      expect(success).toBe(true)

      const all = memoryService.getAllMemories()
      expect(all).toHaveLength(0)
    })

    it("should return false for non-existent memory", () => {
      const success = memoryService.deleteMemory("non-existent-id")
      expect(success).toBe(false)
    })
  })

  describe("clearAllMemories", () => {
    it("should remove all memories", () => {
      memoryService.addMemory({ type: "fact", content: "Test 1", importance: 1 })
      memoryService.addMemory({ type: "fact", content: "Test 2", importance: 2 })

      memoryService.clearAllMemories()

      const all = memoryService.getAllMemories()
      expect(all).toHaveLength(0)
    })
  })

  describe("getStats", () => {
    beforeEach(() => {
      memoryService.addMemory({ type: "preference", content: "Pref", importance: 1 })
      memoryService.addMemory({ type: "fact", content: "Fact", importance: 2 })
      memoryService.addMemory({ type: "goal", content: "Goal", importance: 3 })
      memoryService.addMemory({ type: "goal", content: "Goal 2", importance: 3 })
    })

    it("should return correct total count", () => {
      const stats = memoryService.getStats()
      expect(stats.total).toBe(4)
    })

    it("should count memories by type", () => {
      const stats = memoryService.getStats()
      expect(stats.byType.preference).toBe(1)
      expect(stats.byType.fact).toBe(1)
      expect(stats.byType.goal).toBe(2)
      expect(stats.byType.context).toBe(0)
      expect(stats.byType.skill).toBe(0)
    })

    it("should count memories by importance", () => {
      const stats = memoryService.getStats()
      expect(stats.byImportance.low).toBe(1)
      expect(stats.byImportance.medium).toBe(1)
      expect(stats.byImportance.high).toBe(2)
    })
  })

  describe("extractMemoriesFromConversation", () => {
    it("should extract preference patterns", () => {
      const extracted = memoryService.extractMemoriesFromConversation(
        "I prefer dark mode for coding",
        "I'll help you with that"
      )

      expect(extracted.length).toBeGreaterThan(0)
      expect(extracted.some((m) => m.type === "preference")).toBe(true)
    })

    it("should extract fact patterns", () => {
      const extracted = memoryService.extractMemoriesFromConversation(
        "I am a software developer in Berlin",
        "Great to meet you!"
      )

      expect(extracted.some((m) => m.type === "fact")).toBe(true)
    })

    it("should extract goal patterns", () => {
      const extracted = memoryService.extractMemoriesFromConversation(
        "I want to learn machine learning this year",
        "That's a great goal!"
      )

      expect(extracted.some((m) => m.type === "goal")).toBe(true)
    })

    it("should filter out very short matches", () => {
      const extracted = memoryService.extractMemoriesFromConversation(
        "I like it",
        "Good"
      )

      // Very short matches should be filtered
      expect(extracted.every((m) => m.content.length > 10)).toBe(true)
    })
  })

  describe("settings management", () => {
    it("should update settings", () => {
      memoryService.updateSettings({
        enabled: true,
        maxMemoriesInContext: 10,
      })

      const settings = memoryService.getSettings()
      expect(settings.enabled).toBe(true)
      expect(settings.maxMemoriesInContext).toBe(10)
    })

    it("should merge partial settings", () => {
      memoryService.updateSettings({ maxMemoriesInContext: 15 })

      const settings = memoryService.getSettings()
      // Other settings should remain at defaults
      expect(settings.enabled).toBe(false)
      expect(settings.maxMemoriesInContext).toBe(15)
    })
  })
})
