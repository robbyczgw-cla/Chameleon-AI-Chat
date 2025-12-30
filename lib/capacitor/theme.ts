/**
 * Native Theme Module
 * Syncs app theme with system dark mode and provides theme utilities
 */

import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'

const isNative = Capacitor.isNativePlatform()

export type Theme = 'light' | 'dark' | 'system'

// Module state
let _currentTheme: Theme = 'system'
let _resolvedTheme: 'light' | 'dark' = 'dark'
let _mediaQuery: MediaQueryList | null = null
const _listeners: Set<(theme: 'light' | 'dark') => void> = new Set()
let _initialized = false

/**
 * Native Theme Service
 */
export const nativeTheme = {
  /**
   * Initialize theme handling
   */
  initialize(): void {
    if (_initialized) return
    _initialized = true

    // Setup system theme detection
    _mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    _resolvedTheme = _mediaQuery.matches ? 'dark' : 'light'

    // Listen for system theme changes
    _mediaQuery.addEventListener('change', (e) => {
      if (_currentTheme === 'system') {
        _resolvedTheme = e.matches ? 'dark' : 'light'
        this.applyTheme(_resolvedTheme)
        notifyListeners(_resolvedTheme)
      }
    })

    // Load saved theme preference
    this.loadSavedTheme()

    console.log('[NativeTheme] Initialized, theme:', _resolvedTheme)
  },

  /**
   * Load saved theme preference
   */
  async loadSavedTheme(): Promise<void> {
    try {
      if (isNative) {
        const { Preferences } = await import('@capacitor/preferences')
        const { value } = await Preferences.get({ key: 'theme' })
        if (value && (value === 'light' || value === 'dark' || value === 'system')) {
          await this.setTheme(value as Theme)
        }
      } else {
        const saved = localStorage.getItem('theme')
        if (saved && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          await this.setTheme(saved as Theme)
        }
      }
    } catch (error) {
      console.error('[NativeTheme] Failed to load saved theme:', error)
    }
  },

  /**
   * Set theme
   */
  async setTheme(theme: Theme): Promise<void> {
    _currentTheme = theme

    // Resolve actual theme
    if (theme === 'system') {
      _resolvedTheme = _mediaQuery?.matches ? 'dark' : 'light'
    } else {
      _resolvedTheme = theme
    }

    // Apply theme
    this.applyTheme(_resolvedTheme)

    // Save preference
    try {
      if (isNative) {
        const { Preferences } = await import('@capacitor/preferences')
        await Preferences.set({ key: 'theme', value: theme })
      } else {
        localStorage.setItem('theme', theme)
      }
    } catch (error) {
      console.error('[NativeTheme] Failed to save theme:', error)
    }

    notifyListeners(_resolvedTheme)
  },

  /**
   * Apply theme to DOM and native elements
   */
  applyTheme(theme: 'light' | 'dark'): void {
    // Apply to document
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
    document.documentElement.setAttribute('data-theme', theme)

    // Apply to native status bar
    if (isNative) {
      this.updateStatusBar(theme)
    }

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0a0a0a' : '#ffffff')
    }
  },

  /**
   * Update native status bar style
   */
  async updateStatusBar(theme: 'light' | 'dark'): Promise<void> {
    if (!isNative) return

    try {
      await StatusBar.setStyle({
        style: theme === 'dark' ? Style.Dark : Style.Light,
      })

      // Set background color
      await StatusBar.setBackgroundColor({
        color: theme === 'dark' ? '#0a0a0a' : '#ffffff',
      })
    } catch (error) {
      console.error('[NativeTheme] Failed to update status bar:', error)
    }
  },

  /**
   * Get current theme preference
   */
  getTheme(): Theme {
    return _currentTheme
  },

  /**
   * Get resolved theme (actual light/dark)
   */
  getResolvedTheme(): 'light' | 'dark' {
    return _resolvedTheme
  },

  /**
   * Check if dark mode
   */
  isDark(): boolean {
    return _resolvedTheme === 'dark'
  },

  /**
   * Toggle between light and dark
   */
  async toggle(): Promise<void> {
    const newTheme = _resolvedTheme === 'dark' ? 'light' : 'dark'
    await this.setTheme(newTheme)

    // Haptic feedback
    if (isNative) {
      const { nativeHaptics } = await import('./haptics')
      await nativeHaptics.impact('light')
    }
  },

  /**
   * Subscribe to theme changes
   */
  onThemeChange(callback: (theme: 'light' | 'dark') => void): () => void {
    _listeners.add(callback)
    return () => _listeners.delete(callback)
  },

  /**
   * Get theme-aware colors
   */
  getColors(): {
    background: string
    foreground: string
    primary: string
    secondary: string
    muted: string
    border: string
  } {
    if (_resolvedTheme === 'dark') {
      return {
        background: '#0a0a0a',
        foreground: '#fafafa',
        primary: '#22c55e',
        secondary: '#a1a1aa',
        muted: '#27272a',
        border: '#3f3f46',
      }
    }
    return {
      background: '#ffffff',
      foreground: '#0a0a0a',
      primary: '#16a34a',
      secondary: '#71717a',
      muted: '#f4f4f5',
      border: '#e4e4e7',
    }
  },
}

/**
 * Notify listeners of theme change
 */
function notifyListeners(theme: 'light' | 'dark'): void {
  _listeners.forEach(callback => {
    try {
      callback(theme)
    } catch (error) {
      console.error('[NativeTheme] Listener error:', error)
    }
  })
}
