"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useState, useEffect, type ChangeEvent } from "react"
import { useApp } from "@/contexts/app-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { SettingsDialogProps } from "@/types"
import { MCPManager } from "@/components/mcp-manager"
import { voiceService } from "@/lib/voice"
import { SystemPromptsManager } from "@/components/system-prompts-manager"
import { memoryService } from "@/lib/memory-service"
import { UsageStatsWidget } from "@/components/usage-stats-widget"
import { AIMemoryHub } from "@/components/ai-memory-hub"
import { ModeHelpDialog } from "@/components/mode-help-dialog"
import { ChatAnalytics } from "@/components/chat-analytics"
import { ExperimentalSettings } from "@/components/experimental-settings"
import { Brain, HelpCircle, BarChart3, FlaskRound } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface ExtendedSettingsDialogProps extends SettingsDialogProps {
  hideOptions?: string[] // Array of tab IDs to hide: "prompts", "voice", "mcp", "mode"
}

export function SettingsDialog({ open, onOpenChange, hideOptions = [] }: ExtendedSettingsDialogProps) {
  const { settings, updateSettings } = useApp()
  const [localSettings, setLocalSettings] = useState(settings)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [currentTheme, setCurrentTheme] = useState<string>("light")
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const currentLanguage = settings.language || "en"
  const { t, translations } = useTranslation(currentLanguage)

  // CRITICAL: Sync localSettings when dialog is open and settings change
  // This prevents stale state from overwriting memory toggle changes
  useEffect(() => {
    if (open) {
      console.log("[SettingsDialog] Syncing localSettings with global settings:", {
        globalMemoryEnabled: settings.memorySettings?.enabled,
        localMemoryEnabled: localSettings.memorySettings?.enabled
      })
      setLocalSettings(settings)
    }
  }, [open, settings]) // Sync when dialog opens OR when settings change while dialog is open

  // DEBUG: Log whenever localSettings changes
  useEffect(() => {
    console.log("[SettingsDialog] localSettings changed:", {
      memoryEnabled: localSettings.memorySettings?.enabled,
      hasApiKeys: !!localSettings.apiKeys?.openRouter
    })
  }, [localSettings])

  useEffect(() => {
    if (voiceService.isSupported()) {
      setTimeout(() => setVoices(voiceService.getVoices()), 100)
    }

    // Load theme from localStorage
    const savedTheme = localStorage.getItem("chameleon-theme") || "light"
    setCurrentTheme(savedTheme)
    applyTheme(savedTheme)

    // Listen for closeSettings event from Knowledge Base
    const handleCloseSettings = () => {
      onOpenChange(false)
    }
    window.addEventListener("closeSettings", handleCloseSettings)

    return () => {
      window.removeEventListener("closeSettings", handleCloseSettings)
    }
  }, [onOpenChange])

  const applyTheme = (theme: string) => {
    const html = document.documentElement
    // Remove all theme classes
    html.classList.remove("dark", "girly-violet", "ocean-breeze", "paper-mint", "clean-slate", "midnight-hologram", "cosmic-glass", "modern-light")
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
  }

  const handleSave = () => {
    console.log("[SettingsDialog] handleSave called, saving localSettings:", {
      memoryEnabled: localSettings.memorySettings?.enabled,
      hasApiKeys: !!localSettings.apiKeys
    })
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
          <div className="overflow-x-auto flex-shrink-0 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-thin">
            <TabsList className="inline-flex w-auto min-w-full h-auto gap-1 justify-start">
              <TabsTrigger value="general" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                {translations.settings.general}
              </TabsTrigger>
              <TabsTrigger value="memory" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <Brain className="h-3.5 w-3.5 mr-1.5 inline-block" />
                AI Memory
              </TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <BarChart3 className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Analytics
              </TabsTrigger>
              {/* Prompts tab removed - now use Personas Manager instead */}
              {/* AI Debate moved to top bar */}
              <TabsTrigger value="api" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                {translations.settings.apiKeys}
              </TabsTrigger>
              <TabsTrigger value="search" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                Web Search
              </TabsTrigger>
              {!hideOptions.includes("voice") && (
                <TabsTrigger value="voice" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                  Voice
                </TabsTrigger>
              )}
              {!hideOptions.includes("mcp") && (
                <TabsTrigger value="mcp" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                  MCP
                </TabsTrigger>
              )}
              <TabsTrigger value="statistics" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                Statistics
              </TabsTrigger>
              <TabsTrigger value="experimental" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <FlaskRound className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Experimental
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="general" className="space-y-4 mt-0">
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
                  <option value="cosmic-glass">🔮 Cosmic Glass - Deep Space & Neon</option>
                  <option value="modern-light">✨ Modern Light - Clean & Airy</option>
                  <option value="clean-slate">🧼 Clean Slate - Minimal & Neutral</option>
                  <option value="midnight-hologram">🌌 Midnight Hologram - Neon Cyan & Purple</option>
                  <option value="girly-violet">💜 Girly Violet - Soft & Purple</option>
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


              {/* Detailed Stats Toggle */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="detailed-stats" className="text-sm sm:text-base font-medium">📊 Detaillierte Stats anzeigen</Label>
                  <p className="text-xs text-muted-foreground">
                    Zeigt Token-Nutzung, Kosten, Performance-Metriken und Such-Statistiken am Ende jeder Antwort an
                  </p>
                </div>
                <Switch
                  id="detailed-stats"
                  checked={localSettings.showDetailedStats ?? false}
                  onCheckedChange={(checked) =>
                    setLocalSettings({ ...localSettings, showDetailedStats: checked })
                  }
                  className="flex-shrink-0"
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

              {/* Help button - mobile only */}
              <div className="md:hidden p-3 sm:p-4 rounded-lg border border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
                <Button
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setIsHelpOpen(true)}
                >
                  <HelpCircle className="h-4 w-4" />
                  Hilfe & Tipps
                </Button>
              </div>

            </TabsContent>

            <TabsContent value="memory" className="space-y-4 mt-0">
              <AIMemoryHub />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4 mt-0">
              <ChatAnalytics />
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

            </TabsContent>

            <TabsContent value="search" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Websuche Einstellungen</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                    Konfigurieren Sie die Websuche für genauere und relevantere Ergebnisse.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="search-provider" className="text-sm sm:text-base">
                    Search Provider (für Advanced Mode)
                  </Label>
                  <select
                    id="search-provider"
                    value={localSettings.searchProvider || "tavily"}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        searchProvider: e.target.value as "tavily" | "serper",
                      })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                  >
                    <option value="tavily">Tavily - LLM-optimiert</option>
                    <option value="serper">Serper - Google Search (günstig, DACH)</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Simple Mode verwendet immer Tavily. Diese Einstellung gilt nur für Advanced Mode.
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

                <div className="space-y-2">
                  <Label className="text-sm sm:text-base">Voice</Label>
                  <select
                    value={localSettings.voiceSettings?.voice || ""}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        voiceSettings: { ...localSettings.voiceSettings, voice: e.target.value } as any,
                      })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm sm:text-base min-h-[44px]"
                  >
                    <option value="">Default</option>
                    {voices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>

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
              </TabsContent>
            )}

            {!hideOptions.includes("mcp") && (
              <TabsContent value="mcp" className="space-y-4 mt-0">
                <MCPManager />
              </TabsContent>
            )}

            <TabsContent value="statistics" className="space-y-4 mt-0">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Nutzungsstatistiken</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Verfolgen Sie Ihre API-Nutzung, Kosten und Chat-Aktivität im Detail.
                  </p>
                </div>
                <UsageStatsWidget />
              </div>
            </TabsContent>

            <TabsContent value="experimental" className="space-y-4 mt-0">
              <ExperimentalSettings />
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
      <ModeHelpDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
    </Dialog>
  )
}
