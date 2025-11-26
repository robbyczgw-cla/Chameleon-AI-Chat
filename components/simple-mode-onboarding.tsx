"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ChameleonLogo } from "@/components/chameleon-logo"
import { useApp } from "@/contexts/app-context"
import { userProfileService, type UserProfile } from "@/lib/user-profile"
import {
  Sparkles,
  User,
  Palette,
  Key,
  ChevronRight,
  ChevronLeft,
  Check,
  ExternalLink,
  Sun,
  Moon,
  Wand2,
  Waves,
  Heart,
  Gem,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Translations for Onboarding
const translations = {
  en: {
    welcome: "Welcome to Chameleon AI",
    welcomeDesc: "Let's set up your personal AI assistant in just a few steps.",
    step1Title: "About You",
    step1Desc: "Tell us a bit about yourself for personalized responses.",
    yourName: "Your Name",
    namePlaceholder: "What should I call you?",
    nameRequired: "Name is required to continue",
    occupation: "What do you do? (optional)",
    occupationPlaceholder: "e.g., Student, Developer, Designer",
    step2Title: "Personalize",
    step2Desc: "Choose your language and theme.",
    language: "Language",
    theme: "Theme",
    preview: "Preview",
    step3Title: "API Keys",
    step3Desc: "Add your API keys to start chatting.",
    openRouterKey: "OpenRouter API Key",
    openRouterDesc: "Required for AI chat. Free tier available!",
    getKey: "Get your key",
    openAIKey: "OpenAI API Key (optional)",
    openAIDesc: "For voice input & premium voice output",
    serperKey: "Serper API Key (optional)",
    serperDesc: "For web search - 2,500 free searches!",
    step4Title: "You're all set!",
    step4Desc: "Your AI assistant is ready. Here's a preview of your setup:",
    back: "Back",
    next: "Next",
    skip: "Skip for now",
    getStarted: "Get Started",
    step: "Step",
    of: "of",
    themeLight: "Light",
    themeDark: "Dark",
    themeCosmicGlass: "Cosmic Glass",
    themeModernLight: "Modern Light",
    themeGirlyViolet: "Girly Violet",
    themeOceanBreeze: "Ocean Breeze",
    yourProfile: "Your Profile",
    appearance: "Appearance",
    apiStatus: "API Status",
    ready: "Ready",
    notConfigured: "Not configured",
    configured: "Configured",
  },
  de: {
    welcome: "Willkommen bei Chameleon AI",
    welcomeDesc: "Lass uns deinen persönlichen KI-Assistenten in wenigen Schritten einrichten.",
    step1Title: "Über Dich",
    step1Desc: "Erzähl uns ein bisschen über dich für personalisierte Antworten.",
    yourName: "Dein Name",
    namePlaceholder: "Wie soll ich dich nennen?",
    nameRequired: "Name ist erforderlich um fortzufahren",
    occupation: "Was machst du? (optional)",
    occupationPlaceholder: "z.B. Student, Entwickler, Designer",
    step2Title: "Personalisieren",
    step2Desc: "Wähle deine Sprache und Design.",
    language: "Sprache",
    theme: "Design",
    preview: "Vorschau",
    step3Title: "API Keys",
    step3Desc: "Füge deine API Keys hinzu um loszulegen.",
    openRouterKey: "OpenRouter API Key",
    openRouterDesc: "Erforderlich für KI-Chat. Kostenlose Stufe verfügbar!",
    getKey: "Key holen",
    openAIKey: "OpenAI API Key (optional)",
    openAIDesc: "Für Spracheingabe & Premium-Sprachausgabe",
    serperKey: "Serper API Key (optional)",
    serperDesc: "Für Websuche - 2.500 kostenlose Suchen!",
    step4Title: "Alles bereit!",
    step4Desc: "Dein KI-Assistent ist bereit. Hier ist eine Vorschau deiner Einstellungen:",
    back: "Zurück",
    next: "Weiter",
    skip: "Vorerst überspringen",
    getStarted: "Loslegen",
    step: "Schritt",
    of: "von",
    themeLight: "Hell",
    themeDark: "Dunkel",
    themeCosmicGlass: "Cosmic Glass",
    themeModernLight: "Modern Light",
    themeGirlyViolet: "Girly Violet",
    themeOceanBreeze: "Ocean Breeze",
    yourProfile: "Dein Profil",
    appearance: "Aussehen",
    apiStatus: "API Status",
    ready: "Bereit",
    notConfigured: "Nicht konfiguriert",
    configured: "Konfiguriert",
  },
}

interface SimpleModeOnboardingProps {
  open: boolean
  onComplete: () => void
}

const themes = [
  { id: "light", icon: Sun, gradient: "from-amber-400 to-orange-500" },
  { id: "dark", icon: Moon, gradient: "from-slate-600 to-slate-800" },
  { id: "cosmic-glass", icon: Gem, gradient: "from-purple-500 to-pink-500" },
  { id: "modern-light", icon: Sparkles, gradient: "from-blue-400 to-cyan-400" },
  { id: "girly-violet", icon: Heart, gradient: "from-pink-400 to-violet-500" },
  { id: "ocean-breeze", icon: Waves, gradient: "from-teal-400 to-blue-500" },
]

export function SimpleModeOnboarding({ open, onComplete }: SimpleModeOnboardingProps) {
  const { settings, updateSettings, user } = useApp()
  const [currentStep, setCurrentStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>({ name: "" })
  const [localSettings, setLocalSettings] = useState(settings)
  const [currentTheme, setCurrentTheme] = useState<string>("light")
  const [nameError, setNameError] = useState(false)

  const totalSteps = 4

  // Get translations based on language
  const lang = localSettings.language === "de" ? "de" : "en"
  const t = translations[lang]

  useEffect(() => {
    if (open) {
      setLocalSettings(settings)
      setProfile(userProfileService.getProfile())
      const savedTheme = localStorage.getItem("chameleon-theme") || "light"
      setCurrentTheme(savedTheme)
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

  const handleNext = () => {
    if (currentStep === 0) {
      // Validate name
      if (!profile.name?.trim()) {
        setNameError(true)
        return
      }
      setNameError(false)
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleComplete = async () => {
    // Save profile
    try {
      await userProfileService.saveProfile(profile, user?.id)
    } catch (error) {
      console.error("[Onboarding] Profile save error:", error)
    }

    // Save settings
    updateSettings(localSettings)

    // Mark onboarding as complete
    localStorage.setItem("simple-mode-onboarding-complete", "true")

    onComplete()
  }

  const getThemeLabel = (themeId: string) => {
    switch (themeId) {
      case "light": return t.themeLight
      case "dark": return t.themeDark
      case "cosmic-glass": return t.themeCosmicGlass
      case "modern-light": return t.themeModernLight
      case "girly-violet": return t.themeGirlyViolet
      case "ocean-breeze": return t.themeOceanBreeze
      default: return themeId
    }
  }

  const progress = ((currentStep + 1) / totalSteps) * 100

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header with Progress */}
        <div className="p-6 pb-4 border-b bg-gradient-to-br from-violet-500/10 to-purple-500/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <ChameleonLogo size={28} animated />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{t.welcome}</h2>
              <p className="text-sm text-muted-foreground">{t.step} {currentStep + 1} {t.of} {totalSteps}</p>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 0: Profile */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.step1Title}</h3>
                <p className="text-muted-foreground">{t.step1Desc}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-1">
                    {t.yourName}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder={t.namePlaceholder}
                    value={profile.name || ""}
                    onChange={(e) => {
                      setProfile({ ...profile, name: e.target.value })
                      if (e.target.value.trim()) setNameError(false)
                    }}
                    className={cn("h-12 text-base", nameError && "border-red-500 focus-visible:ring-red-500")}
                    autoFocus
                  />
                  {nameError && (
                    <p className="text-sm text-red-500">{t.nameRequired}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="occupation">{t.occupation}</Label>
                  <Input
                    id="occupation"
                    placeholder={t.occupationPlaceholder}
                    value={profile.occupation || ""}
                    onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                    className="h-12 text-base"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Appearance */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center">
                  <Palette className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.step2Title}</h3>
                <p className="text-muted-foreground">{t.step2Desc}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t.language}</Label>
                  <select
                    value={localSettings.language || "en"}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      setLocalSettings({ ...localSettings, language: e.target.value as "en" | "de" })
                    }
                    className="w-full rounded-md border bg-background px-3 py-3 text-base min-h-[48px]"
                  >
                    <option value="en">English</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <Label>{t.theme}</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {themes.map((theme) => {
                      const Icon = theme.icon
                      return (
                        <button
                          key={theme.id}
                          onClick={() => handleThemeChange(theme.id)}
                          className={cn(
                            "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all",
                            currentTheme === theme.id
                              ? "border-violet-500 bg-violet-500/10"
                              : "border-border hover:border-violet-300"
                          )}
                        >
                          <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center", theme.gradient)}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <span className="text-xs font-medium">{getThemeLabel(theme.id)}</span>
                          {currentTheme === theme.id && (
                            <div className="absolute top-1 right-1">
                              <Check className="h-4 w-4 text-violet-500" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Theme Preview */}
                <div className="mt-4 p-4 rounded-xl border bg-background">
                  <p className="text-sm text-muted-foreground mb-2">{t.preview}</p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {profile.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium">{profile.name || t.yourName}</p>
                      <p className="text-sm text-muted-foreground">{profile.occupation || t.occupationPlaceholder}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: API Keys */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Key className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.step3Title}</h3>
                <p className="text-muted-foreground">{t.step3Desc}</p>
              </div>

              <div className="space-y-4">
                {/* OpenRouter Key */}
                <div className="p-4 rounded-xl border bg-gradient-to-br from-violet-500/5 to-purple-500/5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Label htmlFor="openrouter-key" className="font-medium">{t.openRouterKey}</Label>
                      <p className="text-xs text-muted-foreground">{t.openRouterDesc}</p>
                    </div>
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-500 hover:text-violet-600 flex items-center gap-1"
                    >
                      {t.getKey}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
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
                    className="h-11"
                  />
                </div>

                {/* OpenAI Key */}
                <div className="p-4 rounded-xl border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Label htmlFor="openai-key" className="font-medium">{t.openAIKey}</Label>
                      <p className="text-xs text-muted-foreground">{t.openAIDesc}</p>
                    </div>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-500 hover:text-violet-600 flex items-center gap-1"
                    >
                      {t.getKey}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
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
                    className="h-11"
                  />
                </div>

                {/* Serper Key */}
                <div className="p-4 rounded-xl border">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Label htmlFor="serper-key" className="font-medium">{t.serperKey}</Label>
                      <p className="text-xs text-muted-foreground">{t.serperDesc}</p>
                    </div>
                    <a
                      href="https://serper.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-violet-500 hover:text-violet-600 flex items-center gap-1"
                    >
                      {t.getKey}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Input
                    id="serper-key"
                    type="password"
                    placeholder="..."
                    value={localSettings.apiKeys?.serper || ""}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        apiKeys: { ...localSettings.apiKeys, serper: e.target.value },
                        searchProvider: e.target.value ? "serper" : localSettings.searchProvider,
                      })
                    }
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Complete */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="h-20 w-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Wand2 className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{t.step4Title}</h3>
                <p className="text-muted-foreground">{t.step4Desc}</p>
              </div>

              {/* Summary Cards */}
              <div className="space-y-3">
                {/* Profile Summary */}
                <div className="p-4 rounded-xl border bg-gradient-to-br from-violet-500/5 to-purple-500/5">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium text-violet-600 dark:text-violet-400">
                    <User className="h-4 w-4" />
                    {t.yourProfile}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                      {profile.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-medium">{profile.name}</p>
                      {profile.occupation && (
                        <p className="text-sm text-muted-foreground">{profile.occupation}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appearance Summary */}
                <div className="p-4 rounded-xl border">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <Palette className="h-4 w-4" />
                    {t.appearance}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.language}:</span>
                    <span className="font-medium">{localSettings.language === "de" ? "Deutsch" : "English"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-1">
                    <span className="text-muted-foreground">{t.theme}:</span>
                    <span className="font-medium">{getThemeLabel(currentTheme)}</span>
                  </div>
                </div>

                {/* API Status Summary */}
                <div className="p-4 rounded-xl border">
                  <div className="flex items-center gap-2 mb-2 text-sm font-medium">
                    <Key className="h-4 w-4" />
                    {t.apiStatus}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">OpenRouter:</span>
                      <span className={cn(
                        "font-medium",
                        localSettings.apiKeys?.openRouter ? "text-green-600" : "text-muted-foreground"
                      )}>
                        {localSettings.apiKeys?.openRouter ? t.configured : t.notConfigured}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">OpenAI:</span>
                      <span className={cn(
                        "font-medium",
                        localSettings.apiKeys?.openAI ? "text-green-600" : "text-muted-foreground"
                      )}>
                        {localSettings.apiKeys?.openAI ? t.configured : t.notConfigured}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Web Search:</span>
                      <span className={cn(
                        "font-medium",
                        localSettings.apiKeys?.serper ? "text-green-600" : "text-muted-foreground"
                      )}>
                        {localSettings.apiKeys?.serper ? t.configured : t.notConfigured}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t flex items-center justify-between">
          <div>
            {currentStep > 0 && (
              <Button variant="ghost" onClick={handleBack} className="gap-1">
                <ChevronLeft className="h-4 w-4" />
                {t.back}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentStep === 2 && (
              <Button variant="ghost" onClick={handleNext} className="text-muted-foreground">
                {t.skip}
              </Button>
            )}
            {currentStep < totalSteps - 1 ? (
              <Button onClick={handleNext} className="gap-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
                {t.next}
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} className="gap-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                <Sparkles className="h-4 w-4" />
                {t.getStarted}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
