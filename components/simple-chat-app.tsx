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
import { streakService, gamificationService, type Pet, type Achievement } from "@/lib/simple-mode-features"
import { PetWidget, PetAdoptDialog } from "@/components/pet-companion"
import { AchievementsDialog, AchievementToast, StreakWidget } from "@/components/achievements-dialog"
import { ConversationStartersGrid, StartersDialog, CreativeCornerDialog, CreativeCornerButton } from "@/components/conversation-starters"
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
  Trophy,
  Sparkles,
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
  },
}

export function SimpleChatApp() {
  const { chats, currentChatId, createChat, deleteChat, setCurrentChat, settings, updateSettings, setChats } = useApp()
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
  const [isStartersOpen, setIsStartersOpen] = useState(false)
  const [isCreativeOpen, setIsCreativeOpen] = useState(false)
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null)
  const [pet, setPet] = useState<Pet | null>(null)

  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const isEmpty = !currentChat || currentChat.messages.length === 0

  // Load profile context
  useEffect(() => {
    const profile = userProfileService.getProfile()
    setProfileContext(userProfileService.getProfileContext(profile))
  }, [])

  // Record streak on app load and load gamification settings
  useEffect(() => {
    const gamificationSettings = gamificationService.getSettings()
    if (gamificationSettings.streaksEnabled) {
      streakService.recordActivity()
    }
  }, [])

  // Check if onboarding should be shown (first time Simple Mode user)
  useEffect(() => {
    const onboardingComplete = localStorage.getItem("simple-mode-onboarding-complete")
    const profile = userProfileService.getProfile()

    // Show onboarding if:
    // 1. Onboarding has never been completed
    // 2. User has no profile name set (indicating first-time setup)
    if (!onboardingComplete && !profile.name) {
      setShowOnboarding(true)
    }
  }, [])

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

      <div className="relative z-10 flex h-[100dvh] overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Chat History */}
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 bg-background/95 backdrop-blur-xl border-r border-border/50 transition-transform duration-300 ease-out md:relative md:translate-x-0",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full">
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
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm">
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

            <div className="flex items-center gap-1.5">
              {/* Pet Widget */}
              <PetWidget onOpenAdopt={() => setIsPetAdoptOpen(true)} lang={lang} />

              {/* Streak Widget */}
              <StreakWidget onClick={() => setIsAchievementsOpen(true)} />

              {/* Achievements Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAchievementsOpen(true)}
                className="relative"
                title="Achievements"
              >
                <Trophy className="h-5 w-5 text-amber-500" />
              </Button>

              <Button
                variant={imageMode ? "default" : "ghost"}
                size="icon"
                onClick={toggleImageMode}
                className={cn(
                  "relative",
                  imageMode && "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600"
                )}
                title={t.createImage}
              >
                <ImagePlus className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPersonasOpen(true)}
                className="relative"
              >
                <Users className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {isEmpty ? (
              /* Welcome Screen */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-6">
                  {/* Greeting */}
                  <div className="space-y-2">
                    <div className="flex justify-center mb-4">
                      <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center">
                        {selectedPersona ? (
                          <span className="text-4xl">{selectedPersona.emoji}</span>
                        ) : (
                          <ChameleonLogo size={48} animated colorShift />
                        )}
                      </div>
                    </div>
                    <h1 className="text-2xl font-bold">
                      {getGreeting()}{profile.name ? `, ${profile.name}` : ""}!
                    </h1>
                    <p className="text-muted-foreground">
                      {selectedPersona
                        ? `${lang === "de" ? "Ich bin" : "I'm"} ${selectedPersona.name}. ${selectedPersona.description}`
                        : t.imYourAssistant}
                    </p>
                  </div>

                  {/* Quick Persona Selection */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{t.choosePersona}</p>
                    <QuickPersonaPicker />
                  </div>

                  {/* Profile Prompt */}
                  {!profile.name && (
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => setIsProfileOpen(true)}
                    >
                      <User className="h-4 w-4" />
                      {t.setUpProfileBtn}
                    </Button>
                  )}

                  {/* Conversation Starters */}
                  <div className="space-y-3 pt-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {lang === "de" ? "Schnellstart" : "Quick Start"}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsStartersOpen(true)}
                          className="text-xs"
                        >
                          {lang === "de" ? "Mehr" : "More"}
                        </Button>
                        <CreativeCornerButton onClick={() => setIsCreativeOpen(true)} lang={lang} />
                      </div>
                    </div>
                    <ConversationStartersGrid onSelectPrompt={handleQuickPrompt} lang={lang} />
                  </div>
                </div>

                {/* Input at bottom of welcome screen */}
                <div className="w-full max-w-2xl mt-8">
                  <SimpleChatInput
                    selectedPersona={selectedPersona || undefined}
                    profileContext={profileContext}
                  />
                </div>
              </div>
            ) : (
              /* Chat View */
              <>
                <div className="flex-1 overflow-hidden px-2 md:px-4">
                  <ChatMessages currentPersona={selectedPersona || undefined} />
                </div>
                <div className="flex-shrink-0 pb-4 px-2 md:px-4">
                  <SimpleChatInput
                    selectedPersona={selectedPersona || undefined}
                    profileContext={profileContext}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SimpleSettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
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

      {/* Conversation Starters Dialog */}
      <StartersDialog
        open={isStartersOpen}
        onOpenChange={setIsStartersOpen}
        onSelectPrompt={handleQuickPrompt}
        lang={lang}
      />

      {/* Creative Corner Dialog */}
      <CreativeCornerDialog
        open={isCreativeOpen}
        onOpenChange={setIsCreativeOpen}
        onGenerate={handleQuickPrompt}
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
