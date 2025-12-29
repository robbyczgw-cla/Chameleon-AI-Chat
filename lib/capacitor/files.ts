/**
 * Native File Operations Module
 * Handles file downloads, exports, and document handling
 */

import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'

const isNative = Capacitor.isNativePlatform()

export interface SaveFileOptions {
  filename: string
  data: string | Blob
  mimeType: string
  directory?: Directory
}

export interface SaveResult {
  success: boolean
  uri?: string
  error?: string
}

/**
 * Native File Service
 */
export const nativeFiles = {
  /**
   * Save text file (e.g., JSONL export)
   */
  async saveTextFile(
    filename: string,
    content: string,
    mimeType: string = 'text/plain'
  ): Promise<SaveResult> {
    try {
      if (isNative) {
        // Save to Downloads directory on Android
        const result = await Filesystem.writeFile({
          path: filename,
          data: content,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
        })

        // Show toast
        const { Toast } = await import('@capacitor/toast')
        await Toast.show({
          text: `Saved to Documents/${filename}`,
          duration: 'long',
          position: 'bottom',
        })

        // Haptic feedback
        const { nativeHaptics } = await import('./haptics')
        await nativeHaptics.notification('success')

        console.log('[NativeFiles] File saved:', result.uri)
        return { success: true, uri: result.uri }
      } else {
        // Web fallback: trigger download
        const blob = new Blob([content], { type: mimeType })
        this.downloadBlob(blob, filename)
        return { success: true }
      }
    } catch (error) {
      console.error('[NativeFiles] Failed to save file:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * Save JSONL training data export
   */
  async saveTrainingData(
    conversations: Array<{ messages: Array<{ role: string; content: string }> }>,
    filename?: string
  ): Promise<SaveResult> {
    const lines = conversations.map(conv => JSON.stringify(conv))
    const content = lines.join('\n')
    const name = filename || `chameleon-training-${Date.now()}.jsonl`
    return this.saveTextFile(name, content, 'application/jsonl')
  },

  /**
   * Save JSON file
   */
  async saveJSON(
    data: object,
    filename: string
  ): Promise<SaveResult> {
    const content = JSON.stringify(data, null, 2)
    return this.saveTextFile(filename, content, 'application/json')
  },

  /**
   * Save image from base64
   */
  async saveImage(
    base64Data: string,
    filename: string
  ): Promise<SaveResult> {
    try {
      if (isNative) {
        // Remove data URL prefix if present
        const base64 = base64Data.includes(',')
          ? base64Data.split(',')[1]
          : base64Data

        const result = await Filesystem.writeFile({
          path: filename,
          data: base64,
          directory: Directory.Documents,
        })

        const { Toast } = await import('@capacitor/toast')
        await Toast.show({
          text: `Image saved to Documents/${filename}`,
          duration: 'long',
          position: 'bottom',
        })

        const { nativeHaptics } = await import('./haptics')
        await nativeHaptics.notification('success')

        return { success: true, uri: result.uri }
      } else {
        // Web fallback
        const blob = await fetch(base64Data).then(r => r.blob())
        this.downloadBlob(blob, filename)
        return { success: true }
      }
    } catch (error) {
      console.error('[NativeFiles] Failed to save image:', error)
      return { success: false, error: String(error) }
    }
  },

  /**
   * Save blob as file (web fallback)
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },

  /**
   * Read file from device
   */
  async readTextFile(
    path: string,
    directory: Directory = Directory.Documents
  ): Promise<string | null> {
    try {
      if (isNative) {
        const result = await Filesystem.readFile({
          path,
          directory,
          encoding: Encoding.UTF8,
        })
        return result.data as string
      } else {
        // Web: use file input
        return null
      }
    } catch (error) {
      console.error('[NativeFiles] Failed to read file:', error)
      return null
    }
  },

  /**
   * Check if file exists
   */
  async exists(
    path: string,
    directory: Directory = Directory.Documents
  ): Promise<boolean> {
    try {
      if (isNative) {
        await Filesystem.stat({ path, directory })
        return true
      }
      return false
    } catch {
      return false
    }
  },

  /**
   * Delete file
   */
  async delete(
    path: string,
    directory: Directory = Directory.Documents
  ): Promise<boolean> {
    try {
      if (isNative) {
        await Filesystem.deleteFile({ path, directory })
        return true
      }
      return false
    } catch {
      return false
    }
  },

  /**
   * Get file info
   */
  async getInfo(
    path: string,
    directory: Directory = Directory.Documents
  ): Promise<{ size: number; mtime: number } | null> {
    try {
      if (isNative) {
        const stat = await Filesystem.stat({ path, directory })
        return {
          size: stat.size,
          mtime: stat.mtime,
        }
      }
      return null
    } catch {
      return null
    }
  },

  /**
   * Share file using native share sheet
   */
  async shareFile(
    path: string,
    directory: Directory = Directory.Documents
  ): Promise<boolean> {
    try {
      if (isNative) {
        const { Share } = await import('@capacitor/share')

        // Get file URI
        const result = await Filesystem.getUri({
          path,
          directory,
        })

        await Share.share({
          url: result.uri,
        })

        return true
      }
      return false
    } catch (error) {
      console.error('[NativeFiles] Failed to share file:', error)
      return false
    }
  },

  /**
   * Open file picker for importing
   */
  async pickFile(accept: string = '*/*'): Promise<File | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = accept
      input.onchange = () => {
        const file = input.files?.[0] || null
        resolve(file)
      }
      input.click()
    })
  },

  /**
   * Pick and read JSON file
   */
  async pickAndReadJSON<T = object>(): Promise<T | null> {
    const file = await this.pickFile('.json,application/json')
    if (!file) return null

    try {
      const text = await file.text()
      return JSON.parse(text) as T
    } catch (error) {
      console.error('[NativeFiles] Failed to parse JSON:', error)
      return null
    }
  },
}
