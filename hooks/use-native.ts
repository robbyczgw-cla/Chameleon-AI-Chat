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

/**
 * Hook for native voice recording
 */
export function useNativeVoice() {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [amplitude, setAmplitude] = useState(0)

  const startRecording = useCallback(async () => {
    const { nativeVoice } = await import('@/lib/capacitor/voice')
    const success = await nativeVoice.startRecording((state) => {
      setIsRecording(state.isRecording)
      setDuration(state.duration)
      setAmplitude(state.amplitude)
    })
    return success
  }, [])

  const stopRecording = useCallback(async () => {
    const { nativeVoice } = await import('@/lib/capacitor/voice')
    const result = await nativeVoice.stopRecording()
    setIsRecording(false)
    setDuration(0)
    setAmplitude(0)
    return result
  }, [])

  const cancelRecording = useCallback(async () => {
    const { nativeVoice } = await import('@/lib/capacitor/voice')
    await nativeVoice.cancelRecording()
    setIsRecording(false)
    setDuration(0)
    setAmplitude(0)
  }, [])

  return {
    isRecording,
    duration,
    amplitude,
    startRecording,
    stopRecording,
    cancelRecording,
  }
}

/**
 * Hook for native text-to-speech
 */
export function useNativeTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isPaused, setIsPaused] = useState(false)

  const speak = useCallback(async (text: string, options?: { lang?: string; rate?: number }) => {
    const { nativeTTS } = await import('@/lib/capacitor/tts')
    setIsSpeaking(true)
    try {
      await nativeTTS.speak({ text, ...options })
    } finally {
      setIsSpeaking(false)
    }
  }, [])

  const stop = useCallback(async () => {
    const { nativeTTS } = await import('@/lib/capacitor/tts')
    nativeTTS.stop()
    setIsSpeaking(false)
    setIsPaused(false)
  }, [])

  const pause = useCallback(async () => {
    const { nativeTTS } = await import('@/lib/capacitor/tts')
    nativeTTS.pause()
    setIsPaused(true)
  }, [])

  const resume = useCallback(async () => {
    const { nativeTTS } = await import('@/lib/capacitor/tts')
    nativeTTS.resume()
    setIsPaused(false)
  }, [])

  return {
    isSpeaking,
    isPaused,
    speak,
    stop,
    pause,
    resume,
  }
}

/**
 * Hook for native clipboard
 */
export function useNativeClipboard() {
  const copyText = useCallback(async (text: string) => {
    const { nativeClipboard } = await import('@/lib/capacitor/clipboard')
    return nativeClipboard.writeText(text)
  }, [])

  const copyCode = useCallback(async (code: string, language?: string) => {
    const { nativeClipboard } = await import('@/lib/capacitor/clipboard')
    return nativeClipboard.copyCodeBlock(code, language)
  }, [])

  const copyMessage = useCallback(async (content: string) => {
    const { nativeClipboard } = await import('@/lib/capacitor/clipboard')
    return nativeClipboard.copyMessage(content)
  }, [])

  const copyShareLink = useCallback(async (url: string) => {
    const { nativeClipboard } = await import('@/lib/capacitor/clipboard')
    return nativeClipboard.copyShareLink(url)
  }, [])

  const readText = useCallback(async () => {
    const { nativeClipboard } = await import('@/lib/capacitor/clipboard')
    return nativeClipboard.readText()
  }, [])

  return {
    copyText,
    copyCode,
    copyMessage,
    copyShareLink,
    readText,
  }
}

/**
 * Hook for native network status
 */
export function useNativeNetwork() {
  const [connected, setConnected] = useState(true)
  const [connectionType, setConnectionType] = useState<string>('unknown')
  const [isWifi, setIsWifi] = useState(false)

  useEffect(() => {
    import('@/lib/capacitor/network').then(async ({ nativeNetwork }) => {
      await nativeNetwork.initialize()
      const status = await nativeNetwork.getStatus()
      setConnected(status.connected)
      setConnectionType(status.connectionType)
      setIsWifi(status.isWifi)

      nativeNetwork.onStatusChange((state) => {
        setConnected(state.connected)
        setConnectionType(state.connectionType)
        setIsWifi(state.isWifi)
      })
    })
  }, [])

  const checkConnectivity = useCallback(async () => {
    const { nativeNetwork } = await import('@/lib/capacitor/network')
    return nativeNetwork.checkConnectivity()
  }, [])

  return {
    connected,
    connectionType,
    isWifi,
    isOffline: !connected,
    checkConnectivity,
  }
}

