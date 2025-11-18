"use client"

import { useState, useEffect } from "react"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatHeader } from "@/components/chat-header"
import { ChatMessages } from "@/components/chat-messages"
import { ChatInput } from "@/components/chat-input"
import { BranchNavigator } from "@/components/branch-navigator"
import { AppProvider, useApp } from "@/contexts/app-context"
import { ModelComparison } from "@/components/model-comparison"
import { StatsDashboard } from "@/components/stats-dashboard"
import { ModeWrapper } from "@/components/mode-wrapper"
import { keyboardShortcutService } from "@/lib/keyboard-shortcuts"
import { ChameleonLogo } from "@/components/chameleon-logo"
import { MobileBottomNav } from "@/components/mobile-bottom-nav"
import { PersonaLevelUpNotifier } from "@/components/persona-level-up-notifier"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"

function ChatApp() {
  const { chats, currentChatId, createChat, settings } = useApp()
  const [isComparisonMode, setIsComparisonMode] = useState(false)
  const [showStatsPanel, setShowStatsPanel] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const currentChat = chats.find((chat) => chat.id === currentChatId)
  const isEmpty = !currentChat || currentChat.messages.length === 0

  // Mobile bottom nav handlers
  const handleMobileNewChat = () => {
    createChat(settings.selectedModel)
  }

  const handleMobileSearch = () => {
    window.dispatchEvent(new Event("openSearch"))
  }

  const handleMobilePersonas = () => {
    window.dispatchEvent(new Event("openPersonas"))
  }

  const handleMobileSettings = () => {
    window.dispatchEvent(new Event("openSettings"))
  }

  const handleMobileCollections = () => {
    window.dispatchEvent(new Event("openDocCollections"))
  }

  // Apply saved theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("chameleon-theme") || "light"
    const html = document.documentElement
    html.classList.remove("dark", "cyberpunk", "girly-violet", "ocean-breeze", "retro-wave", "chameleon")
    if (savedTheme !== "light") {
      html.classList.add(savedTheme)
    }
  }, [])

  useEffect(() => {
    keyboardShortcutService.register("new-chat", () => {
      const event = new CustomEvent("newChat")
      window.dispatchEvent(event)
    })

    keyboardShortcutService.register("toggle-sidebar", () => {
      setShowSidebar((prev) => !prev)
    })

    keyboardShortcutService.register("toggle-theme", () => {
      const event = new CustomEvent("toggleTheme")
      window.dispatchEvent(event)
    })

    keyboardShortcutService.register("settings", () => {
      const event = new CustomEvent("openSettings")
      window.dispatchEvent(event)
    })

    keyboardShortcutService.register("prompt-library", () => {
      const event = new CustomEvent("openPromptLibrary")
      window.dispatchEvent(event)
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      keyboardShortcutService.handleKeyDown(e)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    const handleToggleSidebar = () => {
      setIsMobileSidebarOpen((prev) => !prev)
    }
    const handleToggleDesktopSidebar = () => {
      setShowSidebar((prev) => !prev)
    }
    const handleToggleComparison = () => setIsComparisonMode((prev) => !prev)
    const handleToggleStats = () => setShowStatsPanel((prev) => !prev)
    window.addEventListener("toggleMobileSidebar" as any, handleToggleSidebar)
    window.addEventListener("toggleDesktopSidebar" as any, handleToggleDesktopSidebar)
    window.addEventListener("toggleComparison" as any, handleToggleComparison)
    window.addEventListener("toggleStats" as any, handleToggleStats)
    return () => {
      window.removeEventListener("toggleMobileSidebar" as any, handleToggleSidebar)
      window.removeEventListener("toggleDesktopSidebar" as any, handleToggleDesktopSidebar)
      window.removeEventListener("toggleComparison" as any, handleToggleComparison)
      window.removeEventListener("toggleStats" as any, handleToggleStats)
    }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <PersonaLevelUpNotifier />
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300" onClick={() => setIsMobileSidebarOpen(false)} />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 md:relative md:z-0 transition-transform duration-300 ease-in-out",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          !showSidebar && "md:hidden",
        )}
      >
        <ChatSidebar onClose={() => setIsMobileSidebarOpen(false)} />
      </div>

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <ChatHeader />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {showStatsPanel ? (
            <StatsDashboard />
          ) : isComparisonMode ? (
            <ModelComparison />
          ) : isEmpty ? (
            /* Centered layout for empty state */
            <div className="flex-1 flex flex-col items-center justify-center p-4 pb-20 md:pb-4 overflow-hidden">
              <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
                <ChatMessages currentPersona={settings.selectedPersona} />
                <div className="w-full">
                  <ChatInput />
                </div>
              </div>
            </div>
          ) : (
            /* Normal layout with messages */
            <>
              <div className="flex-1 overflow-hidden">
                <ChatMessages currentPersona={settings.selectedPersona} />
              </div>
              <div className="flex-shrink-0 pb-16 md:pb-0">
                <BranchNavigator />
                <ChatInput />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        onMenuClick={() => setIsMobileSidebarOpen(prev => !prev)}
        onSearchClick={handleMobileSearch}
        onNewChatClick={handleMobileNewChat}
        onPersonasClick={handleMobilePersonas}
        onCollectionsClick={handleMobileCollections}
      />
    </div>
  )
}

function LoadingWrapper() {
  const { isLoading, user } = useApp()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="flex flex-col items-center gap-6">
          <div className="flex h-32 w-32 md:h-40 md:w-40 items-center justify-center rounded-3xl bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 shadow-2xl border border-primary/10">
            <ChameleonLogo size={120} animated colorShift />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Chameleon AI
            </h1>
            <p className="text-sm md:text-base text-muted-foreground font-medium">Adapting to your conversation...</p>
          </div>
        </div>
      </div>
    )
  }

  return <ChatApp />
}

export default function Home() {
  return (
    <AppProvider>
      <ModeWrapper>
        <LoadingWrapper />
      </ModeWrapper>
    </AppProvider>
  )
}
