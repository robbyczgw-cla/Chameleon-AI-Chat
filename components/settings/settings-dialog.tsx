"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useState, useEffect, useRef, lazy, Suspense } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import type { SettingsDialogProps } from "@/types"
import { voiceService } from "@/lib/voice"
import { languageService } from "@/lib/languages"

// Tab components
import { GeneralTab } from "./tabs/general-tab"
import { ApiKeysTab } from "./tabs/api-keys-tab"
import { SearchTab } from "./tabs/search-tab"
import { VoiceTab } from "./tabs/voice-tab"

// Lazy load heavy components for better initial bundle size
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

import { Brain, Flask, Gear, Key, MagnifyingGlass, PuzzlePiece, SpeakerHigh } from "@phosphor-icons/react"
import { useTranslation } from "@/lib/i18n"

interface ExtendedSettingsDialogProps extends SettingsDialogProps {
  hideOptions?: string[] // Array of tab IDs to hide: "prompts", "voice", "mode"
}

export function SettingsDialog({ open, onOpenChange, hideOptions = [] }: ExtendedSettingsDialogProps) {
  const { settings, updateSettings } = useApp()
  const [localSettings, setLocalSettings] = useState(settings)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [currentTheme, setCurrentTheme] = useState<string>("light")

  const currentLanguage = settings.language || "en"
  const { t, translations } = useTranslation(currentLanguage)

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

  // Sync experimental settings with global changes (from ExperimentalSettings component)
  // This prevents the Save button from overwriting experimental settings toggles
  useEffect(() => {
    if (open && settings.experimental) {
      setLocalSettings(prev => ({
        ...prev,
        experimental: settings.experimental
      }))
    }
  }, [open, settings.experimental])

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
  }, [onOpenChange, settings.theme])

  const applyTheme = (theme: string) => {
    const html = document.documentElement
    // Remove all theme classes
    html.classList.remove("dark", "girly-violet", "kawaii-pink", "aurora", "amber-pro", "ocean-breeze", "paper-mint", "clean-slate", "claude", "claude-grey", "chameleon", "soft-sunrise")
    // Add the selected theme
    if (theme !== "light") {
      html.classList.add(theme)
    }
    // Dark-based themes need the "dark" class for Tailwind dark: variants
    const darkThemes = ["dark", "claude-grey"]
    if (darkThemes.includes(theme)) {
      html.classList.add("dark")
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
                <Gear className="h-3.5 w-3.5 mr-1.5 inline-block" />
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
                <MagnifyingGlass className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Search
              </TabsTrigger>
              <TabsTrigger value="mcp" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <PuzzlePiece className="h-3.5 w-3.5 mr-1.5 inline-block" />
                MCP
              </TabsTrigger>
              {!hideOptions.includes("voice") && (
                <TabsTrigger value="voice" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                  <SpeakerHigh className="h-3.5 w-3.5 mr-1.5 inline-block" />
                  Voice
                </TabsTrigger>
              )}
              <TabsTrigger value="experimental" className="text-xs sm:text-sm py-2 px-3 whitespace-nowrap">
                <Flask className="h-3.5 w-3.5 mr-1.5 inline-block" />
                Labs
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto mt-4">
            <TabsContent value="general" className="space-y-4 mt-0">
              <GeneralTab
                localSettings={localSettings}
                setLocalSettings={setLocalSettings}
                currentTheme={currentTheme}
                onThemeChange={handleThemeChange}
                translations={translations}
                hideOptions={hideOptions}
              />
            </TabsContent>

            <TabsContent value="memory" className="space-y-4 mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <AIMemoryHub />
              </Suspense>
            </TabsContent>

            <TabsContent value="api" className="space-y-4 mt-0">
              <ApiKeysTab
                localSettings={localSettings}
                setLocalSettings={setLocalSettings}
              />
            </TabsContent>

            <TabsContent value="search" className="space-y-4 mt-0">
              <SearchTab
                localSettings={localSettings}
                setLocalSettings={setLocalSettings}
              />
            </TabsContent>

            {/* MCP Tab */}
            <TabsContent value="mcp" className="space-y-4 mt-0">
              <Suspense fallback={<TabLoadingFallback />}>
                <MCPSettings />
              </Suspense>
            </TabsContent>

            {!hideOptions.includes("voice") && (
              <TabsContent value="voice" className="space-y-4 mt-0">
                <VoiceTab
                  localSettings={localSettings}
                  setLocalSettings={setLocalSettings}
                  voices={voices}
                />
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
            {translations.settings.cancel}
          </Button>
          <Button onClick={handleSave} className="min-h-[44px]">
            {translations.settings.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
