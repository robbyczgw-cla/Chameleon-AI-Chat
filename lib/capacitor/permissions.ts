/**
 * Native Permissions Handler
 * Handles all Android runtime permissions with proper UX
 * Provides permission status tracking and request flows
 */

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()
const isAndroid = Capacitor.getPlatform() === 'android'

export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'limited'

export interface PermissionState {
  camera: PermissionStatus
  microphone: PermissionStatus
  notifications: PermissionStatus
  photos: PermissionStatus
  location: PermissionStatus
}

// Permission state cache
let _permissionState: Partial<PermissionState> = {}

// Map Capacitor permission states to our PermissionStatus
const mapPermissionState = (state: string): PermissionStatus => {
  if (state === 'prompt-with-rationale') return 'prompt'
  return state as PermissionStatus
}

/**
 * Native Permissions Service
 */
export const nativePermissions = {
  /**
   * Get all permission states at once
   */
  async getAllPermissions(): Promise<PermissionState> {
    const [camera, microphone, notifications, photos] = await Promise.all([
      this.checkCamera(),
      this.checkMicrophone(),
      this.checkNotifications(),
      this.checkPhotos(),
    ])

    _permissionState = { camera, microphone, notifications, photos }
    return _permissionState as PermissionState
  },

  // ==================== CAMERA ====================

  /**
   * Check camera permission status
   */
  async checkCamera(): Promise<PermissionStatus> {
    if (!isNative) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
        return result.state as PermissionStatus
      } catch {
        return 'prompt'
      }
    }

    if (!Capacitor.isPluginAvailable('Camera')) return 'denied'

    const { Camera } = await import('@capacitor/camera')
    const { camera } = await Camera.checkPermissions()
    const status = mapPermissionState(camera)
    _permissionState.camera = status
    return status
  },

  /**
   * Request camera permission
   */
  async requestCamera(): Promise<PermissionStatus> {
    if (!isNative) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
        return 'granted'
      } catch {
        return 'denied'
      }
    }

    if (!Capacitor.isPluginAvailable('Camera')) return 'denied'

    // Haptic feedback before permission request
    if (isAndroid) {
      const { nativeHaptics } = await import('./haptics')
      await nativeHaptics.impact('medium')
    }

    const { Camera } = await import('@capacitor/camera')
    const { camera } = await Camera.requestPermissions()
    const status = mapPermissionState(camera)
    _permissionState.camera = status
    return status
  },

  // ==================== MICROPHONE ====================

  /**
   * Check microphone permission status
   */
  async checkMicrophone(): Promise<PermissionStatus> {
    if (!isNative) {
      try {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        return result.state as PermissionStatus
      } catch {
        return 'prompt'
      }
    }

    // Android doesn't have a specific microphone permission check in Capacitor
    // We use MediaDevices API
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const hasAudio = devices.some(d => d.kind === 'audioinput' && d.deviceId !== '')
      return hasAudio ? 'granted' : 'prompt'
    } catch {
      return 'prompt'
    }
  },

  /**
   * Request microphone permission
   */
  async requestMicrophone(): Promise<PermissionStatus> {
    // Haptic feedback before permission request
    if (isAndroid) {
      const { nativeHaptics } = await import('./haptics')
      await nativeHaptics.impact('medium')
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
      _permissionState.microphone = 'granted'
      return 'granted'
    } catch (error) {
      console.error('[Permissions] Microphone request failed:', error)
      _permissionState.microphone = 'denied'
      return 'denied'
    }
  },

  // ==================== NOTIFICATIONS ====================

  /**
   * Check notifications permission status
   */
  async checkNotifications(): Promise<PermissionStatus> {
    if (!isNative) {
      if ('Notification' in window) {
        return Notification.permission as PermissionStatus
      }
      return 'denied'
    }

    if (!Capacitor.isPluginAvailable('LocalNotifications')) return 'denied'

    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const { display } = await LocalNotifications.checkPermissions()
    const status = mapPermissionState(display)
    _permissionState.notifications = status
    return status
  },

  /**
   * Request notifications permission
   */
  async requestNotifications(): Promise<PermissionStatus> {
    if (!isNative) {
      if ('Notification' in window) {
        const result = await Notification.requestPermission()
        // Map 'default' to 'prompt'
        return result === 'default' ? 'prompt' : result
      }
      return 'denied'
    }

    if (!Capacitor.isPluginAvailable('LocalNotifications')) return 'denied'

    // Haptic feedback before permission request
    if (isAndroid) {
      const { nativeHaptics } = await import('./haptics')
      await nativeHaptics.impact('medium')
    }

    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const { display } = await LocalNotifications.requestPermissions()
    const status = mapPermissionState(display)
    _permissionState.notifications = status
    return status
  },

  // ==================== PHOTOS/GALLERY ====================

  /**
   * Check photos/gallery permission status
   */
  async checkPhotos(): Promise<PermissionStatus> {
    if (!isNative) return 'granted' // Web always has access through file picker

    if (!Capacitor.isPluginAvailable('Camera')) return 'denied'

    const { Camera } = await import('@capacitor/camera')
    const { photos } = await Camera.checkPermissions()
    const status = mapPermissionState(photos)
    _permissionState.photos = status
    return status
  },

  /**
   * Request photos/gallery permission
   */
  async requestPhotos(): Promise<PermissionStatus> {
    if (!isNative) return 'granted'

    if (!Capacitor.isPluginAvailable('Camera')) return 'denied'

    // Haptic feedback before permission request
    if (isAndroid) {
      const { nativeHaptics } = await import('./haptics')
      await nativeHaptics.impact('medium')
    }

    const { Camera } = await import('@capacitor/camera')
    const { photos } = await Camera.requestPermissions({ permissions: ['photos'] })
    const status = mapPermissionState(photos)
    _permissionState.photos = status
    return status
  },

  // ==================== BIOMETRIC ====================

  /**
   * Check biometric availability and permission
   */
  async checkBiometric(): Promise<{
    available: boolean
    biometryType: 'fingerprint' | 'face' | 'iris' | 'multiple' | 'none'
  }> {
    if (!isNative) {
      return { available: false, biometryType: 'none' }
    }

    try {
      const { nativeBiometric } = await import('./biometric')
      return nativeBiometric.isAvailable()
    } catch {
      return { available: false, biometryType: 'none' }
    }
  },

  // ==================== HELPERS ====================

  /**
   * Check if a specific permission is granted
   */
  isGranted(permission: keyof PermissionState): boolean {
    return _permissionState[permission] === 'granted'
  },

  /**
   * Check if a specific permission was denied permanently
   */
  isPermanentlyDenied(permission: keyof PermissionState): boolean {
    return _permissionState[permission] === 'denied'
  },

  /**
   * Open app settings (for when permission is permanently denied)
   */
  async openSettings(): Promise<void> {
    if (!isNative) {
      // Show instructions for web
      alert('Please enable permissions in your browser settings.')
      return
    }

    // On Android, we need to use the App plugin to open settings
    // Note: This requires the @capacitor/app plugin
    if (Capacitor.isPluginAvailable('App')) {
      // Try to use native settings opener
      try {
        const { App } = await import('@capacitor/app')
        // Unfortunately, Capacitor doesn't have a direct "openSettings" method
        // We'd need a custom plugin or use a community plugin
        console.log('[Permissions] Opening app settings...')

        // Show dialog explaining how to enable permissions
        const { Dialog } = await import('@capacitor/dialog')
        await Dialog.alert({
          title: 'Permission Required',
          message: 'Please open Settings > Apps > Chameleon AI and enable the required permissions.',
        })
      } catch (error) {
        console.error('[Permissions] Failed to open settings:', error)
      }
    }
  },

  /**
   * Request all essential permissions at once (for onboarding)
   */
  async requestEssentialPermissions(): Promise<{
    camera: PermissionStatus
    microphone: PermissionStatus
    notifications: PermissionStatus
  }> {
    // Request in sequence to avoid overwhelming the user
    const notifications = await this.requestNotifications()

    // Small delay between permission requests
    await new Promise(resolve => setTimeout(resolve, 300))

    const microphone = await this.requestMicrophone()

    await new Promise(resolve => setTimeout(resolve, 300))

    const camera = await this.requestCamera()

    return { camera, microphone, notifications }
  },

  /**
   * Check if permission is needed before performing an action
   * Returns true if permission should be requested
   */
  async ensurePermission(permission: 'camera' | 'microphone' | 'notifications' | 'photos'): Promise<boolean> {
    let status: PermissionStatus

    switch (permission) {
      case 'camera':
        status = await this.checkCamera()
        if (status === 'prompt') {
          status = await this.requestCamera()
        }
        break
      case 'microphone':
        status = await this.checkMicrophone()
        if (status === 'prompt') {
          status = await this.requestMicrophone()
        }
        break
      case 'notifications':
        status = await this.checkNotifications()
        if (status === 'prompt') {
          status = await this.requestNotifications()
        }
        break
      case 'photos':
        status = await this.checkPhotos()
        if (status === 'prompt') {
          status = await this.requestPhotos()
        }
        break
    }

    if (status === 'denied') {
      // Show dialog to guide user to settings
      if (isNative) {
        const { Dialog } = await import('@capacitor/dialog')
        const { value } = await Dialog.confirm({
          title: 'Permission Required',
          message: `This feature requires ${permission} access. Would you like to open settings?`,
          okButtonTitle: 'Open Settings',
          cancelButtonTitle: 'Cancel',
        })

        if (value) {
          await this.openSettings()
        }
      }
      return false
    }

    return status === 'granted'
  },

  /**
   * Get a user-friendly description for a permission
   */
  getPermissionDescription(permission: keyof PermissionState): string {
    const descriptions: Record<keyof PermissionState, string> = {
      camera: 'Take photos and scan documents',
      microphone: 'Use voice input for messages',
      notifications: 'Receive AI response notifications',
      photos: 'Select images from your gallery',
      location: 'Get location-based assistance',
    }
    return descriptions[permission]
  },

  /**
   * Get icon name for a permission
   */
  getPermissionIcon(permission: keyof PermissionState): string {
    const icons: Record<keyof PermissionState, string> = {
      camera: 'camera',
      microphone: 'mic',
      notifications: 'bell',
      photos: 'image',
      location: 'map-pin',
    }
    return icons[permission]
  },
}

export default nativePermissions
