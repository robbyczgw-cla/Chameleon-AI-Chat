"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import dynamic from "next/dynamic"
import { useSwipeable } from "react-swipeable"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatHeader } from "@/components/chat-header"
import { ChatMessages } from "@/components/chat-messages"
import { ChatInput } from "@/components/chat-input"
import { BranchNavigator } from "@/components/branch-navigator"
import { AppProvider, useApp } from "@/contexts/app-context"
import { ModeWrapper } from "@/components/mode-wrapper"
import { keyboardShortcutService } from "@/lib/keyboard-shortcuts"
import { ChameleonLogo } from "@/components/chameleon-logo"
import { useToast } from "@/hooks/use-toast"
// Mobile bottom nav removed - navigation now in header
import { PersonaLevelUpNotifier } from "@/components/persona-level-up-notifier"
import { FontApplier } from "@/components/font-applier"
import { cn } from "@/lib/utils"
import { haptics } from "@/lib/haptics"
import { KeyboardShortcutsDialog } from "@/components/keyboard-shortcuts-dialog"
import { useFeatureFlags } from "@/hooks/use-feature-flags"

// Dynamic imports for heavy components - only loaded when needed
const ModelComparison = dynamic(() => import("@/components/model-comparison").then(mod => ({ default: mod.ModelComparison })), {
  loading: () => <div className="flex items-center justify-center h-full"><div className="animate-pulse text-muted-foreground">Loading comparison...</div></div>,
  ssr: false,
})

const StatsDashboard = dynamic(() => import("@/components/stats-dashboard").then(mod => ({ default: mod.StatsDashboard })), {
  loading: () => <div className="flex items-center justify-center h-full"><div className="animate-pulse text-muted-foreground">Loading stats...</div></div>,
  ssr: false,
})

