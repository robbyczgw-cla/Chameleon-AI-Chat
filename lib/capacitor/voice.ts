/**
 * Native Voice Recording Module
 * Handles audio recording for Whisper voice input
 * Uses Web Audio API with native permissions
 */

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

export interface VoiceRecordingResult {
  blob: Blob
  duration: number
  format: string
}

export interface VoiceRecordingState {
  isRecording: boolean
  duration: number
  amplitude: number
}

// Module state
let _mediaRecorder: MediaRecorder | null = null
let _audioChunks: Blob[] = []
let _startTime: number = 0
let _analyser: AnalyserNode | null = null
let _animationFrame: number | null = null
let _stateCallback: ((state: VoiceRecordingState) => void) | null = null

/**
 * Native Voice Recording Service
 */
export const nativeVoice = {
  /**
   * Check if voice recording is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    } catch {
      return false
    }
  },

  /**
   * Request microphone permission
   */
  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Stop the stream immediately after getting permission
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      console.error('[NativeVoice] Permission denied:', error)
      return false
    }
  },

  /**
   * Start recording audio
   */
  async startRecording(
    onStateChange?: (state: VoiceRecordingState) => void
  ): Promise<boolean> {
    try {
      // Check if already recording
      if (_mediaRecorder && _mediaRecorder.state === 'recording') {
        console.warn('[NativeVoice] Already recording')
        return false
      }

      // Get audio stream with optimal settings for speech
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000, // Optimal for Whisper
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Setup audio analyser for amplitude visualization
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      _analyser = audioContext.createAnalyser()
      _analyser.fftSize = 256
      source.connect(_analyser)

      // Determine best format for Whisper
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm'

      // Create MediaRecorder
      _mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      })

      _audioChunks = []
      _startTime = Date.now()
      _stateCallback = onStateChange || null

      // Handle data
      _mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          _audioChunks.push(event.data)
        }
      }

      // Start recording
      _mediaRecorder.start(100) // Collect data every 100ms

      // Start amplitude monitoring
      this.startAmplitudeMonitoring()

      // Trigger haptic feedback on native
      if (isNative) {
        const { nativeHaptics } = await import('./haptics')
        await nativeHaptics.impact('medium')
      }

      console.log('[NativeVoice] Recording started')
      return true
    } catch (error) {
      console.error('[NativeVoice] Failed to start recording:', error)
      return false
    }
  },

  /**
   * Stop recording and get the audio blob
   */
  async stopRecording(): Promise<VoiceRecordingResult | null> {
    return new Promise((resolve) => {
      if (!_mediaRecorder || _mediaRecorder.state !== 'recording') {
        console.warn('[NativeVoice] Not recording')
        resolve(null)
        return
      }

      this.stopAmplitudeMonitoring()

      _mediaRecorder.onstop = async () => {
        const duration = (Date.now() - _startTime) / 1000
        const blob = new Blob(_audioChunks, { type: _mediaRecorder!.mimeType })

        // Stop all tracks
        _mediaRecorder!.stream.getTracks().forEach(track => track.stop())

        // Cleanup
        _audioChunks = []
        _mediaRecorder = null
        _stateCallback = null

        // Trigger haptic feedback on native
        if (isNative) {
          const { nativeHaptics } = await import('./haptics')
          await nativeHaptics.notification('success')
        }

        console.log('[NativeVoice] Recording stopped, duration:', duration)
        resolve({
          blob,
          duration,
          format: blob.type,
        })
      }

      _mediaRecorder.stop()
    })
  },

  /**
   * Cancel recording without saving
   */
  async cancelRecording(): Promise<void> {
    if (!_mediaRecorder) return

    this.stopAmplitudeMonitoring()

    if (_mediaRecorder.state === 'recording') {
      _mediaRecorder.stop()
    }

    _mediaRecorder.stream.getTracks().forEach(track => track.stop())
    _audioChunks = []
    _mediaRecorder = null
    _stateCallback = null

    if (isNative) {
      const { nativeHaptics } = await import('./haptics')
      await nativeHaptics.notification('warning')
    }

    console.log('[NativeVoice] Recording cancelled')
  },

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return _mediaRecorder?.state === 'recording'
  },

  /**
   * Get current recording duration in seconds
   */
  getDuration(): number {
    if (!_startTime || !this.isRecording()) return 0
    return (Date.now() - _startTime) / 1000
  },

  /**
   * Start monitoring audio amplitude for visualization
   */
  startAmplitudeMonitoring(): void {
    if (!_analyser) return

    const dataArray = new Uint8Array(_analyser.frequencyBinCount)

    const updateAmplitude = () => {
      if (!_analyser || !this.isRecording()) return

      _analyser.getByteFrequencyData(dataArray)

      // Calculate average amplitude
      const sum = dataArray.reduce((a, b) => a + b, 0)
      const amplitude = sum / dataArray.length / 255

      // Notify callback
      if (_stateCallback) {
        _stateCallback({
          isRecording: true,
          duration: this.getDuration(),
          amplitude,
        })
      }

      _animationFrame = requestAnimationFrame(updateAmplitude)
    }

    updateAmplitude()
  },

  /**
   * Stop amplitude monitoring
   */
  stopAmplitudeMonitoring(): void {
    if (_animationFrame) {
      cancelAnimationFrame(_animationFrame)
      _animationFrame = null
    }
    _analyser = null
  },

  /**
   * Convert blob to base64 for API transmission
   */
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = reader.result as string
        resolve(base64.split(',')[1]) // Remove data URL prefix
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  },

  /**
   * Convert blob to File object for FormData
   */
  blobToFile(blob: Blob, filename: string = 'recording.webm'): File {
    return new File([blob], filename, { type: blob.type })
  },
}

/**
 * Keep screen awake during recording (native only)
 */
export async function keepScreenAwake(enable: boolean): Promise<void> {
  if (!isNative) return

  try {
    const { KeepAwake } = await import('@capacitor-community/keep-awake')
    if (enable) {
      await KeepAwake.keepAwake()
    } else {
      await KeepAwake.allowSleep()
    }
  } catch {
    // Plugin not available
  }
}
