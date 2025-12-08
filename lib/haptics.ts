/**
 * Enhanced Haptic Feedback Utility
 * Provides vibration feedback for touch interactions on mobile devices
 * Works with PWA and native mobile browsers
 *
 * 2025 Best Practices:
 * - Context-aware patterns (send, receive, typing)
 * - Intensity settings for user preference
 * - iOS-style notification patterns
 * - Graceful fallback for unsupported devices
 */

type HapticPattern =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  // Enhanced patterns for 2025
  | 'notification'
  | 'send'
  | 'receive'
  | 'typing'
  | 'delete'
  | 'swipe'
  | 'longPress'
  | 'doubleTap'
  | 'toggle'
  | 'refresh'
  | 'achievement'

type HapticIntensity = 'off' | 'light' | 'normal' | 'strong'

const PATTERNS: Record<HapticPattern, number[]> = {
  // Basic patterns
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10],
  warning: [15, 50, 15, 50, 15],
  error: [30, 100, 30],
  selection: [5],

  // Enhanced 2025 patterns
  notification: [10, 30, 10, 30, 10],    // iOS-style notification rhythm
  send: [5, 20, 15],                      // Quick double-tap feel for sending messages
  receive: [15, 40, 10],                  // Incoming message feel
  typing: [3],                            // Very subtle for typing indicators
  delete: [30, 60, 30],                   // More pronounced for destructive actions
  swipe: [8, 20, 8],                      // Smooth swipe confirmation
  longPress: [5, 10, 5, 10, 20],         // Building intensity for long press
  doubleTap: [8, 30, 8],                  // Quick double feedback
  toggle: [12, 25, 12],                   // Toggle switch feel
  refresh: [10, 20, 10, 20, 30],         // Pull-to-refresh completion
  achievement: [10, 30, 10, 30, 10, 50, 20], // Celebratory pattern
} as const

// Intensity multipliers
const INTENSITY_MULTIPLIERS: Record<HapticIntensity, number> = {
  off: 0,
  light: 0.5,
  normal: 1,
  strong: 1.5,
}

class HapticsService {
  private isSupported = false
  private intensity: HapticIntensity = 'normal'

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSupported = 'vibrate' in navigator
      // Load saved intensity preference
      this.loadIntensityPreference()
    }
  }

  /**
   * Load intensity preference from localStorage
   */
  private loadIntensityPreference(): void {
    try {
      const saved = localStorage.getItem('haptic-intensity')
      if (saved && saved in INTENSITY_MULTIPLIERS) {
        this.intensity = saved as HapticIntensity
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Set haptic feedback intensity
   */
  setIntensity(intensity: HapticIntensity): void {
    this.intensity = intensity
    try {
      localStorage.setItem('haptic-intensity', intensity)
    } catch {
      // Ignore localStorage errors
    }
  }

  /**
   * Get current intensity setting
   */
  getIntensity(): HapticIntensity {
    return this.intensity
  }

  /**
   * Trigger haptic feedback with a pattern
   */
  trigger(pattern: HapticPattern = 'light'): void {
    if (!this.isSupported || this.intensity === 'off') return

    try {
      const basePattern = PATTERNS[pattern]
      const multiplier = INTENSITY_MULTIPLIERS[this.intensity]

      // Apply intensity multiplier to pattern
      const adjustedPattern = basePattern.map(duration =>
        Math.round(duration * multiplier)
      )

      navigator.vibrate(adjustedPattern)
    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }

  /**
   * Trigger custom vibration pattern
   * @param pattern Array of vibration durations in ms (vibrate, pause, vibrate, ...)
   * Example: [100, 50, 100] = vibrate 100ms, pause 50ms, vibrate 100ms
   */
  custom(pattern: number[]): void {
    if (!this.isSupported || this.intensity === 'off') return

    try {
      const multiplier = INTENSITY_MULTIPLIERS[this.intensity]
      const adjustedPattern = pattern.map(duration =>
        Math.round(duration * multiplier)
      )
      navigator.vibrate(adjustedPattern)
    } catch (error) {
      console.warn('Haptic feedback failed:', error)
    }
  }

  /**
   * Cancel any ongoing vibration
   */
  cancel(): void {
    if (!this.isSupported) return

    try {
      navigator.vibrate(0)
    } catch (error) {
      console.warn('Haptic cancel failed:', error)
    }
  }

  /**
   * Check if haptics are supported
   */
  supported(): boolean {
    return this.isSupported
  }

  /**
   * Check if haptics are enabled (supported and not off)
   */
  enabled(): boolean {
    return this.isSupported && this.intensity !== 'off'
  }

  // ============================================
  // Contextual Helper Methods
  // ============================================

  /**
   * Haptic for sending a message
   */
  onSendMessage(): void {
    this.trigger('send')
  }

  /**
   * Haptic for receiving a message
   */
  onReceiveMessage(): void {
    this.trigger('receive')
  }

  /**
   * Haptic for successful action
   */
  onSuccess(): void {
    this.trigger('success')
  }

  /**
   * Haptic for error
   */
  onError(): void {
    this.trigger('error')
  }

  /**
   * Haptic for button tap
   */
  onTap(): void {
    this.trigger('selection')
  }

  /**
   * Haptic for toggle switch
   */
  onToggle(): void {
    this.trigger('toggle')
  }

  /**
   * Haptic for swipe gesture
   */
  onSwipe(): void {
    this.trigger('swipe')
  }

  /**
   * Haptic for delete action
   */
  onDelete(): void {
    this.trigger('delete')
  }

  /**
   * Haptic for pull-to-refresh completion
   */
  onRefresh(): void {
    this.trigger('refresh')
  }

  /**
   * Haptic for long press detection
   */
  onLongPress(): void {
    this.trigger('longPress')
  }

  /**
   * Haptic for notification
   */
  onNotification(): void {
    this.trigger('notification')
  }

  /**
   * Haptic for achievement/milestone
   */
  onAchievement(): void {
    this.trigger('achievement')
  }
}

export const haptics = new HapticsService()

// Export types for TypeScript consumers
export type { HapticPattern, HapticIntensity }
