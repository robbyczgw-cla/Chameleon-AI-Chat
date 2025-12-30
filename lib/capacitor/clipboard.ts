/**
 * Native Clipboard Module
 * Handles clipboard operations with native capabilities
 */

import { Capacitor } from '@capacitor/core'
import { Clipboard } from '@capacitor/clipboard'

const isNative = Capacitor.isNativePlatform()

export interface ClipboardResult {
  value: string
  type: 'text/plain' | 'text/html' | 'image/png'
}

/**
 * Native Clipboard Service
 */
export const nativeClipboard = {
  /**
   * Write text to clipboard
   */
  async writeText(text: string): Promise<boolean> {
    try {
      if (isNative) {
        await Clipboard.write({ string: text })
      } else {
        await navigator.clipboard.writeText(text)
      }

      // Haptic feedback on success
      if (isNative) {
        const { nativeHaptics } = await import('./haptics')
        await nativeHaptics.notification('success')
      }

      console.log('[NativeClipboard] Text copied')
      return true
    } catch (error) {
      console.error('[NativeClipboard] Failed to write text:', error)
      return false
    }
  },

  /**
   * Write URL to clipboard
   */
  async writeUrl(url: string): Promise<boolean> {
    try {
      if (isNative) {
        await Clipboard.write({ url })
      } else {
        await navigator.clipboard.writeText(url)
      }

      if (isNative) {
        const { nativeHaptics } = await import('./haptics')
        await nativeHaptics.notification('success')
      }

      console.log('[NativeClipboard] URL copied')
      return true
    } catch (error) {
      console.error('[NativeClipboard] Failed to write URL:', error)
      return false
    }
  },

  /**
   * Write image to clipboard (base64)
   */
  async writeImage(base64Image: string): Promise<boolean> {
    try {
      if (isNative) {
        await Clipboard.write({ image: base64Image })
      } else {
        // Web clipboard image write is more complex
        const blob = await fetch(`data:image/png;base64,${base64Image}`).then(r => r.blob())
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ])
      }

      if (isNative) {
        const { nativeHaptics } = await import('./haptics')
        await nativeHaptics.notification('success')
      }

      console.log('[NativeClipboard] Image copied')
      return true
    } catch (error) {
      console.error('[NativeClipboard] Failed to write image:', error)
      return false
    }
  },

  /**
   * Read text from clipboard
   */
  async readText(): Promise<string | null> {
    try {
      if (isNative) {
        const result = await Clipboard.read()
        return result.value || null
      } else {
        return await navigator.clipboard.readText()
      }
    } catch (error) {
      console.error('[NativeClipboard] Failed to read text:', error)
      return null
    }
  },

  /**
   * Check if clipboard has text
   */
  async hasText(): Promise<boolean> {
    try {
      const text = await this.readText()
      return !!text
    } catch {
      return false
    }
  },

  /**
   * Copy code block with formatting
   */
  async copyCodeBlock(code: string, language?: string): Promise<boolean> {
    // For code blocks, we just copy the raw code
    const success = await this.writeText(code)

    if (success && isNative) {
      // Show toast notification
      const { Toast } = await import('@capacitor/toast')
      await Toast.show({
        text: language ? `${language} code copied` : 'Code copied',
        duration: 'short',
        position: 'bottom',
      })
    }

    return success
  },

  /**
   * Copy chat message
   */
  async copyMessage(content: string): Promise<boolean> {
    const success = await this.writeText(content)

    if (success && isNative) {
      const { Toast } = await import('@capacitor/toast')
      await Toast.show({
        text: 'Message copied',
        duration: 'short',
        position: 'bottom',
      })
    }

    return success
  },

  /**
   * Copy share link
   */
  async copyShareLink(url: string): Promise<boolean> {
    const success = await this.writeUrl(url)

    if (success && isNative) {
      const { Toast } = await import('@capacitor/toast')
      await Toast.show({
        text: 'Link copied to clipboard',
        duration: 'short',
        position: 'bottom',
      })
    }

    return success
  },
}
