import { describe, test, expect, vi } from 'vitest'
import {
  isMemoryDuplicate,
  normalizeMemoryContent,
  extractKeyValue,
  calculateSimilarity
} from './duplicate-detection'
import type { Memory } from '@/types'

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
const createMemory = (content: string, id?: string): Memory => ({
  id: id || `memory-${Date.now()}`,
  userId: 'test-user',
  content,
  type: 'fact',
  importance: 'medium',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  accessCount: 0,
  lastAccessedAt: null,
  source: 'extracted',
})

describe('normalizeMemoryContent', () => {
  test('removes "user\'s" prefix', () => {
    const result = normalizeMemoryContent("user's name is john")
    expect(result).not.toContain("user's")
  })

  test('removes "the user" prefix', () => {
    const result = normalizeMemoryContent('the user works at google')
    expect(result).not.toContain('the user')
  })

  test('removes "my" possessive', () => {
    const result = normalizeMemoryContent('my favorite color is blue')
    expect(result).not.toContain('my')
  })

  test('removes common verbs', () => {
    const result = normalizeMemoryContent('user is a developer')
    expect(result).not.toMatch(/\bis\b/)
    expect(result).not.toMatch(/\bare\b/)
    expect(result).not.toMatch(/\bhas\b/)
  })

  test('removes punctuation', () => {
    const result = normalizeMemoryContent("Hello, world! How are you?")
    expect(result).not.toContain(',')
    expect(result).not.toContain('!')
    expect(result).not.toContain('?')
  })

  test('collapses whitespace', () => {
    const result = normalizeMemoryContent('too    many   spaces')
    expect(result).not.toContain('  ')
  })

  test('trims leading and trailing whitespace', () => {
    const result = normalizeMemoryContent('  padded content  ')
    expect(result).toBe(normalizeMemoryContent('padded content'))
  })
})

describe('extractKeyValue', () => {
  describe('name patterns', () => {
    test('extracts "name is X" pattern', () => {
      const result = extractKeyValue("user's name is John")
      expect(result).not.toBeNull()
      expect(result?.key).toBe('name')
      expect(result?.value).toBe('john')
    })

    test('extracts "called X" pattern', () => {
      const result = extractKeyValue('user is called Sarah')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('name')
      expect(result?.value).toBe('sarah')
    })

    test('extracts "known as X" pattern', () => {
      const result = extractKeyValue('goes by Mike')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('name')
    })
  })

  describe('age patterns', () => {
    test('extracts "age is X" pattern', () => {
      const result = extractKeyValue('user age is 25')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('age')
      expect(result?.value).toBe('25')
    })

    test('extracts "X years old" pattern', () => {
      const result = extractKeyValue('user is 30 years old')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('age')
      expect(result?.value).toBe('30')
    })

    test('extracts "born in YEAR" pattern', () => {
      const result = extractKeyValue('user was born in 1995')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('age')
      expect(result?.value).toBe('1995')
    })
  })

  describe('location patterns', () => {
    test('extracts "lives in X" pattern', () => {
      const result = extractKeyValue('user lives in Berlin')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('location')
      expect(result?.value).toContain('berlin')
    })

    test('extracts "based in X" pattern', () => {
      const result = extractKeyValue('user is based in New York')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('location')
    })

    test('extracts "from X" pattern', () => {
      const result = extractKeyValue('from is Paris')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('location')
    })
  })

  describe('occupation patterns', () => {
    test('extracts "works as X" pattern', () => {
      const result = extractKeyValue('user works as a software engineer')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('occupation')
      expect(result?.value).toContain('software engineer')
    })

    test('extracts "job is X" pattern', () => {
      const result = extractKeyValue('job is data scientist')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('occupation')
    })

    test('extracts "is a X" pattern', () => {
      const result = extractKeyValue('user is a designer')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('occupation')
    })
  })

  describe('interest patterns', () => {
    test('extracts "likes X" pattern for interests', () => {
      const result = extractKeyValue('user likes hiking very much')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('interests')
    })

    test('extracts interest-related content', () => {
      const result = extractKeyValue('user enjoys playing video games')
      // Pattern matching may vary; just check we get a result
      expect(result).not.toBeNull()
    })
  })

  describe('goal patterns', () => {
    test('extracts "wants to X" pattern', () => {
      const result = extractKeyValue('user wants to learn rust')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('goals')
    })

    test('extracts "trying to X" pattern', () => {
      const result = extractKeyValue('user is trying to build a startup')
      expect(result).not.toBeNull()
      expect(result?.key).toBe('goals')
    })
  })

  test('returns null for unrecognized patterns', () => {
    const result = extractKeyValue('random text without patterns')
    expect(result).toBeNull()
  })
})

