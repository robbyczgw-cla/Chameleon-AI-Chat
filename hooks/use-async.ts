"use client"

import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Async operation state
 */
export interface AsyncState<T> {
  data: T | null
  error: Error | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
  isIdle: boolean
}

/**
 * Async hook options
 */
export interface UseAsyncOptions<T> {
  /** Initial data value */
  initialData?: T | null
  /** Execute immediately on mount */
  immediate?: boolean
  /** Callback when execution succeeds */
  onSuccess?: (data: T) => void
  /** Callback when execution fails */
  onError?: (error: Error) => void
  /** Callback when execution completes (success or error) */
  onSettled?: () => void
  /** Dependencies to re-execute on change */
  deps?: unknown[]
}

/**
 * Async hook return type
 */
export interface UseAsyncReturn<T, TArgs extends unknown[]> extends AsyncState<T> {
  /** Execute the async function */
  execute: (...args: TArgs) => Promise<T | null>
  /** Reset state to initial */
  reset: () => void
  /** Set data manually */
  setData: (data: T | null) => void
  /** Set error manually */
  setError: (error: Error | null) => void
}

/**
 * Hook for managing async operations with loading, error, and success states
 *
 * @param asyncFunction - The async function to execute
 * @param options - Configuration options
 * @returns State and control functions
 *
 * @example
 * const { data, isLoading, error, execute } = useAsync(
 *   async (id: string) => {
 *     const response = await fetch(`/api/users/${id}`)
 *     return response.json()
 *   },
 *   { immediate: false }
 * )
 *
 * // Execute manually
 * const handleClick = () => execute('user-123')
 */
export function useAsync<T, TArgs extends unknown[] = []>(
  asyncFunction: (...args: TArgs) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, TArgs> {
  const {
    initialData = null,
    immediate = false,
    onSuccess,
    onError,
    onSettled,
    deps = [],
  } = options

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    error: null,
    isLoading: immediate,
    isError: false,
    isSuccess: false,
    isIdle: !immediate,
  })

  // Track if component is mounted
  const isMounted = useRef(true)

  // Track the latest async function
  const asyncFunctionRef = useRef(asyncFunction)
  asyncFunctionRef.current = asyncFunction

  // Track callbacks
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const onSettledRef = useRef(onSettled)
  onSuccessRef.current = onSuccess
  onErrorRef.current = onError
  onSettledRef.current = onSettled

  // Abort controller for cancellation
  const abortControllerRef = useRef<AbortController | null>(null)

  const execute = useCallback(async (...args: TArgs): Promise<T | null> => {
    // Cancel any in-progress request
    abortControllerRef.current?.abort()
    abortControllerRef.current = new AbortController()

    setState(prev => ({
      ...prev,
      isLoading: true,
      isError: false,
      isIdle: false,
    }))

    try {
      const result = await asyncFunctionRef.current(...args)

      if (isMounted.current) {
        setState({
          data: result,
          error: null,
          isLoading: false,
          isError: false,
          isSuccess: true,
          isIdle: false,
        })
        onSuccessRef.current?.(result)
      }

      return result
    } catch (error) {
      const normalizedError = error instanceof Error ? error : new Error(String(error))

      // Don't update state if aborted
      if (normalizedError.name === 'AbortError') {
        return null
      }

      if (isMounted.current) {
        setState({
          data: null,
          error: normalizedError,
          isLoading: false,
          isError: true,
          isSuccess: false,
          isIdle: false,
        })
        onErrorRef.current?.(normalizedError)
      }

      return null
    } finally {
      if (isMounted.current) {
        onSettledRef.current?.()
      }
    }
  }, [])

  const reset = useCallback(() => {
    abortControllerRef.current?.abort()
    setState({
      data: initialData,
      error: null,
      isLoading: false,
      isError: false,
      isSuccess: false,
      isIdle: true,
    })
  }, [initialData])

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }))
  }, [])

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({
      ...prev,
      error,
      isError: error !== null,
    }))
  }, [])

  // Execute on mount if immediate
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as TArgs))
    }
  }, [immediate, execute])

  // Re-execute when deps change
  useEffect(() => {
    if (deps.length > 0 && !state.isIdle) {
      execute(...([] as unknown as TArgs))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
  }
}

/**
 * Hook for fetching data with automatic execution
 *
 * @param fetchFn - Function that returns a promise with the data
 * @param deps - Dependencies to re-fetch on change
 * @param options - Additional options
 *
 * @example
 * const { data, isLoading, error, refetch } = useFetch(
 *   () => api.get('/users'),
 *   [userId]
 * )
 */
export function useFetch<T>(
  fetchFn: () => Promise<T>,
  deps: unknown[] = [],
  options: Omit<UseAsyncOptions<T>, 'immediate' | 'deps'> = {}
): UseAsyncReturn<T, []> & { refetch: () => Promise<T | null> } {
  const result = useAsync(fetchFn, {
    ...options,
    immediate: true,
    deps,
  })

  return {
    ...result,
    refetch: result.execute,
  }
}

/**
 * Hook for mutation operations (POST, PUT, DELETE)
 *
 * @param mutationFn - Function that performs the mutation
 * @param options - Configuration options
 *
 * @example
 * const { mutate, isLoading } = useMutation(
 *   async (user: User) => {
 *     return api.post('/users', user)
 *   },
 *   {
 *     onSuccess: () => toast.success('User created!'),
 *   }
 * )
 *
 * const handleSubmit = () => mutate({ name: 'John' })
 */
export function useMutation<T, TArgs extends unknown[] = []>(
  mutationFn: (...args: TArgs) => Promise<T>,
  options: Omit<UseAsyncOptions<T>, 'immediate' | 'deps'> = {}
): UseAsyncReturn<T, TArgs> & { mutate: (...args: TArgs) => Promise<T | null> } {
  const result = useAsync(mutationFn, {
    ...options,
    immediate: false,
  })

  return {
    ...result,
    mutate: result.execute,
  }
}

/**
 * Hook for debounced async operations
 *
 * @param asyncFunction - The async function to debounce
 * @param delay - Debounce delay in milliseconds
 * @param options - Configuration options
 *
 * @example
 * const { data, execute } = useDebouncedAsync(
 *   async (query: string) => searchAPI(query),
 *   300
 * )
 *
 * // Called frequently, but only executes after 300ms of no calls
 * const handleSearch = (e) => execute(e.target.value)
 */
export function useDebouncedAsync<T, TArgs extends unknown[]>(
  asyncFunction: (...args: TArgs) => Promise<T>,
  delay: number,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T, TArgs> {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingArgsRef = useRef<TArgs | null>(null)

  const result = useAsync(asyncFunction, options)

  const debouncedExecute = useCallback((...args: TArgs): Promise<T | null> => {
    pendingArgsRef.current = args

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    return new Promise((resolve) => {
      timeoutRef.current = setTimeout(async () => {
        if (pendingArgsRef.current) {
          const res = await result.execute(...pendingArgsRef.current)
          resolve(res)
        }
      }, delay)
    })
  }, [delay, result.execute])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return {
    ...result,
    execute: debouncedExecute,
  }
}

export default useAsync
