/**
 * Native Camera Module
 * Uses Capacitor Camera for photo capture and gallery access
 * Falls back to file input on web
 */

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

export interface PhotoResult {
  dataUrl: string
  format: string
  width?: number
  height?: number
}

export type CameraSource = 'camera' | 'gallery' | 'prompt'

/**
 * Native Camera Service
 */
export const nativeCamera = {
  /**
   * Check if camera is available
   */
  isAvailable(): boolean {
    return isNative || (typeof navigator !== 'undefined' && 'mediaDevices' in navigator)
  },

  /**
   * Take a photo or select from gallery
   */
  async getPhoto(source: CameraSource = 'prompt'): Promise<PhotoResult | null> {
    try {
      if (isNative && Capacitor.isPluginAvailable('Camera')) {
        return await this.getNativePhoto(source)
      } else {
        return await this.getWebPhoto(source)
      }
    } catch (error: any) {
      // User cancelled
      if (error.message?.includes('cancelled') || error.message?.includes('denied')) {
        return null
      }
      throw error
    }
  },

  /**
   * Native camera implementation
   */
  async getNativePhoto(source: CameraSource): Promise<PhotoResult | null> {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')

    const sourceMap = {
      camera: CameraSource.Camera,
      gallery: CameraSource.Photos,
      prompt: CameraSource.Prompt,
    }

    const photo = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.DataUrl,
      source: sourceMap[source],
      correctOrientation: true,
      width: 1920,
      height: 1920,
      presentationStyle: 'fullScreen',
    })

    if (!photo.dataUrl) return null

    return {
      dataUrl: photo.dataUrl,
      format: photo.format,
    }
  },

  /**
   * Web camera/gallery implementation
   */
  async getWebPhoto(source: CameraSource): Promise<PhotoResult | null> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'

      if (source === 'camera') {
        input.capture = 'environment'
      }

      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) {
          resolve(null)
          return
        }

        try {
          const dataUrl = await this.fileToDataUrl(file)
          resolve({
            dataUrl,
            format: file.type.split('/')[1] || 'jpeg',
          })
        } catch (error) {
          reject(error)
        }
      }

      input.oncancel = () => resolve(null)
      input.click()
    })
  },

  /**
   * Convert File to data URL
   */
  async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },

  /**
   * Check camera permissions
   */
  async checkPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
    if (isNative && Capacitor.isPluginAvailable('Camera')) {
      const { Camera } = await import('@capacitor/camera')
      const { camera } = await Camera.checkPermissions()
      return camera
    }

    // Web permission check
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName })
      return result.state as 'granted' | 'denied' | 'prompt'
    } catch {
      return 'prompt'
    }
  },

  /**
   * Request camera permissions
   */
  async requestPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
    if (isNative && Capacitor.isPluginAvailable('Camera')) {
      const { Camera } = await import('@capacitor/camera')
      const { camera } = await Camera.requestPermissions({ permissions: ['camera'] })
      return camera
    }

    // Web - permissions are requested when accessing the camera
    return 'prompt'
  },

  /**
   * Pick multiple images
   */
  async pickImages(limit: number = 5): Promise<PhotoResult[]> {
    if (isNative && Capacitor.isPluginAvailable('Camera')) {
      const { Camera, CameraResultType } = await import('@capacitor/camera')

      const { photos } = await Camera.pickImages({
        quality: 90,
        limit,
      })

      const results: PhotoResult[] = []
      for (const photo of photos) {
        if (photo.webPath) {
          // Convert webPath to dataUrl
          const response = await fetch(photo.webPath)
          const blob = await response.blob()
          const dataUrl = await this.fileToDataUrl(new File([blob], 'image.jpg'))
          results.push({
            dataUrl,
            format: photo.format,
          })
        }
      }

      return results
    }

    // Web fallback - multiple file input
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = true

      input.onchange = async (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []).slice(0, limit)
        const results: PhotoResult[] = []

        for (const file of files) {
          const dataUrl = await this.fileToDataUrl(file)
          results.push({
            dataUrl,
            format: file.type.split('/')[1] || 'jpeg',
          })
        }

        resolve(results)
      }

      input.oncancel = () => resolve([])
      input.click()
    })
  },
}
