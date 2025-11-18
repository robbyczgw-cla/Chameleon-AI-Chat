"use client"

import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { MessageSquare, Plus, Wand2, Sparkles, Menu, Settings } from "lucide-react"
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
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-around px-2 py-2 safe-bottom">
        {/* Chats/Menu */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            haptics.trigger('selection')
            onMenuClick()
          }}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-lg transition-all",
            activeView === "chats"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
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
            "flex-1 flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-lg transition-all",
            activeView === "personas"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
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
          className="flex-1 flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25"
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
          className="flex-1 flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-lg transition-all text-muted-foreground hover:text-foreground"
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
          className="flex-1 flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-lg transition-all text-muted-foreground hover:text-foreground"
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
  )
}
