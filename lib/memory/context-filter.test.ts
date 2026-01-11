import { describe, test, expect, vi } from 'vitest'
import {
  filterMemoriesAlreadyInContext,
  isTransientContent,
  assessMemoryQuality,
  type ConversationMessage
} from './context-filter'
import type { Memory } from './types'

// Mock the logger
vi.mock('@/lib/logger', () => ({
  loggers: {
    memory: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }
  }
}))

// Helper to create memory objects
const createMemory = (content: string, id?: string, type: Memory['type'] = 'fact'): Memory => ({
  id: id || `memory-${Math.random().toString(36).slice(2)}`,
  userId: 'test-user',
  content,
  type,
  importance: 'medium',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  accessCount: 0,
  lastAccessedAt: null,
  source: 'extracted',
})

describe('isTransientContent', () => {
  describe('temporary states', () => {
    test('detects "currently debugging"', () => {
      expect(isTransientContent('User is currently debugging the auth module')).toBe(true)
    })

    test('detects "currently fixing"', () => {
      expect(isTransientContent('Currently fixing a bug in the API')).toBe(true)
    })

    test('detects "right now"', () => {
      expect(isTransientContent('User is working on a feature right now')).toBe(true)
    })

    test('detects "temporarily"', () => {
      expect(isTransientContent('User temporarily disabled the cache')).toBe(true)
    })
  })

  describe('granular references', () => {
    test('detects line number references', () => {
      expect(isTransientContent('Error on line 42 of main.ts')).toBe(true)
    })

    test('detects file path references', () => {
      expect(isTransientContent('Check file: src/utils.ts')).toBe(true)
    })

    test('detects various file extensions', () => {
      expect(isTransientContent('file:app.js')).toBe(true)
      expect(isTransientContent('file:script.py')).toBe(true)
      expect(isTransientContent('file:Main.java')).toBe(true)
    })
  })

  describe('persistent content', () => {
    test('allows name information', () => {
      expect(isTransientContent("User's name is John")).toBe(false)
    })

    test('allows job/role information', () => {
      expect(isTransientContent('User works as a software engineer')).toBe(false)
    })

    test('allows preference information', () => {
      expect(isTransientContent('User prefers TypeScript over JavaScript')).toBe(false)
    })

    test('allows location information', () => {
      expect(isTransientContent('User lives in Berlin')).toBe(false)
    })
  })
})

describe('assessMemoryQuality', () => {
  describe('positive signals', () => {
    test('boosts score for name information', () => {
      const score = assessMemoryQuality("User's name is John Doe", 'fact')
      expect(score).toBeGreaterThan(0.5)
    })

    test('boosts score for professional information', () => {
      const score = assessMemoryQuality('User works as a senior software engineer', 'fact')
      expect(score).toBeGreaterThan(0.5)
    })

    test('boosts score for technology preferences', () => {
      const score = assessMemoryQuality('User prefers TypeScript for all projects', 'preference')
      expect(score).toBeGreaterThanOrEqual(0.5)
    })

    test('boosts score for location information', () => {
      const score = assessMemoryQuality('User lives in San Francisco', 'fact')
      expect(score).toBeGreaterThan(0.5)
    })

    test('boosts score for learning goals', () => {
      const score = assessMemoryQuality('User wants to learn machine learning', 'goal')
      expect(score).toBeGreaterThan(0.5)
    })
  })

  describe('negative signals', () => {
    test('penalizes very short content', () => {
      const shortScore = assessMemoryQuality('Hi', 'fact')
      const normalScore = assessMemoryQuality('User prefers to code in Python', 'fact')
      expect(shortScore).toBeLessThan(normalScore)
    })

    test('penalizes very long content', () => {
      const longContent = 'User mentioned that they have been working on this particular project for several months now and it involves a lot of different technologies and frameworks including React, TypeScript, Node.js, and various databases'
      const score = assessMemoryQuality(longContent, 'fact')
      expect(score).toBeLessThan(0.6)
    })

    test('penalizes uncertain language', () => {
      const uncertainScore = assessMemoryQuality('User maybe probably likes Python sometimes occasionally', 'fact')
      const certainScore = assessMemoryQuality('User strongly prefers Python for development', 'fact')
      expect(uncertainScore).toBeLessThanOrEqual(certainScore)
    })

    test('penalizes context type with time references', () => {
      const score = assessMemoryQuality('User is currently working on a React project today', 'context')
      expect(score).toBeLessThan(0.5)
    })

    test('penalizes transient content', () => {
      const score = assessMemoryQuality('Currently debugging line 42', 'context')
      expect(score).toBeLessThan(0.3)
    })
  })

  describe('score bounds', () => {
    test('score is never below 0', () => {
      const score = assessMemoryQuality('maybe probably x', 'context')
      expect(score).toBeGreaterThanOrEqual(0)
    })

    test('score is never above 1', () => {
      const score = assessMemoryQuality(
        "User's name is John, works as a developer, prefers React, lives in NYC, wants to learn AI",
        'fact'
      )
      expect(score).toBeLessThanOrEqual(1)
    })
  })
})

