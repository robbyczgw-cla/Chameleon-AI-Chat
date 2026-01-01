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
import { User, Palette, Key, Volume2, Settings2, ChevronRight, Search, Brain, HelpCircle, Bot, ShoppingCart } from "lucide-react"
import { Sparkles, Zap, Shield, DollarSign } from "lucide-react"
import { userProfileService, type UserProfile } from "@/lib/user-profile"
import { voiceService, OPENAI_TTS_VOICES } from "@/lib/voice"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { isHifiTier } from "@/lib/feature-flags"

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
    help: "Help",
    advancedSettings: "Settings",
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
    autoSearch: "Automatic Web Search",
    autoSearchDesc: "Let AI automatically search the web when needed",
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
    storageLocation: "Storage Location",
    storageLocationDesc: "Where to store your memories",
    localStorage: "Local (Private)",
    localStorageDesc: "Store on this device only",
    supabaseStorage: "Supabase (Cloud)",
    supabaseStorageDesc: "Sync across devices",
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
    // Help section
    helpTitle: "Welcome to Chameleon AI",
    helpSubtitle: "Your intelligent conversation partner",
    howItWorks: "How It Works",
    howItWorksText1: "Chameleon AI connects to powerful language models (LLMs) through OpenRouter. Think of it as having a conversation with an extremely knowledgeable assistant that can help you with almost anything.",
    howItWorksText2: "The AI reads your messages, understands context, and generates helpful responses. It can write, explain, analyze, create, and much more - all in natural language.",
    chatTipsTitle: "💡 Tips for Better Conversations",
    chatTip1: "Be specific: Instead of 'Help me with code', try 'Write a Python function that sorts a list'",
    chatTip2: "Provide context: Give background information for better, more relevant answers",
    chatTip3: "Ask follow-up questions: Build on previous responses for deeper understanding",
    chatTip4: "Request formats: Ask for bullet points, step-by-step guides, or examples",
    chatTip5: "Use personas: Different personas are optimized for specific tasks (coding, writing, teaching)",
    featuresTitle: "🎯 Key Features",
    personasFeature: "Personas: Choose different AI personalities optimized for specific tasks",
    memoryFeature: "Memory: AI remembers important facts about you across conversations",
    searchFeature: "Web Search: Access current information from the internet",
    voiceFeature: "Voice: Listen to responses or talk to the AI",
    understandingTitle: "🧠 Understanding AI",
    understandingText1: "The AI doesn't have access to the internet unless you enable web search. It's trained on data up to a certain date.",
    understandingText2: "Each conversation is independent unless you enable Memory. The AI can't remember past chats without it.",
    understandingText3: "The AI generates responses word-by-word based on patterns it learned. It can sometimes make mistakes or 'hallucinate' information.",
    privacyTitle: "🔒 Privacy",
    privacyText: "Your conversations are sent to OpenRouter/OpenAI for processing. Choose local storage for memories to keep them private on your device only.",
    cancel: "Cancel",
    save: "Save",
    settingsSaved: "Settings saved!",
    preferencesUpdated: "Your preferences have been updated.",
    // AI Model section
    aiModel: "AI Model",
    chooseAiModel: "Choose Your AI Model",
    chooseAiModelDesc: "Select which AI brain powers your conversations. Each has different strengths.",
    modelCodex: "Gemini 3 Flash",
    modelCodexDesc: "Best all-around choice. Thinking model with reasoning. Great for complex tasks and everyday use.",
    modelCodexStrengths: "Deep thinking • Versatile • Great value",
    modelGemini: "Gemini 2.0 Flash",
    modelGeminiDesc: "Ultra-fast and proven stable. Best for quick answers. $0.10/$0.40 per 1M tokens.",
    modelGeminiStrengths: "Super fast • 1M context • Budget friendly",
    modelHaiku: "Claude Haiku 4.5",
    modelHaikuDesc: "Fast and smart. Great for everyday tasks, coding, and quick analysis.",
    modelHaikuStrengths: "Lightning fast • Cost effective • Versatile",
    modelGrok: "Grok 4.1 Fast",
    modelGrokDesc: "xAI's fastest model. Real-time web access, great for current events and quick research tasks.",
    modelGrokStrengths: "Real-time info • Very fast • Web connected",
    modelDeepseek: "DeepSeek V3.2",
    modelDeepseekDesc: "China's top open model. Exceptional reasoning and coding. Great value when available.",
    modelDeepseekStrengths: "Strong reasoning • Great at coding • Open source",
    speed: "Speed",
    recommended: "Recommended",
    premium: "Premium",
    budget: "Budget",
    currentModel: "Current model",
  },
  de: {
    settings: "Einstellungen",
    profile: "Profil",
    look: "Aussehen",
    search: "Suche",
    voice: "Stimme",
    memory: "Gedächtnis",
    api: "API",
    help: "Hilfe",
    advancedSettings: "Einstellungen",
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
    autoSearch: "Automatische Websuche",
    autoSearchDesc: "KI sucht automatisch im Web wenn nötig",
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
    storageLocation: "Speicherort",
    storageLocationDesc: "Wo deine Erinnerungen gespeichert werden",
    localStorage: "Lokal (Privat)",
    localStorageDesc: "Nur auf diesem Gerät speichern",
    supabaseStorage: "Supabase (Cloud)",
    supabaseStorageDesc: "Über Geräte hinweg synchronisieren",
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
    // Help section
    helpTitle: "Willkommen bei Chameleon AI",
    helpSubtitle: "Dein intelligenter Gesprächspartner",
    howItWorks: "Wie es funktioniert",
    howItWorksText1: "Chameleon AI verbindet sich über OpenRouter mit leistungsstarken Sprachmodellen (LLMs). Stell es dir wie ein Gespräch mit einem extrem wissenswerten Assistenten vor, der dir bei fast allem helfen kann.",
    howItWorksText2: "Die KI liest deine Nachrichten, versteht den Kontext und generiert hilfreiche Antworten. Sie kann schreiben, erklären, analysieren, erstellen und vieles mehr - alles in natürlicher Sprache.",
    chatTipsTitle: "💡 Tipps für bessere Gespräche",
    chatTip1: "Sei spezifisch: Statt 'Hilf mir mit Code', versuche 'Schreibe eine Python-Funktion, die eine Liste sortiert'",
    chatTip2: "Gib Kontext: Liefere Hintergrundinformationen für bessere, relevantere Antworten",
    chatTip3: "Stelle Nachfragen: Baue auf vorherige Antworten auf für tieferes Verständnis",
    chatTip4: "Frage nach Formaten: Bitte um Aufzählungspunkte, Schritt-für-Schritt-Anleitungen oder Beispiele",
    chatTip5: "Nutze Personas: Verschiedene Personas sind für spezifische Aufgaben optimiert (Programmieren, Schreiben, Lehren)",
    featuresTitle: "🎯 Hauptfunktionen",
    personasFeature: "Personas: Wähle verschiedene KI-Persönlichkeiten für spezifische Aufgaben",
    memoryFeature: "Gedächtnis: Die KI merkt sich wichtige Fakten über dich über Gespräche hinweg",
    searchFeature: "Websuche: Zugriff auf aktuelle Informationen aus dem Internet",
    voiceFeature: "Stimme: Höre Antworten an oder sprich mit der KI",
    understandingTitle: "🧠 KI verstehen",
    understandingText1: "Die KI hat keinen Zugang zum Internet, außer du aktivierst die Websuche. Sie ist auf Daten bis zu einem bestimmten Datum trainiert.",
    understandingText2: "Jedes Gespräch ist unabhängig, außer du aktivierst das Gedächtnis. Die KI kann sich ohne Gedächtnis nicht an frühere Chats erinnern.",
    understandingText3: "Die KI generiert Antworten Wort für Wort basierend auf Mustern, die sie gelernt hat. Sie kann manchmal Fehler machen oder Informationen 'halluzinieren'.",
    privacyTitle: "🔒 Datenschutz",
    privacyText: "Deine Gespräche werden zur Verarbeitung an OpenRouter/OpenAI gesendet. Wähle lokalen Speicher für Erinnerungen, um sie nur auf deinem Gerät privat zu halten.",
    cancel: "Abbrechen",
    save: "Speichern",
    settingsSaved: "Einstellungen gespeichert!",
    preferencesUpdated: "Deine Einstellungen wurden aktualisiert.",
    // Shopify section (HiFi only)
    shopify: "Shop",
    shopifyTitle: "Shopify Verbindung",
    shopifyDesc: "Verbinde deinen Shopify Store für Produktsuche und Bestandsabfragen",
    shopifyStoreUrl: "Store URL",
    shopifyStoreUrlPlaceholder: "dein-shop.myshopify.com",
    shopifyStoreUrlHelp: "Die URL deines Shopify Stores (ohne https://)",
    shopifyAccessToken: "Access Token",
    shopifyAccessTokenPlaceholder: "shpat_...",
    shopifyAccessTokenHelp: "Erstelle einen Custom App Token in den Shopify Admin Einstellungen",
    shopifyConnected: "Shopify ist verbunden! Du kannst jetzt nach Produkten fragen.",
    shopifyNotConnected: "Gib deine Shopify Daten ein um den Store zu verbinden.",
    // AI Model section
    aiModel: "KI-Modell",
    chooseAiModel: "Wähle dein KI-Modell",
    chooseAiModelDesc: "Wähle welches KI-Gehirn deine Gespräche steuert. Jedes hat unterschiedliche Stärken.",
    modelCodex: "Gemini 3 Flash",
    modelCodexDesc: "Beste Allround-Wahl. Denk-Modell mit Reasoning. Ideal für komplexe Aufgaben und alltägliche Nutzung.",
    modelCodexStrengths: "Tiefes Denken • Vielseitig • Gutes Preis-Leistungs-Verhältnis",
    modelGemini: "Gemini 2.0 Flash",
    modelGeminiDesc: "Ultraschnell und stabil. Am besten für schnelle Antworten. $0.10/$0.40 pro 1M Tokens.",
    modelGeminiStrengths: "Super schnell • 1M Kontext • Budgetfreundlich",
    modelHaiku: "Claude Haiku 4.5",
    modelHaikuDesc: "Schnell und intelligent. Ideal für alltägliche Aufgaben, Programmierung und schnelle Analysen.",
    modelHaikuStrengths: "Blitzschnell • Kostengünstig • Vielseitig",
    modelGrok: "Grok 4.1 Fast",
    modelGrokDesc: "xAIs schnellstes Modell. Echtzeit-Webzugriff, ideal für aktuelle Ereignisse und schnelle Recherchen.",
    modelGrokStrengths: "Echtzeit-Info • Sehr schnell • Web-verbunden",
    modelDeepseek: "DeepSeek V3.2",
    modelDeepseekDesc: "Chinas bestes Open-Source Modell. Hervorragendes Reasoning und Coding. Gutes Preis-Leistungs-Verhältnis.",
    modelDeepseekStrengths: "Starkes Reasoning • Coding-Profi • Open Source",
    speed: "Schnell",
    recommended: "Empfohlen",
    premium: "Premium",
    budget: "Budget",
    currentModel: "Aktuelles Modell",
  },
  es: {
    settings: "Configuración",
    profile: "Perfil",
    look: "Apariencia",
    search: "Búsqueda",
    voice: "Voz",
    memory: "Memoria",
    api: "API",
    help: "Ayuda",
    advancedSettings: "Configuración",
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
    autoSearch: "Búsqueda Web Automática",
    autoSearchDesc: "La IA busca automáticamente en la web cuando es necesario",
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
    storageLocation: "Ubicación de Almacenamiento",
    storageLocationDesc: "Dónde almacenar tus recuerdos",
    localStorage: "Local (Privado)",
    localStorageDesc: "Almacenar solo en este dispositivo",
    supabaseStorage: "Supabase (Nube)",
    supabaseStorageDesc: "Sincronizar entre dispositivos",
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
    // Help section
    helpTitle: "Bienvenido a Chameleon AI",
    helpSubtitle: "Tu compañero de conversación inteligente",
    howItWorks: "Cómo Funciona",
    howItWorksText1: "Chameleon AI se conecta a modelos de lenguaje potentes (LLMs) a través de OpenRouter. Piensa en ello como tener una conversación con un asistente extremadamente conocedor que puede ayudarte con casi cualquier cosa.",
    howItWorksText2: "La IA lee tus mensajes, entiende el contexto y genera respuestas útiles. Puede escribir, explicar, analizar, crear y mucho más - todo en lenguaje natural.",
    chatTipsTitle: "💡 Consejos para Mejores Conversaciones",
    chatTip1: "Sé específico: En lugar de 'Ayúdame con código', prueba 'Escribe una función Python que ordene una lista'",
    chatTip2: "Proporciona contexto: Da información de fondo para obtener respuestas mejores y más relevantes",
    chatTip3: "Haz preguntas de seguimiento: Construye sobre respuestas anteriores para una comprensión más profunda",
    chatTip4: "Solicita formatos: Pide listas con viñetas, guías paso a paso o ejemplos",
    chatTip5: "Usa personas: Diferentes personas están optimizadas para tareas específicas (programación, escritura, enseñanza)",
    featuresTitle: "🎯 Características Principales",
    personasFeature: "Personas: Elige diferentes personalidades de IA optimizadas para tareas específicas",
    memoryFeature: "Memoria: La IA recuerda datos importantes sobre ti a través de conversaciones",
    searchFeature: "Búsqueda Web: Accede a información actual de internet",
    voiceFeature: "Voz: Escucha respuestas o habla con la IA",
    understandingTitle: "🧠 Entendiendo la IA",
    understandingText1: "La IA no tiene acceso a internet a menos que actives la búsqueda web. Está entrenada en datos hasta una fecha determinada.",
    understandingText2: "Cada conversación es independiente a menos que actives la Memoria. La IA no puede recordar chats pasados sin ella.",
    understandingText3: "La IA genera respuestas palabra por palabra basándose en patrones que aprendió. A veces puede cometer errores o 'alucinar' información.",
    privacyTitle: "🔒 Privacidad",
    privacyText: "Tus conversaciones se envían a OpenRouter/OpenAI para procesamiento. Elige almacenamiento local para recuerdos para mantenerlos privados solo en tu dispositivo.",
    cancel: "Cancelar",
    save: "Guardar",
    settingsSaved: "¡Configuración guardada!",
    preferencesUpdated: "Tus preferencias han sido actualizadas.",
    // AI Model section
    aiModel: "Modelo IA",
    chooseAiModel: "Elige tu Modelo de IA",
    chooseAiModelDesc: "Selecciona qué cerebro de IA impulsa tus conversaciones. Cada uno tiene diferentes fortalezas.",
    modelCodex: "Gemini 3 Flash",
    modelCodexDesc: "Mejor opción general. Modelo pensante con razonamiento. Ideal para tareas complejas y uso diario.",
    modelCodexStrengths: "Pensamiento profundo • Versátil • Gran valor",
    modelGemini: "Gemini 2.0 Flash",
    modelGeminiDesc: "Ultrarápido y estable. Mejor para respuestas rápidas. $0.10/$0.40 por 1M tokens.",
    modelGeminiStrengths: "Súper rápido • 1M contexto • Económico",
    modelHaiku: "Claude Haiku 4.5",
    modelHaikuDesc: "Rápido e inteligente. Excelente para tareas diarias, programación y análisis rápidos.",
    modelHaikuStrengths: "Muy rápido • Económico • Versátil",
    modelGrok: "Grok 4.1 Fast",
    modelGrokDesc: "El modelo más rápido de xAI. Acceso web en tiempo real, ideal para eventos actuales e investigación rápida.",
    modelGrokStrengths: "Info en tiempo real • Muy rápido • Conectado a web",
    modelDeepseek: "DeepSeek V3.2",
    modelDeepseekDesc: "El mejor modelo abierto de China. Razonamiento y programación excepcionales. Gran valor cuando está disponible.",
    modelDeepseekStrengths: "Razonamiento fuerte • Excelente para código • Código abierto",
    speed: "Rápido",
    recommended: "Recomendado",
    premium: "Premium",
    budget: "Económico",
    currentModel: "Modelo actual",
  },
}

