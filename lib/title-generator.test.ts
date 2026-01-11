import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateChatTitle, DEFAULT_TITLE_MODEL } from './title-generator'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('DEFAULT_TITLE_MODEL', () => {
  test('is defined', () => {
    expect(DEFAULT_TITLE_MODEL).toBeDefined()
    expect(typeof DEFAULT_TITLE_MODEL).toBe('string')
  })
})

describe('generateChatTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('fallback behavior', () => {
    test('returns fallback for empty API key', async () => {
      const result = await generateChatTitle('Hello, I need help with my Python code', '')

      expect(result.success).toBe(false)
      expect(result.title).toBe('Hello, I need help with my Python code')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    test('returns fallback for very short messages', async () => {
      const result = await generateChatTitle('Hi', 'test-api-key')

      expect(result.success).toBe(false)
      expect(result.title).toBe('Hi')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    test('truncates long messages for fallback', async () => {
      const longMessage = 'A'.repeat(100)
      const result = await generateChatTitle(longMessage, '')

      expect(result.success).toBe(false)
      expect(result.title.length).toBeLessThanOrEqual(53) // 50 + "..."
      expect(result.title).toContain('...')
    })

    test('does not truncate messages under 50 chars', async () => {
      const shortMessage = 'Short message here'
      const result = await generateChatTitle(shortMessage, '')

      expect(result.title).toBe(shortMessage)
      expect(result.title).not.toContain('...')
    })
  })

  describe('API call behavior', () => {
    test('makes API call with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Python Code Help' } }]
        })
      })

      await generateChatTitle('Help me with Python code', 'test-api-key')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://openrouter.ai/api/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
          }),
        })
      )
    })

    test('uses custom model when provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Custom Model Title' } }]
        })
      })

      await generateChatTitle('Test message here', 'test-api-key', {
        model: 'custom/model-name'
      })

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.model).toBe('custom/model-name')
    })

    test('limits input to 500 characters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Long Message Title' } }]
        })
      })

      const longMessage = 'X'.repeat(1000)
      await generateChatTitle(longMessage, 'test-api-key')

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      const userMessage = callBody.messages[1].content
      expect(userMessage.length).toBeLessThanOrEqual(500)
    })
  })

  describe('successful response handling', () => {
    test('returns generated title on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Python List Sorting' } }]
        })
      })

      const result = await generateChatTitle('How do I sort a list in Python?', 'test-api-key')

      expect(result.success).toBe(true)
      expect(result.title).toBe('Python List Sorting')
    })

    test('cleans up quotes from title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '"Quoted Title"' } }]
        })
      })

      const result = await generateChatTitle('Test message', 'test-api-key')

      expect(result.title).toBe('Quoted Title')
    })

    test('cleans up trailing punctuation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'Title With Punctuation...' } }]
        })
      })

      const result = await generateChatTitle('Test message', 'test-api-key')

      expect(result.title).toBe('Title With Punctuation')
    })

    test('handles single quotes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: "'Single Quoted'" } }]
        })
      })

      const result = await generateChatTitle('Test message', 'test-api-key')

      expect(result.title).toBe('Single Quoted')
    })
  })

  describe('error handling', () => {
    test('returns fallback on API error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      })

      const result = await generateChatTitle('Test message here', 'test-api-key')

      expect(result.success).toBe(false)
      expect(result.title).toBe('Test message here')
    })

    test('returns fallback on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await generateChatTitle('Test message here', 'test-api-key')

      expect(result.success).toBe(false)
      expect(result.title).toBe('Test message here')
    })

    test('returns fallback for empty generated title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: '' } }]
        })
      })

      const result = await generateChatTitle('Test message here', 'test-api-key')

      expect(result.success).toBe(false)
    })

    test('returns fallback for too short generated title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'X' } }]
        })
      })

      const result = await generateChatTitle('Test message here', 'test-api-key')

      expect(result.success).toBe(false)
    })

    test('returns fallback for too long generated title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          choices: [{ message: { content: 'A'.repeat(100) } }]
        })
      })

      const result = await generateChatTitle('Test message here', 'test-api-key')

      expect(result.success).toBe(false)
    })

    test('returns fallback for undefined choices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({})
      })

      const result = await generateChatTitle('Test message here', 'test-api-key')

      expect(result.success).toBe(false)
    })
  })
})
