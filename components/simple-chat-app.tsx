"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { ChatMessages } from "@/components/chat-messages"
import { SimpleChatInput } from "@/components/simple-chat-input"
import { SimpleSettingsDialog } from "@/components/simple-settings-dialog"
import { PersonasDialog } from "@/components/personas-dialog"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { SimpleModeOnboarding } from "@/components/simple-mode-onboarding"
import { QuickPersonaPicker } from "@/components/quick-persona-picker"
import { ChameleonLogo } from "@/components/chameleon-logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { userProfileService } from "@/lib/user-profile"
import { gamificationService, type Pet, type Achievement } from "@/lib/simple-mode-features"
import { PetWidget, PetAdoptDialog } from "@/components/pet-companion"
import { AchievementsDialog, AchievementToast } from "@/components/achievements-dialog"
import {
  MessageSquarePlus,
  Users,
  Settings,
  User,
  Menu,
  X,
  ChevronLeft,
  Trash2,
  MoreVertical,
  ImagePlus,
  Lightbulb,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import type { Persona } from "@/lib/personas"

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
  },
}

// Persona-specific question suggestions
const personaTips: Record<string, { en: string[]; de: string[] }> = {
  default: {
    en: [
      "What can you help me with?",
      "Tell me something interesting",
      "Help me brainstorm ideas",
      "Explain something complex simply",
      "Write a short story",
      "Give me advice on...",
    ],
    de: [
      "Wobei kannst du mir helfen?",
      "Erzähl mir etwas Interessantes",
      "Hilf mir beim Brainstorming",
      "Erkläre mir etwas Komplexes einfach",
      "Schreibe eine kurze Geschichte",
      "Gib mir einen Rat zu...",
    ],
  },
  coder: {
    en: [
      "Debug this code for me",
      "How do I implement...?",
      "Explain this algorithm",
      "Review my code",
      "Best practices for...",
      "Convert this to TypeScript",
    ],
    de: [
      "Finde den Fehler in diesem Code",
      "Wie implementiere ich...?",
      "Erkläre diesen Algorithmus",
      "Überprüfe meinen Code",
      "Best Practices für...",
      "Konvertiere das zu TypeScript",
    ],
  },
  writer: {
    en: [
      "Help me write a blog post",
      "Improve this paragraph",
      "Create a catchy headline",
      "Write in a different tone",
      "Proofread my text",
      "Generate creative ideas",
    ],
    de: [
      "Hilf mir einen Blogpost zu schreiben",
      "Verbessere diesen Absatz",
      "Erstelle eine packende Überschrift",
      "Schreibe in anderem Stil",
      "Korrigiere meinen Text",
      "Generiere kreative Ideen",
    ],
  },
  translator: {
    en: [
      "Translate this to German",
      "What does this phrase mean?",
      "How do I say... in French?",
      "Check my grammar",
      "Formal vs informal translation",
      "Cultural context of this expression",
    ],
    de: [
      "Übersetze das ins Englische",
      "Was bedeutet dieser Ausdruck?",
      "Wie sage ich... auf Französisch?",
      "Prüfe meine Grammatik",
      "Formell vs informell übersetzen",
      "Kultureller Kontext dieses Ausdrucks",
    ],
  },
  researcher: {
    en: [
      "Summarize this topic",
      "Find sources about...",
      "Compare these concepts",
      "What's the latest on...?",
      "Explain the history of...",
      "Pros and cons of...",
    ],
    de: [
      "Fasse dieses Thema zusammen",
      "Finde Quellen über...",
      "Vergleiche diese Konzepte",
      "Was gibt's Neues zu...?",
      "Erkläre die Geschichte von...",
      "Vor- und Nachteile von...",
    ],
  },
  teacher: {
    en: [
      "Explain this like I'm 5",
      "Quiz me on this topic",
      "Create a study plan",
      "What should I learn next?",
      "Break this down step by step",
      "Give me practice exercises",
    ],
    de: [
      "Erkläre es mir wie einem Kind",
      "Teste mich zu diesem Thema",
      "Erstelle einen Lernplan",
      "Was sollte ich als nächstes lernen?",
      "Erkläre das Schritt für Schritt",
      "Gib mir Übungsaufgaben",
    ],
  },
}

