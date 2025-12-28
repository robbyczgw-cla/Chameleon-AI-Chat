/**
 * Voice utilities - Speech-to-Text (Whisper) and Text-to-Speech
 */

// Cross-browser API detection
const isFirefox = typeof browser !== "undefined"
const storage = isFirefox ? browser.storage : chrome.storage

export interface VoiceSettings {
  ttsEnabled: boolean
  ttsVoice: string // alloy, echo, fable, onyx, nova, shimmer
  ttsSpeed: number // 0.5 - 2.0
}

export const TTS_VOICES = [
  { id: "alloy", name: "Alloy", description: "Neutral, balanced" },
  { id: "echo", name: "Echo", description: "Deep, warm" },
  { id: "fable", name: "Fable", description: "Expressive, British" },
  { id: "onyx", name: "Onyx", description: "Deep, authoritative" },
  { id: "nova", name: "Nova", description: "Energetic, youthful" },
  { id: "shimmer", name: "Shimmer", description: "Warm, friendly" },
]

/**
 * Speech-to-Text using Whisper API via OpenRouter
 */
export async function transcribeAudio(
  audioBlob: Blob,
  apiKey: string
): Promise<string> {
  // Convert blob to base64
  const buffer = await audioBlob.arrayBuffer()
  const base64Audio = btoa(
    new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
  )

  // Use OpenAI Whisper directly (OpenRouter doesn't support audio)
  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: (() => {
      const formData = new FormData()
      formData.append("file", audioBlob, "recording.webm")
      formData.append("model", "whisper-1")
      return formData
    })(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Whisper API error: ${error}`)
  }

  const result = await response.json()
  return result.text
}

/**
 * Text-to-Speech using OpenAI TTS
 */
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
      input: text,
      voice: voice,
      speed: speed,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`TTS API error: ${error}`)
  }

  return response.arrayBuffer()
}

/**
 * Play audio from ArrayBuffer
 */
export async function playAudio(audioBuffer: ArrayBuffer): Promise<void> {
  const audioContext = new AudioContext()
  const decodedAudio = await audioContext.decodeAudioData(audioBuffer)
  const source = audioContext.createBufferSource()
  source.buffer = decodedAudio
  source.connect(audioContext.destination)
  source.start(0)

  return new Promise((resolve) => {
    source.onended = () => {
      audioContext.close()
      resolve()
    }
  })
}

/**
 * Audio Recorder class for capturing microphone input
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private stream: MediaStream | null = null

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      this.audioChunks = []

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      }

      this.mediaRecorder.start()
    } catch (error) {
      throw new Error(`Microphone access denied: ${error}`)
    }
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

/**
 * Browser native Speech Recognition fallback
 */
export function startNativeSpeechRecognition(): Promise<string> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      reject(new Error("Speech recognition not supported"))
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      resolve(transcript)
    }

    recognition.onerror = (event: any) => {
      reject(new Error(`Speech recognition error: ${event.error}`))
    }

    recognition.start()
  })
}

/**
 * Browser native TTS fallback
 */
export function speakNative(text: string, rate: number = 1.0): void {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = rate
  speechSynthesis.speak(utterance)
}
