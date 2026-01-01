"use client"

import { useState } from "react"
import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import {
  Settings,
  Menu,
  Columns2,
  BookTemplate,
  FolderOpen,
  BarChart3,
  Sliders,
  Sparkles,
  Moon,
  Sun,
  Brain,
  User,
  Wand2,
  PanelLeftClose,
  PanelLeft,
  Swords,
  FileCode,
  Mic,
  MoreHorizontal,
  Share2,
} from "lucide-react"
import { useEffect } from "react"
import { ModelSelector } from "@/components/model-selector"
import { SettingsDialog } from "@/components/settings-dialog"
import { DocumentCollectionsDialog } from "@/components/document-collections-dialog"
import { AdvancedSettingsDialog } from "@/components/advanced-settings-dialog"
import { MemoryManager } from "@/components/memory-manager"
import { UserProfileDialog } from "@/components/user-profile-dialog"
import { PersonasDialog } from "@/components/personas-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChameleonLogoSimple } from "@/components/chameleon-logo"
import { cn } from "@/lib/utils"
import { AIDebateMode } from "@/components/ai-debate-mode"
import { QuickActionsMenu } from "@/components/quick-actions-menu"
import { PromptInspector } from "@/components/prompt-inspector"
import { usePromptInspectorStore } from "@/lib/prompt-inspector-store"
import { PromptHelperDialog } from "@/components/prompt-helper-dialog"
import { MobileMoreMenu } from "@/components/mobile-more-menu"
import { ShareDialog } from "@/components/share-dialog"
import { haptics } from "@/lib/haptics"
import { useTranslation } from "@/lib/i18n"

