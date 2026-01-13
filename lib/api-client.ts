/**
 * Type-safe API Client with Error Handling
 *
 * Features:
 * - Typed request/response handling
 * - Automatic retry with exponential backoff
 * - Request/response interceptors
 * - Timeout support
 * - Error normalization
 * - Request deduplication
 * - Caching support
 */

import { retry, type RetryOptions } from './retry'
import { loggers } from './logger'
import type { APIError } from '@/types'
import { getOpenRouterHeaders } from '@/lib/utils'

const log = loggers.api

// Request configuration
export interface RequestConfig extends Omit<RequestInit, 'body'> {
  /** Request body (will be JSON stringified if object) */
  body?: unknown
  /** Query parameters */
  params?: Record<string, string | number | boolean | undefined>
  /** Request timeout in milliseconds */
  timeout?: number
  /** Retry configuration */
  retry?: RetryOptions | boolean
  /** Skip response parsing (for streaming) */
  stream?: boolean
  /** Cache the response */
  cache?: boolean
  /** Cache TTL in milliseconds */
  cacheTTL?: number
}

// API Response wrapper
export interface APIResponse<T> {
  data: T
  status: number
  headers: Headers
  ok: boolean
}

// Normalized error structure
export class APIClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>,
    public readonly response?: Response
  ) {
    super(message)
    this.name = 'APIClientError'
  }

  toJSON(): APIError {
    return {
      message: this.message,
      status: this.status,
      code: this.code,
      details: this.details,
    }
  }
}

// Request interceptor type
type RequestInterceptor = (config: RequestConfig & { url: string }) => RequestConfig & { url: string } | Promise<RequestConfig & { url: string }>

// Response interceptor type
type ResponseInterceptor = <T>(response: APIResponse<T>) => APIResponse<T> | Promise<APIResponse<T>>

// Error interceptor type
type ErrorInterceptor = (error: APIClientError) => APIClientError | Promise<APIClientError>

// Cache entry
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

// In-flight request tracker for deduplication
const inFlightRequests = new Map<string, Promise<unknown>>()

// Response cache
const responseCache = new Map<string, CacheEntry<unknown>>()

/**
 * API Client class
 */
