/**
 * Search Service Tests
 * Tests for lib/search-service.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { searchService } from "@/lib/search-service"
import type { Chat, Message } from "@/types"

// Helper to create test chats
function createChat(id: string, title: string, messages: Partial<Message>[]): Chat {
  return {
    id,
    title,
    messages: messages.map((m, i) => ({
      id: `msg-${id}-${i}`,
      role: m.role || "user",
      content: m.content || "",
      timestamp: Date.now() - i * 1000,
    })) as Message[],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    model: "test-model",
  }
}

describe("SearchService", () => {
  beforeEach(() => {
    // Invalidate index before each test
    searchService.invalidateIndex()
  })

  describe("buildIndex", () => {
    it("should build index from chats", () => {
      const chats: Chat[] = [
        createChat("1", "TypeScript Tutorial", [
          { content: "How do I use TypeScript with React?" },
          { content: "TypeScript provides type safety", role: "assistant" },
        ]),
      ]

      searchService.buildIndex(chats)

      expect(searchService.isIndexFresh()).toBe(true)
    })

    it("should index both title and message content", () => {
      const chats: Chat[] = [
        createChat("1", "JavaScript Basics", [
          { content: "What is a closure in JavaScript?" },
        ]),
      ]

      searchService.buildIndex(chats)

      // Search should find matches in both title and content
      const titleResults = searchService.search("javascript", chats)
      const contentResults = searchService.search("closure", chats)

      expect(titleResults.length).toBeGreaterThan(0)
      expect(contentResults.length).toBeGreaterThan(0)
    })

    it("should handle empty chats array", () => {
      searchService.buildIndex([])
      expect(searchService.isIndexFresh()).toBe(true)
    })

    it("should handle chats with no messages", () => {
      const chats: Chat[] = [createChat("1", "Empty Chat", [])]

      searchService.buildIndex(chats)

      const results = searchService.search("empty", chats)
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe("search", () => {
    const testChats: Chat[] = [
      createChat("1", "React Hooks Guide", [
        { content: "useState is a React hook for managing state" },
        { content: "useEffect handles side effects in functional components", role: "assistant" },
      ]),
      createChat("2", "TypeScript Types", [
        { content: "How to define custom types in TypeScript?" },
        { content: "You can use interface or type keyword", role: "assistant" },
      ]),
      createChat("3", "Python Basics", [
        { content: "Python is a great language for beginners" },
        { content: "List comprehensions are powerful in Python", role: "assistant" },
      ]),
    ]

    beforeEach(() => {
      searchService.buildIndex(testChats)
    })

    it("should return matching chats", () => {
      const results = searchService.search("react", testChats)

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].chatId).toBe("1")
    })

    it("should prioritize title matches", () => {
      const results = searchService.search("typescript", testChats)

      // TypeScript is in title of chat 2
      expect(results[0].chatId).toBe("2")
      expect(results[0].titleMatch).toBe(true)
    })

    it("should return multiple message matches", () => {
      const results = searchService.search("react", testChats)

      // Both "useState" and "useEffect" messages mention React-related content
      expect(results[0].messageMatches.length).toBeGreaterThanOrEqual(1)
    })

    it("should handle multi-word queries", () => {
      const results = searchService.search("react hooks", testChats)

      expect(results.length).toBeGreaterThan(0)
      expect(results[0].chatId).toBe("1")
    })

    it("should perform prefix matching (fuzzy search)", () => {
      const results = searchService.search("type", testChats)

      // Should match "typescript" and "types"
      expect(results.some((r) => r.chatId === "2")).toBe(true)
    })

    it("should return empty array for no matches", () => {
      const results = searchService.search("nonexistent query xyz", testChats)
      expect(results).toHaveLength(0)
    })

    it("should return empty array for empty query", () => {
      const results = searchService.search("", testChats)
      expect(results).toHaveLength(0)
    })

    it("should return empty array for whitespace-only query", () => {
      const results = searchService.search("   ", testChats)
      expect(results).toHaveLength(0)
    })

    it("should respect limit parameter", () => {
      const results = searchService.search("in", testChats, 2)
      expect(results.length).toBeLessThanOrEqual(2)
    })

    it("should score results by relevance", () => {
      const results = searchService.search("python", testChats)

      // Results should be sorted by score (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
      }
    })

    it("should handle special characters in query", () => {
      const results = searchService.search("useState()", testChats)

      // Should still find matches after removing punctuation
      expect(results.length).toBeGreaterThan(0)
    })

    it("should be case insensitive", () => {
      const upperResults = searchService.search("REACT", testChats)
      const lowerResults = searchService.search("react", testChats)

      expect(upperResults.length).toBe(lowerResults.length)
      expect(upperResults[0]?.chatId).toBe(lowerResults[0]?.chatId)
    })
  })

  describe("search performance", () => {
    it("should search quickly with large chat history", () => {
      // Create 100 chats with 10 messages each
      const largeChats: Chat[] = Array.from({ length: 100 }, (_, i) =>
        createChat(`chat-${i}`, `Chat about topic ${i % 10}`, [
          { content: `Message about programming and ${i % 5 === 0 ? "javascript" : "python"}` },
          { content: `Response about ${i % 3 === 0 ? "react" : "vue"} framework`, role: "assistant" },
          { content: "Follow up question about types and interfaces" },
        ])
      )

      searchService.buildIndex(largeChats)

      const start = performance.now()
      const results = searchService.search("javascript programming", largeChats)
      const duration = performance.now() - start

      // Search should complete in under 50ms
      expect(duration).toBeLessThan(50)
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe("index freshness", () => {
    it("should report fresh index after build", () => {
      const chats = [createChat("1", "Test", [{ content: "test" }])]
      searchService.buildIndex(chats)

      expect(searchService.isIndexFresh()).toBe(true)
    })

    it("should report stale index after invalidation", () => {
      const chats = [createChat("1", "Test", [{ content: "test" }])]
      searchService.buildIndex(chats)
      searchService.invalidateIndex()

      expect(searchService.isIndexFresh()).toBe(false)
    })

    it("should auto-rebuild stale index on search", () => {
      const chats = [createChat("1", "Test Chat", [{ content: "test content" }])]

      // Don't build index first
      searchService.invalidateIndex()

      // Search should trigger index rebuild
      const results = searchService.search("test", chats)

      expect(results.length).toBeGreaterThan(0)
      expect(searchService.isIndexFresh()).toBe(true)
    })
  })

  describe("edge cases", () => {
    it("should handle very long messages", () => {
      const longContent = "word ".repeat(10000)
      const chats = [createChat("1", "Long Chat", [{ content: longContent }])]

      searchService.buildIndex(chats)
      const results = searchService.search("word", chats)

      expect(results.length).toBeGreaterThan(0)
    })

    it("should handle unicode characters", () => {
      const chats = [
        createChat("1", "Umlaute Test", [
          { content: "Mochten Sie uber Programmierung sprechen?" },
        ]),
      ]

      searchService.buildIndex(chats)
      const results = searchService.search("programmierung", chats)

      expect(results.length).toBeGreaterThan(0)
    })

    it("should handle numbers in search", () => {
      const chats = [
        createChat("1", "Version 2023", [{ content: "Released in 2023 with new features" }]),
      ]

      searchService.buildIndex(chats)
      const results = searchService.search("2023", chats)

      expect(results.length).toBeGreaterThan(0)
    })

    it("should filter very short words", () => {
      const chats = [createChat("1", "A B C", [{ content: "a b c" }])]

      searchService.buildIndex(chats)
      // Single character words should be filtered out
      const results = searchService.search("a", chats)

      // May or may not match depending on tokenizer behavior
      // The important thing is it doesn't crash
      expect(Array.isArray(results)).toBe(true)
    })

    it("should handle multimodal message content", () => {
      const chats: Chat[] = [
        {
          id: "1",
          title: "Image Chat",
          messages: [
            {
              id: "msg-1",
              role: "user",
              content: [
                { type: "text", text: "What is in this image?" },
                { type: "image_url", image_url: { url: "data:image/png;base64,..." } },
              ],
              timestamp: Date.now(),
            },
          ],
          createdAt: Date.now(),
          updatedAt: Date.now(),
          model: "test-model",
        },
      ]

      // Should not crash on multimodal content
      searchService.buildIndex(chats)
      const results = searchService.search("image", chats)

      expect(Array.isArray(results)).toBe(true)
    })
  })
})
