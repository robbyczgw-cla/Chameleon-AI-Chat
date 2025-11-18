export class VoiceService {
  private recognition: any
  private synthesis: SpeechSynthesis
  private isListening = false
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []

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
   * Start recording audio using MediaRecorder and transcribe with Whisper API
   * This works in all browsers including Firefox and mobile
   */
  async startWhisperListening(
    apiKey: string,
    onResult: (text: string) => void,
    onError?: (error: string) => void,
    onStart?: () => void
  ) {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        onError?.('Microphone access not supported in this browser')
        return
      }

      // Request microphone permission (Firefox/Zen need this FIRST before enumerateDevices shows devices)
      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        })
      } catch (permError: any) {
        // Handle permission errors
        if (permError.name === 'NotAllowedError') {
          onError?.('Microphone permission denied. Please allow microphone access in browser settings.')
        } else if (permError.name === 'NotFoundError') {
          onError?.('No microphone found. Please connect a microphone and reload the page.')
        } else if (permError.name === 'NotReadableError') {
          onError?.('Microphone is being used by another application. Please close other apps using the microphone.')
        } else {
          onError?.(`Microphone error: ${permError.message || 'Unknown error'}`)
        }
        return
      }

      // Verify stream has audio tracks
      const audioTracks = stream.getAudioTracks()
      if (audioTracks.length === 0) {
        stream.getTracks().forEach(track => track.stop())
        onError?.('No audio input available. Please check your microphone.')
        return
      }

      // Reset audio chunks
      this.audioChunks = []

      // Create MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      this.mediaRecorder = new MediaRecorder(stream, { mimeType })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop())

        // Create audio blob from chunks
        const audioBlob = new Blob(this.audioChunks, { type: mimeType })

        // Check if audio is too short (less than 100ms)
        if (audioBlob.size < 1000) {
          onError?.("Recording too short. Please speak longer.")
          return
        }

        try {
          // Send to Whisper API
          const formData = new FormData()
          formData.append('audio', audioBlob)
          formData.append('apiKey', apiKey)

          const response = await fetch('/api/whisper', {
            method: 'POST',
            body: formData,
          })

          if (!response.ok) {
            const error = await response.json()
            onError?.(error.error || 'Failed to transcribe audio')
            return
          }

          const data = await response.json()
          if (data.text) {
            onResult(data.text)
          } else {
            onError?.('No transcription received')
          }
        } catch (error) {
          console.error('Whisper transcription error:', error)
          onError?.(error instanceof Error ? error.message : 'Failed to transcribe audio')
        }
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        onError?.('Recording failed')
        stream.getTracks().forEach(track => track.stop())
      }

      // Start recording
      this.mediaRecorder.start()
      this.isListening = true
      onStart?.()
    } catch (error) {
      console.error('Failed to start recording:', error)
      if (error instanceof Error && error.name === 'NotAllowedError') {
        onError?.('Microphone permission denied')
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        onError?.('No microphone found')
      } else {
        onError?.(error instanceof Error ? error.message : 'Failed to start recording')
      }
    }
  }

  stopWhisperListening() {
    if (this.mediaRecorder && this.isListening) {
      this.mediaRecorder.stop()
      this.isListening = false
    }
  }

  speak(text: string, options?: { rate?: number; pitch?: number; voice?: string }) {
    if (!this.synthesis) return

    // Cancel any ongoing speech
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

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel()
    }
  }

  getVoices(): SpeechSynthesisVoice[] {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }

  isSupported(): boolean {
    return !!(this.recognition && this.synthesis)
  }
}

export const voiceService = new VoiceService()