export class APIClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private defaultTimeout: number
  private defaultRetry: RetryOptions | boolean
  private requestInterceptors: RequestInterceptor[] = []
  private responseInterceptors: ResponseInterceptor[] = []
  private errorInterceptors: ErrorInterceptor[] = []

  constructor(options: {
    baseURL?: string
    headers?: Record<string, string>
    timeout?: number
    retry?: RetryOptions | boolean
  } = {}) {
    this.baseURL = options.baseURL || ''
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
    }
    this.defaultTimeout = options.timeout || 30000
    this.defaultRetry = options.retry ?? true
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor)
    return () => {
      const index = this.requestInterceptors.indexOf(interceptor)
      if (index >= 0) this.requestInterceptors.splice(index, 1)
    }
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor)
    return () => {
      const index = this.responseInterceptors.indexOf(interceptor)
      if (index >= 0) this.responseInterceptors.splice(index, 1)
    }
  }

  /**
   * Add an error interceptor
   */
  addErrorInterceptor(interceptor: ErrorInterceptor): () => void {
    this.errorInterceptors.push(interceptor)
    return () => {
      const index = this.errorInterceptors.indexOf(interceptor)
      if (index >= 0) this.errorInterceptors.splice(index, 1)
    }
  }

  /**
   * Build the full URL with query parameters
   */
  private buildURL(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path, this.baseURL || window.location.origin)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.set(key, String(value))
        }
      })
    }

    return url.toString()
  }

  /**
   * Generate a cache key for a request
   */
  private getCacheKey(method: string, url: string, body?: unknown): string {
    return `${method}:${url}:${body ? JSON.stringify(body) : ''}`
  }

  /**
   * Check if a cached response is still valid
   */
  private getCached<T>(key: string): T | null {
    const entry = responseCache.get(key) as CacheEntry<T> | undefined
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      responseCache.delete(key)
      return null
    }

    return entry.data
  }

  /**
   * Cache a response
   */
  private setCache<T>(key: string, data: T, ttl: number): void {
    responseCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Make an HTTP request
   */
  async request<T>(
    method: string,
    path: string,
    config: RequestConfig = {}
  ): Promise<APIResponse<T>> {
    let requestConfig = {
      ...config,
      url: path,
      method,
    }

    // Apply request interceptors
    for (const interceptor of this.requestInterceptors) {
      requestConfig = await interceptor(requestConfig)
    }

    const url = this.buildURL(requestConfig.url, requestConfig.params)
    const cacheKey = this.getCacheKey(method, url, requestConfig.body)

    // Check cache for GET requests
    if (method === 'GET' && requestConfig.cache !== false) {
      const cached = this.getCached<T>(cacheKey)
      if (cached !== null) {
        log.debug(`Cache hit: ${method} ${path}`)
        return {
          data: cached,
          status: 200,
          headers: new Headers(),
          ok: true,
        }
      }
    }

    // Deduplicate in-flight requests for GET
    if (method === 'GET') {
      const inFlight = inFlightRequests.get(cacheKey)
      if (inFlight) {
        log.debug(`Deduplicating request: ${method} ${path}`)
        return inFlight as Promise<APIResponse<T>>
      }
    }

    // Prepare fetch options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...this.defaultHeaders,
        ...(requestConfig.headers as Record<string, string>),
      },
      signal: requestConfig.signal,
    }

    // Handle body
    if (requestConfig.body !== undefined) {
      fetchOptions.body = typeof requestConfig.body === 'string'
        ? requestConfig.body
        : JSON.stringify(requestConfig.body)
    }

    // Create timeout signal
    const timeout = requestConfig.timeout ?? this.defaultTimeout
    const timeoutController = new AbortController()
    const timeoutId = setTimeout(() => timeoutController.abort(), timeout)

    // Combine signals if both exist
    if (requestConfig.signal) {
      requestConfig.signal.addEventListener('abort', () => timeoutController.abort())
    }
    fetchOptions.signal = timeoutController.signal

    // Execute request (with optional retry)
    const executeRequest = async (): Promise<APIResponse<T>> => {
      try {
        log.debug(`${method} ${path}`)
        const response = await fetch(url, fetchOptions)

        clearTimeout(timeoutId)

        // Handle streaming responses
        if (requestConfig.stream) {
          return {
            data: response as unknown as T,
            status: response.status,
            headers: response.headers,
            ok: response.ok,
          }
        }

        // Parse response
        let data: T
        const contentType = response.headers.get('content-type')

        if (contentType?.includes('application/json')) {
          data = await response.json()
        } else {
          data = await response.text() as unknown as T
        }

        // Handle error responses
        if (!response.ok) {
          const error = new APIClientError(
            typeof data === 'object' && data && 'message' in data
              ? String((data as Record<string, unknown>).message)
              : `Request failed with status ${response.status}`,
            response.status,
            typeof data === 'object' && data && 'code' in data
              ? String((data as Record<string, unknown>).code)
              : undefined,
            typeof data === 'object' ? data as Record<string, unknown> : undefined,
            response
          )

          // Apply error interceptors
          let processedError = error
          for (const interceptor of this.errorInterceptors) {
            processedError = await interceptor(processedError)
          }

          throw processedError
        }

        let result: APIResponse<T> = {
          data,
          status: response.status,
          headers: response.headers,
          ok: true,
        }

        // Apply response interceptors
        for (const interceptor of this.responseInterceptors) {
          result = await interceptor(result) as APIResponse<T>
        }

        // Cache successful GET responses
        if (method === 'GET' && requestConfig.cache !== false) {
          this.setCache(cacheKey, result.data, requestConfig.cacheTTL ?? 60000)
        }

        return result
      } catch (error) {
        clearTimeout(timeoutId)

        if (error instanceof APIClientError) {
          throw error
        }

        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new APIClientError('Request timeout', 408, 'TIMEOUT')
        }

        throw new APIClientError(
          error instanceof Error ? error.message : 'Unknown error',
          0,
          'NETWORK_ERROR'
        )
      }
    }

    // Wrap with retry if enabled
    const retryConfig = requestConfig.retry ?? this.defaultRetry
    const shouldRetry = retryConfig !== false && method === 'GET'

    let requestPromise: Promise<APIResponse<T>>

    if (shouldRetry) {
      const retryOptions: RetryOptions = typeof retryConfig === 'object' ? retryConfig : {}
      requestPromise = (async () => {
        const result = await retry(executeRequest, {
          ...retryOptions,
          operationName: `${method} ${path}`,
        })
        if (!result.success) throw result.error
        return result.data as APIResponse<T>
      })()
    } else {
      requestPromise = executeRequest()
    }

    // Track in-flight GET requests
    if (method === 'GET') {
      inFlightRequests.set(cacheKey, requestPromise)
      requestPromise.finally(() => inFlightRequests.delete(cacheKey))
    }

    return requestPromise
  }

  // Convenience methods
  async get<T>(path: string, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>('GET', path, config)
  }

  async post<T>(path: string, body?: unknown, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>('POST', path, { ...config, body })
  }

  async put<T>(path: string, body?: unknown, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>('PUT', path, { ...config, body })
  }

  async patch<T>(path: string, body?: unknown, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>('PATCH', path, { ...config, body })
  }

  async delete<T>(path: string, config?: RequestConfig): Promise<APIResponse<T>> {
    return this.request<T>('DELETE', path, config)
  }

  /**
   * Clear the response cache
   */
  clearCache(): void {
    responseCache.clear()
    log.debug('API cache cleared')
  }

  /**
   * Clear a specific cache entry
   */
  invalidateCache(method: string, path: string, params?: Record<string, string | number | boolean | undefined>): void {
    const url = this.buildURL(path, params)
    const key = this.getCacheKey(method, url)
    responseCache.delete(key)
  }
}

// Default API client instance
export const api = new APIClient()

// Create OpenRouter API client with auth
export function createOpenRouterClient(apiKey: string): APIClient {
  const client = new APIClient({
    baseURL: 'https://openrouter.ai/api/v1',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      ...getOpenRouterHeaders(),
    },
    timeout: 60000,
    retry: {
      maxAttempts: 3,
      initialDelayMs: 1000,
      isRetryable: (error) => {
        if (error instanceof APIClientError) {
          // Retry on rate limits and server errors
          return error.status === 429 || error.status >= 500
        }
        return true
      },
    },
  })

  return client
}
