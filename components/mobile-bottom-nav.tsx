"use client"

import { useApp } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { MessageSquare, Search, Plus, Wand2, Settings, Menu, FolderOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { haptics } from "@/lib/haptics"

interface MobileBottomNavProps {
  onMenuClick: () => void
  onSearchClick: () => void
  onNewChatClick: () => void
  onPersonasClick: () => void
  onCollectionsClick: () => void
  activeView?: "chats" | "search" | "personas" | "collections"
}

export function MobileBottomNav({
  onMenuClick,
  onSearchClick,
  onNewChatClick,
  onPersonasClick,
  onCollectionsClick,
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

        {/* Search */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            haptics.trigger('selection')
            onSearchClick()
          }}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-lg transition-all",
            activeView === "search"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-medium">Suche</span>
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
          <span className="text-[10px] font-medium">Neu</span>
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

        {/* Document Collections */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            haptics.trigger('selection')
            onCollectionsClick()
          }}
          className={cn(
            "flex-1 flex flex-col items-center gap-1 h-auto py-2 px-1 rounded-lg transition-all",
            activeView === "collections"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FolderOpen className="h-5 w-5" />
          <span className="text-[10px] font-medium">Docs</span>
        </Button>
      </div>
    </div>
  )
}
