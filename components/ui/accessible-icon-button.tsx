"use client"

import * as React from "react"
import { Button, type buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

interface AccessibleIconButtonProps
  extends Omit<React.ComponentProps<"button">, "children">,
    VariantProps<typeof buttonVariants> {
  /** Required accessible label for screen readers */
  label: string
  /** The icon to display */
  icon: React.ReactNode
  /** Show tooltip on hover (defaults to true) */
  showTooltip?: boolean
  /** Tooltip side preference */
  tooltipSide?: "top" | "right" | "bottom" | "left"
  /** Use Slot for composition (passed to Button) */
  asChild?: boolean
  /** Additional class for the icon wrapper */
  iconClassName?: string
  /** Whether the button is in an active/pressed state */
  isActive?: boolean
  /** Loading state - shows a spinner */
  isLoading?: boolean
  /** Keyboard shortcut hint (e.g., "⌘K") */
  shortcut?: string
}

/**
 * Accessible Icon Button Component
 *
 * Wraps icon-only buttons with proper accessibility features:
 * - aria-label for screen readers
 * - Tooltip for sighted users
 * - Consistent styling
 * - Loading state support
 * - Keyboard shortcut hints
 *
 * @example
 * <AccessibleIconButton
 *   label="Send message"
 *   icon={<Send className="h-4 w-4" />}
 *   onClick={handleSend}
 * />
 */
export function AccessibleIconButton({
  label,
  icon,
  showTooltip = true,
  tooltipSide = "top",
  className,
  iconClassName,
  isActive,
  isLoading,
  shortcut,
  disabled,
  variant = "ghost",
  size = "icon",
  ...props
}: AccessibleIconButtonProps) {
  const button = (
    <Button
      variant={variant}
      size={size}
      className={cn(
        isActive && "bg-accent text-accent-foreground",
        className
      )}
      disabled={disabled || isLoading}
      aria-label={label}
      aria-pressed={isActive}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className={cn("h-4 w-4 animate-spin", iconClassName)}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <span className={iconClassName} aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </Button>
  )

  if (!showTooltip) {
    return button
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={tooltipSide} className="flex items-center gap-2">
          <span>{label}</span>
          {shortcut && (
            <kbd className="ml-1 text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Screen reader only text
 * Use for adding accessible text that should not be visible
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>
}

/**
 * Skip to main content link for keyboard navigation
 */
export function SkipToContent({ targetId = "main-content" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-md focus:top-4 focus:left-4"
    >
      Skip to main content
    </a>
  )
}

/**
 * Live region for announcing dynamic content changes
 */
export function LiveRegion({
  children,
  mode = "polite",
  atomic = true,
}: {
  children: React.ReactNode
  mode?: "polite" | "assertive" | "off"
  atomic?: boolean
}) {
  return (
    <div
      role="status"
      aria-live={mode}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  )
}

export default AccessibleIconButton