/**
 * Hook for native file operations
 */
export function useNativeFiles() {
  const saveTextFile = useCallback(async (filename: string, content: string) => {
    const { nativeFiles } = await import('@/lib/capacitor/files')
    return nativeFiles.saveTextFile(filename, content)
  }, [])

  const saveTrainingData = useCallback(
    async (conversations: Array<{ messages: Array<{ role: string; content: string }> }>, filename?: string) => {
      const { nativeFiles } = await import('@/lib/capacitor/files')
      return nativeFiles.saveTrainingData(conversations, filename)
    },
    []
  )

  const saveImage = useCallback(async (base64Data: string, filename: string) => {
    const { nativeFiles } = await import('@/lib/capacitor/files')
    return nativeFiles.saveImage(base64Data, filename)
  }, [])

  const pickFile = useCallback(async (accept?: string) => {
    const { nativeFiles } = await import('@/lib/capacitor/files')
    return nativeFiles.pickFile(accept)
  }, [])

  return {
    saveTextFile,
    saveTrainingData,
    saveImage,
    pickFile,
  }
}

/**
 * Hook for native keyboard
 */
export function useNativeKeyboard() {
  const [isOpen, setIsOpen] = useState(false)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    import('@/lib/capacitor/keyboard').then(async ({ nativeKeyboard }) => {
      await nativeKeyboard.initialize()

      nativeKeyboard.onStateChange((state) => {
        setIsOpen(state.isOpen)
        setHeight(state.height)
      })
    })
  }, [])

  const hide = useCallback(async () => {
    const { nativeKeyboard } = await import('@/lib/capacitor/keyboard')
    await nativeKeyboard.hide()
  }, [])

  const show = useCallback(async () => {
    const { nativeKeyboard } = await import('@/lib/capacitor/keyboard')
    await nativeKeyboard.show()
  }, [])

  return {
    isOpen,
    height,
    hide,
    show,
  }
}

/**
 * Hook for native theme
 */
export function useNativeTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    import('@/lib/capacitor/theme').then(({ nativeTheme }) => {
      nativeTheme.initialize()
      setTheme(nativeTheme.getTheme())
      setResolvedTheme(nativeTheme.getResolvedTheme())

      nativeTheme.onThemeChange((newTheme) => {
        setResolvedTheme(newTheme)
      })
    })
  }, [])

  const setThemePreference = useCallback(async (newTheme: 'light' | 'dark' | 'system') => {
    const { nativeTheme } = await import('@/lib/capacitor/theme')
    await nativeTheme.setTheme(newTheme)
    setTheme(newTheme)
  }, [])

  const toggle = useCallback(async () => {
    const { nativeTheme } = await import('@/lib/capacitor/theme')
    await nativeTheme.toggle()
  }, [])

  return {
    theme,
    resolvedTheme,
    isDark: resolvedTheme === 'dark',
    setTheme: setThemePreference,
    toggle,
  }
}

/**
 * Hook for native authentication
 */
export function useNativeAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    import('@/lib/capacitor/auth').then(({ nativeAuth }) => {
      setIsAuthenticated(nativeAuth.isAuthenticated())

      nativeAuth.onAuthStateChange((tokens) => {
        setIsAuthenticated(!!tokens)
      })
    })
  }, [])

  const openOAuthLogin = useCallback(async (provider: 'google' | 'github' | 'apple') => {
    const { nativeAuth } = await import('@/lib/capacitor/auth')
    return nativeAuth.openOAuthLogin(provider)
  }, [])

  const verifyWithBiometric = useCallback(async (reason?: string) => {
    const { nativeAuth } = await import('@/lib/capacitor/auth')
    return nativeAuth.verifyWithBiometric(reason)
  }, [])

  const logout = useCallback(async () => {
    const { nativeAuth } = await import('@/lib/capacitor/auth')
    await nativeAuth.clearTokens()
    setIsAuthenticated(false)
  }, [])

  return {
    isAuthenticated,
    openOAuthLogin,
    verifyWithBiometric,
    logout,
  }
}
