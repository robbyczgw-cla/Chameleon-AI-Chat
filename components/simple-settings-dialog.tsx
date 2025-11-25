"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect, type ChangeEvent } from "react"
import { useApp } from "@/contexts/app-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { User, Palette, Key, Volume2, Sparkles, Settings2, ChevronRight } from "lucide-react"
import { userProfileService, type UserProfile } from "@/lib/user-profile"
import { voiceService, OPENAI_TTS_VOICES } from "@/lib/voice"
import { useToast } from "@/hooks/use-toast"

interface SimpleSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SimpleSettingsDialog({ open, onOpenChange }: SimpleSettingsDialogProps) {
  const { settings, updateSettings, user } = useApp()
  const [localSettings, setLocalSettings] = useState(settings)
  const [profile, setProfile] = useState<UserProfile>({})
  const [currentTheme, setCurrentTheme] = useState<string>("light")
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      setLocalSettings(settings)
      setProfile(userProfileService.getProfile())
      const savedTheme = localStorage.getItem("chameleon-theme") || "light"
      setCurrentTheme(savedTheme)

      // Load voices
      if (voiceService.isSupported()) {
        const availableVoices = voiceService.getVoices()
        if (availableVoices.length > 0) {
          const sorted = availableVoices.sort((a, b) => {
            const aEn = a.lang.startsWith('en')
            const bEn = b.lang.startsWith('en')
            if (aEn && !bEn) return -1
            if (!aEn && bEn) return 1
            return a.name.localeCompare(b.name)
          })
          setVoices(sorted)
        }
      }
    }
  }, [open, settings])

  const applyTheme = (theme: string) => {
    const html = document.documentElement
    html.classList.remove("dark", "girly-violet", "ocean-breeze", "paper-mint", "clean-slate", "midnight-hologram", "cosmic-glass", "modern-light")
    if (theme !== "light") {
      html.classList.add(theme)
    }
    localStorage.setItem("chameleon-theme", theme)
  }

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme)
    applyTheme(theme)
  }

  const handleSave = async () => {
    // Save profile
    try {
      await userProfileService.saveProfile(profile, user?.id)
    } catch (error) {
      console.error("[SimpleSettings] Profile save error:", error)
    }

    // Save settings
    updateSettings(localSettings)

    toast({
      title: "Settings saved!",
      description: "Your preferences have been updated.",
    })
    onOpenChange(false)
  }

  const switchToAdvancedMode = () => {
    updateSettings({ simpleMode: false })
    onOpenChange(false)
    toast({
      title: "Advanced Mode",
      description: "You can switch back to Simple Mode in Settings.",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-500" />
            Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-4 gap-1">
            <TabsTrigger value="profile" className="text-xs gap-1">
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs gap-1">
              <Palette className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Look</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs gap-1">
              <Volume2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Voice</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs gap-1">
              <Key className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4 mt-0">
              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                    {profile.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Welcome back</p>
                    <p className="font-semibold">{profile.name || "Set your name below"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm">Your Name</Label>
                    <Input
                      id="name"
                      placeholder="What should I call you?"
                      value={profile.name || ""}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="occupation" className="text-sm">What do you do?</Label>
                    <Input
                      id="occupation"
                      placeholder="e.g., Student, Developer, Designer"
                      value={profile.occupation || ""}
                      onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">Interests</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(profile.interests || []).map((interest, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {(!profile.interests || profile.interests.length === 0) && (
                        <p className="text-xs text-muted-foreground">Edit profile to add interests</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => window.dispatchEvent(new Event("openProfile"))}
              >
                <span>Edit Full Profile</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label className="text-sm">Language</Label>
                <select
                  value={localSettings.language || "en"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLocalSettings({ ...localSettings, language: e.target.value as "en" | "de" })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                >
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Theme</Label>
                <select
                  value={currentTheme}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => handleThemeChange(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="cosmic-glass">Cosmic Glass</option>
                  <option value="modern-light">Modern Light</option>
                  <option value="girly-violet">Girly Violet</option>
                  <option value="ocean-breeze">Ocean Breeze</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Text Size</Label>
                <select
                  value={localSettings.fontSize || "medium"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLocalSettings({ ...localSettings, fontSize: e.target.value as "small" | "medium" | "large" })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </TabsContent>

            {/* Voice Tab */}
            <TabsContent value="voice" className="space-y-4 mt-0">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm">Enable Voice</Label>
                  <p className="text-xs text-muted-foreground">Read messages aloud</p>
                </div>
                <Switch
                  checked={localSettings.voiceSettings?.enabled !== false}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      voiceSettings: { ...localSettings.voiceSettings, enabled: checked } as any,
                    })
                  }
                />
              </div>

              {localSettings.voiceSettings?.enabled !== false && (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm">Voice Type</Label>
                    <select
                      value={localSettings.voiceSettings?.ttsProvider || "browser"}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          voiceSettings: { ...localSettings.voiceSettings, ttsProvider: e.target.value } as any,
                        })
                      }
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                    >
                      <option value="browser">Browser Voice (Free)</option>
                      <option value="openai">OpenAI Voice (Premium)</option>
                    </select>
                  </div>

                  {localSettings.voiceSettings?.ttsProvider === "openai" ? (
                    <div className="space-y-2">
                      <Label className="text-sm">OpenAI Voice</Label>
                      <select
                        value={localSettings.voiceSettings?.openaiVoice || "nova"}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            voiceSettings: { ...localSettings.voiceSettings, openaiVoice: e.target.value } as any,
                          })
                        }
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                      >
                        {OPENAI_TTS_VOICES.map((voice) => (
                          <option key={voice.id} value={voice.id}>
                            {voice.name} - {voice.description}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">Requires OpenAI API key</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm">Browser Voice</Label>
                      <select
                        value={localSettings.voiceSettings?.voice || ""}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            voiceSettings: { ...localSettings.voiceSettings, voice: e.target.value } as any,
                          })
                        }
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[44px]"
                      >
                        <option value="">System Default</option>
                        {voices.slice(0, 15).map((voice) => (
                          <option key={voice.name} value={voice.name}>
                            {voice.name} ({voice.lang})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* API Tab */}
            <TabsContent value="api" className="space-y-4 mt-0">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  API keys are needed for AI chat and voice features.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openrouter-key" className="text-sm">OpenRouter API Key</Label>
                <Input
                  id="openrouter-key"
                  type="password"
                  placeholder="sk-or-v1-..."
                  value={localSettings.apiKeys?.openRouter || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiKeys: { ...localSettings.apiKeys, openRouter: e.target.value },
                    })
                  }
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  Get from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai/keys</a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-key" className="text-sm">OpenAI API Key (Optional)</Label>
                <Input
                  id="openai-key"
                  type="password"
                  placeholder="sk-..."
                  value={localSettings.apiKeys?.openAI || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiKeys: { ...localSettings.apiKeys, openAI: e.target.value },
                    })
                  }
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">For voice input & premium TTS</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex flex-col gap-3 pt-4 border-t flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground hover:text-foreground"
            onClick={switchToAdvancedMode}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            Switch to Advanced Mode
          </Button>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
