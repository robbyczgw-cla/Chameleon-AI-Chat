"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useState, useEffect, useRef, type ChangeEvent, lazy, Suspense } from "react"
import { useApp } from "@/contexts/app-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { SettingsDialogProps } from "@/types"
import { voiceService, OPENAI_TTS_VOICES } from "@/lib/voice"
import { memoryService } from "@/lib/memory-service"
import { languageService } from "@/lib/languages"

// Lazy load heavy components for better initial bundle size
const SystemPromptsManager = lazy(() => import("@/components/system-prompts-manager").then(m => ({ default: m.SystemPromptsManager })))
const AIMemoryHub = lazy(() => import("@/components/ai-memory-hub").then(m => ({ default: m.AIMemoryHub })))
const ExperimentalSettings = lazy(() => import("@/components/experimental-settings").then(m => ({ default: m.ExperimentalSettings })))
const MCPSettings = lazy(() => import("@/components/mcp-settings").then(m => ({ default: m.MCPSettings })))

// Loading fallback for lazy components
function TabLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  )
}
import { Brain, FlaskRound, Mic, MicOff, CheckCircle2, XCircle, AlertCircle, Settings, Key, Search, Volume2, Loader2, Puzzle } from "lucide-react"
import { useTranslation } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"

interface ExtendedSettingsDialogProps extends SettingsDialogProps {
  hideOptions?: string[] // Array of tab IDs to hide: "prompts", "voice", "mode"
}

