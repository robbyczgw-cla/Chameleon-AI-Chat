"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { voiceService, OPENAI_TTS_VOICES } from "@/lib/voice"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle, Microphone, WarningCircle, XCircle } from "@phosphor-icons/react"
import type { VoiceTabProps } from "../types"

type MicPermissionState = "unknown" | "granted" | "denied" | "prompt" | "testing"

export function VoiceTab({ localSettings, setLocalSettings, voices }: VoiceTabProps) {
  const [micPermission, setMicPermission] = useState<MicPermissionState>("unknown")
  const { toast } = useToast()

  const testMicrophonePermission = async () => {
    setMicPermission("testing")

    try {
      // First check the permission state if API is available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          // @ts-ignore
          const result = await navigator.permissions.query({ name: "microphone" })
          if (result.state === "denied") {
            setMicPermission("denied")
            toast({
              title: "Microphone Blocked",
              description: "Open Chrome browser (not PWA), go to this site, and allow microphone access there.",
              variant: "destructive",
              duration: 8000,
            })
            return
          }
        } catch (e) {
          // Permission API not supported, continue with getUserMedia test
        }
      }

      // Try to get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Success! Clean up immediately
      stream.getTracks().forEach((track) => track.stop())

      setMicPermission("granted")
      toast({
        title: "Microphone Access Granted",
        description: "Voice input should now work!",
      })
    } catch (error: any) {
      console.error("[Settings] Microphone test error:", error)

      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setMicPermission("denied")
        toast({
          title: "Microphone Permission Denied",
          description: "To fix: Open Chrome browser -> go to this site URL -> click the lock icon -> allow Microphone -> then return to PWA",
          variant: "destructive",
          duration: 10000,
        })
      } else if (error.name === "NotFoundError") {
        setMicPermission("denied")
        toast({
          title: "No Microphone Found",
          description: "Please connect a microphone and try again.",
          variant: "destructive",
        })
      } else {
        setMicPermission("denied")
        toast({
          title: "Microphone Error",
          description: error.message || "Unknown error accessing microphone",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between py-2">
        <Label htmlFor="voice-enabled" className="text-sm sm:text-base">
          Enable Voice Features
        </Label>
        <Switch
          id="voice-enabled"
          checked={localSettings.voiceSettings?.enabled !== false}
          onCheckedChange={(checked) =>
            setLocalSettings({
              ...localSettings,
              voiceSettings: { ...localSettings.voiceSettings, enabled: checked } as any,
            })
          }
        />
      </div>

      <div className="flex items-center justify-between py-2">
        <Label htmlFor="auto-play" className="text-sm sm:text-base">
          Auto-play Responses
        </Label>
        <Switch
          id="auto-play"
          checked={localSettings.voiceSettings?.autoPlay || false}
          onCheckedChange={(checked) =>
            setLocalSettings({
              ...localSettings,
              voiceSettings: { ...localSettings.voiceSettings, autoPlay: checked } as any,
            })
          }
        />
      </div>

      {/* TTS Provider Selection */}
      <div className="space-y-2">
        <Label className="text-sm sm:text-base">TTS Provider</Label>
        <select
          value={localSettings.voiceSettings?.ttsProvider || "browser"}
          onChange={(e) =>
            setLocalSettings({
              ...localSettings,
              voiceSettings: { ...localSettings.voiceSettings, ttsProvider: e.target.value } as any,
            })
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
        >
          <option value="browser">Browser (Free, basic quality)</option>
          <option value="openai">OpenAI (Requires API key, high quality)</option>
        </select>
      </div>

      {/* Browser Voice Selection */}
      {(localSettings.voiceSettings?.ttsProvider || "browser") === "browser" && (
        <div className="space-y-2">
          <Label className="text-sm sm:text-base">Voice ({voices.length} available)</Label>
          <div className="flex gap-2">
            <select
              value={localSettings.voiceSettings?.voice || ""}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  voiceSettings: { ...localSettings.voiceSettings, voice: e.target.value } as any,
                })
              }
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
            >
              <option value="">System Default</option>
              {voices.length === 0 && <option disabled>Loading voices...</option>}
              {voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} ({voice.lang}){voice.localService ? "" : " ☁️"}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] px-3"
              onClick={() => {
                const testText = "Hello! This is a test of the browser text-to-speech."
                voiceService.speak(testText, {
                  rate: localSettings.voiceSettings?.rate || 1,
                  pitch: localSettings.voiceSettings?.pitch || 1,
                  voice: localSettings.voiceSettings?.voice,
                })
              }}
            >
              Test
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            ☁️ = Online voice (higher quality). Choose an English voice for best results.
          </p>
        </div>
      )}

      {/* OpenAI Voice Selection */}
      {localSettings.voiceSettings?.ttsProvider === "openai" && (
        <div className="space-y-2">
          <Label className="text-sm sm:text-base">OpenAI Voice</Label>
          <div className="flex gap-2">
            <select
              value={localSettings.voiceSettings?.openaiVoice || "nova"}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  voiceSettings: { ...localSettings.voiceSettings, openaiVoice: e.target.value } as any,
                })
              }
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
            >
              {OPENAI_TTS_VOICES.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} - {voice.description}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              className="min-h-[44px] px-3"
              onClick={async () => {
                const openAiKey = localSettings.apiKeys?.openAI
                if (!openAiKey) {
                  toast({
                    title: "API Key Required",
                    description: "Please add your OpenAI API key in the API Keys tab",
                    variant: "destructive",
                  })
                  return
                }
                toast({ title: "🔊 Generating speech..." })
                await voiceService.speakWithOpenAI(
                  "Hello! This is a test of the OpenAI text-to-speech voice.",
                  openAiKey,
                  {
                    voice: (localSettings.voiceSettings?.openaiVoice as any) || "nova",
                    speed: localSettings.voiceSettings?.rate || 1,
                  }
                )
              }}
            >
              Test
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            High-quality neural voices. Requires OpenAI API key.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-sm sm:text-base">Speech Rate: {localSettings.voiceSettings?.rate || 1}</Label>
        <Slider
          value={[localSettings.voiceSettings?.rate || 1]}
          onValueChange={([value]) =>
            setLocalSettings({
              ...localSettings,
              voiceSettings: { ...localSettings.voiceSettings, rate: value } as any,
            })
          }
          min={0.5}
          max={2}
          step={0.1}
          className="touch-none"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm sm:text-base">Speech Pitch: {localSettings.voiceSettings?.pitch || 1}</Label>
        <Slider
          value={[localSettings.voiceSettings?.pitch || 1]}
          onValueChange={([value]) =>
            setLocalSettings({
              ...localSettings,
              voiceSettings: { ...localSettings.voiceSettings, pitch: value } as any,
            })
          }
          min={0.5}
          max={2}
          step={0.1}
          className="touch-none"
        />
      </div>

      {/* Microphone Permission Test */}
      <div className="space-y-3 pt-4 border-t">
        <Label className="text-sm sm:text-base font-medium">Microphone Permission</Label>
        <p className="text-xs text-muted-foreground">
          Voice input requires microphone access. Test it here:
        </p>

        <div className="flex items-center gap-3">
          <Button
            variant={micPermission === "granted" ? "default" : "outline"}
            size="sm"
            onClick={testMicrophonePermission}
            disabled={micPermission === "testing"}
            className="min-h-[44px] gap-2"
          >
            {micPermission === "testing" ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Testing...
              </>
            ) : micPermission === "granted" ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                Microphone OK
              </>
            ) : micPermission === "denied" ? (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                Test Again
              </>
            ) : (
              <>
                <Microphone className="h-4 w-4" />
                Test Microphone
              </>
            )}
          </Button>

          {micPermission === "granted" && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Ready to use
            </span>
          )}
        </div>

        {micPermission === "denied" && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-2">
            <p className="text-sm font-medium text-destructive flex items-center gap-2">
              <WarningCircle className="h-4 w-4" />
              Microphone access blocked
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>To fix (PWA users):</strong></p>
              <ol className="list-decimal list-inside space-y-1 pl-2">
                <li>Open <strong>Chrome browser</strong> (not this app)</li>
                <li>Go to this site's URL</li>
                <li>Tap the <strong>lock icon</strong> in address bar</li>
                <li>Tap <strong>Site settings</strong></li>
                <li>Set <strong>Microphone</strong> to <strong>Allow</strong></li>
                <li>Return to this app and test again</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
