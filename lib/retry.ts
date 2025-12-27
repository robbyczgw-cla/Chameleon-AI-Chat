/**
 * Retry Utility with Exponential Backoff
 *
 * Provides robust retry logic for network requests and other fallible operations.
 * Features:
 * - Exponential backoff with jitter
 * - Configurable retry conditions
 * - Abort signal support
 * - Detailed error tracking
 */

import { loggers } from './logger'

const log = loggers.api

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number
  /** Add random jitter to prevent thundering herd (default: true) */
  jitter?: boolean
  /** Jitter factor 0-1 (default: 0.1) */
  jitterFactor?: number
  /** Custom function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean
  /** Abort signal for cancellation */
  signal?: AbortSignal
  /** Callback called before each retry attempt */
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void
  /** Operation name for logging */
  operationName?: string
}

export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: unknown
  attempts: number
  totalDelayMs: number
  errors: unknown[]
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'signal' | 'onRetry' | 'operationName'>> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
  jitterFactor: 0.1,
  isRetryable: defaultIsRetryable,
}

/**
 * Default retry condition - retries on network errors and 5xx status codes
 */
function defaultIsRetryable(error: unknown): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }

  // Abort errors should not be retried
  if (error instanceof DOMException && error.name === 'AbortError') {
    return false
  }

  // HTTP errors
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status
    // Retry on server errors (5xx) and rate limits (429)
    return status >= 500 || status === 429
  }

  // Retry on generic errors that might be transient
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('socket hang up')
    )
  }

  return false
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
  jitter: boolean,
  jitterFactor: number
): number {
  // Exponential backoff: delay = initial * multiplier^attempt
  let delay = initialDelayMs * Math.pow(backoffMultiplier, attempt)

  // Cap at max delay
  delay = Math.min(delay, maxDelayMs)

  // Add jitter to prevent thundering herd
  if (jitter) {
    const jitterRange = delay * jitterFactor
    const randomJitter = (Math.random() - 0.5) * 2 * jitterRange
    delay = Math.max(0, delay + randomJitter)
  }

  return Math.round(delay)
}

/**
 * Sleep for a specified duration, respecting abort signals
 */
async function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    const timer = setTimeout(resolve, ms)

    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}

/**
 * Retry an async operation with exponential backoff
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns Result object with success status, data, and error info
 *
 * @example
 * const result = await retry(
 *   () => fetch('/api/data'),
 *   { maxAttempts: 3, operationName: 'fetchData' }
 * )
 *
 * if (result.success) {
 *   console.log(result.data)
 * } else {
 *   console.error('Failed after', result.attempts, 'attempts')
 * }
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const errors: unknown[] = []
  let totalDelayMs = 0

  for (let attempt = 0; attempt < opts.maxAttempts; attempt++) {
    // Check for abort before attempting
    if (opts.signal?.aborted) {
      return {
        success: false,
        error: new DOMException('Aborted', 'AbortError'),
        attempts: attempt,
        totalDelayMs,
        errors,
      }
    }

    try {
      const data = await fn()
      return {
        success: true,
        data,
        attempts: attempt + 1,
        totalDelayMs,
        errors,
      }
    } catch (error) {
      errors.push(error)

      // Check if this is the last attempt
      if (attempt === opts.maxAttempts - 1) {
        log.warn(`${opts.operationName || 'Operation'} failed after ${attempt + 1} attempts`, error)
        return {
          success: false,
          error,
          attempts: attempt + 1,
          totalDelayMs,
          errors,
        }
      }

      // Check if error is retryable
      if (!opts.isRetryable(error)) {
        log.debug(`${opts.operationName || 'Operation'} failed with non-retryable error`, error)
        return {
          success: false,
          error,
          attempts: attempt + 1,
          totalDelayMs,
          errors,
        }
      }

      // Calculate delay for next attempt
      const delayMs = calculateDelay(
        attempt,
        opts.initialDelayMs,
        opts.maxDelayMs,
        opts.backoffMultiplier,
        opts.jitter,
        opts.jitterFactor
      )

      totalDelayMs += delayMs

      log.debug(
        `${opts.operationName || 'Operation'} attempt ${attempt + 1} failed, retrying in ${delayMs}ms`,
        error
      )

      // Call onRetry callback
      opts.onRetry?.(attempt + 1, error, delayMs)

      // Wait before next attempt
      try {
        await sleep(delayMs, opts.signal)
      } catch (abortError) {
        return {
          success: false,
          error: abortError,
          attempts: attempt + 1,
          totalDelayMs,
          errors,
        }
      }
    }
  }

  // Should not reach here, but TypeScript needs it
  return {
    success: false,
    error: errors[errors.length - 1],
    attempts: opts.maxAttempts,
    totalDelayMs,
    errors,
  }
}

/**
 * Simplified retry wrapper that throws on failure
 *
 * @param fn - The async function to retry
 * @param options - Retry configuration options
 * @returns The result of the function
 * @throws The last error if all retries fail
 *
 * @example
 * try {
 *   const data = await retryOrThrow(() => fetchData())
 * } catch (error) {
 *   console.error('All retries failed:', error)
 * }
 */
export async function retryOrThrow<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const result = await retry(fn, options)

  if (!result.success) {
    throw result.error
  }

  return result.data as T
}

/**
 * Create a retryable version of a function
 *
 * @param fn - The async function to wrap
 * @param options - Default retry options
 * @returns A wrapped function that automatically retries
 *
 * @example
 * const fetchWithRetry = withRetry(
 *   (url: string) => fetch(url),
 *   { maxAttempts: 3 }
 * )
 *
 * const response = await fetchWithRetry('/api/data')
 */
export function withRetry<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  defaultOptions: RetryOptions = {}
): (...args: TArgs) => Promise<RetryResult<TResult>> {
  return (...args: TArgs) => retry(() => fn(...args), defaultOptions)
}

/**
 * Retry with circuit breaker pattern
 * Stops retrying after too many failures in a time window
 */
export class CircuitBreaker {
  private failures: number = 0
  private lastFailureTime: number = 0
  private isOpen: boolean = false

  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeMs: number = 60000
  ) {}

  /**
   * Check if circuit is open (should not make requests)
   */
  isCircuitOpen(): boolean {
    if (this.isOpen) {
      // Check if enough time has passed to try again
      if (Date.now() - this.lastFailureTime >= this.resetTimeMs) {
        this.isOpen = false
        this.failures = 0
        log.info('Circuit breaker reset')
      }
    }
    return this.isOpen
  }

  /**
   * Record a successful operation
   */
  recordSuccess(): void {
    this.failures = 0
    this.isOpen = false
  }

  /**
   * Record a failed operation
   */
  recordFailure(): void {
    this.failures++
    this.lastFailureTime = Date.now()

    if (this.failures >= this.threshold) {
      this.isOpen = true
      log.warn(`Circuit breaker opened after ${this.failures} failures`)
    }
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isCircuitOpen()) {
      throw new Error('Circuit breaker is open - too many recent failures')
    }

    try {
      const result = await fn()
      this.recordSuccess()
      return result
    } catch (error) {
      this.recordFailure()
      throw error
    }
  }
}