export function ChatHeader() {
  const { settings, updateSettings, chats, currentChatId } = useApp()
  const { translations } = useTranslation(settings.language || "en")
  const [mounted, setMounted] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDocCollectionsOpen, setIsDocCollectionsOpen] = useState(false)
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false)
  const [isMemoryOpen, setIsMemoryOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isPersonasOpen, setIsPersonasOpen] = useState(false)
  const [isDebateOpen, setIsDebateOpen] = useState(false)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [isPromptHelperOpen, setIsPromptHelperOpen] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const { inspectorData } = usePromptInspectorStore()

  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const [isTitleAnimated, setIsTitleAnimated] = useState(false)

  // Track AI-generated title animation for header
  useEffect(() => {
    if (currentChat?.titleGeneratedAt) {
      const now = Date.now()
      // Animate if title was generated in the last 3 seconds
      if (now - currentChat.titleGeneratedAt < 3000) {
        setIsTitleAnimated(true)
        const timer = setTimeout(() => setIsTitleAnimated(false), 1500)
        return () => clearTimeout(timer)
      }
    }
    setIsTitleAnimated(false)
  }, [currentChat?.title, currentChat?.titleGeneratedAt])

  useEffect(() => {
    setMounted(true)
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark")
    }
  }, [settings.theme])

  // Add keyboard shortcuts (Ctrl+Shift+P for prompt helper)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+P for prompt helper
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "P") {
        e.preventDefault()
        setIsPromptHelperOpen(true)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Listen for mobile bottom nav events
  useEffect(() => {
    const handleOpenPersonas = () => setIsPersonasOpen(true)
    const handleOpenSettings = () => setIsSettingsOpen(true)
    const handleOpenDocCollections = () => setIsDocCollectionsOpen(true)
    const handleOpenPromptHelper = () => setIsPromptHelperOpen(true)
    const handleOpenProfile = () => setIsProfileOpen(true)
    const handleOpenMemory = () => setIsMemoryOpen(true)
    const handleOpenAdvancedSettings = () => setIsAdvancedSettingsOpen(true)
    const handleOpenDebate = () => setIsDebateOpen(true)
    const handleOpenInspector = () => setIsInspectorOpen(true)

    window.addEventListener("openPersonas", handleOpenPersonas)
    window.addEventListener("openSettings", handleOpenSettings)
    window.addEventListener("openDocCollections", handleOpenDocCollections)
    window.addEventListener("openPromptHelper", handleOpenPromptHelper)
    window.addEventListener("openProfile", handleOpenProfile)
    window.addEventListener("openMemory", handleOpenMemory)
    window.addEventListener("openAdvancedSettings", handleOpenAdvancedSettings)
    window.addEventListener("openDebate", handleOpenDebate)
    window.addEventListener("openInspector", handleOpenInspector)

    return () => {
      window.removeEventListener("openPersonas", handleOpenPersonas)
      window.removeEventListener("openSettings", handleOpenSettings)
      window.removeEventListener("openDocCollections", handleOpenDocCollections)
      window.removeEventListener("openPromptHelper", handleOpenPromptHelper)
      window.removeEventListener("openProfile", handleOpenProfile)
      window.removeEventListener("openMemory", handleOpenMemory)
      window.removeEventListener("openAdvancedSettings", handleOpenAdvancedSettings)
      window.removeEventListener("openDebate", handleOpenDebate)
      window.removeEventListener("openInspector", handleOpenInspector)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = settings.theme === "dark" ? "light" : "dark"
    updateSettings({ theme: newTheme })
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const toggleComparisonMode = () => {
    window.dispatchEvent(new CustomEvent("toggleComparison"))
  }

  const toggleStatsPanel = () => {
    window.dispatchEvent(new CustomEvent("toggleStats"))
  }

  const toggleMobileSidebar = () => {
    window.dispatchEvent(new CustomEvent("toggleMobileSidebar"))
  }

  const toggleDesktopSidebar = () => {
    window.dispatchEvent(new CustomEvent("toggleDesktopSidebar"))
  }

  if (!mounted) return null

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between border-b border-hairline bg-background/92 px-3 sm:px-4 md:px-5 shadow-apple-1 mobile-header-glass">
        {/* Mobile: Modern minimalistic header */}
        <div className="flex md:hidden items-center justify-between w-full">
          {/* Left: Sidebar toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all"
            onClick={() => {
              haptics.trigger('selection')
              toggleMobileSidebar()
            }}
            title="Chats"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Center: Logo and title */}
          <div className="flex items-center gap-2 min-w-0 flex-1 justify-center px-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5 border border-primary/10 flex-shrink-0">
              <ChameleonLogoSimple className="text-primary" size={14} />
            </div>
            <h1 className={cn(
              "text-sm font-semibold text-foreground truncate max-w-[100px]",
              isTitleAnimated && "animate-title-appear"
            )}>
              {currentChat?.title || "Chameleon"}
            </h1>
          </div>

          {/* Right: Share, Settings, Tune, More */}
          <div className="flex items-center gap-0.5">
            {/* Share button - visible when chat has messages AND is not private */}
            {currentChat && currentChat.messages && currentChat.messages.length > 0 && !currentChat.isPrivate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all"
                onClick={() => {
                  haptics.trigger('selection')
                  setIsShareOpen(true)
                }}
                title={translations.chatHeader.share}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all"
              onClick={() => {
                haptics.trigger('selection')
                setIsSettingsOpen(true)
              }}
              title={translations.chatHeader.settings}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 active:scale-95 transition-all"
              onClick={() => {
                haptics.trigger('selection')
                setIsAdvancedSettingsOpen(true)
              }}
              title={translations.chatHeader.tune}
            >
              <Sliders className="h-4 w-4" />
            </Button>
            <MobileMoreMenu
              onSettingsClick={() => setIsSettingsOpen(true)}
              onProfileClick={() => setIsProfileOpen(true)}
              onMemoryClick={() => setIsMemoryOpen(true)}
              onComparisonClick={toggleComparisonMode}
              onDocCollectionsClick={() => setIsDocCollectionsOpen(true)}
              onDebateClick={() => setIsDebateOpen(true)}
              onInspectorClick={() => setIsInspectorOpen(true)}
              onStatsClick={toggleStatsPanel}
              onPersonasClick={() => setIsPersonasOpen(true)}
              onPromptHelperClick={() => setIsPromptHelperOpen(true)}
              onShareClick={() => setIsShareOpen(true)}
            />
          </div>
        </div>

        {/* Desktop: Full header with all controls */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Desktop Sidebar Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0 h-10 w-10 hover:bg-accent hover:text-accent-foreground hover:scale-105 transition-all rounded-xl"
            onClick={toggleDesktopSidebar}
            title={translations.chatHeader.toggleSidebar}
          >
            <PanelLeftClose className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 shadow-lg border border-primary/10 flex-shrink-0">
              <ChameleonLogoSimple className="text-green-600" size={20} />
            </div>
            <h1 className={cn(
              "text-sm sm:text-base lg:text-lg font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent truncate",
              isTitleAnimated && "animate-title-appear"
            )}>
              {currentChat?.title || "Chameleon AI"}
            </h1>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-0.5 sm:gap-1 md:gap-1.5 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={settings.theme === "dark" ? translations.chatHeader.lightMode : translations.chatHeader.darkMode}
            className="hidden sm:flex hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            {settings.theme === "dark" ? (
              <Sun className="h-4 w-4 md:h-4.5 md:w-4.5 text-primary" />
            ) : (
              <Moon className="h-4 w-4 md:h-4.5 md:w-4.5 text-primary" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsProfileOpen(true)}
            title={translations.chatHeader.profile}
            className="hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <User className="h-4 w-4 md:h-4.5 md:w-4.5 text-primary" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMemoryOpen(true)}
            title="Memory System"
            className={cn(
              "hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg relative",
              settings.memorySettings?.enabled && "text-purple-500"
            )}
          >
            <Brain className="h-4 w-4 md:h-4.5 md:w-4.5" />
            {settings.memorySettings?.enabled && (
              <span className={cn(
                "absolute top-1.5 right-1.5 h-2 w-2 bg-purple-500 rounded-full shadow-sm shadow-purple-500/50",
                !settings.experimental?.performanceMode && "animate-pulse"
              )} />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleComparisonMode}
            title="Modellvergleich"
            className="hidden md:flex hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <Columns2 className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
          {/* Prompt Library - Hidden for now */}
          {/*
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPromptLibraryOpen(true)}
            title="Prompt-Bibliothek"
            className="hover:bg-primary/10 h-8 w-8 sm:h-9 sm:w-9"
          >
            <BookTemplate className="h-4 w-4" />
          </Button>
          */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPersonasOpen(true)}
            title="Personas Manager"
            className="hidden md:flex hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <Wand2 className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDocCollectionsOpen(true)}
            title="Document Collections"
            className="hidden md:flex hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <FolderOpen className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPromptHelperOpen(true)}
            title="Prompt Helper (Strg+Shift+P)"
            className="hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <Sparkles className="h-4 w-4 md:h-4.5 md:w-4.5 text-yellow-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsAdvancedSettingsOpen(true)}
            title="Erweiterte Parameter"
            className="hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <Sliders className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
          {/* AI Debate Mode */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDebateOpen(true)}
            title="AI Debate Mode"
            className="hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <Swords className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
          {/* Prompt Inspector */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsInspectorOpen(true)}
            title="Prompt Inspector"
            className={cn(
              "hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg relative",
              inspectorData && "text-blue-500"
            )}
          >
            <FileCode className="h-4 w-4 md:h-4.5 md:w-4.5" />
            {inspectorData && (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-blue-500 rounded-full animate-pulse shadow-sm shadow-blue-500/50" />
            )}
          </Button>
          {/* Quick Actions Menu */}
          <QuickActionsMenu
            onShareClick={() => setIsShareOpen(true)}
          />
          {/* Model Selector - Desktop only */}
          <div className="hidden md:block">
            <ModelSelector />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            title={translations.chatHeader.settings}
            className="hover:bg-accent hover:text-accent-foreground h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10 hover:scale-105 transition-all rounded-lg"
          >
            <Settings className="h-4 w-4 md:h-4.5 md:w-4.5" />
          </Button>
        </div>
      </header>

      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
      {/* Prompt Library Dialog - Hidden for now */}
      {/*
      <PromptLibraryDialog
        open={isPromptLibraryOpen}
        onOpenChange={setIsPromptLibraryOpen}
        onSelectTemplate={(content) => {
          const event = new CustomEvent("insertPrompt", { detail: content })
          window.dispatchEvent(event)
        }}
      />
      */}
      <DocumentCollectionsDialog
        open={isDocCollectionsOpen}
        onOpenChange={setIsDocCollectionsOpen}
        onSelectCollection={(collectionId) => {
          const event = new CustomEvent("attachCollection", { detail: collectionId })
          window.dispatchEvent(event)
        }}
      />
      <AdvancedSettingsDialog open={isAdvancedSettingsOpen} onOpenChange={setIsAdvancedSettingsOpen} />
      <Dialog open={isMemoryOpen} onOpenChange={setIsMemoryOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Memory System</DialogTitle>
          </DialogHeader>
          <MemoryManager />
        </DialogContent>
      </Dialog>
      <UserProfileDialog open={isProfileOpen} onOpenChange={setIsProfileOpen} />
      <PersonasDialog open={isPersonasOpen} onOpenChange={setIsPersonasOpen} />
      <Dialog open={isDebateOpen} onOpenChange={setIsDebateOpen}>
        <DialogContent className="sm:max-w-[95vw] lg:max-w-[1200px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Swords className="h-5 w-5 text-primary" />
              AI Debate Mode
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
            <AIDebateMode />
          </div>
        </DialogContent>
      </Dialog>
      <PromptHelperDialog
        open={isPromptHelperOpen}
        onOpenChange={setIsPromptHelperOpen}
        onUsePrompt={(prompt) => {
          // Dispatch event to insert prompt into chat input
          const event = new CustomEvent("insertPrompt", { detail: prompt })
          window.dispatchEvent(event)
        }}
      />
      <PromptInspector
        open={isInspectorOpen}
        onOpenChange={setIsInspectorOpen}
        data={inspectorData}
      />
      {/* Share dialog - not available for private chats */}
      {currentChat && !currentChat.isPrivate && (
        <ShareDialog
          open={isShareOpen}
          onOpenChange={setIsShareOpen}
          chatId={currentChat.id}
          chatTitle={currentChat.title}
        />
      )}
    </>
  )
}
