import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { retry, retryOrThrow, withRetry, CircuitBreaker } from './retry'

// Mock the logger
vi.mock('./logger', () => ({
  loggers: {
    api: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }
  }
}))

describe('retry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('succeeds on first attempt', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const resultPromise = retry(fn, { maxAttempts: 3 })
    await vi.runAllTimersAsync()
    const result = await resultPromise

    expect(result.success).toBe(true)
    expect(result.data).toBe('success')
    expect(result.attempts).toBe(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('retries on failure and succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce('success')

    const resultPromise = retry(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      isRetryable: () => true,
    })

    await vi.runAllTimersAsync()
    const result = await resultPromise

    expect(result.success).toBe(true)
    expect(result.data).toBe('success')
    expect(result.attempts).toBe(3)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  test('fails after max attempts', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent error'))

    const resultPromise = retry(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      isRetryable: () => true,
    })

    await vi.runAllTimersAsync()
    const result = await resultPromise

    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(Error)
    expect(result.attempts).toBe(3)
    expect(result.errors).toHaveLength(3)
  })

  test('does not retry non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('auth error'))

    const resultPromise = retry(fn, {
      maxAttempts: 3,
      isRetryable: (err) => {
        return err instanceof Error && err.message.includes('network')
      },
    })

    await vi.runAllTimersAsync()
    const result = await resultPromise

    expect(result.success).toBe(false)
    expect(result.attempts).toBe(1)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  test('respects abort signal', async () => {
    const controller = new AbortController()
    const fn = vi.fn().mockRejectedValue(new Error('network error'))

    const resultPromise = retry(fn, {
      maxAttempts: 5,
      signal: controller.signal,
      isRetryable: () => true,
    })

    // Abort immediately
    controller.abort()

    const result = await resultPromise

    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(DOMException)
  })

  test('calls onRetry callback', async () => {
    const onRetry = vi.fn()
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('error 1'))
      .mockResolvedValueOnce('success')

    const resultPromise = retry(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      onRetry,
      isRetryable: () => true,
    })

    await vi.runAllTimersAsync()
    await resultPromise

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error), expect.any(Number))
  })

  test('tracks total delay', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('error'))
      .mockRejectedValueOnce(new Error('error'))
      .mockResolvedValueOnce('success')

    const resultPromise = retry(fn, {
      maxAttempts: 3,
      initialDelayMs: 100,
      backoffMultiplier: 2,
      jitter: false,
      isRetryable: () => true,
    })

    await vi.runAllTimersAsync()
    const result = await resultPromise

    // 100ms + 200ms = 300ms total delay
    expect(result.totalDelayMs).toBe(300)
  })

  test('applies exponential backoff', async () => {
    const delays: number[] = []
    const fn = vi.fn().mockRejectedValue(new Error('error'))

    const resultPromise = retry(fn, {
      maxAttempts: 4,
      initialDelayMs: 100,
      backoffMultiplier: 2,
      jitter: false,
      isRetryable: () => true,
      onRetry: (_attempt, _error, delay) => {
        delays.push(delay)
      },
    })

    await vi.runAllTimersAsync()
    await resultPromise

    // Should have 3 retries (4 attempts - 1 initial)
    expect(delays).toEqual([100, 200, 400])
  })

  test('respects max delay', async () => {
    const delays: number[] = []
    const fn = vi.fn().mockRejectedValue(new Error('error'))

    const resultPromise = retry(fn, {
      maxAttempts: 5,
      initialDelayMs: 100,
      backoffMultiplier: 10,
      maxDelayMs: 500,
      jitter: false,
      isRetryable: () => true,
      onRetry: (_attempt, _error, delay) => {
        delays.push(delay)
      },
    })

    await vi.runAllTimersAsync()
    await resultPromise

    // All delays should be capped at 500ms
    expect(delays.every(d => d <= 500)).toBe(true)
  })
})

