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
import { User, Palette, Key, Volume2, Settings2, ChevronRight, Search, Brain } from "lucide-react"
import { Sparkles } from "lucide-react"
import { userProfileService, type UserProfile } from "@/lib/user-profile"
import { voiceService, OPENAI_TTS_VOICES } from "@/lib/voice"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// Translations for Simple Settings
const translations = {
  en: {
    settings: "Settings",
    profile: "Profile",
    look: "Look",
    search: "Search",
    voice: "Voice",
    memory: "Memory",
    api: "API",
    welcomeBack: "Welcome back",
    setYourName: "Set your name below",
    yourName: "Your Name",
    whatShouldICall: "What should I call you?",
    whatDoYouDo: "What do you do?",
    occupationPlaceholder: "e.g., Student, Developer, Designer",
    interests: "Interests",
    editProfileToAdd: "Edit profile to add interests",
    editFullProfile: "Edit Full Profile",
    language: "Language",
    theme: "Theme",
    textSize: "Text Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    performanceMode: "Performance Mode",
    performanceModeDesc: "Reduce GPU usage (less blur effects)",
    webSearchInfo: "Web search lets the AI find current information from the internet.",
    serperApiKey: "Serper API Key (Google Search)",
    enterSerperKey: "Enter your Serper API key...",
    getFreeKey: "Get free key from",
    freeSearches: "(2,500 free searches)",
    includeImages: "Include Images",
    showImagesInSearch: "Show images in search results",
    webSearchReady: "Web search is ready! Use the globe icon in chat to search.",
    enableVoice: "Enable Voice",
    readMessagesAloud: "Read messages aloud",
    voiceType: "Voice Type",
    browserVoice: "Browser Voice (Free)",
    openaiVoice: "OpenAI Voice (Premium)",
    requiresOpenAI: "Requires OpenAI API key",
    browserVoiceLabel: "Browser Voice",
    systemDefault: "System Default",
    memoryInfo: "Memory helps the AI remember important facts about you and your conversations.",
    enableMemory: "Enable Memory",
    letAiRemember: "Let the AI remember important information",
    autoExtract: "Auto-Extract Memories",
    autoExtractDesc: "Automatically extract important information from conversations",
    manageMemories: "Manage Memories",
    viewAndEdit: "View and edit your memories",
    apiKeysInfo: "API keys are needed for AI chat and voice features.",
    openRouterKey: "OpenRouter API Key",
    getFrom: "Get from",
    openAIKeyOptional: "OpenAI API Key (Optional)",
    forVoiceInput: "For voice input & premium TTS",
    switchToAdvanced: "Switch to Advanced Mode",
    advancedMode: "Advanced Mode",
    canSwitchBack: "You can switch back to Simple Mode in Settings.",
    cancel: "Cancel",
    save: "Save",
    settingsSaved: "Settings saved!",
    preferencesUpdated: "Your preferences have been updated.",
  },
  de: {
    settings: "Einstellungen",
    profile: "Profil",
    look: "Aussehen",
    search: "Suche",
    voice: "Stimme",
    memory: "Gedächtnis",
    api: "API",
    welcomeBack: "Willkommen zurück",
    setYourName: "Gib deinen Namen unten ein",
    yourName: "Dein Name",
    whatShouldICall: "Wie soll ich dich nennen?",
    whatDoYouDo: "Was machst du?",
    occupationPlaceholder: "z.B. Student, Entwickler, Designer",
    interests: "Interessen",
    editProfileToAdd: "Profil bearbeiten um Interessen hinzuzufügen",
    editFullProfile: "Vollständiges Profil bearbeiten",
    language: "Sprache",
    theme: "Design",
    textSize: "Textgröße",
    small: "Klein",
    medium: "Mittel",
    large: "Groß",
    performanceMode: "Performance-Modus",
    performanceModeDesc: "GPU-Last reduzieren (weniger Blur-Effekte)",
    webSearchInfo: "Die Websuche ermöglicht der KI, aktuelle Informationen aus dem Internet zu finden.",
    serperApiKey: "Serper API Key (Google Suche)",
    enterSerperKey: "Serper API Key eingeben...",
    getFreeKey: "Kostenlosen Key holen von",
    freeSearches: "(2.500 kostenlose Suchen)",
    includeImages: "Bilder einschließen",
    showImagesInSearch: "Bilder in Suchergebnissen anzeigen",
    webSearchReady: "Websuche bereit! Nutze das Globus-Symbol im Chat zum Suchen.",
    enableVoice: "Sprache aktivieren",
    readMessagesAloud: "Nachrichten vorlesen",
    voiceType: "Stimmtyp",
    browserVoice: "Browser-Stimme (Kostenlos)",
    openaiVoice: "OpenAI Stimme (Premium)",
    requiresOpenAI: "Benötigt OpenAI API Key",
    browserVoiceLabel: "Browser-Stimme",
    systemDefault: "Systemstandard",
    memoryInfo: "Das Gedächtnis hilft der KI, wichtige Fakten über dich und deine Gespräche zu merken.",
    enableMemory: "Gedächtnis aktivieren",
    letAiRemember: "Lass die KI wichtige Informationen speichern",
    autoExtract: "Auto-Extraktion",
    autoExtractDesc: "Wichtige Informationen automatisch aus Gesprächen extrahieren",
    manageMemories: "Erinnerungen verwalten",
    viewAndEdit: "Deine Erinnerungen ansehen und bearbeiten",
    apiKeysInfo: "API Keys werden für KI-Chat und Sprachfunktionen benötigt.",
    openRouterKey: "OpenRouter API Key",
    getFrom: "Holen von",
    openAIKeyOptional: "OpenAI API Key (Optional)",
    forVoiceInput: "Für Spracheingabe & Premium TTS",
    switchToAdvanced: "Zum erweiterten Modus wechseln",
    advancedMode: "Erweiterter Modus",
    canSwitchBack: "Du kannst in den Einstellungen zurück zum einfachen Modus wechseln.",
    cancel: "Abbrechen",
    save: "Speichern",
    settingsSaved: "Einstellungen gespeichert!",
    preferencesUpdated: "Deine Einstellungen wurden aktualisiert.",
  },
  es: {
    settings: "Configuración",
    profile: "Perfil",
    look: "Apariencia",
    search: "Búsqueda",
    voice: "Voz",
    memory: "Memoria",
    api: "API",
    welcomeBack: "Bienvenido de nuevo",
    setYourName: "Introduce tu nombre abajo",
    yourName: "Tu Nombre",
    whatShouldICall: "¿Cómo debería llamarte?",
    whatDoYouDo: "¿A qué te dedicas?",
    occupationPlaceholder: "ej., Estudiante, Desarrollador, Diseñador",
    interests: "Intereses",
    editProfileToAdd: "Edita el perfil para añadir intereses",
    editFullProfile: "Editar Perfil Completo",
    language: "Idioma",
    theme: "Tema",
    textSize: "Tamaño de Texto",
    small: "Pequeño",
    medium: "Mediano",
    large: "Grande",
    performanceMode: "Modo Rendimiento",
    performanceModeDesc: "Reducir uso de GPU (menos efectos de desenfoque)",
    webSearchInfo: "La búsqueda web permite a la IA encontrar información actualizada en internet.",
    serperApiKey: "Clave API Serper (Búsqueda Google)",
    enterSerperKey: "Introduce tu clave API de Serper...",
    getFreeKey: "Obtén clave gratuita de",
    freeSearches: "(2,500 búsquedas gratis)",
    includeImages: "Incluir Imágenes",
    showImagesInSearch: "Mostrar imágenes en resultados de búsqueda",
    webSearchReady: "¡Búsqueda web lista! Usa el icono del globo en el chat para buscar.",
    enableVoice: "Activar Voz",
    readMessagesAloud: "Leer mensajes en voz alta",
    voiceType: "Tipo de Voz",
    browserVoice: "Voz del Navegador (Gratis)",
    openaiVoice: "Voz OpenAI (Premium)",
    requiresOpenAI: "Requiere clave API de OpenAI",
    browserVoiceLabel: "Voz del Navegador",
    systemDefault: "Predeterminado del Sistema",
    memoryInfo: "La memoria ayuda a la IA a recordar datos importantes sobre ti y tus conversaciones.",
    enableMemory: "Activar Memoria",
    letAiRemember: "Permite a la IA recordar información importante",
    autoExtract: "Auto-Extracción",
    autoExtractDesc: "Extraer automáticamente información importante de las conversaciones",
    manageMemories: "Gestionar Recuerdos",
    viewAndEdit: "Ver y editar tus recuerdos",
    apiKeysInfo: "Las claves API son necesarias para el chat de IA y funciones de voz.",
    openRouterKey: "Clave API de OpenRouter",
    getFrom: "Obtener de",
    openAIKeyOptional: "Clave API de OpenAI (Opcional)",
    forVoiceInput: "Para entrada de voz y TTS premium",
    switchToAdvanced: "Cambiar a Modo Avanzado",
    advancedMode: "Modo Avanzado",
    canSwitchBack: "Puedes volver al Modo Simple en Configuración.",
    cancel: "Cancelar",
    save: "Guardar",
    settingsSaved: "¡Configuración guardada!",
    preferencesUpdated: "Tus preferencias han sido actualizadas.",
  },
}

