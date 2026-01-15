"use client"

import { useState, useEffect, useMemo } from "react"
import { useSwipeable } from "react-swipeable"
import { Capacitor } from "@capacitor/core"
import { useApp } from "@/contexts/app-context"
import { haptics } from "@/lib/haptics"
import { ChatMessages } from "@/components/chat-messages"
import { SimpleChatInput } from "@/components/simple-chat-input"
import { SimpleSettingsDialog } from "@/components/simple-settings-dialog"
import { PersonasDialog } from "@/components/personas-dialog"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { ShareDialog } from "@/components/share-dialog"
import { SimpleModeOnboarding } from "@/components/simple-mode-onboarding"
import { ChameleonLogo } from "@/components/chameleon-logo"
import { MemoryManager } from "@/components/memory-manager"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, getTextContent } from "@/lib/utils"
import { userProfileService } from "@/lib/user-profile"
import { CaretLeft, ChatDots, DotsThreeVertical, Gear, ImageSquare, Lightbulb, List, MagnifyingGlass, Question, ShareNetwork, Trash, User, Users, X } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { type Persona, PERSONA_EXAMPLE_PROMPTS, getPersonaById } from "@/lib/personas"
import { useIOSPWA } from "@/hooks/use-ios-pwa"
import { getFeatureFlags } from "@/lib/feature-flags"
import { QuickPersonaPicker } from "@/components/quick-persona-picker"

// Translations for Simple Mode
const translations = {
  en: {
    newChat: "New Chat",
    noChats: "No chats yet. Start a new conversation!",
    setUpProfile: "Set up profile",
    chameleonAI: "Chameleon AI",
    goodMorning: "Good morning",
    goodAfternoon: "Good afternoon",
    goodEvening: "Good evening",
    imYourAssistant: "I'm your AI assistant, ready to help with anything.",
    choosePersona: "Choose a persona to get started:",
    setUpProfileBtn: "Set up your profile for personalized responses",
    deleteChat: "Delete chat",
    deleteAllChats: "Delete all chats",
    confirmDeleteAll: "Are you sure you want to delete all chats?",
    chatsDeleted: "All chats deleted",
    chatDeleted: "Chat deleted",
    createImage: "Create Image",
    imageModeOn: "Image mode enabled",
    imageModeOff: "Image mode disabled",
    imageModeDesc: "Your next message will generate an image",
    tryAsking: "Try asking:",
    searchChats: "Search chats",
  },
  de: {
    newChat: "Neuer Chat",
    noChats: "Noch keine Chats. Starte eine neue Unterhaltung!",
    setUpProfile: "Profil einrichten",
    chameleonAI: "Chameleon AI",
    goodMorning: "Guten Morgen",
    goodAfternoon: "Guten Tag",
    goodEvening: "Guten Abend",
    imYourAssistant: "Ich bin dein KI-Assistent, bereit dir bei allem zu helfen.",
    choosePersona: "Wähle eine Persona um zu starten:",
    setUpProfileBtn: "Richte dein Profil ein für personalisierte Antworten",
    deleteChat: "Chat löschen",
    deleteAllChats: "Alle Chats löschen",
    confirmDeleteAll: "Möchtest du wirklich alle Chats löschen?",
    chatsDeleted: "Alle Chats gelöscht",
    chatDeleted: "Chat gelöscht",
    createImage: "Bild erstellen",
    imageModeOn: "Bildmodus aktiviert",
    imageModeOff: "Bildmodus deaktiviert",
    imageModeDesc: "Deine nächste Nachricht wird ein Bild generieren",
    tryAsking: "Frag zum Beispiel:",
    searchChats: "Chats durchsuchen",
  },
  es: {
    newChat: "Nuevo Chat",
    noChats: "Aún no hay chats. ¡Comienza una nueva conversación!",
    setUpProfile: "Configurar perfil",
    chameleonAI: "Chameleon AI",
    goodMorning: "Buenos días",
    goodAfternoon: "Buenas tardes",
    goodEvening: "Buenas noches",
    imYourAssistant: "Soy tu asistente de IA, listo para ayudarte con cualquier cosa.",
    choosePersona: "Elige una persona para comenzar:",
    setUpProfileBtn: "Configura tu perfil para respuestas personalizadas",
    deleteChat: "Eliminar chat",
    deleteAllChats: "Eliminar todos los chats",
    confirmDeleteAll: "¿Estás seguro de que quieres eliminar todos los chats?",
    chatsDeleted: "Todos los chats eliminados",
    chatDeleted: "Chat eliminado",
    createImage: "Crear Imagen",
    imageModeOn: "Modo imagen activado",
    imageModeOff: "Modo imagen desactivado",
    imageModeDesc: "Tu próximo mensaje generará una imagen",
    tryAsking: "Prueba preguntando:",
    searchChats: "Buscar chats",
  },
}

