/**
 * Rate limiter with support for both in-memory (development) and
 * distributed Redis/Upstash (production) backends.
 *
 * Configuration:
 * - Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for distributed rate limiting
 * - Falls back to in-memory if Upstash is not configured
 */

// ============================================================================
// Types
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the time window
   */
  limit: number
  /**
   * Time window in milliseconds
   */
  windowMs: number
}

export interface RateLimitResult {
  limited: boolean
  remaining: number
  resetTime: number
}

// ============================================================================
// In-Memory Backend (Development/Fallback)
// ============================================================================

const rateLimitMap = new Map<string, RateLimitEntry>()

function checkRateLimitInMemory(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  // If no entry exists or the window has expired, create a new entry
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs
    rateLimitMap.set(identifier, { count: 1, resetTime })
    return { limited: false, remaining: config.limit - 1, resetTime }
  }

  // Increment the count
  entry.count++

  // Check if limit is exceeded
  if (entry.count > config.limit) {
    return { limited: true, remaining: 0, resetTime: entry.resetTime }
  }

  return { limited: false, remaining: config.limit - entry.count, resetTime: entry.resetTime }
}

/**
 * Clean up expired entries (call this periodically)
 */
export function cleanupRateLimitMap(): void {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}

// Clean up expired entries every 5 minutes (only in Node.js environment)
if (typeof setInterval !== 'undefined' && typeof window === 'undefined') {
  setInterval(cleanupRateLimitMap, 5 * 60 * 1000)
}

// ============================================================================
// Upstash Redis Backend (Production/Distributed)
// ============================================================================

/**
 * Check if Upstash is configured
 */
function isUpstashConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

/**
 * Rate limiting using Upstash Redis with sliding window algorithm
 * Uses Upstash REST API (works in Edge runtime)
 */
async function checkRateLimitUpstash(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL!
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!

  const now = Date.now()
  const windowStart = now - config.windowMs
  const key = `ratelimit:${identifier}`

  try {
    // Use Upstash pipeline for atomic operations:
    // 1. Remove old entries outside the sliding window
    // 2. Add current timestamp
    // 3. Count entries in window
    // 4. Set TTL on the key
    const pipelineCommands = [
      // Remove entries older than the window
      ["ZREMRANGEBYSCORE", key, "0", String(windowStart)],
      // Add current request timestamp (score = timestamp, member = unique ID)
      ["ZADD", key, String(now), `${now}-${Math.random().toString(36).slice(2)}`],
      // Count all entries (requests in window)
      ["ZCARD", key],
      // Set expiry to window size (auto-cleanup)
      ["PEXPIRE", key, String(config.windowMs)],
    ]

    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(pipelineCommands),
    })

    if (!response.ok) {
      console.error("[RateLimit] Upstash error:", response.status)
      // Fall back to in-memory on error
      return checkRateLimitInMemory(identifier, config)
    }

    const results = await response.json()

    // results[2] contains the ZCARD result (count of requests)
    const requestCount = results[2]?.result ?? 1
    const remaining = Math.max(0, config.limit - requestCount)
    const limited = requestCount > config.limit
    const resetTime = now + config.windowMs

    return { limited, remaining, resetTime }
  } catch (error) {
    console.error("[RateLimit] Upstash request failed:", error)
    // Fall back to in-memory on network error
    return checkRateLimitInMemory(identifier, config)
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if a request should be rate limited (synchronous version)
 * Uses in-memory backend only. For production, use checkRateLimitAsync.
 *
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Object with `limited` boolean and `remaining` count
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { limit: 60, windowMs: 60000 }
): RateLimitResult {
  // Synchronous version always uses in-memory
  // This maintains backwards compatibility with existing code
  return checkRateLimitInMemory(identifier, config)
}

/**
 * Check if a request should be rate limited (async version)
 * Uses Upstash Redis if configured, falls back to in-memory otherwise.
 *
 * @param identifier - Unique identifier for the client (e.g., IP address, user ID)
 * @param config - Rate limit configuration
 * @returns Promise resolving to object with `limited` boolean and `remaining` count
 */
export async function checkRateLimitAsync(
  identifier: string,
  config: RateLimitConfig = { limit: 60, windowMs: 60000 }
): Promise<RateLimitResult> {
  if (isUpstashConfigured()) {
    return checkRateLimitUpstash(identifier, config)
  }

  // Fall back to in-memory if Upstash is not configured
  return checkRateLimitInMemory(identifier, config)
}

/**
 * Get rate limit headers for HTTP response
 */
export function getRateLimitHeaders(result: RateLimitResult, config: RateLimitConfig): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(config.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
    ...(result.limited && {
      "Retry-After": String(Math.ceil((result.resetTime - Date.now()) / 1000)),
    }),
  }
}

/**
 * Check if distributed rate limiting is available
 */
export function isDistributedRateLimitingEnabled(): boolean {
  return isUpstashConfigured()
}
