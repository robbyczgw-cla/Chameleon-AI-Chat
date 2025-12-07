import { describe, test, expect, beforeEach, vi } from 'vitest'
import { CostTracker, getSearchCost } from './cost-tracker'

// Mock localStorage before tests
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

global.localStorage = localStorageMock as any

describe('CostTracker', () => {
  let tracker: CostTracker

  beforeEach(() => {
    // Clear localStorage completely
    localStorageMock.clear()
    // Create fresh instance for each test
    tracker = new CostTracker()
  })

  // NOTE: Cost calculation removed - now using exact costs from OpenRouter API
  // See fetchGenerationData() for exact cost tracking

  describe('trackCost', () => {
    test('tracks a cost entry', () => {
      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.015,
      })

      const entries = tracker.getEntries()
      expect(entries).toHaveLength(1)
      expect(entries[0].chatId).toBe('chat-1')
      expect(entries[0].model).toBe('openai/gpt-4')
      expect(entries[0].cost).toBe(0.015)
    })

    test('generates unique IDs for entries', () => {
      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.015,
      })

      tracker.trackCost({
        chatId: 'chat-2',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.015,
      })

      const entries = tracker.getEntries()
      expect(entries[0].id).not.toBe(entries[1].id)
    })

    test('adds timestamp to entries', () => {
      const before = Date.now()
      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.015,
      })
      const after = Date.now()

      const entries = tracker.getEntries()
      expect(entries[0].timestamp).toBeGreaterThanOrEqual(before)
      expect(entries[0].timestamp).toBeLessThanOrEqual(after)
    })

    test('adds new entries to the beginning', () => {
      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.01,
      })

      tracker.trackCost({
        chatId: 'chat-2',
        model: 'openai/gpt-4',
        inputTokens: 200,
        outputTokens: 400,
        totalTokens: 600,
        cost: 0.02,
      })

      const entries = tracker.getEntries()
      expect(entries[0].cost).toBe(0.02) // Most recent
      expect(entries[1].cost).toBe(0.01) // Older
    })
  })

  describe('getChatEntries', () => {
    test('returns entries for specific chat', () => {
      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.01,
      })

      tracker.trackCost({
        chatId: 'chat-2',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.02,
      })

      const chat1Entries = tracker.getChatEntries('chat-1')
      expect(chat1Entries).toHaveLength(1)
      expect(chat1Entries[0].chatId).toBe('chat-1')
    })

    test('returns empty array for non-existent chat', () => {
      const entries = tracker.getChatEntries('non-existent')
      expect(entries).toEqual([])
    })
  })

  describe('getStats', () => {
    beforeEach(() => {
      // Add some test data
      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.015,
      })

      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.015,
      })

      tracker.trackCost({
        chatId: 'chat-2',
        model: 'anthropic/claude-3.5-sonnet',
        inputTokens: 500,
        outputTokens: 1000,
        totalTokens: 1500,
        cost: 0.0165,
        searchCost: 0.001,
      })
    })

    test('calculates total cost from actualCost only', () => {
      // Clear existing data and add entry with actualCost
      localStorageMock.clear()
      const freshTracker = new CostTracker()

      freshTracker.trackCost({
        chatId: 'chat-test',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0, // Deprecated
        actualCost: 0.015, // Exact from OpenRouter
      })

      const stats = freshTracker.getStats()
      expect(stats.totalCost).toBeCloseTo(0.015, 6)
    })

    test('calculates total tokens', () => {
      const stats = tracker.getStats()
      expect(stats.totalTokens).toBe(2100) // 300 + 300 + 1500
    })

    test('counts unique chats', () => {
      const stats = tracker.getStats()
      expect(stats.totalChats).toBe(2) // chat-1 and chat-2
    })

    test('groups cost by model with actualCost', () => {
      // Add entries with actualCost (exact from OpenRouter)
      tracker.trackCost({
        chatId: 'chat-3',
        model: 'openai/gpt-4o',
        inputTokens: 1000,
        outputTokens: 2000,
        totalTokens: 3000,
        cost: 0, // Deprecated
        actualCost: 0.025, // Exact from OpenRouter
      })

      const stats = tracker.getStats()
      expect(stats.costByModel['openai/gpt-4o']).toBeCloseTo(0.025, 6)
    })

    test('calculates average cost per message with actualCost', () => {
      // Clear and create fresh tracker with multiple actualCost entries
      localStorageMock.clear()
      const freshTracker = new CostTracker()

      freshTracker.trackCost({
        chatId: 'chat-4',
        model: 'anthropic/claude-4.5-sonnet-20250929',
        inputTokens: 1000,
        outputTokens: 2000,
        totalTokens: 3000,
        cost: 0, // Deprecated
        actualCost: 0.033, // Exact from OpenRouter
      })

      freshTracker.trackCost({
        chatId: 'chat-5',
        model: 'openai/gpt-4o',
        inputTokens: 500,
        outputTokens: 1000,
        totalTokens: 1500,
        cost: 0, // Deprecated
        actualCost: 0.015, // Exact from OpenRouter
      })

      const stats = freshTracker.getStats()
      // Average of 0.033 and 0.015 = 0.024
      expect(stats.avgCostPerMessage).toBeCloseTo(0.024, 4)
    })

    test('returns zero avg for no entries', () => {
      localStorageMock.clear() // Clear before creating empty tracker
      const emptyTracker = new CostTracker()
      const stats = emptyTracker.getStats()
      expect(stats.avgCostPerMessage).toBe(0)
    })
  })

  describe('getChatCost', () => {
    test('calculates total cost for a chat using actualCost', () => {
      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0, // Deprecated
        actualCost: 0.01, // Exact from OpenRouter
      })

      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0, // Deprecated
        actualCost: 0.02, // Exact from OpenRouter
        searchCost: 0.001,
      })

      const totalCost = tracker.getChatCost('chat-1')
      expect(totalCost).toBeCloseTo(0.031, 6) // 0.01 + 0.02 + 0.001
    })

    test('returns zero for non-existent chat', () => {
      const cost = tracker.getChatCost('non-existent')
      expect(cost).toBe(0)
    })
  })

  describe('clearAll', () => {
    test('removes all entries', () => {
      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.01,
      })

      tracker.clearAll()

      expect(tracker.getEntries()).toHaveLength(0)
    })
  })

  describe('clearOlderThan', () => {
    test('removes entries older than specified days', () => {
      // Add entry from 10 days ago
      const oldEntry = {
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.01,
      }

      tracker.trackCost(oldEntry)

      // Manually set timestamp to 10 days ago
      const entries = tracker.getEntries()
      entries[0].timestamp = Date.now() - 10 * 24 * 60 * 60 * 1000

      // Add recent entry
      tracker.trackCost({
        chatId: 'chat-2',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.02,
      })

      // Clear entries older than 7 days
      tracker.clearOlderThan(7)

      const remaining = tracker.getEntries()
      expect(remaining).toHaveLength(1)
      expect(remaining[0].cost).toBe(0.02)
    })
  })

  describe('exportToJSON', () => {
    test('exports entries as JSON string', () => {
      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.01,
      })

      const json = tracker.exportToJSON()
      const parsed = JSON.parse(json)

      expect(parsed.totalEntries).toBe(1)
      expect(parsed.entries).toHaveLength(1)
      expect(parsed.exportDate).toBeDefined()
      expect(parsed.entries[0].chatId).toBe('chat-1')
    })
  })
})


describe('getSearchCost', () => {
  test('returns cost for Tavily', () => {
    expect(getSearchCost('tavily')).toBe(0.001)
  })

  test('returns cost for Serper', () => {
    expect(getSearchCost('serper')).toBe(0.0002)
  })

  test('returns 0 for unknown provider', () => {
    // @ts-expect-error - testing invalid input
    expect(getSearchCost('unknown')).toBe(0)
  })
})
