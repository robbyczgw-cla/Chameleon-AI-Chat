"use client"

import { useApp } from "@/contexts/app-context"
import { SimpleChatApp } from "@/components/simple-chat-app"

interface ModeWrapperProps {
  children: React.ReactNode
}

export function ModeWrapper({ children }: ModeWrapperProps) {
  const { settings, isLoading } = useApp()

  // Don't render during loading to prevent flash
  if (isLoading) {
    return null
  }

  // Simple Mode: Clean, persona-focused interface
  if (settings.simpleMode) {
    return <SimpleChatApp />
  }

  // Advanced Mode: Full-featured interface (default)
  return <>{children}</>
}
