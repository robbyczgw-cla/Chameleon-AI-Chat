/**
 * Voice utilities - Speech-to-Text (Whisper) and Text-to-Speech
 * Matches main app's lib/voice.ts implementation
 */

// OpenAI TTS voices (same as main app)
export const OPENAI_TTS_VOICES = [
  { id: "alloy", name: "Alloy", description: "Neutral, balanced" },
  { id: "echo", name: "Echo", description: "Warm, conversational" },
  { id: "fable", name: "Fable", description: "Expressive, British" },
  { id: "onyx", name: "Onyx", description: "Deep, authoritative" },
  { id: "nova", name: "Nova", description: "Friendly, upbeat" },
  { id: "shimmer", name: "Shimmer", description: "Clear, gentle" },
] as const

export type OpenAIVoiceId = (typeof OPENAI_TTS_VOICES)[number]["id"]

// Legacy alias
export const TTS_VOICES = OPENAI_TTS_VOICES

export interface VoiceSettings {
  ttsEnabled: boolean
  ttsVoice: OpenAIVoiceId
  ttsSpeed: number // 0.25 - 4.0
}

/**
 * VoiceService class (matches main app's lib/voice.ts)
 */
export class VoiceService {
  private recognition: any
  private synthesis: SpeechSynthesis | null = null
  private isListening = false
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private currentAudio: HTMLAudioElement | null = null

  constructor() {
    if (typeof window !== "undefined") {
      this.synthesis = window.speechSynthesis
      // @ts-ignore - SpeechRecognition is not in TypeScript types
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = false
        this.recognition.interimResults = true
        this.recognition.lang = "en-US"
      }
    }
  }

  /**
   * Check microphone permission status
   */
  async checkMicrophonePermission(): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
    try {
      if (!navigator.permissions || !navigator.permissions.query) {
        return "unsupported"
      }
      // @ts-ignore - microphone is valid but TypeScript doesn't know
      const result = await navigator.permissions.query({ name: "microphone" })
      return result.state as "granted" | "denied" | "prompt"
    } catch {
      return "unsupported"
    }
  }

  /**
   * Start recording audio using MediaRecorder and transcribe with Whisper API
   * Matches main app's startWhisperListening
   */
  async startWhisperListening(
    apiKey: string,
    onResult: (text: string) => void,
    onError?: (error: string) => void,
    onStart?: () => void
  ) {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onError?.("Microphone access not supported in this browser")
        return
      }

      let stream: MediaStream
      try {
        console.log("[Voice] Requesting microphone access...")
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })
        console.log("[Voice] Microphone access granted!")
      } catch (permError: any) {
        console.error("[Voice] getUserMedia error:", permError.name, permError.message)

        if (permError.name === "NotAllowedError" || permError.name === "PermissionDeniedError") {
          onError?.(
            "Microphone denied. Click the lock icon in address bar → Site settings → Microphone → Allow"
          )
        } else if (permError.name === "NotFoundError") {
          onError?.("No microphone found. Please connect a microphone and reload.")
        } else if (permError.name === "NotReadableError") {
          onError?.("Microphone in use by another app. Close other apps and try again.")
        } else {
          onError?.(`Microphone error: ${permError.message || "Unknown error"}`)
        }
        return
      }

      // Verify stream has audio tracks
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        stream.getTracks().forEach((track) => track.stop())
        onError?.("No audio input available. Please check your microphone.")
        return
      }

      // Reset audio chunks
      this.audioChunks = []

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4"
      this.mediaRecorder = new MediaRecorder(stream, { mimeType })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop())

        // Create audio blob from chunks
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })

        // Check if audio is too short
        if (audioBlob.size < 1000) {
          onError?.("Recording too short. Please speak longer.")
          return
        }

        try {
          // Send to OpenAI Whisper API directly
          const extension = mimeType === "audio/webm" ? "webm" : "m4a"
          const filename = `recording.${extension}`

          console.log("[Voice] Sending audio to Whisper:", {
            size: audioBlob.size,
            type: audioBlob.type,
            filename,
          })

          const formData = new FormData()
          formData.append("file", audioBlob, filename)
          formData.append("model", "whisper-1")

          const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json()
            console.error("[Voice] Whisper API error:", error)
            onError?.(error.error?.message || "Failed to transcribe audio")
            return
          }

          const data = await response.json()
          if (data.text) {
            onResult(data.text)
          } else {
            onError?.("No transcription received")
          }
        } catch (error) {
          console.error("Whisper transcription error:", error)
          onError?.(error instanceof Error ? error.message : "Failed to transcribe audio")
        }
      }

      this.mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event)
        onError?.("Recording failed")
        stream.getTracks().forEach((track) => track.stop())
      }

      // Start recording
      this.mediaRecorder.start()
      this.isListening = true
      onStart?.()
    } catch (error) {
      console.error("Failed to start recording:", error)
      onError?.(error instanceof Error ? error.message : "Failed to start recording")
    }
  }

  stopWhisperListening() {
    if (this.mediaRecorder && this.isListening) {
      this.mediaRecorder.stop()
      this.isListening = false
    }
  }

  /**
   * Speak text using OpenAI TTS API
   * Matches main app's speakWithOpenAI
   */
  async speakWithOpenAI(
    text: string,
    apiKey: string,
    options?: { voice?: OpenAIVoiceId; speed?: number },
    onEnd?: () => void,
    onError?: (error: string) => void
  ) {
    // Stop any current playback
    this.stopSpeaking()

    // Client-side timeout (30 seconds)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      // Truncate text to 2000 chars (OpenAI TTS limit)
      const truncatedText = text.slice(0, 2000)

      const response = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "tts-1",
          input: truncatedText,
          voice: options?.voice || "nova",
          speed: options?.speed || 1.0,
          response_format: "mp3",
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        let errorMessage = "TTS failed"
        try {
          const error = await response.json()
          console.error("[Voice] OpenAI TTS error:", error)
          errorMessage = error.error?.message || "TTS failed"
        } catch {
          errorMessage = `TTS failed with status ${response.status}`
        }
        onError?.(errorMessage)
        return
      }

      // Get audio blob and play it
      const audioBlob = await response.blob()

      if (audioBlob.size === 0) {
        onError?.("No audio data received")
        return
      }

      const audioUrl = URL.createObjectURL(audioBlob)

      this.currentAudio = new Audio(audioUrl)
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        this.currentAudio = null
        onEnd?.()
      }
      this.currentAudio.onerror = () => {
        URL.revokeObjectURL(audioUrl)
        this.currentAudio = null
        onError?.("Failed to play audio")
      }

      await this.currentAudio.play()
    } catch (error) {
      clearTimeout(timeoutId)
      console.error("[Voice] OpenAI TTS error:", error)

      if (error instanceof Error && error.name === "AbortError") {
        onError?.("TTS timed out. Try shorter text or check your connection.")
        return
      }

      onError?.(error instanceof Error ? error.message : "TTS failed")
    }
  }

  stopSpeaking() {
    // Stop browser TTS
    if (this.synthesis) {
      this.synthesis.cancel()
    }
    // Stop OpenAI TTS audio
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
  }

  isOpenAIPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused
  }

  /**
   * Native browser speech recognition (fallback)
   */
  startListening(onResult: (text: string, isFinal: boolean) => void, onError?: (error: string) => void) {
    if (!this.recognition) {
      onError?.("Speech recognition not supported")
      return
    }

    this.recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join("")
      const isFinal = event.results[event.results.length - 1].isFinal
      onResult(transcript, isFinal)
    }

    this.recognition.onerror = (event: any) => {
      onError?.(event.error)
      this.isListening = false
    }

    this.recognition.onend = () => {
      this.isListening = false
    }

    this.recognition.start()
    this.isListening = true
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop()
      this.isListening = false
    }
  }

  /**
   * Native browser TTS (fallback)
   */
  speak(text: string, options?: { rate?: number; pitch?: number; voice?: string }) {
    if (!this.synthesis) return

    this.synthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = options?.rate || 1
    utterance.pitch = options?.pitch || 1

    if (options?.voice) {
      const voices = this.synthesis.getVoices()
      const selectedVoice = voices.find((v) => v.name === options.voice)
      if (selectedVoice) utterance.voice = selectedVoice
    }

    this.synthesis.speak(utterance)
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }

  isSupported(): boolean {
    return !!(this.recognition && this.synthesis)
  }
}

