'use client'

import { useCallback, useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'

/**
 * Hook for accessing native platform capabilities
 * Provides a unified interface for Capacitor features with web fallbacks
 */
export function useNative() {
  const [isNative, setIsNative] = useState(false)
  const [platform, setPlatform] = useState<'web' | 'android' | 'ios'>('web')
  const [isOnline, setIsOnline] = useState(true)
  const [keyboardHeight, setKeyboardHeight] = useState(0)

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform())
    setPlatform(Capacitor.getPlatform() as 'web' | 'android' | 'ios')

    // Listen for network status changes
    const handleNetwork = (e: CustomEvent) => {
      setIsOnline(e.detail?.connected ?? true)
    }
    document.addEventListener('capacitor:network', handleNetwork as EventListener)

    // Listen for keyboard changes
    const handleKeyboardShow = () => {
      const height = parseInt(
        document.body.style.getPropertyValue('--keyboard-height') || '0'
      )
      setKeyboardHeight(height)
    }

    document.body.addEventListener('keyboardWillShow', handleKeyboardShow)
    document.body.addEventListener('keyboardWillHide', () => setKeyboardHeight(0))

    return () => {
      document.removeEventListener('capacitor:network', handleNetwork as EventListener)
      document.body.removeEventListener('keyboardWillShow', handleKeyboardShow)
    }
  }, [])

  return {
    isNative,
    platform,
    isAndroid: platform === 'android',
    isIOS: platform === 'ios',
    isWeb: platform === 'web',
    isOnline,
    keyboardHeight,
    keyboardVisible: keyboardHeight > 0,
  }
}

/**
 * Hook for native haptic feedback
 */
export function useNativeHaptics() {
  const [haptics, setHaptics] = useState<typeof import('@/lib/capacitor/haptics').nativeHaptics | null>(null)

  useEffect(() => {
    import('@/lib/capacitor/haptics').then(({ nativeHaptics }) => {
      setHaptics(nativeHaptics)
    })
  }, [])

  const trigger = useCallback(
    async (pattern: import('@/lib/capacitor/haptics').HapticPattern = 'light') => {
      await haptics?.trigger(pattern)
    },
    [haptics]
  )

  return {
    trigger,
    onTap: useCallback(() => haptics?.onTap(), [haptics]),
    onSuccess: useCallback(() => haptics?.onSuccess(), [haptics]),
    onError: useCallback(() => haptics?.onError(), [haptics]),
    onToggle: useCallback(() => haptics?.onToggle(), [haptics]),
    onSwipe: useCallback(() => haptics?.onSwipe(), [haptics]),
    onDelete: useCallback(() => haptics?.onDelete(), [haptics]),
    onSendMessage: useCallback(() => haptics?.onSendMessage(), [haptics]),
    onReceiveMessage: useCallback(() => haptics?.onReceiveMessage(), [haptics]),
    onNotification: useCallback(() => haptics?.onNotification(), [haptics]),
    selectionChanged: useCallback(() => haptics?.selectionChanged(), [haptics]),
    supported: haptics?.supported() ?? false,
    enabled: haptics?.enabled() ?? false,
  }
}

/**
 * Hook for native share functionality
 */
export function useNativeShare() {
  const share = useCallback(
    async (options: {
      title?: string
      text?: string
      url?: string
      files?: File[]
    }) => {
      const { nativeShare } = await import('@/lib/capacitor/share')
      return nativeShare.share(options)
    },
    []
  )

  const shareChat = useCallback(
    async (title: string, content: string, url?: string) => {
      const { nativeShare } = await import('@/lib/capacitor/share')
      return nativeShare.shareChat(title, content, url)
    },
    []
  )

  const shareResponse = useCallback(async (response: string) => {
    const { nativeShare } = await import('@/lib/capacitor/share')
    return nativeShare.shareResponse(response)
  }, [])

  const copyToClipboard = useCallback(async (text: string) => {
    const { nativeShare } = await import('@/lib/capacitor/share')
    return nativeShare.copyToClipboard(text)
  }, [])

  return {
    share,
    shareChat,
    shareResponse,
    copyToClipboard,
  }
}

/**
 * Hook for native camera functionality
 */
export function useNativeCamera() {
  const getPhoto = useCallback(
    async (source: 'camera' | 'gallery' | 'prompt' = 'prompt') => {
      const { nativeCamera } = await import('@/lib/capacitor/camera')
      return nativeCamera.getPhoto(source)
    },
    []
  )

  const pickImages = useCallback(async (limit: number = 5) => {
    const { nativeCamera } = await import('@/lib/capacitor/camera')
    return nativeCamera.pickImages(limit)
  }, [])

  return {
    getPhoto,
    pickImages,
  }
}

/**
 * Hook for native notifications
 */
