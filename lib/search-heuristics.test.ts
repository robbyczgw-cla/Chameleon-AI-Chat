import { describe, test, expect } from 'vitest'
import { analyzeQueryForSearch, quickSearchCheck } from './search-heuristics'

describe('analyzeQueryForSearch', () => {
  describe('queries that should trigger search', () => {
    test('detects time-sensitive keywords', () => {
      expect(analyzeQueryForSearch('What is the latest news about AI?').shouldSearch).toBe(true)
      expect(analyzeQueryForSearch('What happened today in tech?').shouldSearch).toBe(true)
      expect(analyzeQueryForSearch('Current weather in Berlin').shouldSearch).toBe(true)
    })

    test('detects price/market queries', () => {
      expect(analyzeQueryForSearch('What is the current Bitcoin price?').shouldSearch).toBe(true)
      expect(analyzeQueryForSearch('How much does Tesla stock cost?').shouldSearch).toBe(true)
      expect(analyzeQueryForSearch('Ethereum crypto trading update').shouldSearch).toBe(true)
    })

    test('detects weather queries', () => {
      expect(analyzeQueryForSearch('Weather forecast for tomorrow').shouldSearch).toBe(true)
      expect(analyzeQueryForSearch('Will it rain this week?').shouldSearch).toBe(true)
    })

    test('detects sports queries', () => {
      expect(analyzeQueryForSearch('What was the score of the game?').shouldSearch).toBe(true)
      expect(analyzeQueryForSearch('Who won the championship?').shouldSearch).toBe(true)
    })

    test('detects release/product queries', () => {
      expect(analyzeQueryForSearch('When is the new iPhone releasing?').shouldSearch).toBe(true)
      expect(analyzeQueryForSearch('What version of React is available?').shouldSearch).toBe(true)
    })

    test('detects news patterns', () => {
      expect(analyzeQueryForSearch('Breaking news about elections').shouldSearch).toBe(true)
      expect(analyzeQueryForSearch('Latest announcements from Google').shouldSearch).toBe(true)
    })

    test('detects year references with other signals', () => {
      // Years combined with other search signals trigger search
      expect(analyzeQueryForSearch('Latest best phones of 2024 news').shouldSearch).toBe(true)
      expect(analyzeQueryForSearch('Current January 2025 events today').shouldSearch).toBe(true)
    })

    test('detects German realtime keywords', () => {
      expect(analyzeQueryForSearch('Was sind die neuesten Nachrichten?').shouldSearch).toBe(true)
      expect(analyzeQueryForSearch('Aktueller Wetterbericht').shouldSearch).toBe(true)
    })

    test('detects company/tech queries', () => {
      expect(analyzeQueryForSearch('Latest from OpenAI and ChatGPT').shouldSearch).toBe(true)
      expect(analyzeQueryForSearch('Microsoft acquisition news').shouldSearch).toBe(true)
    })
  })

  describe('queries that should NOT trigger search', () => {
    test('filters out greetings', () => {
      expect(analyzeQueryForSearch('Hello, how are you?').shouldSearch).toBe(false)
      expect(analyzeQueryForSearch('Hi there friend!').shouldSearch).toBe(false)
      expect(analyzeQueryForSearch('Good morning everyone').shouldSearch).toBe(false)
    })

    test('filters out thanks', () => {
      expect(analyzeQueryForSearch('Thanks for your help').shouldSearch).toBe(false)
      expect(analyzeQueryForSearch('Thank you!').shouldSearch).toBe(false)
    })

    test('filters out yes/no responses', () => {
      expect(analyzeQueryForSearch('Yes, that sounds good').shouldSearch).toBe(false)
      expect(analyzeQueryForSearch('No, try again').shouldSearch).toBe(false)
    })

    test('filters out explanation requests', () => {
      expect(analyzeQueryForSearch('Explain how recursion works').shouldSearch).toBe(false)
      expect(analyzeQueryForSearch('What does async mean?').shouldSearch).toBe(false)
    })

    test('filters out how-to requests', () => {
      expect(analyzeQueryForSearch('How do I sort an array in Python?').shouldSearch).toBe(false)
      expect(analyzeQueryForSearch('How can I fix this bug?').shouldSearch).toBe(false)
    })

    test('filters out creative writing requests', () => {
      expect(analyzeQueryForSearch('Write a poem about nature').shouldSearch).toBe(false)
      expect(analyzeQueryForSearch('Create a story for me').shouldSearch).toBe(false)
    })

    test('filters out code-related requests', () => {
      expect(analyzeQueryForSearch('Code a function to calculate fibonacci').shouldSearch).toBe(false)
      expect(analyzeQueryForSearch('Fix this JavaScript error').shouldSearch).toBe(false)
      expect(analyzeQueryForSearch('Debug my Python script').shouldSearch).toBe(false)
    })

    test('filters out translation requests', () => {
      expect(analyzeQueryForSearch('Translate this to German').shouldSearch).toBe(false)
    })

    test('filters out summarize requests', () => {
      expect(analyzeQueryForSearch('Summarize this article for me').shouldSearch).toBe(false)
    })

    test('filters out very short queries', () => {
      expect(analyzeQueryForSearch('hi').shouldSearch).toBe(false)
      expect(analyzeQueryForSearch('yes').shouldSearch).toBe(false)
    })
  })

  describe('confidence scoring', () => {
    test('high confidence for multiple realtime indicators', () => {
      const result = analyzeQueryForSearch('What is the latest breaking news today about Bitcoin prices?')
      expect(result.confidence).toBeGreaterThan(0.5)
    })

    test('lower confidence for ambiguous queries', () => {
      const result = analyzeQueryForSearch('Tell me about machine learning')
      expect(result.confidence).toBeLessThan(0.5)
    })

    test('captures detected keywords', () => {
      const result = analyzeQueryForSearch('What is the current Bitcoin price today?')
      expect(result.detectedKeywords).toBeDefined()
      expect(result.detectedKeywords?.length).toBeGreaterThan(0)
    })
  })

  describe('provides reasons', () => {
    test('provides reason for search recommendation', () => {
      const result = analyzeQueryForSearch('Latest news about AI')
      expect(result.reason).toBeDefined()
      expect(result.reason).toContain('confidence')
    })

    test('provides reason for no-search recommendation', () => {
      const result = analyzeQueryForSearch('Hello there')
      expect(result.reason).toBeDefined()
    })
  })
})

