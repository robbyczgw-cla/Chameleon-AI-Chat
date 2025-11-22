"use client"

import { Button } from "@/components/ui/button"
import { Plus, Menu, Settings, Sliders } from "lucide-react"
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
  activeView?: "chats" | "personas"
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
    <div className="fixed bottom-4 left-0 right-0 z-50 md:hidden px-3 pointer-events-none">
      <div className="mx-auto max-w-md rounded-3xl glass-strong backdrop-blur-3xl p-1.5 shadow-2xl shadow-black/20 border border-white/20 dark:border-white/10 pointer-events-auto safe-bottom">
        <div className="flex items-center justify-between gap-1">
          {/* Chats/Menu */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              haptics.trigger('selection')
              onMenuClick()
            }}
            className={cn(
              "flex-1 flex flex-col items-center gap-0.5 h-auto py-2 px-1.5 rounded-2xl transition-all duration-200",
              activeView === "chats"
                ? "bg-primary/20 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Menu className="h-[18px] w-[18px]" />
            <span className="text-[9px] font-medium tracking-tight">Chats</span>
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              haptics.trigger('selection')
              onSettingsClick()
            }}
            className="flex-1 flex flex-col items-center gap-0.5 h-auto py-2 px-1.5 rounded-2xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <Settings className="h-[18px] w-[18px]" />
            <span className="text-[9px] font-medium tracking-tight">Settings</span>
          </Button>

          {/* New Chat - Prominent center button */}
          <Button
            size="sm"
            onClick={() => {
              haptics.trigger('medium')
              onNewChatClick()
            }}
            className="flex flex-col items-center gap-0.5 h-auto py-2.5 px-4 rounded-2xl bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground shadow-lg shadow-primary/40 hover:shadow-xl hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
            <span className="text-[9px] font-semibold tracking-tight">New</span>
          </Button>

          {/* Advanced Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              haptics.trigger('selection')
              onAdvancedSettingsClick()
            }}
            className="flex-1 flex flex-col items-center gap-0.5 h-auto py-2 px-1.5 rounded-2xl transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-muted/50"
          >
            <Sliders className="h-[18px] w-[18px]" />
            <span className="text-[9px] font-medium tracking-tight">Tune</span>
          </Button>

          {/* More Menu */}
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
  )
}