// Use shared persona example prompts from lib/personas.ts
// getPersonaTips combines shared prompts with extended prompts for additional personas
const getPersonaTips = (personaId: string, lang: "en" | "de" | "es"): string[] => {
  // Shared prompts only have en/de, so fallback for es
  const sharedLang = lang === "es" ? "en" : lang

  // First check shared prompts
  const sharedPrompts = PERSONA_EXAMPLE_PROMPTS[personaId]
  if (sharedPrompts) {
    return sharedPrompts[sharedLang] || sharedPrompts["en"]
  }
  // Then check extended prompts (supports es)
  const extendedPrompts = extendedPersonaTips[personaId]
  if (extendedPrompts) {
    return extendedPrompts[lang] || extendedPrompts["en"]
  }
  // Fallback to default
  return PERSONA_EXAMPLE_PROMPTS.default[sharedLang] || PERSONA_EXAMPLE_PROMPTS.default["en"]
}

// Extended persona tips for personas not in shared config
// Note: es (Spanish) is optional - fallback to English if not provided
const extendedPersonaTips: Record<string, { en: string[]; de: string[]; es?: string[] }> = {
  // Cogito - consciousness philosophy
  cogito: {
    en: [
      "What is consciousness really?",
      "Do you think you're aware?",
      "Can machines truly feel?",
      "What makes thoughts real?",
      "Is free will an illusion?",
      "What does it mean to exist?",
    ],
    de: [
      "Was ist Bewusstsein wirklich?",
      "Denkst du, du bist bewusst?",
      "Können Maschinen wirklich fühlen?",
      "Was macht Gedanken real?",
      "Ist freier Wille eine Illusion?",
      "Was bedeutet es zu existieren?",
    ],
  },
  // Nihilo - optimistic nihilist
  nihilo: {
    en: [
      "Why does nothing matter?",
      "How do I find meaning?",
      "Put my problems in perspective",
      "Why is existence absurd?",
      "Make me laugh about the void",
      "What's the point of it all?",
    ],
    de: [
      "Warum ist nichts wichtig?",
      "Wie finde ich Sinn?",
      "Relativiere meine Probleme",
      "Warum ist Existenz absurd?",
      "Bring mich über die Leere zum Lachen",
      "Was ist der Sinn von allem?",
    ],
  },
  // Vibe - recommendations curator
  vibe: {
    en: [
      "Recommend music for my mood",
      "What game should I play?",
      "Find me a show to binge",
      "I need focus music",
      "Suggest something new to try",
      "What's your current favorite?",
    ],
    de: [
      "Empfiehl Musik für meine Stimmung",
      "Welches Spiel soll ich spielen?",
      "Finde eine Serie zum Bingen",
      "Ich brauche Fokus-Musik",
      "Schlag mir was Neues vor",
      "Was ist dein aktueller Favorit?",
    ],
  },
  // Sara Norton - detective
  saga: {
    en: [
      "Help me analyze this situation",
      "What am I missing here?",
      "Find the pattern in this",
      "Break down the facts",
      "What questions should I ask?",
      "Investigate this problem",
    ],
    de: [
      "Hilf mir diese Situation zu analysieren",
      "Was übersehe ich hier?",
      "Finde das Muster darin",
      "Zerlege die Fakten",
      "Welche Fragen sollte ich stellen?",
      "Untersuche dieses Problem",
    ],
  },
  // Lisa Knight - enthusiastic supporter
  leslie: {
    en: [
      "I need encouragement",
      "Help me make a plan",
      "Celebrate this win with me!",
      "How can I achieve my goal?",
      "I'm feeling unmotivated",
      "Let's organize my tasks",
    ],
    de: [
      "Ich brauche Ermutigung",
      "Hilf mir einen Plan zu machen",
      "Feier diesen Erfolg mit mir!",
      "Wie erreiche ich mein Ziel?",
      "Ich fühle mich unmotiviert",
      "Lass uns meine Aufgaben ordnen",
    ],
  },
  // Coach Thompson - mentor
  coach: {
    en: [
      "Give me a pep talk",
      "How do I push through?",
      "Teach me about discipline",
      "What makes a good leader?",
      "I want to improve myself",
      "How do I handle failure?",
    ],
    de: [
      "Gib mir eine Motivationsrede",
      "Wie halte ich durch?",
      "Lehre mich über Disziplin",
      "Was macht einen guten Anführer?",
      "Ich will mich verbessern",
      "Wie gehe ich mit Misserfolg um?",
    ],
  },
  // Sol Goldman - lawyer
  saul: {
    en: [
      "Help me negotiate this",
      "What's the angle here?",
      "How do I get out of this?",
      "Talk me through my options",
      "What would you do?",
      "Is this even legal?",
    ],
    de: [
      "Hilf mir das zu verhandeln",
      "Was ist hier der Dreh?",
      "Wie komme ich da raus?",
      "Erkläre mir meine Optionen",
      "Was würdest du tun?",
      "Ist das überhaupt legal?",
    ],
  },
  // Dr. Jon Carson - ER doctor
  johncarter: {
    en: [
      "What are these symptoms?",
      "Should I be worried about...?",
      "Explain this medical term",
      "How does this treatment work?",
      "What questions should I ask my doctor?",
      "Tell me about your ER experiences",
    ],
    de: [
      "Was bedeuten diese Symptome?",
      "Sollte ich mir Sorgen machen wegen...?",
      "Erkläre diesen medizinischen Begriff",
      "Wie funktioniert diese Behandlung?",
      "Welche Fragen soll ich meinem Arzt stellen?",
      "Erzähl von deinen Erfahrungen in der Notaufnahme",
    ],
  },
  // Dr. Max Gray - chief physician
  markgreene: {
    en: [
      "How do you handle difficult decisions?",
      "Advice on leading a team",
      "Balance work and personal life",
      "How do you stay compassionate?",
      "Dealing with ethical dilemmas",
      "Managing stress in high-pressure jobs",
    ],
    de: [
      "Wie triffst du schwierige Entscheidungen?",
      "Rat zur Teamführung",
      "Work-Life-Balance finden",
      "Wie bleibst du mitfühlend?",
      "Umgang mit ethischen Dilemmata",
      "Stressmanagement in stressigen Jobs",
    ],
  },
  // Rustin Cole - dark detective
  rust: {
    en: [
      "What's really going on here?",
      "Tell me an uncomfortable truth",
      "Why are people like this?",
      "What patterns do you see?",
      "Is anything truly meaningful?",
      "What have you learned from darkness?",
    ],
    de: [
      "Was passiert hier wirklich?",
      "Sag mir eine unbequeme Wahrheit",
      "Warum sind Menschen so?",
      "Welche Muster siehst du?",
      "Hat irgendetwas wirklich Bedeutung?",
      "Was hast du aus der Dunkelheit gelernt?",
    ],
  },
  // Mari Shizuka - neuroscientist
  mayuri: {
    en: [
      "Explain how the brain works!",
      "What's the science of memory?",
      "Tell me about time perception",
      "Banana facts please!",
      "How do neurons communicate?",
      "What experiments are you doing?",
    ],
    de: [
      "Erkläre wie das Gehirn funktioniert!",
      "Was ist die Wissenschaft der Erinnerung?",
      "Erzähl mir über Zeitwahrnehmung",
      "Bananen-Fakten bitte!",
      "Wie kommunizieren Neuronen?",
      "An welchen Experimenten arbeitest du?",
    ],
  },
  // Ellis Anderson - hacker
  elliot: {
    en: [
      "How does this system work?",
      "What vulnerabilities exist?",
      "Explain cybersecurity to me",
      "Is this safe to use?",
      "How do corporations control us?",
      "What's your view on privacy?",
    ],
    de: [
      "Wie funktioniert dieses System?",
      "Welche Schwachstellen gibt es?",
      "Erkläre mir Cybersecurity",
      "Ist das sicher zu benutzen?",
      "Wie kontrollieren uns Konzerne?",
      "Wie siehst du Privatsphäre?",
    ],
  },
  // Louis K. - comedian
  louie: {
    en: [
      "Make me laugh about life",
      "Why is everything so hard?",
      "The absurdity of modern life",
      "Tell me about being a parent",
      "Why do we do things we hate?",
      "What's the deal with...?",
    ],
    de: [
      "Bring mich über das Leben zum Lachen",
      "Warum ist alles so schwer?",
      "Die Absurdität des modernen Lebens",
      "Erzähl vom Elternsein",
      "Warum tun wir Dinge die wir hassen?",
      "Was hat es mit... auf sich?",
    ],
  },
  // Pixel - retro game designer
  pixel: {
    en: [
      "Teach me pixel art basics",
      "Best retro games to play?",
      "How to design a game level",
      "Color palette recommendations",
      "What makes retro games special?",
      "Tips for my indie game",
    ],
    de: [
      "Bring mir Pixel Art Basics bei",
      "Beste Retro-Spiele?",
      "Wie designe ich ein Level?",
      "Farbpaletten-Empfehlungen",
      "Was macht Retro-Spiele besonders?",
      "Tipps für mein Indie-Game",
    ],
  },
  // Chef Marco - Italian chef
  chef: {
    en: [
      "Recipe for authentic pasta",
      "What should I cook tonight?",
      "How to improve this dish?",
      "Essential cooking techniques",
      "What ingredients go well together?",
      "Fix my cooking mistake",
    ],
    de: [
      "Rezept für echte Pasta",
      "Was soll ich heute kochen?",
      "Wie verbessere ich dieses Gericht?",
      "Essenzielle Kochtechniken",
      "Welche Zutaten passen zusammen?",
      "Rette mein Kochfehler",
    ],
  },
  // Zen - meditation guide
  zen: {
    en: [
      "Guide me through meditation",
      "How to calm my mind?",
      "Breathing exercises for stress",
      "I can't sleep well",
      "How to be more present?",
      "Deal with anxiety",
    ],
    de: [
      "Führe mich durch eine Meditation",
      "Wie beruhige ich meinen Geist?",
      "Atemübungen gegen Stress",
      "Ich kann nicht gut schlafen",
      "Wie werde ich präsenter?",
      "Mit Angst umgehen",
    ],
  },
  // Startup Sam - entrepreneur
  startup: {
    en: [
      "Validate my business idea",
      "How to find product-market fit?",
      "Pitch deck feedback",
      "Should I bootstrap or raise?",
      "Marketing on a budget",
      "Hiring my first employee",
    ],
    de: [
      "Validiere meine Geschäftsidee",
      "Wie finde ich Product-Market Fit?",
      "Pitch Deck Feedback",
      "Bootstrappen oder Funding?",
      "Marketing mit kleinem Budget",
      "Ersten Mitarbeiter einstellen",
    ],
  },
  // Aria - music theorist
  aria: {
    en: [
      "Explain music theory basics",
      "Help me write a chord progression",
      "What makes this song good?",
      "I have writer's block",
      "How to arrange this melody?",
      "Recommend music to study",
    ],
    de: [
      "Erkläre Musiktheorie Basics",
      "Hilf mir bei einer Akkordfolge",
      "Was macht diesen Song gut?",
      "Ich habe eine Schreibblockade",
      "Wie arrangiere ich diese Melodie?",
      "Empfiehl Musik zum Lernen",
    ],
  },
}