export function SimpleChatApp() {
  const { chats, currentChatId, createChat, deleteChat, setCurrentChat, settings, updateSettings, setChats, user } = useApp()
  const { toast } = useToast()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isPersonasOpen, setIsPersonasOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [profileContext, setProfileContext] = useState("")
  const [imageMode, setImageMode] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  // Simple Mode features state
  const [isPetAdoptOpen, setIsPetAdoptOpen] = useState(false)
  const [isAchievementsOpen, setIsAchievementsOpen] = useState(false)
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [pet, setPet] = useState<Pet | null>(null)

  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const isEmpty = !currentChat || currentChat.messages.length === 0

  // Load profile context
  useEffect(() => {
    const profile = userProfileService.getProfile()
    setProfileContext(userProfileService.getProfileContext(profile))
  }, [])


  // Check if onboarding should be shown (first time Simple Mode user)
  useEffect(() => {
    const onboardingComplete = localStorage.getItem("simple-mode-onboarding-complete")

    // Already completed - skip
    if (onboardingComplete) {
      return
    }

    // Check if this is an existing user switching to Simple Mode
    // Existing users should NOT see onboarding - their settings sync between modes
    const isExistingUser =
      user !== null ||
      chats.length > 0 ||
      localStorage.getItem("chameleon-mode-selected") ||
      localStorage.getItem("chameleon-chats") ||
      localStorage.getItem("chameleon-settings")

    if (isExistingUser) {
      // Mark onboarding as complete for existing users
      localStorage.setItem("simple-mode-onboarding-complete", "true")
      return
    }

    // Truly new user - show onboarding
    const profile = userProfileService.getProfile()
    if (!profile.name) {
      setShowOnboarding(true)
    }
  }, [user, chats.length])

  // Handle events from other components
  useEffect(() => {
    const handleOpenSettings = () => setIsSettingsOpen(true)
    const handleOpenPersonas = () => setIsPersonasOpen(true)
    const handleOpenProfile = () => setIsProfileOpen(true)
    const handleSetImageMode = (e: CustomEvent) => setImageMode(e.detail)

    window.addEventListener("openSettings", handleOpenSettings)
    window.addEventListener("openPersonas", handleOpenPersonas)
    window.addEventListener("openProfile", handleOpenProfile)
    window.addEventListener("setImageMode" as any, handleSetImageMode)

    return () => {
      window.removeEventListener("openSettings", handleOpenSettings)
      window.removeEventListener("openPersonas", handleOpenPersonas)
      window.removeEventListener("openProfile", handleOpenProfile)
      window.removeEventListener("setImageMode" as any, handleSetImageMode)
    }
  }, [])

  const handleNewChat = () => {
    createChat(settings.selectedModel)
    setIsSidebarOpen(false)
  }

  const handleSelectPersona = (persona: Persona | null) => {
    updateSettings({ selectedPersona: persona || undefined })
    // Create new chat when selecting a persona
    createChat(settings.selectedModel)
    setIsPersonasOpen(false)
  }

  const handleProfileUpdate = () => {
    const profile = userProfileService.getProfile()
    setProfileContext(userProfileService.getProfileContext(profile))
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    // Refresh profile context after onboarding
    const profile = userProfileService.getProfile()
    setProfileContext(userProfileService.getProfileContext(profile))
  }

  // Handle conversation starter or creative prompt
  const handleQuickPrompt = (prompt: string) => {
    // Create a new chat if needed and send the prompt
    if (!currentChat || currentChat.messages.length > 0) {
      createChat(settings.selectedModel)
    }
    // Dispatch event to send the message
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("sendQuickMessage", { detail: prompt }))
    }, 100)
  }

  // Handle pet adoption
  const handlePetAdopted = (newPet: Pet) => {
    setPet(newPet)
  }

  const selectedPersona = settings.selectedPersona

  // Get current language translations
  const lang = settings.language === "de" ? "de" : "en"
  const t = translations[lang]

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
        </>
      )}

      <div className="relative z-10 flex h-[100dvh] w-full overflow-hidden gap-0 pb-[44px] md:pb-6">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Wrapper - shrink-0 prevents flex shrinking on desktop */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 md:relative md:z-0 md:shrink-0 transition-transform duration-300 ease-out",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          {/* Sidebar - Chat History - height pattern matches ChatSidebar component */}
          <aside className="relative flex h-[100dvh] md:h-full md:max-h-[100dvh] w-72 flex-col overflow-hidden bg-background border-r border-border/50">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ChameleonLogo size={32} animated />
                  <span className="font-semibold bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">
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
                className="flex-1 gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <MessageSquarePlus className="h-4 w-4" />
                {t.newChat}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={handleDeleteAllChats}
                    className="text-destructive focus:text-destructive"
                    disabled={chats.length === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t.deleteAllChats}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto p-2">
              {chats.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm py-8">
                  {t.noChats}
                </div>
              ) : (
                <div className="space-y-1">
                  {chats.slice(0, 20).map((chat) => (
                    <div
                      key={chat.id}
                      className={cn(
                        "group flex items-center gap-2 rounded-lg p-2.5 cursor-pointer transition-colors",
                        chat.id === currentChatId
                          ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                          : "hover:bg-muted/50"
                      )}
                      onClick={() => {
                        setCurrentChat(chat.id)
                        setIsSidebarOpen(false)
                      }}
                    >
                      <div className="flex-1 truncate text-sm">{chat.title}</div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteChat(chat.id, e)}
                        title={t.deleteChat}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
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
          </aside>
        </div>

        {/* Main Content */}
        <main className="flex flex-1 flex-col min-w-0 overflow-hidden rounded-none md:rounded-none panel-elevated main-bridge-left border border-border/60 shadow-xl bg-background/80">
          {/* Header */}
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50 bg-background">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>

              {currentChatId && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex"
                  onClick={() => setCurrentChat(null)}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}

              <div className="flex-1 min-w-0">
                {selectedPersona ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{selectedPersona.emoji}</span>
                    <div>
                      <p className="font-medium text-sm">{selectedPersona.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{selectedPersona.description}</p>
                    </div>
                  </div>
                ) : (
                  <p className="font-medium">{t.chameleonAI}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Pet Widget - visible on all screens */}
              <PetWidget onOpenAdopt={() => setIsPetAdoptOpen(true)} lang={lang} />

              <Button
                variant={imageMode ? "default" : "ghost"}
                size="icon"
                onClick={toggleImageMode}
                className={cn(
                  "relative h-8 w-8",
                  imageMode && "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600"
                )}
                title={t.createImage}
              >
                <ImagePlus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPersonasOpen(true)}
                className="relative h-8 w-8"
              >
                <Users className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden w-full">
            {isEmpty ? (
              /* Welcome Screen */
              <div className="flex-1 flex flex-col overflow-y-auto w-full">
                <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 text-center w-full">
                  <div className="w-full max-w-lg mx-auto space-y-4 sm:space-y-6">
                    {/* Greeting - Compact */}
                    <div className="space-y-2">
                      <div className="flex justify-center mb-2 sm:mb-4">
                        <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                          {selectedPersona ? (
                            <span className="text-2xl sm:text-4xl">{selectedPersona.emoji}</span>
                          ) : (
                            <ChameleonLogo size={32} animated colorShift />
                          )}
                        </div>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-bold">
                        {getGreeting()}{profile.name ? `, ${profile.name}` : ""}!
                      </h1>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {selectedPersona
                          ? `${lang === "de" ? "Ich bin" : "I'm"} ${selectedPersona.name}.`
                          : t.imYourAssistant}
                      </p>
                    </div>

                    {/* Quick Persona Selection - Always visible */}
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">{t.choosePersona}</p>
                      <QuickPersonaPicker />
                    </div>

                    {/* Persona-based Tips */}
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                        <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                        {t.tryAsking}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
                        {(personaTips[selectedPersona?.id || "default"] || personaTips.default)[lang].map((tip, index) => (
                          <button
                            key={index}
                            onClick={() => handleQuickPrompt(tip)}
                            className="text-left p-2 sm:p-3 rounded-lg border border-border hover:border-violet-300 hover:bg-violet-500/5 transition-all"
                          >
                            <span className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{tip}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Input at bottom */}
                <SimpleChatInput
                  selectedPersona={selectedPersona || undefined}
                  profileContext={profileContext}
                />
              </div>
            ) : (
              /* Chat View */
              <>
                <div className="flex-1 overflow-hidden">
                  <ChatMessages currentPersona={selectedPersona || undefined} />
                </div>
                <SimpleChatInput
                  selectedPersona={selectedPersona || undefined}
                  profileContext={profileContext}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <SimpleSettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        onOpenAchievements={() => setIsAchievementsOpen(true)}
      />
      <PersonasDialog open={isPersonasOpen} onOpenChange={setIsPersonasOpen} />
      <UserProfileDialog
        open={isProfileOpen}
        onOpenChange={setIsProfileOpen}
        onProfileUpdate={handleProfileUpdate}
      />

      {/* Onboarding for first-time Simple Mode users */}
      <SimpleModeOnboarding
        open={showOnboarding}
        onComplete={handleOnboardingComplete}
      />

      {/* Pet Adopt Dialog */}
      <PetAdoptDialog
        open={isPetAdoptOpen}
        onOpenChange={setIsPetAdoptOpen}
        onAdopt={handlePetAdopted}
        lang={lang}
      />

      {/* Achievements Dialog */}
      <AchievementsDialog
        open={isAchievementsOpen}
        onOpenChange={setIsAchievementsOpen}
        lang={lang}
      />

      {/* Achievement Toast */}
      {newAchievement && (
        <AchievementToast
          achievement={newAchievement}
          lang={lang}
          onClose={() => setNewAchievement(null)}
        />
      )}
    </div>
  )
}
