"use client"

import { Plus, Menu, Settings, Sliders } from "lucide-react"
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
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)] gpu-layer">
      <div className="flex items-center justify-between px-3 py-1.5 shadow-lg border-t border-border/50 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40">
        {/* Chats */}
        <button
          onClick={() => handleNavigation(onMenuClick)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 min-w-[40px] min-h-[36px] justify-center transition-all duration-200",
            activeView === "chats"
              ? "text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[11px] font-medium">Chats</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => handleNavigation(onSettingsClick)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 min-w-[40px] min-h-[36px] justify-center transition-all duration-200",
            activeView === "settings"
              ? "text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[11px] font-medium">Settings</span>
        </button>

        {/* Spacer for FAB */}
        <div className="w-12" />

        {/* Tune */}
        <button
          onClick={() => handleNavigation(onAdvancedSettingsClick)}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 min-w-[40px] min-h-[36px] justify-center transition-all duration-200",
            activeView === "tune"
              ? "text-primary drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sliders className="h-5 w-5" />
          <span className="text-[11px] font-medium">Tune</span>
        </button>

        {/* More */}
        <div className="flex flex-1 flex-col items-center gap-0.5 min-w-[40px] min-h-[36px] justify-center">
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

        {/* Central FAB - New Chat */}
        <button
          onClick={() => {
            haptics.trigger('medium')
            navigateWithTransition(onNewChatClick)
          }}
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 animate-pulse-glow gpu-layer"
        >
          <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  )
}