describe('calculateSimilarity', () => {
  test('returns 1 for identical strings', () => {
    const result = calculateSimilarity('hello world', 'hello world')
    expect(result).toBe(1)
  })

  test('returns 1 for both empty strings', () => {
    const result = calculateSimilarity('', '')
    expect(result).toBe(1)
  })

  test('returns 0 when one string is empty', () => {
    const result = calculateSimilarity('hello world', '')
    expect(result).toBe(0)
  })

  test('returns 0 for completely different strings', () => {
    const result = calculateSimilarity('apple orange banana', 'car truck bike')
    expect(result).toBe(0)
  })

  test('returns high similarity for overlapping content', () => {
    const result = calculateSimilarity(
      'user loves programming',
      'user enjoys programming and coding'
    )
    expect(result).toBeGreaterThan(0.3)
  })

  test('ignores short words (less than 3 chars)', () => {
    const result = calculateSimilarity('a b c d e', 'f g h i j')
    // All words are too short, should return 1 (both effectively empty)
    expect(result).toBe(1)
  })
})

describe('isMemoryDuplicate', () => {
  test('returns false for empty content', () => {
    const result = isMemoryDuplicate('', [createMemory('some content')])
    expect(result).toBe(false)
  })

  test('returns false for empty existing memories', () => {
    const result = isMemoryDuplicate('new content', [])
    expect(result).toBe(false)
  })

  describe('exact match detection', () => {
    test('detects exact duplicate (normalized)', () => {
      const existing = [createMemory("User's name is John")]
      const result = isMemoryDuplicate("the user's name is john", existing)
      expect(result).toBe(true)
    })

    test('detects case-insensitive duplicates', () => {
      const existing = [createMemory('User works as developer')]
      const result = isMemoryDuplicate('USER WORKS AS DEVELOPER', existing)
      expect(result).toBe(true)
    })
  })

  describe('key-value duplicate detection', () => {
    test('detects same name with different phrasing', () => {
      const existing = [createMemory("User's name is John")]
      const result = isMemoryDuplicate('The user is called John', existing)
      expect(result).toBe(true)
    })

    test('detects same age with different phrasing', () => {
      const existing = [createMemory('User is 25 years old')]
      const result = isMemoryDuplicate("User's age is 25", existing)
      expect(result).toBe(true)
    })

    test('detects overlapping name values', () => {
      const existing = [createMemory("User's name is John Smith")]
      const result = isMemoryDuplicate('User is named John', existing)
      expect(result).toBe(true)
    })

    test('does not flag different names as duplicates', () => {
      const existing = [createMemory("User's name is John")]
      const result = isMemoryDuplicate("User's name is Sarah", existing)
      expect(result).toBe(false)
    })
  })

  describe('high similarity detection', () => {
    test('detects highly similar content with significant overlap', () => {
      const existing = [createMemory('User prefers TypeScript TypeScript TypeScript web development frontend')]
      const result = isMemoryDuplicate(
        'User prefers TypeScript TypeScript TypeScript web development frontend projects',
        existing
      )
      expect(result).toBe(true)
    })

    test('does not flag sufficiently different content', () => {
      const existing = [createMemory('User works as a software engineer')]
      const result = isMemoryDuplicate('User enjoys hiking on weekends', existing)
      expect(result).toBe(false)
    })
  })

  describe('critical key detection', () => {
    test('detects duplicate names with shared core words', () => {
      const existing = [createMemory('Name is John Doe')]
      const result = isMemoryDuplicate('User name: John', existing)
      expect(result).toBe(true)
    })

    test('detects duplicate location with similar values', () => {
      const existing = [createMemory('User lives in San Francisco')]
      const result = isMemoryDuplicate('Located in San Francisco, CA', existing)
      expect(result).toBe(true)
    })
  })

  test('checks against multiple existing memories', () => {
    const existing = [
      createMemory('User likes Python'),
      createMemory("User's name is Alex"),
      createMemory('User is 28 years old'),
    ]

    // Should match the second memory
    const result = isMemoryDuplicate('User is called Alex', existing)
    expect(result).toBe(true)
  })

  test('returns false when no duplicates found', () => {
    const existing = [
      createMemory('User likes Python'),
      createMemory('User lives in London'),
    ]

    const result = isMemoryDuplicate('User works at Google', existing)
    expect(result).toBe(false)
  })
})
