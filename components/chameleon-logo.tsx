"use client"

import type React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ChameleonLogoProps {
  className?: string
  size?: number
  animated?: boolean
  colorShift?: boolean
  isHifi?: boolean
}

export function ChameleonLogo({
  className = "",
  size = 24,
  animated = false,
  colorShift = false,
  isHifi = false
}: ChameleonLogoProps) {
  // HiFi mode shows HIFI TEAM logo
  if (isHifi) {
    return (
      <Image
        src="/hifi-team-logo.svg"
        alt="HIFI TEAM Logo"
        width={size * 3}
        height={size}
        className={cn(
          "object-contain",
          className,
          animated && "animate-pulse"
        )}
        priority
      />
    )
  }

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
