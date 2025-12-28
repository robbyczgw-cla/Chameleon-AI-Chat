"use client"

import { useCallback, useRef, useEffect, useState, useMemo } from 'react'

/**
 * Hook to debounce a value
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced value
 *
 * @example
 * const [search, setSearch] = useState('')
 * const debouncedSearch = useDebounce(search, 300)
 *
 * useEffect(() => {
 *   if (debouncedSearch) fetchResults(debouncedSearch)
 * }, [debouncedSearch])
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook to create a debounced callback
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced callback
 *
 * @example
 * const handleSearch = useDebouncedCallback((query: string) => {
 *   fetchResults(query)
 * }, 300)
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args)
    }, delay)
  }, [delay])
}

/**
 * Hook to throttle a callback
 *
 * @param callback - The function to throttle
 * @param limit - Minimum time between calls in milliseconds
 * @returns Throttled callback
 *
 * @example
 * const handleScroll = useThrottledCallback(() => {
 *   updateScrollPosition()
 * }, 100)
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  limit: number
): (...args: Parameters<T>) => void {
  const lastCallRef = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallRef.current

    if (timeSinceLastCall >= limit) {
      lastCallRef.current = now
      callbackRef.current(...args)
    } else {
      // Schedule for later
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        lastCallRef.current = Date.now()
        callbackRef.current(...args)
      }, limit - timeSinceLastCall)
    }
  }, [limit])
}

/**
 * Hook to track if component is mounted
 * Prevents state updates after unmount
 *
 * @returns Ref indicating if component is mounted
 */
export function useIsMounted(): React.MutableRefObject<boolean> {
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  return isMounted
}

/**
 * Hook to get the previous value of a variable
 *
 * @param value - The current value
 * @returns The previous value
 *
 * @example
 * const prevCount = usePrevious(count)
 * if (prevCount !== count) {
 *   console.log('Count changed from', prevCount, 'to', count)
 * }
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

/**
 * Hook to create a stable callback that never changes identity
 * but always calls the latest version of the callback
 *
 * @param callback - The callback function
 * @returns Stable callback reference
 *
 * @example
 * // This callback never changes identity, safe for deps
 * const stableOnChange = useStableCallback((value) => {
 *   console.log(props.name, value)
 * })
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  callback: T
): T {
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(((...args) => callbackRef.current(...args)) as T, [])
}

/**
 * Hook to run effect only once when condition is true
 *
 * @param effect - Effect to run
 * @param condition - Condition that must be true
 *
 * @example
 * useEffectOnce(() => {
 *   analytics.track('page_view')
 * }, isLoggedIn)
 */
export function useEffectOnce(effect: () => void | (() => void), condition: boolean): void {
  const hasRun = useRef(false)

  useEffect(() => {
    if (condition && !hasRun.current) {
      hasRun.current = true
      return effect()
    }
  }, [condition, effect])
}

/**
 * Hook to run effect only on updates (not on mount)
 *
 * @param effect - Effect to run
 * @param deps - Dependencies
 */
export function useUpdateEffect(
  effect: React.EffectCallback,
  deps: React.DependencyList
): void {
  const isFirstMount = useRef(true)

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false
      return
    }
    return effect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}

/**
 * Hook to measure render performance
 *
 * @param componentName - Name for logging
 * @returns Object with render count and time
 */
export function useRenderCount(componentName: string): {
  renderCount: number
  lastRenderTime: number
} {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(performance.now())

  renderCount.current++
  const currentTime = performance.now()
  const renderTime = currentTime - lastRenderTime.current
  lastRenderTime.current = currentTime

  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Render] ${componentName}: #${renderCount.current} (${renderTime.toFixed(1)}ms)`)
  }

  return {
    renderCount: renderCount.current,
    lastRenderTime: renderTime,
  }
}

/**
 * Hook to memoize expensive computations with deep comparison
 *
 * @param factory - Factory function to create value
 * @param deps - Dependencies (deeply compared)
 * @returns Memoized value
 */
export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T {
  const prevDeps = useRef<unknown[]>([])
  const value = useRef<T>()

  const depsChanged = deps.some((dep, i) => {
    return !deepEqual(dep, prevDeps.current[i])
  })

  if (depsChanged || value.current === undefined) {
    prevDeps.current = deps
    value.current = factory()
  }

  return value.current
}

