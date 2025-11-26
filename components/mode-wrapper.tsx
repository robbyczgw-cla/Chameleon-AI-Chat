"use client"

import { useState, useEffect } from "react"
import { useApp } from "@/contexts/app-context"
import { SimpleChatApp } from "@/components/simple-chat-app"
import { ModeSelectionDialog } from "@/components/mode-selection-dialog"

interface ModeWrapperProps {
  children: React.ReactNode
}

export function ModeWrapper({ children }: ModeWrapperProps) {
  const { settings, updateSettings, isLoading } = useApp()
  const [showModeSelection, setShowModeSelection] = useState(false)
  const [hasCheckedModeSelection, setHasCheckedModeSelection] = useState(false)

  // Check if user needs to select a mode (first-time user)
  useEffect(() => {
    if (!isLoading) {
      const modeSelected = localStorage.getItem("chameleon-mode-selected")
      if (!modeSelected) {
        setShowModeSelection(true)
      }
      setHasCheckedModeSelection(true)
    }
  }, [isLoading])

  // Handle mode selection
  const handleModeSelection = (simpleMode: boolean) => {
    // Update settings with the selected mode
    updateSettings({ simpleMode })

    // If Simple Mode selected, the onboarding will be triggered by SimpleChatApp
    // For Advanced Mode, no onboarding needed

    setShowModeSelection(false)
  }

  // Don't render during loading to prevent flash
  if (isLoading || !hasCheckedModeSelection) {
    return null
  }

  // Show mode selection dialog for first-time users
  if (showModeSelection) {
    return (
      <ModeSelectionDialog
        open={showModeSelection}
        onSelectMode={handleModeSelection}
      />
    )
  }

  // Simple Mode: Clean, persona-focused interface
  if (settings.simpleMode) {
    return <SimpleChatApp />
  }

  // Advanced Mode: Full-featured interface (default)
  return <>{children}</>
}
