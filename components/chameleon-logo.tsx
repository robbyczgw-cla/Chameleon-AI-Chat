"use client"

import type React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ChameleonLogoProps {
  className?: string
  size?: number
  animated?: boolean
  colorShift?: boolean
}

export function ChameleonLogo({
  className = "",
  size = 24,
  animated = false,
  colorShift = false
}: ChameleonLogoProps) {
  return (
    <Image
      src="/chameleon-logo.jpg"
      alt="Chameleon AI Logo"
      width={size}
      height={size}
      className={cn(
        "rounded-lg object-cover",
        className,
        animated && "animate-pulse",
        colorShift && "chameleon-color-shift"
      )}
      priority
    />
  )
}

// Simpler variant for smaller sizes (uses same image)
export function ChameleonLogoSimple({
  className = "",
  size = 24,
  animated = false
}: ChameleonLogoProps) {
  return (
    <Image
      src="/chameleon-logo.jpg"
      alt="Chameleon AI Logo"
      width={size}
      height={size}
      className={cn(
        "rounded-md object-cover",
        className,
        animated && "animate-pulse"
      )}
      priority
    />
  )
}
