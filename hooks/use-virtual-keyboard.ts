/**
 * VirtualKeyboard API Hook (2025 Standard)
 * Handles mobile keyboard with modern VirtualKeyboard API + fallback
 * Prevents layout shift and content hiding
 */

'use client'

import { useEffect, useState } from 'react'

interface VirtualKeyboardState {
  keyboardHeight: number
  isKeyboardVisible: boolean
  /**
   * Keyboard bounding rect from VirtualKeyboard API
   * Available only when using modern API
   */
  boundingRect: DOMRect | null
}

/**
 * Hook for handling virtual keyboard on mobile devices
 * Uses VirtualKeyboard API (Chrome 94+, Edge 94+) with fallback to visualViewport
 *
 * @returns Keyboard state with height, visibility, and bounding rect
 *
 * @example
 * ```tsx
 * function ChatInput() {
 *   const { keyboardHeight, isKeyboardVisible } = useVirtualKeyboard()
 *
 *   return (
 *     <div
 *       style={{
 *         transform: isKeyboardVisible ? `translateY(-${keyboardHeight}px)` : 'translateY(0)'
 *       }}
 *     >
 *       <textarea />
 *     </div>
 *   )
 * }
 * ```
 */
export function useVirtualKeyboard(): VirtualKeyboardState {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  const [boundingRect, setBoundingRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check for VirtualKeyboard API support (Chrome 94+, Edge 94+)
    const hasVirtualKeyboardAPI = 'virtualKeyboard' in navigator

    if (hasVirtualKeyboardAPI) {
      const vk = (navigator as any).virtualKeyboard

      try {
        // CRITICAL: Opt into overlay mode
        // This prevents automatic viewport resize and allows us to handle keyboard manually
        vk.overlaysContent = true

        // Listen for keyboard geometry changes
        const handleGeometryChange = (event: any) => {
          const rect = event.target.boundingRect as DOMRect
          const height = rect.height

          setKeyboardHeight(height)
          setIsKeyboardVisible(height > 0)
          setBoundingRect(rect)

          // Log for debugging in development
          if (process.env.NODE_ENV === 'development') {
            console.log('[VirtualKeyboard] Geometry changed:', {
              height,
              visible: height > 0,
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
            })
          }
        }

        vk.addEventListener('geometrychange', handleGeometryChange)

        return () => {
          vk.removeEventListener('geometrychange', handleGeometryChange)
        }
      } catch (error) {
        console.warn('[VirtualKeyboard] API initialization failed, falling back to visualViewport:', error)
        // Fall through to fallback
      }
    }

    // Fallback for browsers without VirtualKeyboard API (iOS Safari, older browsers)
    if (window.visualViewport) {
      const handleResize = () => {
        const viewportHeight = window.visualViewport!.height
        const windowHeight = window.innerHeight
        const diff = windowHeight - viewportHeight

        // Keyboard is considered open if difference > 100px
        // This threshold accounts for browser UI changes
        if (diff > 100) {
          setKeyboardHeight(diff)
          setIsKeyboardVisible(true)
          setBoundingRect(null) // No bounding rect in fallback mode
        } else {
          setKeyboardHeight(0)
          setIsKeyboardVisible(false)
          setBoundingRect(null)
        }
      }

      // Initial check
      handleResize()

      // Listen for viewport changes
      window.visualViewport.addEventListener('resize', handleResize)
      window.visualViewport.addEventListener('scroll', handleResize)

      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize)
        window.visualViewport?.removeEventListener('scroll', handleResize)
      }
    }

    // No support for either API
    console.warn('[VirtualKeyboard] No keyboard detection API available')
  }, [])

  return { keyboardHeight, isKeyboardVisible, boundingRect }
}

/**
 * Get virtualkeyboard policy attribute for contenteditable elements
 *
 * @param policy - Whether to show/hide keyboard automatically
 * @returns Attribute object for spreading onto contenteditable elements
 *
 * @example
 * ```tsx
 * <div contentEditable {...getVirtualKeyboardPolicy('manual')}>
 *   Editable content
 * </div>
 * ```
 */
export function getVirtualKeyboardPolicy(policy: 'auto' | 'manual' = 'auto') {
  return {
    virtualkeyboardpolicy: policy
  } as const
}
