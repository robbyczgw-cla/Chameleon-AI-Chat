/**
 * Native Keyboard Module
 * Enhanced keyboard handling for chat input
 */

import { Capacitor } from '@capacitor/core'
import { Keyboard, KeyboardInfo, KeyboardResize } from '@capacitor/keyboard'

const isNative = Capacitor.isNativePlatform()

export interface KeyboardState {
  isOpen: boolean
  height: number
}

// Module state
let _currentState: KeyboardState = { isOpen: false, height: 0 }
const _listeners: Set<(state: KeyboardState) => void> = new Set()
let _initialized = false

/**
 * Native Keyboard Service
 */
export const nativeKeyboard = {
  /**
   * Initialize keyboard handling
   */
  async initialize(): Promise<void> {
    if (_initialized || !isNative) return
    _initialized = true

    try {
      // Configure keyboard behavior
      await Keyboard.setResizeMode({ mode: KeyboardResize.Body })
      await Keyboard.setScroll({ isDisabled: false })

      // Listen for keyboard events
      Keyboard.addListener('keyboardWillShow', (info: KeyboardInfo) => {
        _currentState = { isOpen: true, height: info.keyboardHeight }
        notifyListeners(_currentState)

        // Add class to body for CSS styling
        document.body.classList.add('keyboard-open')
        document.body.style.setProperty('--keyboard-height', `${info.keyboardHeight}px`)
      })

      Keyboard.addListener('keyboardWillHide', () => {
        _currentState = { isOpen: false, height: 0 }
        notifyListeners(_currentState)

        document.body.classList.remove('keyboard-open')
        document.body.style.setProperty('--keyboard-height', '0px')
      })

      console.log('[NativeKeyboard] Initialized')
    } catch (error) {
      console.error('[NativeKeyboard] Failed to initialize:', error)
    }
  },

  /**
   * Show keyboard
   */
  async show(): Promise<void> {
    if (isNative) {
      await Keyboard.show()
    }
  },

  /**
   * Hide keyboard
   */
  async hide(): Promise<void> {
    if (isNative) {
      await Keyboard.hide()
    } else {
      // Web fallback
      const activeElement = document.activeElement as HTMLElement
      activeElement?.blur()
    }
  },

  /**
   * Check if keyboard is open
   */
  isOpen(): boolean {
    return _currentState.isOpen
  },

  /**
   * Get keyboard height
   */
  getHeight(): number {
    return _currentState.height
  },

  /**
   * Subscribe to keyboard state changes
   */
  onStateChange(callback: (state: KeyboardState) => void): () => void {
    _listeners.add(callback)
    return () => _listeners.delete(callback)
  },

  /**
   * Set accessory bar visibility (autocomplete suggestions)
   */
  async setAccessoryBarVisible(visible: boolean): Promise<void> {
    if (isNative) {
      await Keyboard.setAccessoryBarVisible({ isVisible: visible })
    }
  },

  /**
   * Scroll to active element when keyboard opens
   */
  scrollToActiveElement(): void {
    const activeElement = document.activeElement as HTMLElement
    if (activeElement && 'scrollIntoView' in activeElement) {
      setTimeout(() => {
        activeElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }, 100)
    }
  },

  /**
   * Focus input and show keyboard
   */
  async focusInput(element: HTMLInputElement | HTMLTextAreaElement): Promise<void> {
    element.focus()
    if (isNative) {
      await Keyboard.show()
    }
    this.scrollToActiveElement()
  },

  /**
   * Blur and hide keyboard
   */
  async blurInput(): Promise<void> {
    const activeElement = document.activeElement as HTMLElement
    activeElement?.blur()
    await this.hide()
  },
}

/**
 * Notify listeners of keyboard state change
 */
function notifyListeners(state: KeyboardState): void {
  _listeners.forEach(callback => {
    try {
      callback(state)
    } catch (error) {
      console.error('[NativeKeyboard] Listener error:', error)
    }
  })
}

/**
 * Hook for keyboard-aware input handling
 */
export function createKeyboardAwareInput(inputRef: HTMLElement | null) {
  if (!inputRef) return

  // Add keyboard class when focused
  inputRef.addEventListener('focus', () => {
    document.body.classList.add('input-focused')
    nativeKeyboard.scrollToActiveElement()
  })

  inputRef.addEventListener('blur', () => {
    document.body.classList.remove('input-focused')
  })
}