interface SimpleSettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SimpleSettingsDialog({ open, onOpenChange }: SimpleSettingsDialogProps) {
  const { settings, updateSettings, user } = useApp()
  const [localSettings, setLocalSettings] = useState(settings)
  const [profile, setProfile] = useState<UserProfile>({})
  const [currentTheme, setCurrentTheme] = useState<string>("light")
  const [performanceMode, setPerformanceMode] = useState<boolean>(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const { toast } = useToast()

  // Get translations based on language
  const lang = settings.language === "de" ? "de" : settings.language === "es" ? "es" : "en"
  const t = translations[lang as keyof typeof translations]

  useEffect(() => {
    if (open) {
      setLocalSettings(settings)
      setProfile(userProfileService.getProfile())
      const savedTheme = localStorage.getItem("chameleon-theme") || "light"
      setCurrentTheme(savedTheme)

      // Load performance mode setting
      const savedPerformanceMode = localStorage.getItem("chameleon-performance-mode") === "true"
      setPerformanceMode(savedPerformanceMode)

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

  const handlePerformanceModeChange = (enabled: boolean) => {
    setPerformanceMode(enabled)
    const html = document.documentElement
    if (enabled) {
      html.classList.add("performance-mode")
    } else {
      html.classList.remove("performance-mode")
    }
    localStorage.setItem("chameleon-performance-mode", String(enabled))
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
      title: t.settingsSaved,
      description: t.preferencesUpdated,
    })
    onOpenChange(false)
  }

  const switchToAdvancedMode = () => {
    updateSettings({ simpleMode: false })
    onOpenChange(false)
    toast({
      title: t.advancedMode,
      description: t.canSwitchBack,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(96vw,900px)] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              {t.settings}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full min-w-0">
          <TabsList className="grid grid-cols-6 gap-1 w-full">
            <TabsTrigger value="profile" className="text-xs gap-1 px-2">
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.profile}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs gap-1 px-2">
              <Palette className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.look}</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs gap-1 px-2">
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.search}</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs gap-1 px-2">
              <Volume2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.voice}</span>
            </TabsTrigger>
            <TabsTrigger value="memory" className="text-xs gap-1 px-2">
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.memory}</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs gap-1 px-2">
              <Key className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.api}</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4 mt-0">
              <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                    {profile.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t.welcomeBack}</p>
                    <p className="font-semibold">{profile.name || t.setYourName}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm">{t.yourName}</Label>
                    <Input
                      id="name"
                      placeholder={t.whatShouldICall}
                      value={profile.name || ""}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="occupation" className="text-sm">{t.whatDoYouDo}</Label>
                    <Input
                      id="occupation"
                      placeholder={t.occupationPlaceholder}
                      value={profile.occupation || ""}
                      onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm">{t.interests}</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {(profile.interests || []).map((interest, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                      {(!profile.interests || profile.interests.length === 0) && (
                        <p className="text-xs text-muted-foreground">{t.editProfileToAdd}</p>
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
                <span>{t.editFullProfile}</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4 mt-0">
              {/* Language Pills */}
              <div className="space-y-2">
                <Label className="text-sm">{t.language}</Label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: "en", label: "English", flag: "🇬🇧" },
                    { value: "de", label: "Deutsch", flag: "🇩🇪" },
                    { value: "es", label: "Español", flag: "🇪🇸" },
                  ].map((lang) => (
                    <button
                      key={lang.value}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, language: lang.value as "en" | "de" | "es" })}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                        "border border-border/60 hover:border-violet-300",
                        localSettings.language === lang.value
                          ? "bg-violet-500 text-white border-violet-500"
                          : "bg-background/50 hover:bg-violet-500/5"
                      )}
                    >
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Cards - Blocks Style */}
              <div className="space-y-2">
                <Label className="text-sm">{t.theme}</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { value: "light", label: "Light", bg: "bg-white", border: "border-gray-200" },
                    { value: "dark", label: "Dark", bg: "bg-gray-900", border: "border-gray-700" },
                    { value: "cosmic-glass", label: "Cosmic", bg: "bg-gradient-to-br from-indigo-900 to-purple-900", border: "border-indigo-500/50" },
                    { value: "modern-light", label: "Modern", bg: "bg-gradient-to-br from-slate-50 to-gray-100", border: "border-slate-300" },
                    { value: "girly-violet", label: "Violet", bg: "bg-gradient-to-br from-pink-100 to-purple-200", border: "border-pink-300" },
                    { value: "ocean-breeze", label: "Ocean", bg: "bg-gradient-to-br from-cyan-100 to-blue-200", border: "border-cyan-300" },
                  ].map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => handleThemeChange(theme.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all",
                        "border-2 hover:scale-105",
                        currentTheme === theme.value
                          ? "border-violet-500 ring-2 ring-violet-500/20"
                          : "border-transparent hover:border-violet-300/50"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 sm:w-12 sm:h-12 rounded-lg border",
                        theme.bg,
                        theme.border
                      )} />
                      <span className="text-[10px] sm:text-xs font-medium">{theme.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Size Pills */}
              <div className="space-y-2">
                <Label className="text-sm">{t.textSize}</Label>
                <div className="flex gap-2">
                  {[
                    { value: "small", label: t.small, size: "text-xs" },
                    { value: "medium", label: t.medium, size: "text-sm" },
                    { value: "large", label: t.large, size: "text-base" },
                  ].map((size) => (
                    <button
                      key={size.value}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, fontSize: size.value as "small" | "medium" | "large" })}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-center font-medium transition-all",
                        "border border-border/60 hover:border-violet-300",
                        size.size,
                        localSettings.fontSize === size.value
                          ? "bg-violet-500 text-white border-violet-500"
                          : "bg-background/50 hover:bg-violet-500/5"
                      )}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/30 border border-border/40">
                <div>
                  <Label className="text-sm">{t.performanceMode}</Label>
                  <p className="text-xs text-muted-foreground">{t.performanceModeDesc}</p>
                </div>
                <Switch
                  checked={performanceMode}
                  onCheckedChange={handlePerformanceModeChange}
                />
              </div>
            </TabsContent>

            {/* Search Tab */}
            <TabsContent value="search" className="space-y-4 mt-0">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {t.webSearchInfo}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="serper-key" className="text-sm">{t.serperApiKey}</Label>
                <Input
                  id="serper-key"
                  type="password"
                  placeholder={t.enterSerperKey}
                  value={localSettings.apiKeys?.serper || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      apiKeys: { ...localSettings.apiKeys, serper: e.target.value },
                      searchProvider: "serper", // Auto-select Serper when key is added
                    })
                  }
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  {t.getFreeKey} <a href="https://serper.dev" target="_blank" rel="noopener noreferrer" className="underline">serper.dev</a> {t.freeSearches}
                </p>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm">{t.includeImages}</Label>
                  <p className="text-xs text-muted-foreground">{t.showImagesInSearch}</p>
                </div>
                <Switch
                  checked={localSettings.serperSettings?.includeImages || false}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      serperSettings: { ...localSettings.serperSettings, includeImages: checked } as any,
                    })
                  }
                />
              </div>

              {localSettings.apiKeys?.serper && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                    <span>✓</span> {t.webSearchReady}
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Voice Tab */}
            <TabsContent value="voice" className="space-y-4 mt-0">
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm">{t.enableVoice}</Label>
                  <p className="text-xs text-muted-foreground">{t.readMessagesAloud}</p>
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
                    <Label className="text-sm">{t.voiceType}</Label>
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
                      <option value="browser">{t.browserVoice}</option>
                      <option value="openai">{t.openaiVoice}</option>
                    </select>
                  </div>

                  {localSettings.voiceSettings?.ttsProvider === "openai" ? (
                    <div className="space-y-2">
                      <Label className="text-sm">{t.openaiVoice}</Label>
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
                      <p className="text-xs text-muted-foreground">{t.requiresOpenAI}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-sm">{t.browserVoiceLabel}</Label>
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
                        <option value="">{t.systemDefault}</option>
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

            {/* Memory Tab */}
            <TabsContent value="memory" className="space-y-4 mt-0">
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {t.memoryInfo}
                </p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">{t.enableMemory}</Label>
                  <p className="text-xs text-muted-foreground">{t.letAiRemember}</p>
                </div>
                <Switch
                  checked={localSettings.memorySettings?.enabled ?? false}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      memorySettings: checked
                        ? {
                            enabled: true,
                            autoExtract: localSettings.memorySettings?.autoExtract ?? true,
                            maxMemoriesInContext: localSettings.memorySettings?.maxMemoriesInContext ?? 5,
                            importanceThreshold: localSettings.memorySettings?.importanceThreshold ?? 2,
                            syncToDatabase: localSettings.memorySettings?.syncToDatabase ?? false,
                          }
                        : {
                            ...localSettings.memorySettings,
                            enabled: false,
                          },
                    })
                  }
                />
              </div>

              {localSettings.memorySettings?.enabled && (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{t.autoExtract}</Label>
                      <p className="text-xs text-muted-foreground">{t.autoExtractDesc}</p>
                    </div>
                    <Switch
                      checked={localSettings.memorySettings?.autoExtract ?? true}
                      onCheckedChange={(checked) =>
                        setLocalSettings({
                          ...localSettings,
                          memorySettings: {
                            ...localSettings.memorySettings!,
                            autoExtract: checked,
                          },
                        })
                      }
                    />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.dispatchEvent(new Event("openMemoryManager"))}
                  >
                    <span>{t.manageMemories}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">{t.viewAndEdit}</p>
                </>
              )}
            </TabsContent>

            {/* API Tab */}
            <TabsContent value="api" className="space-y-4 mt-0">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  {t.apiKeysInfo}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openrouter-key" className="text-sm">{t.openRouterKey}</Label>
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
                  {t.getFrom} <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="underline">openrouter.ai/keys</a>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openai-key" className="text-sm">{t.openAIKeyOptional}</Label>
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
                <p className="text-xs text-muted-foreground">{t.forVoiceInput}</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex flex-col gap-2 pt-3 border-t flex-shrink-0 mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground hover:text-foreground"
            onClick={switchToAdvancedMode}
          >
            <Settings2 className="h-4 w-4 mr-2" />
            {t.switchToAdvanced}
          </Button>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700">
              {t.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
