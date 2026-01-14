/**
 * Native Network Status Module
 * Monitors network connectivity and provides offline detection
 */

import { Capacitor } from '@capacitor/core'
import { Network, ConnectionStatus, ConnectionType } from '@capacitor/network'

const isNative = Capacitor.isNativePlatform()

export interface NetworkState {
  connected: boolean
  connectionType: ConnectionType
  isWifi: boolean
  isCellular: boolean
  isNone: boolean
}

// Module state
let _currentState: NetworkState = {
  connected: true,
  connectionType: 'unknown' as ConnectionType,
  isWifi: false,
  isCellular: false,
  isNone: false,
}
const _listeners: Set<(state: NetworkState) => void> = new Set()
let _initialized = false
let _webOnlineHandler: (() => void) | null = null
let _webOfflineHandler: (() => void) | null = null

/**
 * Convert ConnectionStatus to NetworkState
 */
function toNetworkState(status: ConnectionStatus): NetworkState {
  return {
    connected: status.connected,
    connectionType: status.connectionType,
    isWifi: status.connectionType === 'wifi',
    isCellular: status.connectionType === 'cellular',
    isNone: status.connectionType === 'none',
  }
}

/**
 * Native Network Service
 */
export const nativeNetwork = {
  /**
   * Initialize network monitoring
   */
  async initialize(): Promise<void> {
    if (_initialized) return
    _initialized = true

    try {
      if (isNative) {
        // Get initial status
        const status = await Network.getStatus()
        _currentState = toNetworkState(status)

        // Listen for changes
        Network.addListener('networkStatusChange', (status) => {
          const newState = toNetworkState(status)
          const wasConnected = _currentState.connected
          _currentState = newState

          console.log('[NativeNetwork] Status changed:', newState)

          // Haptic feedback on connection change
          if (wasConnected !== newState.connected) {
            import('./haptics').then(({ nativeHaptics }) => {
              if (newState.connected) {
                nativeHaptics.notification('success')
              } else {
                nativeHaptics.notification('error')
              }
            })

            // Show toast
            import('@capacitor/toast').then(({ Toast }) => {
              Toast.show({
                text: newState.connected ? 'Back online' : 'You are offline',
                duration: 'short',
                position: 'bottom',
              })
            })
          }

          // Notify listeners
          notifyListeners(newState)
        })
      } else {
        // Web fallback
        _currentState = {
          connected: navigator.onLine,
          connectionType: navigator.onLine ? 'unknown' : 'none',
          isWifi: false,
          isCellular: false,
          isNone: !navigator.onLine,
        }

        // Store handlers for cleanup
        _webOnlineHandler = () => {
          _currentState = { ..._currentState, connected: true, isNone: false }
          notifyListeners(_currentState)
        }
        _webOfflineHandler = () => {
          _currentState = { ..._currentState, connected: false, isNone: true }
          notifyListeners(_currentState)
        }

        window.addEventListener('online', _webOnlineHandler)
        window.addEventListener('offline', _webOfflineHandler)
      }

      console.log('[NativeNetwork] Initialized, connected:', _currentState.connected)
    } catch (error) {
      console.error('[NativeNetwork] Failed to initialize:', error)
    }
  },

  /**
   * Get current network status
   */
  async getStatus(): Promise<NetworkState> {
    if (isNative) {
      const status = await Network.getStatus()
      _currentState = toNetworkState(status)
    }
    return _currentState
  },

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return _currentState.connected
  },

  /**
   * Check if on WiFi
   */
  isWifi(): boolean {
    return _currentState.isWifi
  },

  /**
   * Check if on cellular data
   */
  isCellular(): boolean {
    return _currentState.isCellular
  },

  /**
   * Subscribe to network changes
   */
  onStatusChange(callback: (state: NetworkState) => void): () => void {
    _listeners.add(callback)
    return () => _listeners.delete(callback)
  },

  /**
   * Check connectivity with actual request (more reliable than just checking status)
   */
  async checkConnectivity(timeout: number = 5000): Promise<boolean> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      })

      return true
    } catch {
      return false
    } finally {
      clearTimeout(timeoutId)
    }
  },

  /**
   * Wait for network to be available
   */
  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    if (this.isConnected()) return true

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        unsubscribe()
        resolve(false)
      }, timeout)

      const unsubscribe = this.onStatusChange((state) => {
        if (state.connected) {
          clearTimeout(timer)
          unsubscribe()
          resolve(true)
        }
      })
    })
  },

  /**
   * Get connection quality hint (for adaptive features)
   */
  getQualityHint(): 'high' | 'medium' | 'low' | 'none' {
    if (!_currentState.connected) return 'none'
    if (_currentState.isWifi) return 'high'
    if (_currentState.isCellular) return 'medium'
    return 'low'
  },

  /**
   * Cleanup resources (remove event listeners)
   */
  destroy(): void {
    // Clean up web event listeners
    if (_webOnlineHandler) {
      window.removeEventListener('online', _webOnlineHandler)
      _webOnlineHandler = null
    }
    if (_webOfflineHandler) {
      window.removeEventListener('offline', _webOfflineHandler)
      _webOfflineHandler = null
    }

    // Clear all listeners
    _listeners.clear()
    _initialized = false

    // Native cleanup handled by Capacitor's Network.removeAllListeners() if needed
  },
}

/**
 * Notify listeners of network state change
 */
function notifyListeners(state: NetworkState): void {
  _listeners.forEach(callback => {
    try {
      callback(state)
    } catch (error) {
      console.error('[NativeNetwork] Listener error:', error)
    }
  })
}
