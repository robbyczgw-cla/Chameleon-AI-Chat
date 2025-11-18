"use client"

interface ModeWrapperProps {
  children: React.ReactNode
}

export function ModeWrapper({ children }: ModeWrapperProps) {
  // All users see the standard advanced mode
  return <>{children}</>
}
