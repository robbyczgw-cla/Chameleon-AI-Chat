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
    <div className="fixed bottom-5 left-0 right-0 z-50 md:hidden px-3 pointer-events-none pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-[95%] rounded-[30px] p-2 pointer-events-auto"
        style={{
          background: 'rgba(10, 10, 15, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        }}
      >
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
              "flex-1 flex flex-col items-center gap-1 h-auto py-2.5 px-2 rounded-2xl transition-all duration-200 relative",
              activeView === "chats"
                ? "text-[#00F0FF]"
                : "text-white/60 hover:text-white/90"
            )}
            style={activeView === "chats" ? {
              textShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
            } : {}}
          >
            <Menu className="h-5 w-5" />
            {activeView === "chats" && (
              <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#00F0FF] shadow-[0_0_6px_#00F0FF]" />
            )}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              haptics.trigger('selection')
              onSettingsClick()
            }}
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2.5 px-2 rounded-2xl transition-all duration-200 text-white/60 hover:text-white/90"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* New Chat - Floating Action Button style */}
          <Button
            size="sm"
            onClick={() => {
              haptics.trigger('medium')
              onNewChatClick()
            }}
            className="flex items-center justify-center h-12 w-12 rounded-full -mt-6 transition-all duration-200 hover:scale-110 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7000FF 0%, #00F0FF 100%)',
              boxShadow: '0 0 20px rgba(0, 240, 255, 0.5), 0 4px 15px rgba(0, 0, 0, 0.3)',
            }}
          >
            <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />
          </Button>

          {/* Advanced Settings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              haptics.trigger('selection')
              onAdvancedSettingsClick()
            }}
            className="flex-1 flex flex-col items-center gap-1 h-auto py-2.5 px-2 rounded-2xl transition-all duration-200 text-white/60 hover:text-white/90"
          >
            <Sliders className="h-5 w-5" />
          </Button>

          {/* More Menu */}
          <div className="flex-1 flex justify-center">
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
    </div>
  )
}
