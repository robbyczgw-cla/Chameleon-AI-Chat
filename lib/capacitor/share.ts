/**
 * Native Share Module
 * Uses Capacitor Share for native share sheet
 * Falls back to Web Share API or clipboard
 */

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

interface ShareOptions {
  title?: string
  text?: string
  url?: string
  dialogTitle?: string
  files?: File[]
}

interface ShareResult {
  shared: boolean
  platform?: string
}

/**
 * Native Share Service
 */
export const nativeShare = {
  /**
   * Check if sharing is supported
   */
  isSupported(): boolean {
    return isNative || (typeof navigator !== 'undefined' && 'share' in navigator)
  },

  /**
   * Check if file sharing is supported
   */
  canShareFiles(): boolean {
    return (
      isNative ||
      (typeof navigator !== 'undefined' &&
        'canShare' in navigator &&
        navigator.canShare({ files: [new File([], 'test.txt')] }))
    )
  },

  /**
   * Share content using native share sheet
   */
  async share(options: ShareOptions): Promise<ShareResult> {
    try {
      if (isNative && Capacitor.isPluginAvailable('Share')) {
        const { Share } = await import('@capacitor/share')

        // Convert Files to file URIs for native
        let files: string[] | undefined
        if (options.files && options.files.length > 0) {
          // For native, we need file paths - this requires Filesystem plugin
          // For now, skip file sharing on native
          console.warn('[Share] File sharing not yet implemented for native')
        }

        await Share.share({
          title: options.title,
          text: options.text,
          url: options.url,
          dialogTitle: options.dialogTitle,
          files,
        })

        return { shared: true, platform: 'native' }
      } else if ('share' in navigator) {
        // Web Share API
        await navigator.share({
          title: options.title,
          text: options.text,
          url: options.url,
          files: options.files,
        })

        return { shared: true, platform: 'web' }
      } else {
        // Fallback to clipboard
        const content = [options.title, options.text, options.url]
          .filter(Boolean)
          .join('\n')
        await navigator.clipboard.writeText(content)

        return { shared: true, platform: 'clipboard' }
      }
    } catch (error: any) {
      // User cancelled share
      if (error.name === 'AbortError') {
        return { shared: false }
      }
      throw error
    }
  },

  /**
   * Share a chat conversation
   */
  async shareChat(title: string, content: string, url?: string): Promise<ShareResult> {
    return this.share({
      title: `Chat: ${title}`,
      text: content,
      url,
      dialogTitle: 'Share Conversation',
    })
  },

  /**
   * Share an AI response
   */
  async shareResponse(response: string): Promise<ShareResult> {
    return this.share({
      title: 'AI Response from Chameleon AI',
      text: response,
      dialogTitle: 'Share Response',
    })
  },

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<void> {
    if (isNative && Capacitor.isPluginAvailable('Clipboard')) {
      const { Clipboard } = await import('@capacitor/clipboard')
      await Clipboard.write({ string: text })
    } else {
      await navigator.clipboard.writeText(text)
    }
  },

  /**
   * Read from clipboard
   */
  async readFromClipboard(): Promise<string> {
    if (isNative && Capacitor.isPluginAvailable('Clipboard')) {
      const { Clipboard } = await import('@capacitor/clipboard')
      const { value } = await Clipboard.read()
      return value || ''
    } else {
      return await navigator.clipboard.readText()
    }
  },
}