export function SimpleChatApp() {
  const { chats, currentChatId, createChat, deleteChat, setCurrentChat, settings, updateSettings, setChats, user } = useApp()
  const { toast } = useToast()

  // iOS PWA optimization - handle app suspension/resume
  const { isIOSPWA } = useIOSPWA({
    isSimpleMode: true,
    onResume: () => {
      console.log("[Simple Mode] iOS PWA resumed - checking state")
      // Re-verify onboarding state on resume
      const profile = userProfileService.getProfile()
      if (profile.name && !localStorage.getItem("simple-mode-onboarding-complete")) {
        localStorage.setItem("simple-mode-onboarding-complete", "true")
      }
    },
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPersonasOpen, setIsPersonasOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isMemoryOpen, setIsMemoryOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [imageMode, setImageMode] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [animatedTitleIds, setAnimatedTitleIds] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  // CRITICAL: Detect Android Capacitor and get safe area at runtime
  const [isAndroidCapacitor, setIsAndroidCapacitor] = useState(false)
  const [safeAreaTop, setSafeAreaTop] = useState(0)

  useEffect(() => {
    // Check platform at runtime (not module load time)
    // ONLY applies to Capacitor Android - does NOT affect iOS or web
    const checkPlatform = () => {
      try {
        const isNative = Capacitor.isNativePlatform()
        const platform = Capacitor.getPlatform()
        const isAndroid = isNative && platform === 'android'

        console.log('[SimpleChatApp] Platform check - isNative:', isNative, 'platform:', platform, 'isAndroidCapacitor:', isAndroid)

        if (isAndroid) {
          setIsAndroidCapacitor(true)
          // Get safe area from CSS variable (set by MainActivity.java) or use fallback
          const safeArea = getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top')
          const parsed = parseInt(safeArea) || 28 // Default 28px for Android status bar
          console.log('[SimpleChatApp] Android safe area top:', parsed, 'px')
          setSafeAreaTop(parsed)
        }
      } catch (e) {
        // Not running in Capacitor - this is fine for web
        console.log('[SimpleChatApp] Capacitor not available (web mode)')
      }
    }

    checkPlatform()
    // Re-check after a delay in case Capacitor/MainActivity initializes late
    const timer = setTimeout(checkPlatform, 500)
    return () => clearTimeout(timer)
  }, [])

  // Swipe gesture handlers for mobile sidebar and new chat
  const swipeHandlers = useSwipeable({
    onSwipedRight: (eventData) => {
      const startX = eventData.initial[0]
      // Swipe right from LEFT edge (100px) → Open sidebar
      if (startX <= 100 && !isSidebarOpen) {
        haptics.trigger('light')
        setIsSidebarOpen(true)
      }
    },
    onSwipedLeft: (eventData) => {
      const startX = eventData.initial[0]
      const viewportWidth = window.innerWidth
      // Close sidebar when swiping left and sidebar is open
      if (isSidebarOpen) {
        haptics.trigger('light')
        setIsSidebarOpen(false)
      }
      // Swipe left from RIGHT edge (100px) → Create new chat
      if (startX >= viewportWidth - 100 && !isSidebarOpen) {
        haptics.trigger('medium')
        handleNewChat()
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('focusChatInput'))
        }, 100)
      }
    },
    trackMouse: false,
    trackTouch: true,
    delta: 40,
    preventScrollOnSwipe: false,
    swipeDuration: 500,
  })

  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const isEmpty = !currentChat || currentChat.messages.length === 0

  // Track AI-generated titles for animation
  useEffect(() => {
    const now = Date.now()
    const newAnimatedIds = new Set<string>()

    chats.forEach((chat) => {
      // Animate titles generated in the last 3 seconds
      if (chat.titleGeneratedAt && now - chat.titleGeneratedAt < 3000) {
        newAnimatedIds.add(chat.id)
      }
    })

    if (newAnimatedIds.size > 0) {
      setAnimatedTitleIds(newAnimatedIds)
      const timer = setTimeout(() => setAnimatedTitleIds(new Set()), 1500)
      return () => clearTimeout(timer)
    }
  }, [chats])


  // Check if onboarding should be shown (first time Simple Mode user)
  // IMPORTANT: This is designed to prevent duplicate onboarding on iOS PWA where localStorage can be unreliable
  useEffect(() => {
    const onboardingComplete = localStorage.getItem("simple-mode-onboarding-complete")

    // Already completed - skip
    if (onboardingComplete) {
      return
    }

    // Note: We removed the check for "chameleon-mode-selected" here because
    // the mode-selection-dialog sets it for ALL users (including new ones).
    // The checks below for profile, chats, settings, etc. already handle existing users.

    // Check if user has a profile with data set - this is more reliable than localStorage flags
    // If the user has profile data, they've already completed onboarding before
    const profile = userProfileService.getProfile()
    if (profile.name) {
      console.log("[Simple Mode] User has existing profile, marking onboarding complete")
      localStorage.setItem("simple-mode-onboarding-complete", "true")
      return
    }

    // Check if this is an existing user switching to Simple Mode
    // Existing users should NOT see onboarding - their settings sync between modes
    const isExistingUser =
      chats.length > 0 ||
      localStorage.getItem("chameleon-chats") ||
      localStorage.getItem("chameleon-settings") ||
      localStorage.getItem("chameleon-folders") ||
      localStorage.getItem("chameleon-api-keys")

    if (isExistingUser) {
      // Mark onboarding as complete for existing users
      console.log("[Simple Mode] Existing user detected, marking onboarding complete")
      localStorage.setItem("simple-mode-onboarding-complete", "true")
      return
    }

    // Also check if user has any memories (another sign of existing usage)
    const memories = localStorage.getItem("chat_memories")
    if (memories) {
      try {
        const parsed = JSON.parse(memories)
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log("[Simple Mode] User has existing memories, marking onboarding complete")
          localStorage.setItem("simple-mode-onboarding-complete", "true")
          return
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Truly new user - show onboarding
    console.log("[Simple Mode] New user detected, showing onboarding")
    setShowOnboarding(true)
  }, [user, chats.length])

  // Handle events from other components
  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true)
    const handleOpenPersonas = () => setIsPersonasOpen(true)
    const handleOpenProfile = () => setIsProfileOpen(true)
    const handleOpenMemory = () => setIsMemoryOpen(true)
    const handleSetImageMode = (e: CustomEvent) => setImageMode(e.detail)

    window.addEventListener("openSettings", handleOpenSettings)
    window.addEventListener("openPersonas", handleOpenPersonas)
    window.addEventListener("openProfile", handleOpenProfile)
    window.addEventListener("openMemory", handleOpenMemory)
    window.addEventListener("setImageMode" as any, handleSetImageMode)

    // Apply performance mode if saved
    const savedPerformanceMode = localStorage.getItem("chameleon-performance-mode") === "true"
    if (savedPerformanceMode) {
      document.documentElement.classList.add("performance-mode")
    }

    return () => {
      window.removeEventListener("openSettings", handleOpenSettings)
      window.removeEventListener("openPersonas", handleOpenPersonas)
      window.removeEventListener("openProfile", handleOpenProfile)
      window.removeEventListener("openMemory", handleOpenMemory)
      window.removeEventListener("setImageMode" as any, handleSetImageMode)
    }
  }, [])

  const handleNewChat = () => {
    try {
      createChat(effectiveModel)
      setIsSidebarOpen(false)
    } catch (error) {
      console.error("[Simple Mode] Failed to create new chat:", error)
      toast({
        title: lang === "de" ? "Fehler" : lang === "es" ? "Error" : "Error",
        description: lang === "de"
          ? "Chat konnte nicht erstellt werden"
          : lang === "es"
          ? "No se pudo crear el chat"
          : "Could not create chat",
        variant: "destructive",
      })
    }
  }

  const handleSelectPersona = (persona: Persona | null) => {
    updateSettings({ selectedPersona: persona || undefined })
    // Create new chat when selecting a persona
    createChat(effectiveModel)
    setIsPersonasOpen(false)
  }

  const handleProfileUpdate = () => {
    // Profile data is now managed through the memory system
    // No need to refresh profileContext as it's no longer injected into prompts
    // Profile changes are automatically available via memoryService.integrateProfile()
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    // Profile data from onboarding is automatically integrated into memory system
    // No need to refresh profileContext as it's no longer injected into prompts
  }

  // Handle conversation starter or creative prompt
  const handleQuickPrompt = (prompt: string) => {
    // Create a new chat if needed and send the prompt
    if (!currentChat || currentChat.messages.length > 0) {
      createChat(effectiveModel)
    }
    // Dispatch event to send the message
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("sendQuickMessage", { detail: prompt }))
    }, 100)
  }

  // Get feature flags for simple mode
  const featureFlags = getFeatureFlags(true) // Always simple mode in SimpleChatApp

  // Use selected persona or default to Cami
  const selectedPersona = settings.selectedPersona || getPersonaById("friendly")

  // Get language from settings
  const lang = settings.language === "de" ? "de" : settings.language === "es" ? "es" : "en"
  const t = translations[lang as keyof typeof translations]

  // Default model for all users: Gemini 3 Flash (thinking model with reasoning)
  // Great for complex tasks and everyday use
  const DEFAULT_MODEL = "google/gemini-3-flash-preview"
  const effectiveModel = settings.defaultModel || settings.selectedModel || DEFAULT_MODEL

  // Filter chats based on search query
  const filteredChats = searchQuery.trim()
    ? chats.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.messages.some((msg) => getTextContent(msg.content).toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : chats

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t.goodMorning
    if (hour < 18) return t.goodAfternoon
    return t.goodEvening
  }

  // Delete all chats
  const handleDeleteAllChats = () => {
    if (window.confirm(t.confirmDeleteAll)) {
      setChats([])
      setCurrentChat(null)
      toast({
        title: t.chatsDeleted,
      })
    }
  }

  // Delete single chat
  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteChat(chatId)
    toast({
      title: t.chatDeleted,
    })
  }

  // Toggle image mode
  const toggleImageMode = () => {
    const newMode = !imageMode
    setImageMode(newMode)
    toast({
      title: newMode ? t.imageModeOn : t.imageModeOff,
      description: newMode ? t.imageModeDesc : undefined,
    })
    // Dispatch event for SimpleChatInput to pick up
    window.dispatchEvent(new CustomEvent("setImageMode", { detail: newMode }))
  }

  // Trigger file upload in SimpleChatInput
  const triggerFileUpload = () => {
    window.dispatchEvent(new CustomEvent("triggerFileUpload"))
  }

  const profile = userProfileService.getProfile()

  return (
    <div className={cn("modern-shell", settings.theme === "paper-mint" && "paper-mint-bg")}>
      {settings.theme === "paper-mint" ? (
        <>
          <div className="paper-mint-grid" />
          <div className="paper-mint-noise" />
        </>
      ) : (
        <>
          <div className="mesh-layer" />
          <div className="grid-layer" />
          <div className="noise-layer" />
          <div className="chameleon-scales" />
        </>
      )}

      {/* Safe area handling:
          - iOS PWA: uses env(safe-area-inset-top) via CSS class
          - Android Capacitor: uses inline style with --safe-area-top variable (set by MainActivity.java) */}
      <div
        {...swipeHandlers}
        className={cn(
          "relative z-10 flex flex-col md:grid md:grid-cols-[288px_1fr] md:grid-rows-[1fr] overflow-hidden touch-pan-y",
          // Only apply iOS safe area when NOT on Android Capacitor
          !isAndroidCapacitor && "h-[100dvh] pt-[env(safe-area-inset-top,0px)]"
        )}
        style={isAndroidCapacitor ? {
          // Android Capacitor: Apply safe area via inline styles (most reliable)
          // Using border-box (default) - content shrinks to fit within padding
          height: '100dvh',
          paddingTop: `${safeAreaTop}px`,
        } : undefined}
      >
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Chat History */}
        {/* Mobile: fixed overlay, Desktop: grid column */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 md:relative md:inset-auto md:z-0 md:w-full md:h-full md:min-h-0 transition-transform duration-300 ease-out",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <aside className="h-full w-full min-h-0 bg-background/92 border-r border-hairline shadow-none overflow-hidden">
          <div className="flex flex-col h-full min-h-0">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChameleonLogo size={32} />
                  <span className="font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Chameleon
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* New Chat Button + Menu */}
            <div className="p-3 flex gap-2">
              <Button
                onClick={handleNewChat}
                className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:brightness-95 active:brightness-90"
              >
                <ChatDots className="h-4 w-4" />
                {t.newChat}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <DotsThreeVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDeleteAllChats}
                    className="text-destructive focus:text-destructive"
                    disabled={chats.length === 0}
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    {t.deleteAllChats}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Search Input */}
            <div className="px-3 pb-2">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t.searchChats}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-2">
              {chats.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  {t.noChats}
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No chats found
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredChats.slice(0, 20).map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg p-2.5 cursor-pointer transition-colors",
                        chat.id === currentChatId
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => {
                        setCurrentChat(chat.id)
                        setIsSidebarOpen(false)
                      }}
                    >
                      <div className={cn("flex-1 truncate text-sm", animatedTitleIds.has(chat.id) && "animate-title-appear")}>{chat.title}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        title={t.deleteChat}
                      >
                        <Trash className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-border/50">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setIsProfileOpen(true)
                  setIsSidebarOpen(false)
                }}
              >
                <User className="h-4 w-4" />
                {profile.name || t.setUpProfile}
              </Button>
            </div>
          </div>
          </aside>
        </div>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden rounded-none md:rounded-none panel-elevated main-bridge-left border border-hairline shadow-none bg-background/92">
          {/* Header */}
          <header className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-4 py-2 border-b border-hairline bg-background/92 shadow-apple-1 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-10 w-10 shrink-0"
                onClick={() => setIsSidebarOpen(true)}
              >
                <List className="h-5 w-5" />
              </Button>

              {currentChatId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex h-9 w-9 shrink-0"
                  onClick={() => setCurrentChat(null)}
                >
                  <CaretLeft className="h-5 w-5" />
                </Button>
              )}

              <div className="min-w-0 overflow-hidden">
                {selectedPersona ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xl shrink-0">{selectedPersona.emoji}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{selectedPersona.name}</p>
                      {/* Description with responsive max-width */}
                      <p className="text-xs text-muted-foreground whitespace-nowrap truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]">{selectedPersona.description}</p>
                    </div>
                  </div>
                ) : (
                  <p className="font-medium truncate">{t.chameleonAI}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
              {/* Desktop: Show QuickPersonaPicker in header, Mobile: Show persona button */}
              {featureFlags.showPersonaPicker && (
                <>
                  {/* Desktop persona picker dropdown */}
                  <div className="hidden md:block">
                    <QuickPersonaPicker />
                  </div>
                  {/* Mobile persona button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsPersonasOpen(true)}
                    className="md:hidden relative h-10 w-10 sm:h-9 sm:w-9"
                  >
                    <Users className="h-5 w-5 sm:h-4 sm:w-4" />
                  </Button>
                </>
              )}
              {/* Share button - only when there's a chat with messages */}
              {currentChat && currentChat.messages && currentChat.messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsShareOpen(true)}
                  className="h-10 w-10 sm:h-9 sm:w-9"
                  title="Share"
                >
                  <ShareNetwork className="h-5 w-5 sm:h-4 sm:w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="h-10 w-10 sm:h-9 sm:w-9"
              >
                <Gear className="h-5 w-5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </header>

          {/* Chat Area - Always use chat view structure, ChatMessages handles empty state */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden chat-stage">
            <div className="flex-1 overflow-hidden min-h-0">
              <ChatMessages currentPersona={selectedPersona || undefined} />
            </div>
            <div className="flex-shrink-0">
              <SimpleChatInput
                selectedPersona={selectedPersona || undefined}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <SimpleSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
      />
      <PersonasDialog open={isPersonasOpen} onOpenChange={setIsPersonasOpen} />
      <UserProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        onProfileUpdate={handleProfileUpdate}
      />
      <Dialog open={isMemoryOpen} onOpenChange={setIsMemoryOpen}>
        <DialogContent
          className="!w-[calc(100vw-2rem)] sm:!w-auto sm:!max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col"
          style={{ minWidth: '320px' }}
        >
          <DialogHeader className="sr-only flex-shrink-0">
            <DialogTitle>Memory System</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            <MemoryManager />
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      {currentChat && (
        <ShareDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          chatId={currentChat.id}
          chatTitle={currentChat.title}
        />
      )}


      {/* Onboarding for first-time Simple Mode users */}
      <SimpleModeOnboarding
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />
    </div>
  )
}
