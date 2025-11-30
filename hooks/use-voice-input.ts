'use client'

import { useCallback } from 'react'
import { voiceService } from '@/lib/voice'
import { haptics } from '@/lib/haptics'
import { useToast } from '@/hooks/use-toast'

interface UseVoiceInputOptions {
  openAiApiKey?: string
  onTranscript: (text: string) => void
  onListeningChange: (listening: boolean) => void
}

/**
 * Custom hook for voice input using OpenAI Whisper API
 * Extracts voice recording logic from ChatInput
 */
export function useVoiceInput({
  openAiApiKey,
  onTranscript,
  onListeningChange,
}: UseVoiceInputOptions) {
  const { toast } = useToast()

  const startListening = useCallback(async () => {
    if (!openAiApiKey) {
      haptics.trigger('error')
      toast({
        title: 'API key erforderlich',
        description:
          'Bitte OpenAI API Key in den Einstellungen hinterlegen (Einstellungen → API Keys → OpenAI)',
        variant: 'destructive',
      })
      return false
    }

    haptics.trigger('medium')
    onListeningChange(true)

    try {
      await voiceService.startWhisperListening(
        openAiApiKey,
        (text) => {
          haptics.trigger('success')
          onTranscript(text)
          onListeningChange(false)
          toast({
            title: '✓ Transkribiert',
            description: `"${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
          })
        },
        (error) => {
          haptics.trigger('error')
          toast({
            title: 'Sprachfehler',
            description: error,
            variant: 'destructive',
          })
          onListeningChange(false)
        },
        () => {
          toast({
            title: '🎤 Aufnahme gestartet',
            description: 'Sprich jetzt... Klicke nochmal zum Stoppen',
          })
        }
      )
      return true
    } catch (error) {
      onListeningChange(false)
      return false
    }
  }, [openAiApiKey, onTranscript, onListeningChange, toast])

  const stopListening = useCallback(() => {
    haptics.trigger('light')
    voiceService.stopWhisperListening()
    onListeningChange(false)
  }, [onListeningChange])

  const toggleListening = useCallback(
    async (isCurrentlyListening: boolean) => {
      if (isCurrentlyListening) {
        stopListening()
      } else {
        await startListening()
      }
    },
    [startListening, stopListening]
  )

  return {
    startListening,
    stopListening,
    toggleListening,
  }
}
