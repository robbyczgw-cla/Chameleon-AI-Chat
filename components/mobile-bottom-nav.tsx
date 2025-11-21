"use client"

import { Button } from "@/components/ui/button"
import { Plus, Wand2, Sparkles, Menu, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { haptics } from "@/lib/haptics"
import { MobileMoreMenu } from "@/components/mobile-more-menu"

interface MobileBottomNavProps {
  onMenuClick: () => void
  onNewChatClick: () => void
  onPersonasClick: () => void
  onPromptHelperClick: () => void
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
  activeView?: "chats" | "personas"
}

export function MobileBottomNav({
  onMenuClick,
  onNewChatClick,
  onPersonasClick,
  onPromptHelperClick,
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
  activeView = "chats",
}: MobileBottomNavProps) {
  return (
    <div className="fixed bottom-4 left-0 right-0 z-50 md:hidden px-4 pointer-events-none">
      <div className="mx-auto max-w-3xl rounded-2xl pill-nav backdrop-blur-2xl p-2 shadow-2xl shadow-primary/15 border border-border/70 pointer-events-auto safe-bottom">
        <div className="flex items-center justify-between gap-1.5">
          {/* Chats/Menu */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            haptics.trigger('selection')
            onMenuClick()
          }}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 h-auto py-2 px-2 rounded-xl transition-all text-xs font-semibold",
            activeView === "chats"
              ? "bg-primary/15 text-primary shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:text-foreground/80"
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-medium">Chats</span>
        </Button>

        {/* Personas */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            haptics.trigger('selection')
            onPersonasClick()
          }}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 h-auto py-2 px-2 rounded-xl transition-all text-xs font-semibold",
            activeView === "personas"
              ? "bg-primary/15 text-primary shadow-sm shadow-primary/20"
              : "text-muted-foreground hover:text-foreground/80"
          )}
        >
          <Wand2 className="h-5 w-5" />
          <span className="text-[10px] font-medium">Personas</span>
        </Button>

        {/* New Chat - Bigger, centered */}
        <Button
          size="sm"
          onClick={() => {
            haptics.trigger('medium')
            onNewChatClick()
          }}
          className="flex-1 flex flex-col items-center gap-1 h-auto py-3 px-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg shadow-primary/35 hover:brightness-105"
        >
          <Plus className="h-6 w-6" />
          <span className="text-[10px] font-medium">New</span>
        </Button>

        {/* Prompt Helper */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            haptics.trigger('selection')
            onPromptHelperClick()
          }}
          className="flex-1 flex flex-col items-center gap-1 h-auto py-2 px-2 rounded-xl transition-all text-xs font-semibold text-muted-foreground hover:text-foreground/80"
        >
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <span className="text-[10px] font-medium">Prompts</span>
        </Button>

        {/* Settings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            haptics.trigger('selection')
            onSettingsClick()
          }}
          className="flex-1 flex flex-col items-center gap-1 h-auto py-2 px-2 rounded-xl transition-all text-xs font-semibold text-muted-foreground hover:text-foreground/80"
        >
          <Settings className="h-5 w-5" />
          <span className="text-[10px] font-medium">Settings</span>
        </Button>

        {/* More Menu */}
        <MobileMoreMenu
          onSettingsClick={onSettingsClick}
          onProfileClick={onProfileClick}
          onMemoryClick={onMemoryClick}
          onComparisonClick={onComparisonClick}
          onSearchClick={onSearchClick}
          onDocCollectionsClick={onDocCollectionsClick}
          onAdvancedSettingsClick={onAdvancedSettingsClick}
          onDebateClick={onDebateClick}
          onInspectorClick={onInspectorClick}
          onStatsClick={onStatsClick}
        />
        </div>
      </div>
    </div>
  )
}