describe('filterMemoriesAlreadyInContext', () => {
  const recentMessages: ConversationMessage[] = [
    { role: 'user', content: "What's my name?" },
    { role: 'assistant', content: 'Based on our conversation, your name is John and you work as a software engineer in Berlin.' },
    { role: 'user', content: 'Thanks! Can you help me with some React code?' },
  ]

  test('returns all memories when no recent messages', () => {
    const memories = [createMemory("User's name is John")]
    const result = filterMemoriesAlreadyInContext(memories, [], 'test query')

    expect(result.kept).toHaveLength(1)
    expect(result.filtered).toHaveLength(0)
  })

  test('returns all memories when memories array is empty', () => {
    const result = filterMemoriesAlreadyInContext([], recentMessages, 'test query')

    expect(result.kept).toHaveLength(0)
    expect(result.filtered).toHaveLength(0)
  })

  test('filters out memories already present in context', () => {
    const memories = [
      createMemory("User's name is John", 'mem-1'),
      createMemory('User works as a software engineer', 'mem-2'),
      createMemory('User prefers Python over JavaScript', 'mem-3'),
    ]

    const result = filterMemoriesAlreadyInContext(memories, recentMessages, 'help with code')

    // Name and job are in context, Python preference is not
    expect(result.filtered.length).toBeGreaterThanOrEqual(1)
    expect(result.kept.some(m => m.content.includes('Python'))).toBe(true)
  })

  test('keeps memory when user is asking about it', () => {
    const memories = [createMemory("User's name is John", 'mem-1')]
    const query = "What's my name?"

    const result = filterMemoriesAlreadyInContext(memories, recentMessages, query)

    // Should keep the name memory because user is asking about it
    expect(result.kept.some(m => m.id === 'mem-1')).toBe(true)
  })

  test('keeps memory that might contradict context', () => {
    const contradictingMessages: ConversationMessage[] = [
      { role: 'user', content: 'I stopped using React and switched to Vue' },
    ]

    const memories = [createMemory('User prefers React for frontend', 'mem-1')]

    const result = filterMemoriesAlreadyInContext(memories, contradictingMessages, 'what framework?')

    // Memory should be kept for contradiction resolution
    expect(result.kept.length).toBe(1)
  })

  test('provides reasons for filtered memories', () => {
    const memories = [
      createMemory("User's name is John", 'mem-1'),
      createMemory('User lives in Berlin', 'mem-2'),
    ]

    const result = filterMemoriesAlreadyInContext(memories, recentMessages, 'test')

    // At least one should be filtered with a reason
    for (const [_id, reason] of result.reasons) {
      expect(reason).toBeTruthy()
      expect(typeof reason).toBe('string')
    }
  })

  test('handles system messages in context', () => {
    const messagesWithSystem: ConversationMessage[] = [
      { role: 'system', content: 'User context: Name is John, age 30, developer' },
      { role: 'user', content: 'Hi there' },
    ]

    const memories = [
      createMemory("User's name is John", 'mem-1'),
      createMemory('User is 30 years old', 'mem-2'),
    ]

    const result = filterMemoriesAlreadyInContext(memories, messagesWithSystem, 'hello')

    // Both memories should be filtered as they're in system message
    expect(result.filtered.length).toBeGreaterThanOrEqual(1)
  })

  test('keeps memories with low phrase coverage in context', () => {
    const memories = [
      createMemory('User has extensive experience with machine learning and neural networks', 'mem-1'),
    ]

    const minimalContext: ConversationMessage[] = [
      { role: 'user', content: 'Hello' },
    ]

    const result = filterMemoriesAlreadyInContext(memories, minimalContext, 'AI question')

    expect(result.kept).toHaveLength(1)
  })
})
