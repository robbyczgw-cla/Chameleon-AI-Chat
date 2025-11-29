"use client"

import { Plus, Menu, Settings, Sliders, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { haptics } from "@/lib/haptics"
import { MobileMoreMenu } from "@/components/mobile-more-menu"
import { useViewTransition } from "@/hooks/use-view-transition"

interface MobileBottomNavProps {
  onMenuClick: () => void
  onNewChatClick: () => void
  onSettingsClick: () => void
  onProfileClick: () => void
  onMemoryClick: () => void
  onComparisonClick: () => void
  onSearchClick: () => void
  onDocCollectionsClick: () => void
  onAdvancedSettingsClick: () => void
  onDebateClick: () => void
  onInspectorClick: () => void
  onStatsClick: () => void
  onPersonasClick: () => void
  onPromptHelperClick: () => void
  activeView?: "chats" | "settings" | "tune" | "more"
}

export function MobileBottomNav({
  onMenuClick,
  onNewChatClick,
  onSettingsClick,
  onProfileClick,
  onMemoryClick,
  onComparisonClick,
  onSearchClick,
  onDocCollectionsClick,
  onAdvancedSettingsClick,
  onDebateClick,
  onInspectorClick,
  onStatsClick,
  onPersonasClick,
  onPromptHelperClick,
  activeView = "chats",
}: MobileBottomNavProps) {
  const { navigateWithTransition } = useViewTransition()

  // Wrap navigation actions with view transitions for smoother feel
  const handleNavigation = (callback: () => void) => {
    haptics.trigger('selection')
    navigateWithTransition(callback)
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
      {/* Modern floating pill navigation */}
      <div className="mx-3 mb-2">
        <div className="relative flex items-center justify-around px-2 py-2 rounded-[28px] mobile-nav-glass border border-white/10 dark:border-white/5 shadow-xl shadow-black/10 dark:shadow-black/30">
          {/* Background glow effect */}
          <div className="absolute inset-0 rounded-[28px] bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none" />

          {/* Chats */}
          <button
            onClick={() => handleNavigation(onMenuClick)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 min-w-[56px] min-h-[44px] justify-center rounded-2xl transition-all duration-300",
              activeView === "chats"
                ? "text-primary bg-primary/10 dark:bg-primary/15 scale-105"
                : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <Menu className={cn("h-5 w-5 transition-transform", activeView === "chats" && "scale-110")} />
            <span className="text-[10px] font-semibold tracking-wide">Chats</span>
            {activeView === "chats" && (
              <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
            )}
          </button>

          {/* Settings */}
          <button
            onClick={() => handleNavigation(onSettingsClick)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 min-w-[56px] min-h-[44px] justify-center rounded-2xl transition-all duration-300",
              activeView === "settings"
                ? "text-primary bg-primary/10 dark:bg-primary/15 scale-105"
                : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <Settings className={cn("h-5 w-5 transition-transform", activeView === "settings" && "scale-110")} />
            <span className="text-[10px] font-semibold tracking-wide">Settings</span>
            {activeView === "settings" && (
              <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
            )}
          </button>

          {/* Central FAB - New Chat */}
          <div className="relative -mt-8">
            <button
              onClick={() => {
                haptics.trigger('medium')
                navigateWithTransition(onNewChatClick)
              }}
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary to-accent shadow-lg shadow-primary/25 dark:shadow-primary/40 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-primary/30 active:scale-95 group"
            >
              {/* Animated ring */}
              <span className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent opacity-0 group-hover:opacity-20 blur-xl transition-opacity" />
              {/* Inner glow */}
              <span className="absolute inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
              <Plus className="h-6 w-6 text-white relative z-10 transition-transform group-hover:rotate-90 duration-300" strokeWidth={2.5} />
            </button>
            {/* FAB label */}
            <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] font-semibold text-muted-foreground whitespace-nowrap">
              New Chat
            </span>
          </div>

          {/* Tune */}
          <button
            onClick={() => handleNavigation(onAdvancedSettingsClick)}
            className={cn(
              "relative flex flex-col items-center gap-0.5 min-w-[56px] min-h-[44px] justify-center rounded-2xl transition-all duration-300",
              activeView === "tune"
                ? "text-primary bg-primary/10 dark:bg-primary/15 scale-105"
                : "text-muted-foreground hover:text-foreground active:scale-95"
            )}
          >
            <Sliders className={cn("h-5 w-5 transition-transform", activeView === "tune" && "scale-110")} />
            <span className="text-[10px] font-semibold tracking-wide">Tune</span>
            {activeView === "tune" && (
              <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-primary" />
            )}
          </button>

          {/* More */}
          <div className="relative flex flex-col items-center gap-0.5 min-w-[56px] min-h-[44px] justify-center">
            <MobileMoreMenu
              onSettingsClick={onSettingsClick}
              onProfileClick={onProfileClick}
              onMemoryClick={onMemoryClick}
              onComparisonClick={onComparisonClick}
              onSearchClick={onSearchClick}
              onDocCollectionsClick={onDocCollectionsClick}
              onDebateClick={onDebateClick}
              onInspectorClick={onInspectorClick}
              onStatsClick={onStatsClick}
              onPersonasClick={onPersonasClick}
              onPromptHelperClick={onPromptHelperClick}
            />
          </div>
        </div>
      </div>
    </nav>
  )
}