// Simple Mode curated models with user-friendly descriptions
const SIMPLE_MODE_MODELS = [
  {
    id: "google/gemini-3-flash-preview",
    badge: "recommended",
    icon: "🧠",
    color: "from-blue-500 to-cyan-500",
    borderColor: "border-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "google/gemini-2.0-flash-001",
    badge: "budget",
    icon: "⚡",
    color: "from-green-500 to-emerald-500",
    borderColor: "border-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "anthropic/claude-haiku-4.5",
    badge: "fast",
    icon: "💨",
    color: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500",
    bgColor: "bg-purple-500/10",
  },
]

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

  // Check if user is in HiFi tier - check BOTH settings AND email directly
  const userEmail = user?.email?.toLowerCase() || ""
  // Enterprise email domain is configurable via environment variable
  const enterpriseDomain = process.env.NEXT_PUBLIC_ENTERPRISE_EMAIL_DOMAIN || "@hifiteam.at"
  const isHifiByEmail = enterpriseDomain && userEmail.endsWith(enterpriseDomain.toLowerCase())
  const isHifi = isHifiTier(settings.accessTier) || isHifiByEmail

  // Get translations based on language - HiFi users ALWAYS get German
  const lang = isHifi ? "de" : (settings.language === "de" ? "de" : settings.language === "es" ? "es" : "en")
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
    html.classList.remove("dark", "girly-violet", "kawaii-pink", "aurora", "amber-pro", "ocean-breeze", "paper-mint", "clean-slate", "claude", "claude-grey", "chameleon", "soft-sunrise")
    if (theme !== "light") {
      html.classList.add(theme)
    }
    // Dark-based themes need the "dark" class for Tailwind dark: variants
    const darkThemes = ["dark", "claude-grey"]
    if (darkThemes.includes(theme)) {
      html.classList.add("dark")
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
    // Save to both localStorage (for immediate effect) and settings context (for persistence)
    localStorage.setItem("chameleon-performance-mode", String(enabled))
    setLocalSettings({
      ...localSettings,
      experimental: {
        ...localSettings.experimental,
        performanceMode: enabled
      }
    })
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
              <Sparkles className="h-5 w-5 text-primary" />
              {t.settings}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="profile" className="w-full min-w-0">
          {/* HiFi users have 8 tabs (no settings/advanced mode tab) */}
          <TabsList className={cn("grid gap-1 w-full", isHifi ? "grid-cols-8" : "grid-cols-9")}>
            <TabsTrigger value="profile" className="text-xs gap-1 px-1">
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.profile}</span>
            </TabsTrigger>
            <TabsTrigger value="model" className="text-xs gap-1 px-1">
              <Bot className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.aiModel}</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs gap-1 px-1">
              <Palette className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.look}</span>
            </TabsTrigger>
            <TabsTrigger value="search" className="text-xs gap-1 px-1">
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.search}</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="text-xs gap-1 px-1">
              <Volume2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.voice}</span>
            </TabsTrigger>
            <TabsTrigger value="memory" className="text-xs gap-1 px-1">
              <Brain className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.memory}</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="text-xs gap-1 px-1">
              <Key className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.api}</span>
            </TabsTrigger>
            {/* Help tab - Hidden for HiFi users (they have dedicated help button) */}
            {!isHifi && (
              <TabsTrigger value="help" className="text-xs gap-1 px-1">
                <HelpCircle className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.help}</span>
              </TabsTrigger>
            )}
            {/* Shopify tab for HiFi users only */}
            {isHifi && (
              <TabsTrigger value="shopify" className="text-xs gap-1 px-1">
                <ShoppingCart className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.shopify}</span>
              </TabsTrigger>
            )}
            {/* Hide settings/advanced mode tab for HiFi users - they cannot switch modes */}
            {!isHifi && (
              <TabsTrigger value="settings" className="text-xs gap-1 px-1">
                <Settings2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.advancedSettings}</span>
              </TabsTrigger>
            )}
          </TabsList>

          <div className="mt-4">
            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4 mt-0">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-lg font-bold">
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

              {/* Hide full profile edit for HiFi users - they only need name */}
              {!isHifi && (
                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={() => window.dispatchEvent(new Event("openProfile"))}
                >
                  <span>{t.editFullProfile}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </TabsContent>

            {/* AI Model Tab */}
            <TabsContent value="model" className="space-y-4 mt-0">
              <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Bot className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t.chooseAiModel}</h3>
                    <p className="text-xs text-muted-foreground">{t.chooseAiModelDesc}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Gemini 3 Flash - Recommended for all (thinking model with reasoning) */}
                <button
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, defaultModel: "google/gemini-3-flash-preview", selectedModel: "google/gemini-3-flash-preview" })}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02]",
                    (localSettings.defaultModel === "google/gemini-3-flash-preview" || localSettings.selectedModel === "google/gemini-3-flash-preview")
                      ? "border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20"
                      : "border-border/60 hover:border-blue-300 bg-background/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-2xl flex-shrink-0">
                      🧠
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">Gemini 3 Flash</span>
                        <Badge className="bg-blue-500 text-white text-[10px] px-1.5">{t.recommended}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{t.modelCodexDesc}</p>
                      <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                        <Sparkles className="h-3 w-3" />
                        <span>Thinking Model • Great Value • {t.fast}</span>
                      </div>
                    </div>
                    {(localSettings.defaultModel === "google/gemini-3-flash-preview" || localSettings.selectedModel === "google/gemini-3-flash-preview") && (
                      <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Gemini 2.5 Flash - Budget */}
                <button
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, defaultModel: "google/gemini-2.0-flash-001", selectedModel: "google/gemini-2.0-flash-001" })}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02]",
                    (localSettings.defaultModel === "google/gemini-2.0-flash-001" || localSettings.selectedModel === "google/gemini-2.0-flash-001")
                      ? "border-green-500 bg-green-500/10 ring-2 ring-green-500/20"
                      : "border-border/60 hover:border-green-300 bg-background/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-2xl flex-shrink-0">
                      ⚡
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{t.modelGemini}</span>
                        <Badge className="bg-green-500 text-white text-[10px] px-1.5">{t.budget}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{t.modelGeminiDesc}</p>
                      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                        <Zap className="h-3 w-3" />
                        <span>{t.modelGeminiStrengths}</span>
                      </div>
                    </div>
                    {(localSettings.defaultModel === "google/gemini-2.0-flash-001" || localSettings.selectedModel === "google/gemini-2.0-flash-001") && (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Claude Haiku 4.5 - Fast */}
                <button
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, defaultModel: "anthropic/claude-haiku-4.5", selectedModel: "anthropic/claude-haiku-4.5" })}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02]",
                    (localSettings.defaultModel === "anthropic/claude-haiku-4.5" || localSettings.selectedModel === "anthropic/claude-haiku-4.5")
                      ? "border-purple-500 bg-purple-500/10 ring-2 ring-purple-500/20"
                      : "border-border/60 hover:border-purple-300 bg-background/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl flex-shrink-0">
                      💨
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{t.modelHaiku}</span>
                        <Badge className="bg-purple-500 text-white text-[10px] px-1.5">Fast</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{t.modelHaikuDesc}</p>
                      <div className="flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                        <Zap className="h-3 w-3" />
                        <span>{t.modelHaikuStrengths}</span>
                      </div>
                    </div>
                    {(localSettings.defaultModel === "anthropic/claude-haiku-4.5" || localSettings.selectedModel === "anthropic/claude-haiku-4.5") && (
                      <div className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Grok 4.1 Fast - Tool calling expert */}
                <button
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, defaultModel: "x-ai/grok-4.1-fast", selectedModel: "x-ai/grok-4.1-fast" })}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02]",
                    (localSettings.defaultModel === "x-ai/grok-4.1-fast" || localSettings.selectedModel === "x-ai/grok-4.1-fast")
                      ? "border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20"
                      : "border-border/60 hover:border-orange-300 bg-background/50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-2xl flex-shrink-0">
                      🚀
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{t.modelGrok}</span>
                        <Badge className="bg-orange-500 text-white text-[10px] px-1.5">Agents</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{t.modelGrokDesc}</p>
                      <div className="flex items-center gap-1.5 text-xs text-orange-600 dark:text-orange-400">
                        <Zap className="h-3 w-3" />
                        <span>{t.modelGrokStrengths}</span>
                      </div>
                    </div>
                    {(localSettings.defaultModel === "x-ai/grok-4.1-fast" || localSettings.selectedModel === "x-ai/grok-4.1-fast") && (
                      <div className="h-5 w-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* Current model info */}
              <div className="p-3 rounded-lg bg-muted/50 border border-border/40">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">{t.currentModel}:</span>{" "}
                  <span className="font-mono">{localSettings.defaultModel || localSettings.selectedModel || "google/gemini-3-flash-preview"}</span>
                </p>
              </div>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance" className="space-y-4 mt-0">
              {/* Language Pills - Hidden for HiFi users (German only) */}
              {!isHifi && (
                <div className="space-y-2">
                  <Label className="text-sm">{t.language}</Label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { value: "en", label: "English", flag: "🇬🇧" },
                      { value: "de", label: "Deutsch", flag: "🇩🇪" },
                      { value: "es", label: "Español", flag: "🇪🇸" },
                    ].map((langOption) => (
                      <button
                        key={langOption.value}
                        type="button"
                        onClick={() => setLocalSettings({ ...localSettings, language: langOption.value as "en" | "de" | "es" })}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                          "border border-border/60 hover:border-primary/40",
                          localSettings.language === langOption.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background/50 hover:bg-primary/5"
                        )}
                      >
                        <span>{langOption.flag}</span>
                        <span>{langOption.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Theme Cards - Blocks Style */}
              <div className="space-y-2">
                <Label className="text-sm">{t.theme}</Label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[
                    { value: "light", label: "Light", bg: "bg-white", border: "border-gray-200" },
                    { value: "dark", label: "Dark", bg: "bg-gray-900", border: "border-gray-700" },
                    { value: "soft-sunrise", label: "Sunrise 🌅", bg: "bg-gradient-to-br from-orange-100 via-rose-100 to-purple-100", border: "border-orange-300" },
                    { value: "claude", label: "Claude 🧡", bg: "bg-gradient-to-br from-orange-50 to-amber-100", border: "border-orange-300" },
                    { value: "chameleon", label: "Chameleon 🦎", bg: "bg-gradient-to-br from-emerald-100 via-teal-100 to-lime-50", border: "border-emerald-300" },
                    { value: "girly-violet", label: "Violet", bg: "bg-gradient-to-br from-pink-100 to-purple-200", border: "border-pink-300" },
                    { value: "kawaii-pink", label: "Kawaii 💖", bg: "bg-gradient-to-br from-pink-200 via-pink-100 to-purple-100", border: "border-pink-400" },
                    { value: "aurora", label: "Aurora ✨", bg: "bg-gradient-to-br from-violet-100 via-indigo-50 to-orange-50", border: "border-violet-400" },
                    { value: "amber-pro", label: "Amber Pro 🔶", bg: "bg-gradient-to-br from-orange-100 to-amber-200", border: "border-orange-500" },
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
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-transparent hover:border-primary/30"
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
                        "border border-border/60 hover:border-primary/40",
                        size.size,
                        localSettings.fontSize === size.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background/50 hover:bg-primary/5"
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

              {/* Auto search toggle - hidden for HiFi (tool calling is always enabled) */}
              {!isHifi && (
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label className="text-sm">{t.autoSearch}</Label>
                    <p className="text-xs text-muted-foreground">{t.autoSearchDesc}</p>
                  </div>
                  <Switch
                    checked={localSettings.enableAutoToolUse ?? (!isHifi)}
                    onCheckedChange={(checked) =>
                      setLocalSettings({
                        ...localSettings,
                        enableAutoToolUse: checked,
                      })
                    }
                  />
                </div>
              )}

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
                  checked={localSettings.memorySettings?.enabled ?? (!isHifi)}
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

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t.storageLocation}</Label>
                    <p className="text-xs text-muted-foreground">{t.storageLocationDesc}</p>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            memorySettings: {
                              ...localSettings.memorySettings!,
                              syncToDatabase: false,
                            },
                          })
                        }
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all",
                          !localSettings.memorySettings?.syncToDatabase
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted/30 hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{t.localStorage}</div>
                            <div className="text-xs text-muted-foreground">{t.localStorageDesc}</div>
                          </div>
                          {!localSettings.memorySettings?.syncToDatabase && (
                            <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setLocalSettings({
                            ...localSettings,
                            memorySettings: {
                              ...localSettings.memorySettings!,
                              syncToDatabase: true,
                            },
                          })
                        }
                        className={cn(
                          "w-full p-3 rounded-lg border text-left transition-all",
                          localSettings.memorySettings?.syncToDatabase
                            ? "border-primary bg-primary/10"
                            : "border-border bg-muted/30 hover:border-primary/40"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{t.supabaseStorage}</div>
                            <div className="text-xs text-muted-foreground">{t.supabaseStorageDesc}</div>
                          </div>
                          {localSettings.memorySettings?.syncToDatabase && (
                            <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => window.dispatchEvent(new Event("openMemory"))}
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

            {/* Help Tab - Hidden for HiFi users (they have dedicated help button) */}
            {!isHifi && (
            <TabsContent value="help" className="space-y-4 mt-0">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <HelpCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t.helpTitle}</h3>
                    <p className="text-xs text-muted-foreground">{t.helpSubtitle}</p>
                  </div>
                </div>
              </div>

              {/* How It Works */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  {t.howItWorks}
                </h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>{t.howItWorksText1}</p>
                  <p>{t.howItWorksText2}</p>
                </div>
              </div>

              {/* Chat Tips */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t.chatTipsTitle}</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-none">
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{t.chatTip1}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{t.chatTip2}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{t.chatTip3}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{t.chatTip4}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{t.chatTip5}</span>
                  </li>
                </ul>
              </div>

              {/* Key Features */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t.featuresTitle}</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-none">
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>{t.personasFeature}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>{t.memoryFeature}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>{t.searchFeature}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-500">•</span>
                    <span>{t.voiceFeature}</span>
                  </li>
                </ul>
              </div>

              {/* Understanding AI */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">{t.understandingTitle}</h4>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-none">
                  <li className="flex gap-2">
                    <span className="text-amber-500">•</span>
                    <span>{t.understandingText1}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500">•</span>
                    <span>{t.understandingText2}</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-amber-500">•</span>
                    <span>{t.understandingText3}</span>
                  </li>
                </ul>
              </div>

              {/* Privacy */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <h4 className="font-semibold text-sm mb-1">{t.privacyTitle}</h4>
                <p className="text-xs text-muted-foreground">{t.privacyText}</p>
              </div>
            </TabsContent>
            )}

            {/* Shopify Tab - HiFi users only */}
            {isHifi && (
              <TabsContent value="shopify" className="space-y-4 mt-0">
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t.shopifyTitle}</h3>
                      <p className="text-xs text-muted-foreground">{t.shopifyDesc}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shopify-store-url" className="text-sm font-medium">
                      {t.shopifyStoreUrl}
                    </Label>
                    <Input
                      id="shopify-store-url"
                      placeholder={t.shopifyStoreUrlPlaceholder}
                      value={localSettings.shopifySettings?.storeUrl || ""}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          shopifySettings: {
                            ...localSettings.shopifySettings,
                            storeUrl: e.target.value,
                          },
                        })
                      }
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">{t.shopifyStoreUrlHelp}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shopify-access-token" className="text-sm font-medium">
                      {t.shopifyAccessToken}
                    </Label>
                    <Input
                      id="shopify-access-token"
                      type="password"
                      placeholder={t.shopifyAccessTokenPlaceholder}
                      value={localSettings.shopifySettings?.accessToken || ""}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          shopifySettings: {
                            ...localSettings.shopifySettings,
                            accessToken: e.target.value,
                          },
                        })
                      }
                      className="h-10"
                    />
                    <p className="text-xs text-muted-foreground">{t.shopifyAccessTokenHelp}</p>
                  </div>
                </div>

                {localSettings.shopifySettings?.storeUrl && localSettings.shopifySettings?.accessToken ? (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <span>✓</span> {t.shopifyConnected}
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-600 dark:text-amber-400">
                      {t.shopifyNotConnected}
                    </p>
                  </div>
                )}
              </TabsContent>
            )}

            {/* Settings Tab - Hidden for HiFi users (cannot switch modes) */}
            {!isHifi && (
              <TabsContent value="settings" className="space-y-4 mt-0">
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                      <Settings2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{t.advancedMode}</h3>
                      <p className="text-xs text-muted-foreground">{t.canSwitchBack}</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full justify-between"
                  onClick={switchToAdvancedMode}
                >
                  <span>{t.switchToAdvanced}</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </TabsContent>
            )}
          </div>
        </Tabs>

        {/* Footer */}
        <div className="flex flex-col gap-2 pt-3 border-t flex-shrink-0 mt-2">

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t.cancel}
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:brightness-95 active:brightness-90">
              {t.save}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
