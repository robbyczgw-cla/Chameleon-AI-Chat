/**
 * Tests for rate limiting functionality
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkRateLimit,
  checkRateLimitAsync,
  cleanupRateLimitMap,
  getRateLimitHeaders,
  isDistributedRateLimitingEnabled,
} from './rate-limit'

// Mock fetch for Upstash tests
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Rate Limiting', () => {
  beforeEach(() => {
    // Clean up between tests
    cleanupRateLimitMap()
    mockFetch.mockReset()
    // Reset environment variables
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
  })

  describe('checkRateLimit (in-memory)', () => {
    it('allows requests under the limit', () => {
      const config = { limit: 5, windowMs: 60000 }

      const result1 = checkRateLimit('user1', config)
      expect(result1.limited).toBe(false)
      expect(result1.remaining).toBe(4)

      const result2 = checkRateLimit('user1', config)
      expect(result2.limited).toBe(false)
      expect(result2.remaining).toBe(3)
    })

    it('blocks requests over the limit', () => {
      const config = { limit: 3, windowMs: 60000 }

      checkRateLimit('user2', config) // 1
      checkRateLimit('user2', config) // 2
      checkRateLimit('user2', config) // 3 (at limit)

      const result = checkRateLimit('user2', config) // 4 (over limit)
      expect(result.limited).toBe(true)
      expect(result.remaining).toBe(0)
    })

    it('tracks different identifiers separately', () => {
      const config = { limit: 2, windowMs: 60000 }

      checkRateLimit('userA', config)
      checkRateLimit('userA', config)
      const resultA = checkRateLimit('userA', config)

      const resultB = checkRateLimit('userB', config)

      expect(resultA.limited).toBe(true)
      expect(resultB.limited).toBe(false)
      expect(resultB.remaining).toBe(1)
    })

    it('resets after window expires', () => {
      const config = { limit: 1, windowMs: 100 } // 100ms window

      checkRateLimit('user3', config)
      const blocked = checkRateLimit('user3', config)
      expect(blocked.limited).toBe(true)

      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const allowed = checkRateLimit('user3', config)
          expect(allowed.limited).toBe(false)
          expect(allowed.remaining).toBe(0) // limit - 1
          resolve()
        }, 150)
      })
    })

    it('uses default config when not provided', () => {
      const result = checkRateLimit('user4')
      expect(result.limited).toBe(false)
      expect(result.remaining).toBe(59) // default limit is 60
    })

    it('includes resetTime in result', () => {
      const now = Date.now()
      const config = { limit: 5, windowMs: 60000 }

      const result = checkRateLimit('user5', config)

      expect(result.resetTime).toBeGreaterThanOrEqual(now + 59000)
      expect(result.resetTime).toBeLessThanOrEqual(now + 61000)
    })
  })

  describe('cleanupRateLimitMap', () => {
    it('removes expired entries', () => {
      const config = { limit: 5, windowMs: 50 } // 50ms window

      checkRateLimit('expiring-user', config)

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          cleanupRateLimitMap()
          // After cleanup, should start fresh
          const result = checkRateLimit('expiring-user', config)
          expect(result.remaining).toBe(4) // Fresh start
          resolve()
        }, 100)
      })
    })
  })

  describe('checkRateLimitAsync', () => {
    it('uses in-memory when Upstash is not configured', async () => {
      const config = { limit: 5, windowMs: 60000 }

      const result = await checkRateLimitAsync('async-user', config)

      expect(result.limited).toBe(false)
      expect(result.remaining).toBe(4)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('uses Upstash when configured', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { result: 0 }, // ZREMRANGEBYSCORE
          { result: 1 }, // ZADD
          { result: 3 }, // ZCARD - 3 requests in window
          { result: 1 }, // PEXPIRE
        ],
      })

      const config = { limit: 5, windowMs: 60000 }
      const result = await checkRateLimitAsync('upstash-user', config)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.upstash.io/pipeline',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          },
        })
      )
      expect(result.limited).toBe(false)
      expect(result.remaining).toBe(2) // 5 - 3 = 2
    })

    it('falls back to in-memory on Upstash error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const config = { limit: 5, windowMs: 60000 }
      const result = await checkRateLimitAsync('fallback-user', config)

      expect(result.limited).toBe(false)
      // Falls back to in-memory, starts fresh
    })

    it('falls back to in-memory on network error', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const config = { limit: 5, windowMs: 60000 }
      const result = await checkRateLimitAsync('network-error-user', config)

      expect(result.limited).toBe(false)
      // Falls back to in-memory
    })

    it('correctly identifies rate limiting with Upstash', async () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { result: 0 },
          { result: 1 },
          { result: 10 }, // 10 requests - over limit of 5
          { result: 1 },
        ],
      })

      const config = { limit: 5, windowMs: 60000 }
      const result = await checkRateLimitAsync('limited-upstash-user', config)

      expect(result.limited).toBe(true)
      expect(result.remaining).toBe(0)
    })
  })

  describe('getRateLimitHeaders', () => {
    it('returns correct headers for non-limited request', () => {
      const result = { limited: false, remaining: 5, resetTime: Date.now() + 60000 }
      const config = { limit: 10, windowMs: 60000 }

      const headers = getRateLimitHeaders(result, config)

      expect(headers['X-RateLimit-Limit']).toBe('10')
      expect(headers['X-RateLimit-Remaining']).toBe('5')
      expect(headers['X-RateLimit-Reset']).toBeDefined()
      expect(headers['Retry-After']).toBeUndefined()
    })

    it('includes Retry-After for limited requests', () => {
      const result = { limited: true, remaining: 0, resetTime: Date.now() + 30000 }
      const config = { limit: 10, windowMs: 60000 }

      const headers = getRateLimitHeaders(result, config)

      expect(headers['Retry-After']).toBeDefined()
      const retryAfter = parseInt(headers['Retry-After']!)
      expect(retryAfter).toBeGreaterThan(0)
      expect(retryAfter).toBeLessThanOrEqual(30)
    })
  })

  describe('isDistributedRateLimitingEnabled', () => {
    it('returns false when Upstash is not configured', () => {
      expect(isDistributedRateLimitingEnabled()).toBe(false)
    })

    it('returns true when Upstash is configured', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

      expect(isDistributedRateLimitingEnabled()).toBe(true)
    })

    it('returns false when only URL is set', () => {
      process.env.UPSTASH_REDIS_REST_URL = 'https://test.upstash.io'

      expect(isDistributedRateLimitingEnabled()).toBe(false)
    })

    it('returns false when only token is set', () => {
      process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'

      expect(isDistributedRateLimitingEnabled()).toBe(false)
    })
  })
})
