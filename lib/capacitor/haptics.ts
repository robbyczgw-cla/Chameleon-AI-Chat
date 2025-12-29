/**
 * Native Haptic Feedback Module
 * Uses Capacitor Haptics for true native haptic feedback
 * Falls back to Web Vibration API when not available
 */

import { Capacitor } from '@capacitor/core'

type HapticPattern =
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
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

// Web fallback patterns (vibration duration in ms)
const WEB_PATTERNS: Record<HapticPattern, number[]> = {
  light: [10],
  medium: [20],
  heavy: [30],
  success: [10, 50, 10],
  warning: [15, 50, 15, 50, 15],
  error: [30, 100, 30],
  selection: [5],
  notification: [10, 30, 10, 30, 10],
  send: [5, 20, 15],
  receive: [15, 40, 10],
  typing: [3],
  delete: [30, 60, 30],
  swipe: [8, 20, 8],
  longPress: [5, 10, 5, 10, 20],
  doubleTap: [8, 30, 8],
  toggle: [12, 25, 12],
  refresh: [10, 20, 10, 20, 30],
  achievement: [10, 30, 10, 30, 10, 50, 20],
}

const INTENSITY_MULTIPLIERS: Record<HapticIntensity, number> = {
  off: 0,
  light: 0.5,
  normal: 1,
  strong: 1.5,
}

class NativeHapticsService {
  private isNative = Capacitor.isNativePlatform()
  private isSupported = false
  private intensity: HapticIntensity = 'normal'
  private haptics: typeof import('@capacitor/haptics').Haptics | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      this.isSupported = this.isNative || 'vibrate' in navigator
      this.loadIntensityPreference()
      this.loadNativeHaptics()
    }
  }

  private async loadNativeHaptics(): Promise<void> {
    if (this.isNative && Capacitor.isPluginAvailable('Haptics')) {
      try {
        const { Haptics } = await import('@capacitor/haptics')
        this.haptics = Haptics
      } catch (error) {
        console.warn('[Haptics] Failed to load native haptics:', error)
      }
    }
  }

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

  setIntensity(intensity: HapticIntensity): void {
    this.intensity = intensity
    try {
      localStorage.setItem('haptic-intensity', intensity)
    } catch {
      // Ignore localStorage errors
    }
  }

  getIntensity(): HapticIntensity {
    return this.intensity
  }

  /**
   * Trigger native haptic feedback
   * Uses Capacitor Haptics on native, falls back to Web Vibration API
   */
  async trigger(pattern: HapticPattern = 'light'): Promise<void> {
    if (!this.isSupported || this.intensity === 'off') return

    try {
      if (this.haptics) {
        // Use native haptics
        await this.triggerNative(pattern)
      } else {
        // Fall back to web vibration
        this.triggerWeb(pattern)
      }
    } catch (error) {
      console.warn('[Haptics] Feedback failed:', error)
    }
  }

  private async triggerNative(pattern: HapticPattern): Promise<void> {
    if (!this.haptics) return

    const { ImpactStyle, NotificationType } = await import('@capacitor/haptics')

    switch (pattern) {
      case 'light':
      case 'selection':
      case 'typing':
        await this.haptics.impact({ style: ImpactStyle.Light })
        break

      case 'medium':
      case 'toggle':
      case 'swipe':
        await this.haptics.impact({ style: ImpactStyle.Medium })
        break

      case 'heavy':
      case 'delete':
      case 'longPress':
        await this.haptics.impact({ style: ImpactStyle.Heavy })
        break

      case 'success':
      case 'send':
      case 'achievement':
        await this.haptics.notification({ type: NotificationType.Success })
        break

      case 'warning':
      case 'notification':
      case 'receive':
        await this.haptics.notification({ type: NotificationType.Warning })
        break

      case 'error':
        await this.haptics.notification({ type: NotificationType.Error })
        break

      case 'doubleTap':
        await this.haptics.impact({ style: ImpactStyle.Light })
        setTimeout(() => this.haptics?.impact({ style: ImpactStyle.Medium }), 50)
        break

      case 'refresh':
        await this.haptics.vibrate({ duration: 200 })
        break

      default:
        await this.haptics.impact({ style: ImpactStyle.Light })
    }
  }

  private triggerWeb(pattern: HapticPattern): void {
    const basePattern = WEB_PATTERNS[pattern]
    const multiplier = INTENSITY_MULTIPLIERS[this.intensity]
    const adjustedPattern = basePattern.map((duration) =>
      Math.round(duration * multiplier)
    )
    navigator.vibrate(adjustedPattern)
  }

  /**
   * Selection changed haptic
   */
  async selectionChanged(): Promise<void> {
    if (!this.haptics) {
      this.trigger('selection')
      return
    }
    await this.haptics.selectionChanged()
  }

  /**
   * Custom vibration
   */
  async vibrate(duration: number = 100): Promise<void> {
    if (!this.isSupported || this.intensity === 'off') return

    if (this.haptics) {
      await this.haptics.vibrate({ duration })
    } else {
      navigator.vibrate(duration)
    }
  }

  /**
   * Cancel ongoing vibration
   */
  cancel(): void {
    if (!this.isSupported) return
    try {
      navigator.vibrate(0)
    } catch {
      // Ignore errors
    }
  }

  supported(): boolean {
    return this.isSupported
  }

  enabled(): boolean {
    return this.isSupported && this.intensity !== 'off'
  }

  // Contextual helpers
  onSendMessage = () => this.trigger('send')
  onReceiveMessage = () => this.trigger('receive')
  onSuccess = () => this.trigger('success')
  onError = () => this.trigger('error')
  onTap = () => this.trigger('selection')
  onToggle = () => this.trigger('toggle')
  onSwipe = () => this.trigger('swipe')
  onDelete = () => this.trigger('delete')
  onRefresh = () => this.trigger('refresh')
  onLongPress = () => this.trigger('longPress')
  onNotification = () => this.trigger('notification')
  onAchievement = () => this.trigger('achievement')

  // Direct haptic methods for compatibility
  async impact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
    await this.trigger(style)
  }

  async notification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
    await this.trigger(type)
  }
}

export const nativeHaptics = new NativeHapticsService()
export type { HapticPattern, HapticIntensity }
