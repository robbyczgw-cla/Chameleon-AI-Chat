import { describe, test, expect, beforeEach, vi } from 'vitest'
import { CostTracker, MODEL_PRICING, getSearchCost } from './cost-tracker'

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

  describe('calculateCost', () => {
    test('calculates cost for GPT-4', () => {
      const cost = tracker.calculateCost('openai/gpt-4', 1000, 2000)
      // 1000/1M * $30 + 2000/1M * $60 = $0.03 + $0.12 = $0.15
      expect(cost).toBeCloseTo(0.15, 6)
    })

    test('calculates cost for Claude Sonnet', () => {
      const cost = tracker.calculateCost('anthropic/claude-4.5-sonnet-20250929', 1000, 2000)
      // 1000/1M * $3 + 2000/1M * $15 = $0.003 + $0.03 = $0.033
      expect(cost).toBeCloseTo(0.033, 6)
    })

    test('calculates cost for free models', () => {
      const cost = tracker.calculateCost('google/gemini-2.0-flash-exp', 5000, 10000)
      expect(cost).toBe(0)
    })

    test('uses fallback pricing for unknown models', () => {
      const cost = tracker.calculateCost('unknown/model', 1000, 2000)
      // Fallback is grok-4.1-fast: $0.20 input, $0.50 output
      // 1000/1M * $0.20 + 2000/1M * $0.50 = $0.0002 + $0.001 = $0.0012
      expect(cost).toBeCloseTo(0.0012, 6)
    })

    test('handles zero tokens', () => {
      const cost = tracker.calculateCost('openai/gpt-4', 0, 0)
      expect(cost).toBe(0)
    })

    test('handles large token counts', () => {
      const cost = tracker.calculateCost('openai/gpt-4', 1_000_000, 500_000)
      // 1M/1M * $30 + 500k/1M * $60 = $30 + $30 = $60
      expect(cost).toBeCloseTo(60, 6)
    })
  })

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

    test('calculates total cost', () => {
      const stats = tracker.getStats()
      // 0.015 + 0.015 + 0.0165 + 0.001 (search) = 0.0475
      expect(stats.totalCost).toBeCloseTo(0.0475, 6)
    })

    test('calculates total tokens', () => {
      const stats = tracker.getStats()
      expect(stats.totalTokens).toBe(2100) // 300 + 300 + 1500
    })

    test('counts unique chats', () => {
      const stats = tracker.getStats()
      expect(stats.totalChats).toBe(2) // chat-1 and chat-2
    })

    test('groups cost by model', () => {
      const stats = tracker.getStats()
      expect(stats.costByModel['openai/gpt-4']).toBeCloseTo(0.03, 6)
      expect(stats.costByModel['anthropic/claude-3.5-sonnet']).toBeCloseTo(0.0165, 6)
    })

    test('calculates average cost per message', () => {
      const stats = tracker.getStats()
      // 0.0475 / 3 entries = 0.0158333...
      expect(stats.avgCostPerMessage).toBeCloseTo(0.0158, 4)
    })

    test('returns zero avg for no entries', () => {
      localStorageMock.clear() // Clear before creating empty tracker
      const emptyTracker = new CostTracker()
      const stats = emptyTracker.getStats()
      expect(stats.avgCostPerMessage).toBe(0)
    })
  })

  describe('getChatCost', () => {
    test('calculates total cost for a chat', () => {
      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.01,
      })

      tracker.trackCost({
        chatId: 'chat-1',
        model: 'openai/gpt-4',
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        cost: 0.02,
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

describe('MODEL_PRICING', () => {
  test('contains pricing for major models', () => {
    expect(MODEL_PRICING['openai/gpt-4']).toBeDefined()
    expect(MODEL_PRICING['anthropic/claude-3.5-sonnet']).toBeDefined()
    expect(MODEL_PRICING['google/gemini-2.5-pro']).toBeDefined()
    expect(MODEL_PRICING['x-ai/grok-4']).toBeDefined()
    expect(MODEL_PRICING['deepseek/deepseek-chat']).toBeDefined()
  })

  test('all models have input and output pricing', () => {
    Object.entries(MODEL_PRICING).forEach(([model, pricing]) => {
      expect(pricing.input).toBeGreaterThanOrEqual(0)
      expect(pricing.output).toBeGreaterThanOrEqual(0)
      expect(typeof pricing.input).toBe('number')
      expect(typeof pricing.output).toBe('number')
    })
  })

  test('free models have zero pricing', () => {
    expect(MODEL_PRICING['google/gemini-2.0-flash-exp'].input).toBe(0)
    expect(MODEL_PRICING['google/gemini-2.0-flash-exp'].output).toBe(0)
  })

  test('output cost is typically higher than input cost', () => {
    // Most models charge more for output
    expect(MODEL_PRICING['openai/gpt-4'].output).toBeGreaterThan(MODEL_PRICING['openai/gpt-4'].input)
    expect(MODEL_PRICING['anthropic/claude-opus-4.1'].output).toBeGreaterThan(MODEL_PRICING['anthropic/claude-opus-4.1'].input)
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