describe('retryOrThrow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('returns data on success', async () => {
    const fn = vi.fn().mockResolvedValue('success')

    const resultPromise = retryOrThrow(fn)
    await vi.runAllTimersAsync()
    const result = await resultPromise

    expect(result).toBe('success')
  })

  test('throws on failure', async () => {
    vi.useRealTimers() // Use real timers for this test
    const fn = vi.fn().mockRejectedValue(new Error('fail'))

    await expect(
      retryOrThrow(fn, {
        maxAttempts: 1,
        isRetryable: () => false, // Don't retry
      })
    ).rejects.toThrow('fail')

    vi.useFakeTimers() // Restore fake timers
  })
})

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('creates retryable function', async () => {
    const originalFn = vi.fn((x: number) => Promise.resolve(x * 2))
    const retryableFn = withRetry(originalFn, { maxAttempts: 3 })

    const resultPromise = retryableFn(5)
    await vi.runAllTimersAsync()
    const result = await resultPromise

    expect(result.success).toBe(true)
    expect(result.data).toBe(10)
  })

  test('passes arguments through', async () => {
    const originalFn = vi.fn((a: string, b: number) => Promise.resolve(`${a}-${b}`))
    const retryableFn = withRetry(originalFn)

    const resultPromise = retryableFn('test', 42)
    await vi.runAllTimersAsync()
    const result = await resultPromise

    expect(result.data).toBe('test-42')
    expect(originalFn).toHaveBeenCalledWith('test', 42)
  })
})

describe('CircuitBreaker', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('starts with closed circuit', () => {
    const breaker = new CircuitBreaker()
    expect(breaker.isCircuitOpen()).toBe(false)
  })

  test('opens circuit after threshold failures', () => {
    const breaker = new CircuitBreaker(3, 60000) // 3 failures

    breaker.recordFailure()
    expect(breaker.isCircuitOpen()).toBe(false)

    breaker.recordFailure()
    expect(breaker.isCircuitOpen()).toBe(false)

    breaker.recordFailure()
    expect(breaker.isCircuitOpen()).toBe(true)
  })

  test('resets on success', () => {
    const breaker = new CircuitBreaker(3, 60000)

    breaker.recordFailure()
    breaker.recordFailure()
    breaker.recordSuccess()

    expect(breaker.isCircuitOpen()).toBe(false)

    // Should need 3 more failures to open
    breaker.recordFailure()
    breaker.recordFailure()
    expect(breaker.isCircuitOpen()).toBe(false)
  })

  test('resets circuit after timeout', () => {
    const breaker = new CircuitBreaker(2, 1000) // 1 second reset

    breaker.recordFailure()
    breaker.recordFailure()
    expect(breaker.isCircuitOpen()).toBe(true)

    // Advance time past reset period
    vi.advanceTimersByTime(1500)

    expect(breaker.isCircuitOpen()).toBe(false)
  })

  test('execute succeeds with closed circuit', async () => {
    const breaker = new CircuitBreaker()
    const fn = vi.fn().mockResolvedValue('result')

    const result = await breaker.execute(fn)

    expect(result).toBe('result')
    expect(fn).toHaveBeenCalled()
  })

  test('execute throws with open circuit', async () => {
    const breaker = new CircuitBreaker(1, 60000) // Opens after 1 failure
    breaker.recordFailure()

    const fn = vi.fn().mockResolvedValue('result')

    await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker is open')
    expect(fn).not.toHaveBeenCalled()
  })

  test('execute records success', async () => {
    const breaker = new CircuitBreaker(2, 60000)
    breaker.recordFailure()

    const fn = vi.fn().mockResolvedValue('result')
    await breaker.execute(fn)

    // Should reset failure count
    breaker.recordFailure()
    expect(breaker.isCircuitOpen()).toBe(false)
  })

  test('execute records failure', async () => {
    const breaker = new CircuitBreaker(2, 60000)

    const fn = vi.fn().mockRejectedValue(new Error('fail'))

    await expect(breaker.execute(fn)).rejects.toThrow('fail')

    // Should have recorded one failure
    breaker.recordFailure()
    expect(breaker.isCircuitOpen()).toBe(true)
  })
})