export function SettingsDialog({ open, onOpenChange, hideOptions = [] }: ExtendedSettingsDialogProps) {
  const { settings, updateSettings } = useApp()
  const [localSettings, setLocalSettings] = useState(settings)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [currentTheme, setCurrentTheme] = useState<string>("light")
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied' | 'prompt' | 'testing'>('unknown')
  const { toast } = useToast()

  const currentLanguage = settings.language || "en"
  const { t, translations } = useTranslation(currentLanguage)

  // Test microphone permission
  const testMicrophonePermission = async () => {
    setMicPermission('testing')

    try {
      // First check the permission state if API is available
      if (navigator.permissions && navigator.permissions.query) {
        try {
          // @ts-ignore
          const result = await navigator.permissions.query({ name: 'microphone' })
          if (result.state === 'denied') {
            setMicPermission('denied')
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
      stream.getTracks().forEach(track => track.stop())

      setMicPermission('granted')
      toast({
        title: "Microphone Access Granted",
        description: "Voice input should now work!",
      })
    } catch (error: any) {
      console.error('[Settings] Microphone test error:', error)

      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setMicPermission('denied')
        toast({
          title: "Microphone Permission Denied",
          description: "To fix: Open Chrome browser → go to this site URL → click the lock icon → allow Microphone → then return to PWA",
          variant: "destructive",
          duration: 10000,
        })
      } else if (error.name === 'NotFoundError') {
        setMicPermission('denied')
        toast({
          title: "No Microphone Found",
          description: "Please connect a microphone and try again.",
          variant: "destructive",
        })
      } else {
        setMicPermission('denied')
        toast({
          title: "Microphone Error",
          description: error.message || "Unknown error accessing microphone",
          variant: "destructive",
        })
      }
    }
  }

  // Track if user has made changes to prevent overwriting
  const hasUserChangesRef = useRef(false)
  const previousOpenRef = useRef(open)

  // Only sync when dialog OPENS (not while open) - prevents overwriting user changes
  useEffect(() => {
    const justOpened = open && !previousOpenRef.current
    previousOpenRef.current = open

    if (justOpened) {
      // Dialog just opened - sync with global settings
      hasUserChangesRef.current = false
      setLocalSettings(settings)
    } else if (!open) {
      // Dialog closed - reset change tracking
      hasUserChangesRef.current = false
    }
  }, [open, settings])

  // Sync memorySettings with global changes (e.g., from AIMemoryHub toggle)
  // This prevents the Save button from overwriting memory toggle changes
  useEffect(() => {
    if (open && settings.memorySettings) {
      setLocalSettings(prev => ({
        ...prev,
        memorySettings: settings.memorySettings
      }))
    }
  }, [open, settings.memorySettings])

  // Sync defaultModel with global changes (e.g., from ExperimentalSettings)
  // This prevents the Save button from overwriting defaultModel changes
  useEffect(() => {
    if (open) {
      setLocalSettings(prev => ({
        ...prev,
        defaultModel: settings.defaultModel
      }))
    }
  }, [open, settings.defaultModel])

  useEffect(() => {
    // Load voices - they load asynchronously on most browsers
    const loadVoices = () => {
      const availableVoices = voiceService.getVoices()
      if (availableVoices.length > 0) {
        // Sort voices: English first, then by name
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

    if (voiceService.isSupported()) {
      // Try immediately
      loadVoices()
      // Also listen for voiceschanged event (required for Chrome)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = loadVoices
      }
      // Fallback timeout for older browsers
      setTimeout(loadVoices, 500)
    }

    // Load theme from settings context (preferred) or fallback to localStorage for migration
    const savedTheme = settings.theme || localStorage.getItem("chameleon-theme") || "light"
    setCurrentTheme(savedTheme)
    applyTheme(savedTheme)

    // Listen for closeSettings event from Knowledge Base
    const handleCloseSettings = () => {
      onOpenChange(false)
    }
    window.addEventListener("closeSettings", handleCloseSettings)

    return () => {
      window.removeEventListener("closeSettings", handleCloseSettings)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [onOpenChange])

  const applyTheme = (theme: string) => {
    const html = document.documentElement
    // Remove all theme classes
    html.classList.remove("dark", "girly-violet", "kawaii-pink", "clay-dream", "industrial", "ocean-breeze", "paper-mint", "clean-slate", "modern-light", "chameleon", "soft-sunrise")
    // Add the selected theme
    if (theme !== "light") {
      html.classList.add(theme)
    }
    // Save to localStorage
    localStorage.setItem("chameleon-theme", theme)
  }

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme)
    applyTheme(theme)
    // Also update localSettings so it gets saved to settings context
    setLocalSettings({ ...localSettings, theme: theme as any })
  }

  const handleSave = () => {
    console.log("[SettingsDialog] handleSave called, saving localSettings:", {
      memoryEnabled: localSettings.memorySettings?.enabled,
      hasApiKeys: !!localSettings.apiKeys,
      language: localSettings.language
    })

    // Sync language to languageService for compatibility
    if (localSettings.language && localSettings.language !== settings.language) {
      languageService.setLanguage(localSettings.language)
      console.log("[SettingsDialog] Synced language change to languageService:", localSettings.language)
    }

    updateSettings(localSettings)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{translations.settings.title}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full flex-1 flex flex-col overflow-hidden">
          {/* Mobile: horizontal scroll, Desktop: 2 rows grid */}
          <div className="flex-shrink-0 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto sm:overflow-x-visible">
            <TabsList className="inline-flex w-auto min-w-full h-auto gap-1 justify-start sm:grid sm:grid-cols-4 sm:w-full sm:gap-1.5">
              <TabsTrigger value="general" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <Settings className="h-3.5 w-3.5 mr-1.5 inline-block" />
                {translations.settings.general}
              </TabsTrigger>
              <TabsTrigger value="memory" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <Brain className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Memory
              </TabsTrigger>
              <TabsTrigger value="api" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <Key className="h-3.5 w-3.5 mr-1.5 inline-block" />
                API Keys
              </TabsTrigger>
              <TabsTrigger value="search" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <Search className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Search
              </TabsTrigger>
              <TabsTrigger value="mcp" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <Puzzle className="h-3.5 w-3.5 mr-1.5 inline-block" />
                MCP
              </TabsTrigger>
              {!hideOptions.includes("voice") && (
                <TabsTrigger value="voice" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                  <Volume2 className="h-3.5 w-3.5 mr-1.5 inline-block" />
                  Voice
                </TabsTrigger>
              )}
              <TabsTrigger value="experimental" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <FlaskRound className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Labs
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="general" className="space-y-4 mt-0">
              {/* Simple Mode Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="simple-mode" className="text-sm sm:text-base font-medium">Simple Mode</Label>
                  <p className="text-xs text-muted-foreground">
                    Clean, persona-focused interface. Perfect for everyday conversations.
                  </p>
                </div>
                <Switch
                  id="simple-mode"
                  checked={localSettings.simpleMode ?? false}
                  onCheckedChange={(checked) =>
                    setLocalSettings({ ...localSettings, simpleMode: checked })
                  }
                  className="flex-shrink-0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="system-prompt" className="text-sm sm:text-base">
                  {translations.settings.systemPrompt}
                </Label>
                <Textarea
                  id="system-prompt"
                  placeholder={translations.settings.systemPromptPlaceholder}
                  value={localSettings.systemPrompt}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
                  rows={4}
                  className="text-sm sm:text-base"
                />
                <p className="text-xs text-muted-foreground">
                  {translations.settings.systemPromptHelp}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">{translations.settings.language}</Label>
                <select
                  value={localSettings.language || "en"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLocalSettings({ ...localSettings, language: e.target.value as "en" | "de" })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                >
                  <option value="en">{translations.settings.languageEnglish}</option>
                  <option value="de">{translations.settings.languageGerman}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">{translations.settings.fontSize}</Label>
                <select
                  value={localSettings.fontSize || "medium"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLocalSettings({ ...localSettings, fontSize: e.target.value as "small" | "medium" | "large" })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                >
                  <option value="small">{translations.settings.fontSizeSmall}</option>
                  <option value="medium">{translations.settings.fontSizeMedium}</option>
                  <option value="large">{translations.settings.fontSizeLarge}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Font Family</Label>
                <select
                  value={localSettings.fontFamily || "inter"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLocalSettings({
                      ...localSettings,
                      fontFamily: e.target.value as "inter" | "roboto" | "atkinson" | "opendyslexic" | "jetbrains" | "system",
                    })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                >
                  <option value="inter">Inter (Default)</option>
                  <option value="roboto">Roboto</option>
                  <option value="atkinson">Atkinson Hyperlegible (Dyslexia-friendly)</option>
                  <option value="opendyslexic">OpenDyslexic</option>
                  <option value="jetbrains">JetBrains Mono</option>
                  <option value="system">System Font</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Choose a font that's comfortable for reading. Atkinson and OpenDyslexic are designed for accessibility.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Message Spacing</Label>
                <select
                  value={localSettings.messageDensity || "comfortable"}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setLocalSettings({
                      ...localSettings,
                      messageDensity: e.target.value as "compact" | "comfortable" | "spacious",
                    })
                  }
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                >
                  <option value="compact">Compact (more messages visible)</option>
                  <option value="comfortable">Comfortable (normal)</option>
                  <option value="spacious">Spacious (more breathing room)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm sm:text-base">Color Theme</Label>
                <select
                  value={currentTheme}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => handleThemeChange(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                >
                  <option value="light">☀️ Light - Bright & Classic</option>
                  <option value="dark">🌙 Dark - Dark & Modern</option>
                  <option value="soft-sunrise">🌅 Soft Sunrise - Warm Peach & Lavender</option>
                  <option value="modern-light">🌟 Modern Light - Clean & Airy</option>
                  <option value="clean-slate">🧼 Clean Slate - Minimal & Neutral</option>
                  <option value="chameleon">🦎 Chameleon - Green & Purple Shift</option>
                  <option value="girly-violet">💜 Girly Violet - Soft & Purple</option>
                  <option value="kawaii-pink">💖 Kawaii Pink - Cute & Playful</option>
                  <option value="clay-dream">🍬 Clay Dream - Soft Clay & Pastels</option>
                  <option value="industrial">⚙️ Industrial - Neumorphic & Mechanical</option>
                  <option value="ocean-breeze">🌊 Ocean Breeze - Fresh & Aqua</option>
                  <option value="paper-mint">📄 Paper Mint - Warm & Crisp</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Choose your favorite theme for the user interface
                </p>
              </div>

              <div className="flex items-center justify-between py-2">
                <Label htmlFor="keyboard-shortcuts" className="text-sm sm:text-base">
                  Enable Keyboard Shortcuts
                </Label>
                <Switch
                  id="keyboard-shortcuts"
                  checked={localSettings.enableKeyboardShortcuts !== false}
                  onCheckedChange={(checked) =>
                    setLocalSettings({ ...localSettings, enableKeyboardShortcuts: checked })
                  }
                />
              </div>

              {/* Exa Search Toggle */}
              {hideOptions.includes("mode") && (
                <div className="p-3 sm:p-4 rounded-lg border border-blue-500/30 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 shrink-0">
                        <span className="text-xl">🔍</span>
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="use-exa" className="text-sm sm:text-base font-medium">Exa Semantic Search (experimentell)</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Nutze Exa für tiefe technische Recherche (semantische Suche, lange Kontext-Passagen)
                        </p>
                      </div>
                      <Switch
                        id="use-exa"
                        checked={localSettings.useExaSearch ?? false}
                        onCheckedChange={(checked) =>
                          setLocalSettings({ ...localSettings, useExaSearch: checked })
                        }
                        className="flex-shrink-0"
                      />
                    </div>
                    <div className="text-xs space-y-1 p-2 bg-blue-100 dark:bg-blue-950/50 rounded">
                      <p className="font-medium">ℹ️ Was ist Exa?</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-2">
                        <li>Semantische Suche via OpenRouter (model:online)</li>
                        <li>Lange, detaillierte Passagen von Hersteller-Seiten</li>
                        <li>Beste für: Technische Specs, Vergleiche, Forschung</li>
                        <li>Kosten: ~$0.02 pro Anfrage (10x teurer als Serper)</li>
                        <li>Kann mit Serper/Tavily kombiniert werden</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            </TabsContent>

            <TabsContent value="memory" className="space-y-4 mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <AIMemoryHub />
              </Suspense>
            </TabsContent>

            <TabsContent value="api" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="openrouter-key" className="text-sm sm:text-base">
                  OpenRouter API Key
                </Label>
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
                  className="text-sm sm:text-base min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">
                    openrouter.ai/keys
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-key" className="text-sm sm:text-base">
                  OpenAI API Key (für Whisper Voice Input)
                </Label>
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
                  className="text-sm sm:text-base min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Für Spracheingabe via Whisper API. Key von{" "}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">
                    platform.openai.com/api-keys
                  </a> ($0.006/Minute)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tavily-key" className="text-sm sm:text-base">
                  Tavily API Key (for web search)
                </Label>
                <Input
                  id="tavily-key"
                  type="password"
                  placeholder="tvly-..."
                  value={localSettings.apiKeys?.tavily || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiKeys: { ...localSettings.apiKeys, tavily: e.target.value },
                    })
                  }
                  className="text-sm sm:text-base min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Get your API key from{" "}
                  <a href="https://tavily.com" target="_blank" rel="noopener noreferrer" className="underline">
                    tavily.com
                  </a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serper-key" className="text-sm sm:text-base">
                  Serper API Key (Google Search - optional)
                </Label>
                <Input
                  id="serper-key"
                  type="password"
                  placeholder="..."
                  value={localSettings.apiKeys?.serper || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiKeys: { ...localSettings.apiKeys, serper: e.target.value },
                    })
                  }
                  className="text-sm sm:text-base min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Get your API key from{" "}
                  <a href="https://serper.dev" target="_blank" rel="noopener noreferrer" className="underline">
                    serper.dev
                  </a>{" "}
                  (10x cheaper, better DACH results)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exa-key" className="text-sm sm:text-base">
                  🔮 Exa API Key (Neural/Semantic Search)
                </Label>
                <Input
                  id="exa-key"
                  type="password"
                  placeholder="exa-..."
                  value={localSettings.apiKeys?.exa || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiKeys: { ...localSettings.apiKeys, exa: e.target.value },
                    })
                  }
                  className="text-sm sm:text-base min-h-[44px]"
                />
                <p className="text-xs text-muted-foreground">
                  Optional: Get your API key from{" "}
                  <a href="https://exa.ai" target="_blank" rel="noopener noreferrer" className="underline">
                    exa.ai
                  </a>{" "}
                  - Best for RAG, semantic search & research (~$0.01/search)
                </p>
              </div>

            </TabsContent>

            <TabsContent value="search" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Websuche Einstellungen</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Konfigurieren Sie die Websuche für genauere und relevantere Ergebnisse.
                  </p>
                </div>

                {/* Auto Tool Use Toggle */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border border-green-500/30 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🤖</span>
                      <Label htmlFor="auto-tool-use" className="text-sm sm:text-base font-medium">
                        Automatic Tool Use (AI Tool Calling)
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Let AI automatically decide when to use tools like web search, weather lookup, URL fetching, etc. The model will intelligently choose the right tool based on your question.
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">GPT-5</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">Claude 4.5</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">Gemini 2.5</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">Grok 4</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300">DeepSeek V3</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">Llama 4</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-pink-100 dark:bg-pink-900/50 text-pink-700 dark:text-pink-300">Qwen 3</span>
                    </div>
                  </div>
                  <Switch
                    id="auto-tool-use"
                    checked={localSettings.enableAutoToolUse ?? true}
                    onCheckedChange={(checked) =>
                      setLocalSettings({ ...localSettings, enableAutoToolUse: checked })
                    }
                    className="flex-shrink-0"
                  />
                </div>

                {localSettings.enableAutoToolUse && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-3 text-xs space-y-1">
                    <p className="font-medium text-amber-700 dark:text-amber-400">Requirements:</p>
                    <ul className="list-disc list-inside text-muted-foreground space-y-0.5 pl-1">
                      <li>For web search: A search API key (Tavily, Serper, or Exa) must be configured</li>
                      <li>For weather: Add WEATHER_API_KEY environment variable (optional)</li>
                      <li>Use a model with tool calling support (GPT-5, Claude 4.5, Gemini 2.5, Grok 4, Llama 4, etc.)</li>
                      <li>Most 2025 flagship and mid-tier models support this feature</li>
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="search-provider" className="text-sm sm:text-base">
                    Search Provider
                  </Label>
                  <select
                    id="search-provider"
                    value={localSettings.searchProvider || "tavily"}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        searchProvider: e.target.value as "tavily" | "serper" | "exa",
                      })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                  >
                    <option value="tavily">🌐 Tavily - LLM-optimiert (~$0.01/search)</option>
                    <option value="serper">🔍 Serper - Google Search (~$0.001/search)</option>
                    <option value="exa">🔮 Exa - Neural/Semantic Search (~$0.01/search)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Wähle den Suchanbieter für die Web-Suche. Exa bietet semantische Suche für beste RAG-Ergebnisse.
                  </p>
                </div>

                {localSettings.searchProvider === "serper" && (
                  <div className="rounded-lg border p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20">
                    <h4 className="font-medium mb-2 text-sm sm:text-base">🔍 Serper (Google Search)</h4>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm sm:text-base">
                          Max Ergebnisse: {localSettings.serperSettings?.maxResults || 5}
                        </Label>
                        <Slider
                          value={[localSettings.serperSettings?.maxResults || 5]}
                          onValueChange={([value]) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, maxResults: value } as any,
                            })
                          }
                          min={1}
                          max={10}
                          step={1}
                          className="touch-none"
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <Label htmlFor="serper-images" className="text-sm sm:text-base">
                          Produktbilder einbeziehen
                        </Label>
                        <Switch
                          id="serper-images"
                          checked={localSettings.serperSettings?.includeImages !== false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, includeImages: checked } as any,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serper-country" className="text-sm sm:text-base">
                          Land
                        </Label>
                        <select
                          id="serper-country"
                          value={localSettings.serperSettings?.country || "at"}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, country: e.target.value } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="at">🇦🇹 Österreich</option>
                          <option value="de">🇩🇪 Deutschland</option>
                          <option value="ch">🇨🇭 Schweiz</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serper-language" className="text-sm sm:text-base">
                          Sprache
                        </Label>
                        <select
                          id="serper-language"
                          value={localSettings.serperSettings?.language || "de"}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, language: e.target.value } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="de">Deutsch</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serper-type" className="text-sm sm:text-base">
                          Suchtyp
                        </Label>
                        <select
                          id="serper-type"
                          value={localSettings.serperSettings?.type || "search"}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, type: e.target.value as any } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="search">🔍 Web Search</option>
                          <option value="news">📰 News</option>
                          <option value="images">🖼️ Images</option>
                          <option value="videos">🎥 Videos</option>
                          <option value="places">📍 Places</option>
                          <option value="shopping">🛒 Shopping</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="serper-timerange" className="text-sm sm:text-base">
                          Zeitfilter
                        </Label>
                        <select
                          id="serper-timerange"
                          value={localSettings.serperSettings?.timeRange || "none"}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, timeRange: e.target.value as any } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="none">⏰ Alle Ergebnisse</option>
                          <option value="hour">Letzte Stunde</option>
                          <option value="day">Letzter Tag</option>
                          <option value="week">Letzte Woche</option>
                          <option value="month">Letzter Monat</option>
                          <option value="year">Letztes Jahr</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <Label htmlFor="serper-autocorrect" className="text-sm sm:text-base">
                          Rechtschreibkorrektur
                        </Label>
                        <Switch
                          id="serper-autocorrect"
                          checked={localSettings.serperSettings?.autocorrect !== false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              serperSettings: { ...localSettings.serperSettings, autocorrect: checked } as any,
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {localSettings.searchProvider === "exa" && (
                  <div className="rounded-lg border p-3 sm:p-4 bg-purple-50 dark:bg-purple-950/20">
                    <h4 className="font-medium mb-2 text-sm sm:text-base">🔮 Exa Neural Search</h4>
                    <p className="text-xs text-muted-foreground mb-3">
                      Semantische Suche mit AI-Verständnis - optimal für RAG und Recherche
                    </p>
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label className="text-sm sm:text-base">
                          Max Ergebnisse: {localSettings.exaSettings?.maxResults || 5}
                        </Label>
                        <Slider
                          value={[localSettings.exaSettings?.maxResults || 5]}
                          onValueChange={([value]) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, maxResults: value } as any,
                            })
                          }
                          min={1}
                          max={20}
                          step={1}
                          className="touch-none"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="exa-search-type" className="text-sm sm:text-base">
                          Suchmethode
                        </Label>
                        <select
                          id="exa-search-type"
                          value={localSettings.exaSettings?.searchType || "auto"}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, searchType: e.target.value as any } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="auto">🤖 Auto - Kombination aus Neural & Keyword</option>
                          <option value="neural">🧠 Neural - Semantische Suche (Embeddings)</option>
                          <option value="keyword">🔤 Keyword - Traditionelle Stichwortsuche</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="exa-category" className="text-sm sm:text-base">
                          Kategorie-Filter (optional)
                        </Label>
                        <select
                          id="exa-category"
                          value={localSettings.exaSettings?.category || ""}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, category: e.target.value || undefined } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="">Alle Kategorien</option>
                          <option value="news">📰 News</option>
                          <option value="research paper">📄 Research Papers</option>
                          <option value="github">💻 GitHub</option>
                          <option value="company">🏢 Unternehmen</option>
                          <option value="pdf">📑 PDFs</option>
                          <option value="tweet">🐦 Tweets</option>
                          <option value="linkedin profile">💼 LinkedIn</option>
                          <option value="personal site">🏠 Personal Sites</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5 flex-1 pr-4">
                          <Label htmlFor="exa-autoprompt" className="text-sm sm:text-base">
                            Autoprompt
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Exa optimiert deine Suchanfrage automatisch
                          </p>
                        </div>
                        <Switch
                          id="exa-autoprompt"
                          checked={localSettings.exaSettings?.useAutoprompt !== false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, useAutoprompt: checked } as any,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5 flex-1 pr-4">
                          <Label htmlFor="exa-fulltext" className="text-sm sm:text-base">
                            Volltext einbeziehen
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Kompletten Seiteninhalt für RAG laden
                          </p>
                        </div>
                        <Switch
                          id="exa-fulltext"
                          checked={localSettings.exaSettings?.includeFullText !== false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, includeFullText: checked } as any,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5 flex-1 pr-4">
                          <Label htmlFor="exa-highlights" className="text-sm sm:text-base">
                            Highlights einbeziehen
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Relevante Textausschnitte extrahieren
                          </p>
                        </div>
                        <Switch
                          id="exa-highlights"
                          checked={localSettings.exaSettings?.includeHighlights !== false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, includeHighlights: checked } as any,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-0.5 flex-1 pr-4">
                          <Label htmlFor="exa-summary" className="text-sm sm:text-base">
                            AI-Zusammenfassung
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Generierte Zusammenfassung pro Ergebnis (+$0.001)
                          </p>
                        </div>
                        <Switch
                          id="exa-summary"
                          checked={localSettings.exaSettings?.includeSummary || false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, includeSummary: checked } as any,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between py-1">
                        <div>
                          <Label htmlFor="exa-images" className="text-sm sm:text-base cursor-pointer">
                            🖼️ Bilder einbeziehen
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Bilder aus Suchergebnissen anzeigen
                          </p>
                        </div>
                        <Switch
                          id="exa-images"
                          checked={localSettings.exaSettings?.includeImages || false}
                          onCheckedChange={(checked) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, includeImages: checked } as any,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="exa-livecrawl" className="text-sm sm:text-base">
                          Livecrawl-Modus
                        </Label>
                        <select
                          id="exa-livecrawl"
                          value={localSettings.exaSettings?.livecrawl || "fallback"}
                          onChange={(e) =>
                            setLocalSettings({
                              ...localSettings,
                              exaSettings: { ...localSettings.exaSettings, livecrawl: e.target.value as any } as any,
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                        >
                          <option value="never">⚡ Nie - Nur aus Cache</option>
                          <option value="fallback">🔄 Fallback - Bei veraltetem Content</option>
                          <option value="always">🌐 Immer - Stets frische Daten</option>
                        </select>
                        <p className="text-xs text-muted-foreground">
                          Steuert, ob Exa Seiten live crawlt für aktuelle Inhalte
                        </p>
                      </div>

                      <div className="rounded-lg border p-3 bg-purple-100 dark:bg-purple-900/30">
                        <h5 className="font-medium text-sm mb-1">💡 Exa Tipps</h5>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                          <li>Neural-Suche versteht Bedeutung, nicht nur Stichwörter</li>
                          <li>Kategorie-Filter für spezifische Quellen (GitHub, News, Papers)</li>
                          <li>Highlights sind ideal für prägnante RAG-Kontexte</li>
                          <li>Volltext für tiefgehende Analyse und längere Dokumente</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {(!localSettings.searchProvider || localSettings.searchProvider === "tavily") && (
                  <div className="space-y-3">
                    <h4 className="font-medium mb-3 text-sm sm:text-base">📡 Tavily Einstellungen</h4>

                    <div className="space-y-2">
                      <Label htmlFor="search-depth" className="text-sm sm:text-base">
                        Suchtiefe
                      </Label>
                      <select
                        id="search-depth"
                        value={localSettings.tavilySettings?.searchDepth || "basic"}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            tavilySettings: {
                              ...localSettings.tavilySettings,
                              searchDepth: e.target.value as "basic" | "advanced",
                            } as any,
                          })
                        }
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                      >
                        <option value="basic">Basic - Schneller, weniger detailliert</option>
                        <option value="advanced">Advanced - Langsamer, mehr Details</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        Basic ist schneller und günstiger, Advanced liefert umfassendere Ergebnisse.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm sm:text-base">
                        Maximale Ergebnisse: {localSettings.tavilySettings?.maxResults || 5}
                      </Label>
                      <Slider
                        value={[localSettings.tavilySettings?.maxResults || 5]}
                        onValueChange={([value]) =>
                          setLocalSettings({
                            ...localSettings,
                            tavilySettings: { ...localSettings.tavilySettings, maxResults: value } as any,
                          })
                        }
                        min={1}
                        max={10}
                        step={1}
                        className="touch-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Anzahl der Suchergebnisse, die in den Kontext einbezogen werden.
                      </p>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5 flex-1 pr-4">
                        <Label htmlFor="include-images" className="text-sm sm:text-base">
                          Bilder einbeziehen
                        </Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Relevante Bilder in Suchergebnissen anzeigen
                        </p>
                      </div>
                      <Switch
                        id="include-images"
                        checked={localSettings.tavilySettings?.includeImages || false}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            tavilySettings: { ...localSettings.tavilySettings, includeImages: checked } as any,
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5 flex-1 pr-4">
                        <Label htmlFor="include-answer" className="text-sm sm:text-sm">
                          KI-Antwort einbeziehen
                        </Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Tavily's KI-generierte Zusammenfassung der Suchergebnisse verwenden
                        </p>
                      </div>
                      <Switch
                        id="include-answer"
                        checked={localSettings.tavilySettings?.includeAnswer !== false}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            tavilySettings: { ...localSettings.tavilySettings, includeAnswer: checked } as any,
                          })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tavily-topic" className="text-sm sm:text-base">
                        Suchfokus
                      </Label>
                      <select
                        id="tavily-topic"
                        value={localSettings.tavilySettings?.topic || "general"}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            tavilySettings: { ...localSettings.tavilySettings, topic: e.target.value as any } as any,
                          })
                        }
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                      >
                        <option value="general">🌐 Allgemein</option>
                        <option value="news">📰 News</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <div className="space-y-0.5 flex-1 pr-4">
                        <Label htmlFor="include-raw-content" className="text-sm sm:text-base">
                          Vollständiger Content
                        </Label>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          Lädt kompletten HTML/Text-Inhalt (erhöht Token-Nutzung)
                        </p>
                      </div>
                      <Switch
                        id="include-raw-content"
                        checked={localSettings.tavilySettings?.includeRawContent || false}
                        onCheckedChange={(checked) =>
                          setLocalSettings({
                            ...localSettings,
                            tavilySettings: { ...localSettings.tavilySettings, includeRawContent: checked } as any,
                          })
                        }
                      />
                    </div>

                    <div className="rounded-lg border p-3 sm:p-4 bg-muted/50">
                      <h4 className="font-medium mb-2 text-sm sm:text-base">💡 Tipps für bessere Suchergebnisse</h4>
                      <ul className="text-xs sm:text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Verwenden Sie spezifische Suchbegriffe für genauere Ergebnisse</li>
                        <li>Advanced-Modus für komplexe Recherchen und Faktenprüfung</li>
                        <li>Mehr Ergebnisse = mehr Kontext, aber höhere Kosten</li>
                        <li>KI-Antwort liefert eine prägnante Zusammenfassung der Ergebnisse</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* MCP Tab */}
            <TabsContent value="mcp" className="space-y-4 mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <MCPSettings />
              </Suspense>
            </TabsContent>

            {!hideOptions.includes("voice") && (
              <TabsContent value="voice" className="space-y-4 mt-0">
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
                            {voice.name} ({voice.lang}){voice.localService ? '' : ' ☁️'}
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
                              voice: (localSettings.voiceSettings?.openaiVoice as any) || 'nova',
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
                      variant={micPermission === 'granted' ? 'default' : 'outline'}
                      size="sm"
                      onClick={testMicrophonePermission}
                      disabled={micPermission === 'testing'}
                      className="min-h-[44px] gap-2"
                    >
                      {micPermission === 'testing' ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Testing...
                        </>
                      ) : micPermission === 'granted' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Microphone OK
                        </>
                      ) : micPermission === 'denied' ? (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          Test Again
                        </>
                      ) : (
                        <>
                          <Mic className="h-4 w-4" />
                          Test Microphone
                        </>
                      )}
                    </Button>

                    {micPermission === 'granted' && (
                      <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Ready to use
                      </span>
                    )}
                  </div>

                  {micPermission === 'denied' && (
                    <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 space-y-2">
                      <p className="text-sm font-medium text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
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
              </TabsContent>
            )}

            <TabsContent value="experimental" className="space-y-4 mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <ExperimentalSettings />
              </Suspense>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-h-[44px]">
            Abbrechen
          </Button>
          <Button onClick={handleSave} className="min-h-[44px]">
            Änderungen speichern
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