function ChatApp() {
  const { chats, currentChatId, settings, setChats, setCurrentChat, createChat } = useApp()
  const { toast } = useToast()
  const { features, isSimpleMode } = useFeatureFlags()
  const [isComparisonMode, setIsComparisonMode] = useState(false)
  const [showStatsPanel, setShowStatsPanel] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [shareHandled, setShareHandled] = useState(false)
  const [isKeyboardShortcutsOpen, setIsKeyboardShortcutsOpen] = useState(false)

  // Memoize derived state to prevent unnecessary recalculations
  const currentChat = useMemo(() => chats.find((chat) => chat.id === currentChatId), [chats, currentChatId])
  const isEmpty = useMemo(() => !currentChat || currentChat.messages.length === 0, [currentChat])

  // Memoized swipe handlers to prevent recreation on every render
  const handleSwipeRight = useCallback((eventData: { initial: number[] }) => {
    const startX = eventData.initial[0]
    // Swipe right from LEFT edge (100px) → Open sidebar
    if (startX <= 100) {
      haptics.trigger('light')
      setIsMobileSidebarOpen(true)
    }
  }, [])

  const handleSwipeLeft = useCallback((eventData: { initial: number[] }) => {
    const startX = eventData.initial[0]
    const viewportWidth = window.innerWidth
    // Close sidebar when swiping left and sidebar is open
    if (isMobileSidebarOpen) {
      haptics.trigger('light')
      setIsMobileSidebarOpen(false)
      return
    }
    // Swipe left from RIGHT edge (100px) → Create new chat
    if (startX >= viewportWidth - 100) {
      haptics.trigger('medium')
      createChat()
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('focusChatInput'))
      }, 100)
    }
  }, [isMobileSidebarOpen, createChat])

  // Swipe gesture handlers for mobile sidebar and new chat
  const swipeHandlers = useSwipeable({
    onSwipedRight: handleSwipeRight,
    onSwipedLeft: handleSwipeLeft,
    trackMouse: false, // Only track touch events
    trackTouch: true,
    delta: 40, // Minimum distance for swipe (reduced for easier activation)
    preventScrollOnSwipe: false, // Allow normal scrolling
    swipeDuration: 500, // Maximum time for swipe gesture
  })

  // Handle shared chat links
  useEffect(() => {
    if (shareHandled) return

    const params = new URLSearchParams(window.location.search)
    const shareData = params.get("share")

    if (shareData) {
      try {
        // Decode from base64
        const jsonStr = decodeURIComponent(
          atob(shareData)
            .split("")
            .map((c) => `%${  (`00${  c.charCodeAt(0).toString(16)}`).slice(-2)}`)
            .join("")
        )
        const data = JSON.parse(jsonStr)

        // Validate data structure
        if (data.v === 1 && data.t && data.m && Array.isArray(data.m)) {
          // Create new chat from shared data
          const newChat = {
            id: `shared-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: `📥 ${data.t}`,
            messages: data.m.map((msg: { r: string; c: string }, idx: number) => ({
              id: `msg-${idx}`,
              role: msg.r === "u" ? "user" : "assistant",
              content: msg.c,
              timestamp: Date.now(),
            })),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            model: settings.selectedModel,
          }

          // Add to chats and switch to it
          setChats((prev: typeof chats) => [newChat, ...prev])
          setCurrentChat(newChat.id)

          // Clean URL without reload
          window.history.replaceState({}, document.title, window.location.pathname)

          toast({
            title: "Shared chat loaded!",
            description: `"${data.t}" has been added to your chats`,
          })
        }
      } catch (error) {
        console.error("Failed to parse shared chat:", error)
        toast({
          title: "Invalid share link",
          description: "Could not load the shared conversation",
          variant: "destructive",
        })
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname)
      }

      setShareHandled(true)
    }
  }, [shareHandled, setChats, setCurrentChat, settings.selectedModel, toast])

  // Apply saved theme and performance mode on mount and when settings change
  useEffect(() => {
    // Load theme from settings context (preferred) or fallback to localStorage for migration
    const savedTheme = settings.theme || localStorage.getItem("chameleon-theme") || "light"
    const html = document.documentElement
    html.classList.remove("dark", "girly-violet", "ocean-breeze", "chameleon", "paper-mint", "claude", "claude-grey", "clean-slate", "kawaii-pink", "aurora", "hifi-team", "soft-sunrise")
    if (savedTheme !== "light") {
      html.classList.add(savedTheme)
    }
    // Dark-based themes need the "dark" class for Tailwind dark: variants to work
    const darkThemes = ["dark", "claude-grey"]
    if (darkThemes.includes(savedTheme)) {
      html.classList.add("dark")
    }

    // Apply performance mode from settings context (preferred) or fallback to localStorage
    const savedPerformanceMode = settings.experimental?.performanceMode ??
      (localStorage.getItem("chameleon-performance-mode") === "true")
    if (savedPerformanceMode) {
      html.classList.add("performance-mode")
    } else {
      html.classList.remove("performance-mode")
    }
  }, [settings.theme, settings.experimental?.performanceMode])

  // Apply font family from settings
  useEffect(() => {
    const fontFamily = settings.fontFamily || "inter"
    document.documentElement.setAttribute("data-font", fontFamily)
  }, [settings.fontFamily])

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

    keyboardShortcutService.register("search", () => {
      // Focus the search input in the sidebar
      // First, ensure sidebar is open on desktop
      setShowSidebar(true)
      // On mobile, open the sidebar
      setIsMobileSidebarOpen(true)
      // Focus the search input after a brief delay to ensure sidebar is rendered
      setTimeout(() => {
        const searchInput = document.querySelector<HTMLInputElement>('input[placeholder*="Search" i], input[placeholder*="Suchen" i]')
        if (searchInput) {
          searchInput.focus()
          searchInput.select()
        }
      }, 100)
    })

    keyboardShortcutService.register("export-chat", () => {
      // Check if export is available in current mode
      if (!features.showExportChat) {
        toast({
          title: "Feature not available",
          description: isSimpleMode
            ? "Export is available in Advanced Mode. Toggle mode in settings."
            : "Export feature is not available",
          variant: "default",
        })
        return
      }

      // Trigger export of current chat as JSON (default format)
      if (currentChat && currentChat.messages && currentChat.messages.length > 0) {
        const json = JSON.stringify(currentChat, null, 2)
        const blob = new Blob([json], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${currentChat.title.replace(/[^a-z0-9]/gi, "_")}.json`
        a.click()
        URL.revokeObjectURL(url)
        toast({
          title: "Chat exported",
          description: `"${currentChat.title}" has been exported as JSON`,
        })
      } else {
        toast({
          title: "No chat to export",
          description: "Start a conversation first",
          variant: "destructive",
        })
      }
    })

    keyboardShortcutService.register("model-selector", () => {
      // Check if model selector is available in current mode
      if (!features.showModelSelector) {
        toast({
          title: "Feature not available",
          description: isSimpleMode
            ? "Model selection is available in Advanced Mode. Toggle mode in settings."
            : "Model selector is not available",
          variant: "default",
        })
        return
      }

      // Focus the model selector dropdown
      setTimeout(() => {
        const modelSelector = document.querySelector<HTMLButtonElement>('[role="combobox"]')
        if (modelSelector) {
          modelSelector.click()
        } else {
          toast({
            title: "Model selector not found",
            description: "Try clicking the model button in the header",
            variant: "default",
          })
        }
      }, 50)
    })

    keyboardShortcutService.register("keyboard-shortcuts", () => {
      // Only available in Advanced Mode - Simple Mode keeps things simple
      if (isSimpleMode) {
        return // Silently ignore in Simple Mode
      }
      setIsKeyboardShortcutsOpen(true)
    })

    const handleKeyDown = (e: KeyboardEvent) => {
      // Special handling for "?" key to show keyboard shortcuts
      // Only available in Advanced Mode
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
        if (isSimpleMode) {
          return // Simple Mode doesn't need keyboard shortcuts help
        }

        const target = e.target as HTMLElement
        const isInputField = target.tagName === "INPUT" ||
                            target.tagName === "TEXTAREA" ||
                            target.isContentEditable
        if (!isInputField) {
          e.preventDefault()
          setIsKeyboardShortcutsOpen(true)
          return
        }
      }

      keyboardShortcutService.handleKeyDown(e)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentChat, toast, features, isSimpleMode])

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
    <div className={cn(
      "modern-shell",
      settings.theme === "paper-mint" && "paper-mint-bg",
      settings.experimental?.performanceMode && "ultra-performance-mode"
    )}>
      <FontApplier />
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

      <div
        {...swipeHandlers}
        className="relative z-10 flex h-[100dvh] overflow-hidden px-0 md:px-0 gap-0 touch-pan-y"
      >
        <PersonaLevelUpNotifier />
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 md:hidden smooth-transition animate-fade-in"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
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

        <div
          className={cn(
            "flex flex-1 flex-col min-w-0 overflow-hidden rounded-none md:rounded-none panel-elevated main-bridge-left border border-hairline shadow-none",
            settings.theme === "blueprint" && "animate-[rise_0.6s_ease-out]",
          )}
        >
          <ChatHeader />
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {showStatsPanel ? (
              <StatsDashboard />
            ) : isComparisonMode ? (
              <ModelComparison />
            ) : isEmpty ? (
              /* Empty state: welcome centered, input at bottom */
              <>
                <div className="flex-1 flex items-center justify-center px-2 py-4 md:p-6 overflow-hidden">
                  <div className="w-full max-w-4xl mx-auto">
                    <ChatMessages currentPersona={settings.selectedPersona} />
                  </div>
                </div>
                <div className="flex-shrink-0 w-full max-w-4xl mx-auto px-2 pb-safe">
                  <ChatInput />
                </div>
              </>
            ) : (
              /* Normal layout with messages */
              <>
                <div className="flex-1 overflow-hidden chat-stage">
                  <ChatMessages currentPersona={settings.selectedPersona} />
                </div>
                <div className="flex-shrink-0">
                  <BranchNavigator />
                  <ChatInput />
                </div>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Keyboard Shortcuts Dialog - Advanced Mode Only */}
      {!isSimpleMode && (
        <KeyboardShortcutsDialog
          open={isKeyboardShortcutsOpen}
          onOpenChange={setIsKeyboardShortcutsOpen}
        />
      )}
    </div>
  )
}

function LoadingWrapper() {
  const { isLoading, user } = useApp()

  if (isLoading) {
    return (
      <div className="modern-shell">
        <div className="mesh-layer" />
        <div className="grid-layer" />
        <div className="noise-layer" />
        <div className="relative z-10 flex h-screen items-center justify-center animate-fade-in px-4">
          <div className="flex flex-col items-center gap-6 animate-scale-in">
            <div className="flex h-32 w-32 md:h-40 md:w-40 items-center justify-center rounded-3xl bg-background/80 shadow-2xl border border-primary/20">
              <ChameleonLogo size={120} />
            </div>
            <div className="text-center space-y-2 animate-slide-in-up">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary/80 bg-clip-text text-transparent">
                Chameleon AI
              </h1>
              <p className="text-sm md:text-base text-muted-foreground font-medium animate-shimmer">Adapting to your conversation...</p>
            </div>
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
