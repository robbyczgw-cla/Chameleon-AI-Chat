"use client"

import { Button } from "@/components/ui/button"
import { Plus, Menu, Settings, Sliders, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { haptics } from "@/lib/haptics"
import { MobileMoreMenu } from "@/components/mobile-more-menu"

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
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="relative flex items-center justify-between bg-slate-900/95 backdrop-blur-xl px-3 py-1.5 shadow-lg border-t border-white/5">
        {/* Chats */}
        <button
          onClick={() => {
            haptics.trigger('selection')
            onMenuClick()
          }}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 min-w-[40px] min-h-[36px] justify-center transition-all duration-200",
            activeView === "chats"
              ? "text-white"
              : "text-white/80 hover:text-white"
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[11px] font-medium">Chats</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => {
            haptics.trigger('selection')
            onSettingsClick()
          }}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 min-w-[40px] min-h-[36px] justify-center transition-all duration-200",
            activeView === "settings"
              ? "text-white"
              : "text-white/80 hover:text-white"
          )}
        >
          <Settings className="h-5 w-5" />
          <span className="text-[11px] font-medium">Settings</span>
        </button>

        {/* Spacer for FAB */}
        <div className="w-12" />

        {/* Tune */}
        <button
          onClick={() => {
            haptics.trigger('selection')
            onAdvancedSettingsClick()
          }}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 min-w-[40px] min-h-[36px] justify-center transition-all duration-200",
            activeView === "tune"
              ? "text-white"
              : "text-white/80 hover:text-white"
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
            onNewChatClick()
          }}
          className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-accent shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
        >
          <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
        </button>
      </div>
    </nav>
  )
}