describe('quickSearchCheck', () => {
  test('returns true for "latest" keyword', () => {
    expect(quickSearchCheck('What is the latest version?')).toBe(true)
  })

  test('returns true for "current" keyword', () => {
    expect(quickSearchCheck('Current temperature in NYC')).toBe(true)
  })

  test('returns true for "today" keyword', () => {
    expect(quickSearchCheck('News from today')).toBe(true)
  })

  test('returns true for "news" keyword', () => {
    expect(quickSearchCheck('Tech news headlines')).toBe(true)
  })

  test('returns true for "price" keyword', () => {
    expect(quickSearchCheck('Stock price check')).toBe(true)
  })

  test('returns true for "weather" keyword', () => {
    expect(quickSearchCheck('Weather forecast')).toBe(true)
  })

  test('returns true for year 2024', () => {
    expect(quickSearchCheck('Best laptops 2024')).toBe(true)
  })

  test('returns true for year 2025', () => {
    expect(quickSearchCheck('Predictions for 2025')).toBe(true)
  })

  test('returns true for "what\'s the latest" pattern', () => {
    expect(quickSearchCheck("What's the latest update?")).toBe(true)
  })

  test('returns true for "how much" pattern', () => {
    expect(quickSearchCheck('How much does it cost?')).toBe(true)
  })

  test('returns false for simple greetings', () => {
    expect(quickSearchCheck('Hello')).toBe(false)
  })

  test('returns false for code questions', () => {
    expect(quickSearchCheck('How do I write a function?')).toBe(false)
  })

  test('returns false for conceptual questions', () => {
    expect(quickSearchCheck('What is recursion?')).toBe(false)
  })
})