export function useNativeNotifications() {
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')

  useEffect(() => {
    import('@/lib/capacitor/notifications').then(async ({ nativeNotifications }) => {
      const status = await nativeNotifications.checkPermissions()
      setPermission(status)
    })
  }, [])

  const requestPermission = useCallback(async () => {
    const { nativeNotifications } = await import('@/lib/capacitor/notifications')
    const status = await nativeNotifications.requestPermissions()
    setPermission(status)
    return status
  }, [])

  const notify = useCallback(
    async (options: { title: string; body: string; channelId?: string }) => {
      const { nativeNotifications } = await import('@/lib/capacitor/notifications')
      return nativeNotifications.show(options)
    },
    []
  )

  const notifyAIResponse = useCallback(
    async (personaName: string, preview: string) => {
      const { nativeNotifications } = await import('@/lib/capacitor/notifications')
      return nativeNotifications.notifyAIResponse(personaName, preview)
    },
    []
  )

  return {
    permission,
    requestPermission,
    notify,
    notifyAIResponse,
  }
}

/**
 * Hook for native biometric authentication
 */
export function useNativeBiometric() {
  const [available, setAvailable] = useState(false)
  const [biometryType, setBiometryType] = useState<
    'fingerprint' | 'face' | 'iris' | 'multiple' | 'none'
  >('none')

  useEffect(() => {
    import('@/lib/capacitor/biometric').then(async ({ nativeBiometric }) => {
      const result = await nativeBiometric.isAvailable()
      setAvailable(result.available)
      setBiometryType(result.biometryType)
    })
  }, [])

  const verify = useCallback(
    async (options?: { reason?: string; title?: string }) => {
      const { nativeBiometric } = await import('@/lib/capacitor/biometric')
      return nativeBiometric.verify(options)
    },
    []
  )

  return {
    available,
    biometryType,
    verify,
  }
}

/**
 * Hook for native storage
 */
export function useNativeStorage() {
  const get = useCallback(async <T = string>(key: string): Promise<T | null> => {
    const { nativeStorage } = await import('@/lib/capacitor/storage')
    return nativeStorage.get<T>(key)
  }, [])

  const set = useCallback(async (key: string, value: unknown): Promise<void> => {
    const { nativeStorage } = await import('@/lib/capacitor/storage')
    return nativeStorage.set(key, value)
  }, [])

  const remove = useCallback(async (key: string): Promise<void> => {
    const { nativeStorage } = await import('@/lib/capacitor/storage')
    return nativeStorage.remove(key)
  }, [])

  return { get, set, remove }
}

/**
 * Hook for device information
 */
export function useDeviceInfo() {
  const [info, setInfo] = useState<{
    model: string
    platform: string
    operatingSystem: string
    osVersion: string
    manufacturer: string
    isVirtual: boolean
    webViewVersion?: string
  } | null>(null)

  useEffect(() => {
    const getInfo = async () => {
      if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Device')) {
        const { Device } = await import('@capacitor/device')
        const deviceInfo = await Device.getInfo()
        setInfo({
          model: deviceInfo.model,
          platform: deviceInfo.platform,
          operatingSystem: deviceInfo.operatingSystem,
          osVersion: deviceInfo.osVersion,
          manufacturer: deviceInfo.manufacturer,
          isVirtual: deviceInfo.isVirtual,
          webViewVersion: deviceInfo.webViewVersion,
        })
      } else {
        // Web fallback
        setInfo({
          model: 'Browser',
          platform: 'web',
          operatingSystem: navigator.platform,
          osVersion: '',
          manufacturer: '',
          isVirtual: false,
        })
      }
    }
    getInfo()
  }, [])

  return info
}

/**
 * Hook for app lifecycle events
 */
export function useAppLifecycle(callbacks: {
  onResume?: () => void
  onPause?: () => void
  onDeepLink?: (url: string) => void
}) {
  useEffect(() => {
    const handleResume = () => callbacks.onResume?.()
    const handlePause = () => callbacks.onPause?.()
    const handleDeepLink = (e: CustomEvent) => {
      callbacks.onDeepLink?.(e.detail?.url)
    }

    document.addEventListener('capacitor:resume', handleResume)
    document.addEventListener('capacitor:pause', handlePause)
    document.addEventListener('capacitor:deeplink', handleDeepLink as EventListener)

    return () => {
      document.removeEventListener('capacitor:resume', handleResume)
      document.removeEventListener('capacitor:pause', handlePause)
      document.removeEventListener('capacitor:deeplink', handleDeepLink as EventListener)
    }
  }, [callbacks])
}

/**
 * Hook for opening external URLs/apps
 */
export function useExternalLinks() {
  const openUrl = useCallback(async (url: string) => {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Browser')) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({ url })
    } else {
      window.open(url, '_blank')
    }
  }, [])

  const openInApp = useCallback(async (url: string) => {
    if (Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('Browser')) {
      const { Browser } = await import('@capacitor/browser')
      await Browser.open({
        url,
        presentationStyle: 'fullscreen',
        toolbarColor: '#0a0a0a',
      })
    } else {
      window.open(url, '_blank')
    }
  }, [])

  return { openUrl, openInApp }
}

/**
 * Combined hook for most common native features
 */
export function useNativeFeatures() {
  const native = useNative()
  const haptics = useNativeHaptics()
  const share = useNativeShare()

  return {
    ...native,
    haptics,
    share,
  }
}
