/**
 * Native Text-to-Speech Module
 * Handles TTS with native capabilities and fallback to Web Speech API
 */

import { Capacitor } from '@capacitor/core'

const isNative = Capacitor.isNativePlatform()

export interface TTSOptions {
  text: string
  lang?: string
  rate?: number
  pitch?: number
  volume?: number
}

export interface TTSVoice {
  voiceURI: string
  name: string
  lang: string
  localService: boolean
  default: boolean
}

// Module state
let _synthesis: SpeechSynthesis | null = null
let _currentUtterance: SpeechSynthesisUtterance | null = null
let _voices: TTSVoice[] = []
let _isInitialized = false

/**
 * Native TTS Service
 */
export const nativeTTS = {
  /**
   * Initialize TTS
   */
  async initialize(): Promise<boolean> {
    if (_isInitialized) return true

    try {
      if ('speechSynthesis' in window) {
        _synthesis = window.speechSynthesis

        // Load voices (may be async on some browsers)
        await this.loadVoices()

        _isInitialized = true
        console.log('[NativeTTS] Initialized with', _voices.length, 'voices')
        return true
      }

      console.warn('[NativeTTS] Speech synthesis not supported')
      return false
    } catch (error) {
      console.error('[NativeTTS] Failed to initialize:', error)
      return false
    }
  },

  /**
   * Load available voices
   */
  async loadVoices(): Promise<TTSVoice[]> {
    if (!_synthesis) return []

    return new Promise((resolve) => {
      const getVoices = () => {
        const voices = _synthesis!.getVoices()
        _voices = voices.map(v => ({
          voiceURI: v.voiceURI,
          name: v.name,
          lang: v.lang,
          localService: v.localService,
          default: v.default,
        }))
        resolve(_voices)
      }

      // Voices may not be loaded immediately
      if (_synthesis.getVoices().length > 0) {
        getVoices()
      } else {
        _synthesis.onvoiceschanged = getVoices
        // Timeout fallback
        setTimeout(getVoices, 1000)
      }
    })
  },

  /**
   * Get available voices
   */
  getVoices(): TTSVoice[] {
    return _voices
  },

  /**
   * Get best voice for language
   */
  getBestVoice(lang: string = 'en'): SpeechSynthesisVoice | null {
    if (!_synthesis) return null

    const voices = _synthesis.getVoices()
    const langCode = lang.split('-')[0].toLowerCase()

    // Prefer local voices for better quality
    const localVoice = voices.find(
      v => v.lang.toLowerCase().startsWith(langCode) && v.localService
    )
    if (localVoice) return localVoice

    // Fall back to any matching voice
    const anyVoice = voices.find(
      v => v.lang.toLowerCase().startsWith(langCode)
    )
    if (anyVoice) return anyVoice

    // Default to first English voice
    return voices.find(v => v.lang.toLowerCase().startsWith('en')) || voices[0]
  },

  /**
   * Speak text
   */
  async speak(options: TTSOptions): Promise<void> {
    await this.initialize()

    if (!_synthesis) {
      console.error('[NativeTTS] Speech synthesis not available')
      return
    }

    // Cancel any ongoing speech
    this.stop()

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(options.text)
      _currentUtterance = utterance

      // Set voice
      const voice = this.getBestVoice(options.lang)
      if (voice) {
        utterance.voice = voice
      }

      // Set options
      utterance.lang = options.lang || 'en-US'
      utterance.rate = options.rate ?? 1.0
      utterance.pitch = options.pitch ?? 1.0
      utterance.volume = options.volume ?? 1.0

      utterance.onend = () => {
        _currentUtterance = null
        resolve()
      }

      utterance.onerror = (event) => {
        _currentUtterance = null
        if (event.error !== 'canceled') {
          console.error('[NativeTTS] Speech error:', event.error)
          reject(new Error(event.error))
        } else {
          resolve()
        }
      }

      // Haptic feedback on start (native only)
      if (isNative) {
        import('./haptics').then(({ nativeHaptics }) => {
          nativeHaptics.impact('light')
        })
      }

      _synthesis!.speak(utterance)
    })
  },

  /**
   * Stop current speech
   */
  stop(): void {
    if (_synthesis) {
      _synthesis.cancel()
      _currentUtterance = null
    }
  },

  /**
   * Pause current speech
   */
  pause(): void {
    if (_synthesis && this.isSpeaking()) {
      _synthesis.pause()
    }
  },

  /**
   * Resume paused speech
   */
  resume(): void {
    if (_synthesis && _synthesis.paused) {
      _synthesis.resume()
    }
  },

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return _synthesis?.speaking ?? false
  },

  /**
   * Check if paused
   */
  isPaused(): boolean {
    return _synthesis?.paused ?? false
  },

  /**
   * Split long text into chunks for better TTS handling
   */
  splitIntoChunks(text: string, maxLength: number = 200): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim())
        currentChunk = sentence
      } else {
        currentChunk += sentence
      }
    }

    if (currentChunk) chunks.push(currentChunk.trim())
    return chunks
  },

  /**
   * Speak long text with chunking
   */
  async speakLong(options: TTSOptions): Promise<void> {
    const chunks = this.splitIntoChunks(options.text)

    for (const chunk of chunks) {
      if (!_synthesis || _currentUtterance === null) break // Check if stopped
      await this.speak({ ...options, text: chunk })
    }
  },
}