// Singleton instance
export const voiceService = new VoiceService()

// Legacy exports for backward compatibility
export const AudioRecorder = class {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null

  async start(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    })
    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4"
    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType })
    this.audioChunks = []

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.audioChunks.push(event.data)
    }

    this.mediaRecorder.start()
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No recording in progress"))
        return
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" })
        this.cleanup()
        resolve(audioBlob)
      }

      this.mediaRecorder.stop()
    })
  }

  cancel(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop()
    }
    this.cleanup()
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
    }
    this.mediaRecorder = null
    this.audioChunks = []
  }

  isRecording(): boolean {
    return this.mediaRecorder?.state === "recording"
  }
}

// Legacy function exports
export async function transcribeAudio(audioBlob: Blob, apiKey: string): Promise<string> {
  const formData = new FormData()
  formData.append("file", audioBlob, "recording.webm")
  formData.append("model", "whisper-1")

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "Whisper API error")
  }

  const result = await response.json()
  return result.text
}

export async function textToSpeech(
  text: string,
  apiKey: string,
  voice: string = "nova",
  speed: number = 1.0
): Promise<ArrayBuffer> {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text.slice(0, 2000),
      voice,
      speed,
      response_format: "mp3",
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "TTS API error")
  }

  return response.arrayBuffer()
}

export function speakNative(text: string, rate: number = 1.0): void {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  speechSynthesis.speak(utterance)
}
