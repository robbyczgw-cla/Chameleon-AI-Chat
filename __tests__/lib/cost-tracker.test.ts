/**
 * Cost Tracker Tests
 * Tests for lib/cost-tracker.ts
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { CostTracker, getCostTracker, getSearchCost } from "@/lib/cost-tracker"

describe("CostTracker", () => {
  let tracker: CostTracker

  beforeEach(() => {
    // Create fresh instance for each test
    tracker = new CostTracker()
    tracker.clearAll()
  })

  describe("calculateCost", () => {
    it("should calculate cost correctly for known models", () => {
      // Grok 4.1 Fast: $0.60/1M input, $2.00/1M output
      const cost = tracker.calculateCost("x-ai/grok-4.1-fast", 1000, 500)

      // (1000 / 1_000_000) * 0.60 + (500 / 1_000_000) * 2.0
      // = 0.0006 + 0.001 = 0.0016
      expect(cost).toBeCloseTo(0.0016, 6)
    })

    it("should calculate cost for GPT-4o", () => {
      // GPT-4o: $2.50/1M input, $10.00/1M output
      const cost = tracker.calculateCost("openai/gpt-4o", 10000, 5000)

      // (10000 / 1_000_000) * 2.50 + (5000 / 1_000_000) * 10.0
      // = 0.025 + 0.05 = 0.075
      expect(cost).toBeCloseTo(0.075, 6)
    })

    it("should calculate cost for Claude 4.5 Sonnet", () => {
      // Claude 4.5 Sonnet: $3.00/1M input, $15.00/1M output
      const cost = tracker.calculateCost("anthropic/claude-4.5-sonnet-20250929", 5000, 2000)

      // (5000 / 1_000_000) * 3.0 + (2000 / 1_000_000) * 15.0
      // = 0.015 + 0.03 = 0.045
      expect(cost).toBeCloseTo(0.045, 6)
    })

    it("should use fallback pricing for unknown models", () => {
      // Unknown model should use Grok 4.1 Fast pricing as fallback
      const cost = tracker.calculateCost("unknown/model", 1000, 500)
      const expectedCost = tracker.calculateCost("x-ai/grok-4.1-fast", 1000, 500)
      expect(cost).toBe(expectedCost)
    })

    it("should handle zero tokens", () => {
      const cost = tracker.calculateCost("x-ai/grok-4.1-fast", 0, 0)
      expect(cost).toBe(0)
    })

    it("should handle large token counts", () => {
      // 1 million tokens each
      const cost = tracker.calculateCost("x-ai/grok-4.1-fast", 1_000_000, 1_000_000)

      // 0.60 + 2.0 = 2.60
      expect(cost).toBeCloseTo(2.60, 2)
    })
  })

  describe("trackCost", () => {
    it("should add entry with generated id and timestamp", () => {
      tracker.trackCost({
        chatId: "chat-1",
        model: "x-ai/grok-4.1-fast",
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.001,
      })

      const entries = tracker.getEntries()
      expect(entries).toHaveLength(1)
      expect(entries[0].id).toBeDefined()
      expect(entries[0].timestamp).toBeDefined()
      expect(entries[0].chatId).toBe("chat-1")
    })

    it("should add entries in reverse chronological order", () => {
      tracker.trackCost({
        chatId: "chat-1",
        model: "x-ai/grok-4.1-fast",
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.001,
      })

      tracker.trackCost({
        chatId: "chat-2",
        model: "x-ai/grok-4.1-fast",
        inputTokens: 200,
        outputTokens: 100,
        totalTokens: 300,
        cost: 0.002,
      })

      const entries = tracker.getEntries()
      expect(entries[0].chatId).toBe("chat-2") // Most recent first
      expect(entries[1].chatId).toBe("chat-1")
    })

    it("should track search cost separately", () => {
      tracker.trackCost({
        chatId: "chat-1",
        model: "x-ai/grok-4.1-fast",
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.001,
        searchProvider: "tavily",
        searchCost: 0.001,
      })

      const entries = tracker.getEntries()
      expect(entries[0].searchProvider).toBe("tavily")
      expect(entries[0].searchCost).toBe(0.001)
    })
  })

  describe("getChatEntries", () => {
    beforeEach(() => {
      tracker.trackCost({
        chatId: "chat-1",
        model: "x-ai/grok-4.1-fast",
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.001,
      })
      tracker.trackCost({
        chatId: "chat-2",
        model: "x-ai/grok-4.1-fast",
        inputTokens: 200,
        outputTokens: 100,
        totalTokens: 300,
        cost: 0.002,
      })
      tracker.trackCost({
        chatId: "chat-1",
        model: "openai/gpt-4o",
        inputTokens: 300,
        outputTokens: 150,
        totalTokens: 450,
        cost: 0.003,
      })
    })

    it("should return only entries for specified chat", () => {
      const chat1Entries = tracker.getChatEntries("chat-1")
      expect(chat1Entries).toHaveLength(2)
      expect(chat1Entries.every((e) => e.chatId === "chat-1")).toBe(true)
    })

    it("should return empty array for non-existent chat", () => {
      const entries = tracker.getChatEntries("non-existent")
      expect(entries).toHaveLength(0)
    })
  })

  describe("getStats", () => {
    beforeEach(() => {
      tracker.trackCost({
        chatId: "chat-1",
        model: "x-ai/grok-4.1-fast",
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        cost: 0.01,
      })
      tracker.trackCost({
        chatId: "chat-2",
        model: "openai/gpt-4o",
        inputTokens: 2000,
        outputTokens: 1000,
        totalTokens: 3000,
        cost: 0.02,
        searchCost: 0.001,
      })
    })

    it("should calculate total cost including search costs", () => {
      const stats = tracker.getStats()
      // 0.01 + 0.02 + 0.001 = 0.031
      expect(stats.totalCost).toBeCloseTo(0.031, 4)
    })

    it("should calculate total tokens", () => {
      const stats = tracker.getStats()
      expect(stats.totalTokens).toBe(4500) // 1500 + 3000
    })

    it("should count unique chats", () => {
      const stats = tracker.getStats()
      expect(stats.totalChats).toBe(2)
    })

    it("should break down cost by model", () => {
      const stats = tracker.getStats()
      expect(stats.costByModel["x-ai/grok-4.1-fast"]).toBe(0.01)
      expect(stats.costByModel["openai/gpt-4o"]).toBe(0.02)
    })

    it("should calculate average cost per message", () => {
      const stats = tracker.getStats()
      // Total cost 0.031 / 2 entries = 0.0155
      expect(stats.avgCostPerMessage).toBeCloseTo(0.0155, 4)
    })

    it("should group cost by day", () => {
      const stats = tracker.getStats()
      expect(stats.costByDay.length).toBeGreaterThanOrEqual(1)
      expect(stats.costByDay[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe("getChatCost", () => {
    it("should return total cost for a chat including search costs", () => {
      tracker.trackCost({
        chatId: "chat-1",
        model: "x-ai/grok-4.1-fast",
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        cost: 0.01,
        searchCost: 0.001,
      })
      tracker.trackCost({
        chatId: "chat-1",
        model: "openai/gpt-4o",
        inputTokens: 2000,
        outputTokens: 1000,
        totalTokens: 3000,
        cost: 0.02,
      })

      const cost = tracker.getChatCost("chat-1")
      // 0.01 + 0.001 + 0.02 = 0.031
      expect(cost).toBeCloseTo(0.031, 4)
    })
  })

  describe("clearOlderThan", () => {
    it("should remove entries older than specified days", () => {
      // Add entry with old timestamp
      const oldEntry = {
        chatId: "old-chat",
        model: "x-ai/grok-4.1-fast",
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.001,
      }
      tracker.trackCost(oldEntry)

      // Manually modify timestamp to be 10 days ago
      const entries = tracker.getEntries()
      const tenDaysAgo = Date.now() - 10 * 24 * 60 * 60 * 1000
      ;(entries[0] as any).timestamp = tenDaysAgo

      // Add recent entry
      tracker.trackCost({
        chatId: "new-chat",
        model: "x-ai/grok-4.1-fast",
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.001,
      })

      // Clear entries older than 5 days
      tracker.clearOlderThan(5)

      const remainingEntries = tracker.getEntries()
      expect(remainingEntries).toHaveLength(1)
      expect(remainingEntries[0].chatId).toBe("new-chat")
    })
  })

  describe("exportToJSON", () => {
    it("should export all entries as JSON string", () => {
      tracker.trackCost({
        chatId: "chat-1",
        model: "x-ai/grok-4.1-fast",
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        cost: 0.001,
      })

      const exported = tracker.exportToJSON()
      const parsed = JSON.parse(exported)

      expect(parsed.exportDate).toBeDefined()
      expect(parsed.totalEntries).toBe(1)
      expect(parsed.entries).toHaveLength(1)
    })
  })
})

describe("getSearchCost", () => {
  it("should return correct cost for Tavily", () => {
    expect(getSearchCost("tavily")).toBe(0.001)
  })

  it("should return correct cost for Serper", () => {
    expect(getSearchCost("serper")).toBe(0.0002)
  })
})

describe("getCostTracker singleton", () => {
  it("should return the same instance", () => {
    const instance1 = getCostTracker()
    const instance2 = getCostTracker()
    expect(instance1).toBe(instance2)
  })
})
