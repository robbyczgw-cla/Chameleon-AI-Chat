/**
 * useVoiceInput Hook
 * Handles voice input functionality using Whisper API
 */

import { useState, useCallback } from "react"
import { voiceService } from "@/lib/voice"
import { haptics } from "@/lib/haptics"
import { useToast } from "@/hooks/use-toast"

interface UseVoiceInputOptions {
  onTranscription: (text: string) => void
  apiKey?: string
}

interface UseVoiceInputReturn {
  isListening: boolean
  isSpeaking: boolean
  toggleVoiceInput: () => Promise<void>
  speak: (text: string, options?: SpeakOptions) => void
  stopSpeaking: () => void
}

interface SpeakOptions {
  rate?: number
  pitch?: number
  voice?: string
}

export function useVoiceInput({
  onTranscription,
  apiKey,
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const { toast } = useToast()

  const toggleVoiceInput = useCallback(async () => {
    // Check if OpenAI API key is available for Whisper
    if (!apiKey) {
      haptics.trigger("error")
      toast({
        title: "API key erforderlich",
        description:
          "Bitte OpenAI API Key in den Einstellungen hinterlegen (Einstellungen -> API Keys -> OpenAI)",
        variant: "destructive",
      })
      return
    }

    if (isListening) {
      haptics.trigger("light")
      voiceService.stopWhisperListening()
      setIsListening(false)
    } else {
      haptics.trigger("medium")
      setIsListening(true)

      // Use Whisper API (works in all browsers including Firefox and mobile)
      await voiceService.startWhisperListening(
        apiKey,
        (text) => {
          haptics.trigger("success")
          onTranscription(text)
          setIsListening(false)
          toast({
            title: "Transkribiert",
            description: `"${text.substring(0, 50)}${text.length > 50 ? "..." : ""}"`,
          })
        },
        (error) => {
          haptics.trigger("error")
          toast({
            title: "Sprachfehler",
            description: error,
            variant: "destructive",
          })
          setIsListening(false)
        },
        () => {
          toast({
            title: "Aufnahme gestartet",
            description: "Sprich jetzt... Klicke nochmal zum Stoppen",
          })
        }
      )
    }
  }, [apiKey, isListening, onTranscription, toast])

  const speak = useCallback(
    (text: string, options?: SpeakOptions) => {
      if (!voiceService.isSupported()) {
        toast({
          title: "Not supported",
          description: "Text-to-speech is not supported in your browser",
          variant: "destructive",
        })
        return
      }

      if (isSpeaking) {
        voiceService.stopSpeaking()
        setIsSpeaking(false)
      } else {
        setIsSpeaking(true)
        voiceService.speak(text, {
          rate: options?.rate || 1,
          pitch: options?.pitch || 1,
          voice: options?.voice,
        })
        // Estimate duration and reset speaking state
        const estimatedDuration = (text.length / 10) * 1000
        setTimeout(() => setIsSpeaking(false), estimatedDuration)
      }
    },
    [isSpeaking, toast]
  )

  const stopSpeaking = useCallback(() => {
    voiceService.stopSpeaking()
    setIsSpeaking(false)
  }, [])

  return {
    isListening,
    isSpeaking,
    toggleVoiceInput,
    speak,
    stopSpeaking,
  }
}
