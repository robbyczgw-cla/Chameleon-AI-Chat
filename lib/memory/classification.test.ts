import { describe, test, expect, vi, beforeEach } from 'vitest'
import { classifyQuery, classifyQuerySync } from './classification'

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

describe('classifyQuerySync', () => {
  describe('short queries', () => {
    test('classifies very short queries as factual', () => {
      const result = classifyQuerySync('hello')
      expect(result.needsMemory).toBe(false)
      expect(result.queryType).toBe('factual')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    test('classifies short queries without personal pronouns as factual', () => {
      const result = classifyQuerySync('what is AI?')
      expect(result.needsMemory).toBe(false)
    })

    test('still retrieves memory for short queries with personal reference', () => {
      const result = classifyQuerySync('my name')
      expect(result.needsMemory).toBe(true)
    })
  })

  describe('explicit memory references', () => {
    test('detects "remember" keyword', () => {
      const result = classifyQuerySync('do you remember what I told you?')
      expect(result.needsMemory).toBe(true)
      expect(result.queryType).toBe('personal')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    test('detects "recall" keyword', () => {
      const result = classifyQuerySync('can you recall my preferences?')
      expect(result.needsMemory).toBe(true)
      expect(result.queryType).toBe('personal')
    })

    test('detects "last time" phrase', () => {
      const result = classifyQuerySync('what did we discuss last time?')
      expect(result.needsMemory).toBe(true)
    })

    test('detects "mentioned" keyword', () => {
      const result = classifyQuerySync('as I mentioned earlier')
      expect(result.needsMemory).toBe(true)
    })

    test('detects "told you" phrase', () => {
      const result = classifyQuerySync('I told you about this before')
      expect(result.needsMemory).toBe(true)
    })
  })

  describe('personal preference queries', () => {
    test('detects "my name" queries', () => {
      const result = classifyQuerySync("what's my name?")
      expect(result.needsMemory).toBe(true)
      expect(result.queryType).toBe('personal')
    })

    test('detects "my job" queries', () => {
      const result = classifyQuerySync('you know my job, right?')
      expect(result.needsMemory).toBe(true)
    })

    test('detects "my preference" queries', () => {
      const result = classifyQuerySync("what's my preference for coding style?")
      expect(result.needsMemory).toBe(true)
    })

    test('detects "my favorite" queries', () => {
      const result = classifyQuerySync("what's my favorite programming language?")
      expect(result.needsMemory).toBe(true)
    })
  })

  describe('factual queries', () => {
    test('classifies "what is" questions as factual', () => {
      const result = classifyQuerySync('what is the capital of France?')
      expect(result.needsMemory).toBe(false)
      expect(result.queryType).toBe('factual')
    })

    test('classifies "explain" queries as factual', () => {
      const result = classifyQuerySync('explain how JavaScript promises work')
      expect(result.needsMemory).toBe(false)
    })

    test('classifies "write a" queries as factual', () => {
      const result = classifyQuerySync('write a function to sort an array')
      expect(result.needsMemory).toBe(false)
    })

    test('classifies "create a" queries as factual', () => {
      const result = classifyQuerySync('create a simple todo list component')
      expect(result.needsMemory).toBe(false)
    })

    test('classifies "translate" queries as factual', () => {
      const result = classifyQuerySync('translate this to German')
      expect(result.needsMemory).toBe(false)
    })

    test('classifies "calculate" queries as factual', () => {
      const result = classifyQuerySync('calculate the fibonacci sequence')
      expect(result.needsMemory).toBe(false)
    })
  })

  describe('technical queries', () => {
    test('classifies error-related queries as non-personal', () => {
      const result = classifyQuerySync('getting TypeError in this code')
      expect(result.needsMemory).toBe(false)
      // May be classified as factual or ambiguous
      expect(['factual', 'ambiguous']).toContain(result.queryType)
    })

    test('classifies bug/exception queries as non-personal', () => {
      const result = classifyQuerySync('this exception keeps happening')
      expect(result.needsMemory).toBe(false)
    })

    test('classifies syntax error queries as non-personal', () => {
      const result = classifyQuerySync('syntax error on line 42')
      expect(result.needsMemory).toBe(false)
    })
  })

  describe('follow-up queries', () => {
    test('classifies "yes" as follow-up', () => {
      const result = classifyQuerySync('yes, that looks good')
      expect(result.needsMemory).toBe(false)
      expect(result.queryType).toBe('factual')
    })

    test('classifies "ok" as follow-up', () => {
      const result = classifyQuerySync('ok thanks')
      expect(result.needsMemory).toBe(false)
    })

    test('classifies "thanks" as follow-up', () => {
      const result = classifyQuerySync('thanks, that worked!')
      expect(result.needsMemory).toBe(false)
    })

    test('classifies "what about" as follow-up', () => {
      const result = classifyQuerySync('what about the other option?')
      expect(result.needsMemory).toBe(false)
    })
  })

  describe('generic requests with personal pronouns', () => {
    test('classifies "help me with X" as generic/ambiguous', () => {
      const result = classifyQuerySync('help me with this bug')
      expect(result.needsMemory).toBe(false)
      expect(result.queryType).toBe('ambiguous')
    })

    test('classifies "can I" questions as generic', () => {
      const result = classifyQuerySync('can I use async/await here?')
      expect(result.needsMemory).toBe(false)
    })

    test('classifies "should I" questions as generic', () => {
      const result = classifyQuerySync('should I use TypeScript or JavaScript?')
      expect(result.needsMemory).toBe(false)
    })
  })

  describe('ambiguous queries', () => {
    test('defaults to not retrieving for ambiguous queries', () => {
      const result = classifyQuerySync('hmm, interesting point')
      expect(result.needsMemory).toBe(false)
      // May classify as factual or ambiguous depending on heuristics
      expect(['factual', 'ambiguous']).toContain(result.queryType)
    })
  })
})

describe('classifyQuery (async)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  test('falls back to sync classification without API key', async () => {
    const result = await classifyQuery('what is my name?', undefined)
    expect(result.needsMemory).toBe(true)
    expect(result.queryType).toBe('personal')
  })

  test('returns factual for short queries without API call', async () => {
    const result = await classifyQuery('hi', 'test-api-key')
    expect(result.needsMemory).toBe(false)
    expect(result.queryType).toBe('factual')
  })

  test('returns factual for obvious factual patterns', async () => {
    const result = await classifyQuery('what is the weather like today?', 'test-api-key')
    expect(result.needsMemory).toBe(false)
    expect(result.queryType).toBe('factual')
  })

  test('returns personal for explicit memory references', async () => {
    const result = await classifyQuery('do you remember my favorite color?', 'test-api-key')
    expect(result.needsMemory).toBe(true)
    expect(result.queryType).toBe('personal')
  })

  test('returns factual for follow-up patterns', async () => {
    const result = await classifyQuery('yes, that sounds good', 'test-api-key')
    expect(result.needsMemory).toBe(false)
    expect(result.queryType).toBe('factual')
  })
})