/**
 * Simple deep equality check
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true

  if (typeof a !== typeof b) return false

  if (a === null || b === null) return a === b

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((val, i) => deepEqual(val, b[i]))
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object)
    const bKeys = Object.keys(b as object)

    if (aKeys.length !== bKeys.length) return false

    return aKeys.every(key =>
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    )
  }

  return false
}

/**
 * Hook for intersection observer (lazy loading, infinite scroll)
 *
 * @param options - IntersectionObserver options
 * @returns [ref, isIntersecting]
 */
export function useIntersectionObserver<T extends HTMLElement>(
  options: IntersectionObserverInit = {}
): [React.RefCallback<T>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)

  const ref = useCallback(
    (node: T | null) => {
      if (observer.current) {
        observer.current.disconnect()
      }

      if (node) {
        observer.current = new IntersectionObserver(([entry]) => {
          setIsIntersecting(entry.isIntersecting)
        }, options)

        observer.current.observe(node)
      }
    },
    [options.root, options.rootMargin, options.threshold]
  )

  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [])

  return [ref, isIntersecting]
}

/**
 * Hook for virtual scrolling with dynamic item heights
 */
export function useVirtualScroll<T>(
  items: T[],
  containerHeight: number,
  estimatedItemHeight: number,
  overscan: number = 3
): {
  visibleItems: Array<{ item: T; index: number; style: React.CSSProperties }>
  totalHeight: number
  scrollToIndex: (index: number) => void
  containerRef: React.RefObject<HTMLDivElement>
} {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const itemHeights = useRef<Map<number, number>>(new Map())

  // Calculate visible range
  const { startIndex, endIndex, totalHeight, offsetY } = useMemo(() => {
    let currentOffset = 0
    let start = 0
    let end = items.length - 1

    // Find start index
    for (let i = 0; i < items.length; i++) {
      const height = itemHeights.current.get(i) || estimatedItemHeight
      if (currentOffset + height > scrollTop) {
        start = Math.max(0, i - overscan)
        break
      }
      currentOffset += height
    }

    // Find end index
    currentOffset = 0
    for (let i = 0; i < items.length; i++) {
      const height = itemHeights.current.get(i) || estimatedItemHeight
      currentOffset += height
      if (currentOffset > scrollTop + containerHeight) {
        end = Math.min(items.length - 1, i + overscan)
        break
      }
    }

    // Calculate total height and offset
    let total = 0
    let offset = 0
    for (let i = 0; i < items.length; i++) {
      const height = itemHeights.current.get(i) || estimatedItemHeight
      if (i < start) offset += height
      total += height
    }

    return {
      startIndex: start,
      endIndex: end,
      totalHeight: total,
      offsetY: offset,
    }
  }, [items.length, scrollTop, containerHeight, estimatedItemHeight, overscan])

  // Build visible items
  const visibleItems = useMemo(() => {
    const result: Array<{ item: T; index: number; style: React.CSSProperties }> = []
    let currentOffset = offsetY

    for (let i = startIndex; i <= endIndex && i < items.length; i++) {
      const height = itemHeights.current.get(i) || estimatedItemHeight
      result.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute',
          top: currentOffset,
          left: 0,
          right: 0,
          height,
        },
      })
      currentOffset += height
    }

    return result
  }, [items, startIndex, endIndex, offsetY, estimatedItemHeight])

  // Handle scroll
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollTop(container.scrollTop)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current
    if (!container) return

    let offset = 0
    for (let i = 0; i < index; i++) {
      offset += itemHeights.current.get(i) || estimatedItemHeight
    }

    container.scrollTop = offset
  }, [estimatedItemHeight])

  return {
    visibleItems,
    totalHeight,
    scrollToIndex,
    containerRef,
  }
}

export default {
  useDebounce,
  useDebouncedCallback,
  useThrottledCallback,
  useIsMounted,
  usePrevious,
  useStableCallback,
  useEffectOnce,
  useUpdateEffect,
  useRenderCount,
  useDeepMemo,
  useIntersectionObserver,
  useVirtualScroll,
}
