'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button, type ButtonProps } from '@/components/ui/button'
import { touchTarget, iconSize, button as buttonTokens } from '@/lib/mobile-design-tokens'

/**
 * Mobile-optimized button with proper touch targets
 * Ensures minimum 44px touch area for accessibility
 */
interface MobileButtonProps extends ButtonProps {
  /** Make the button fill the container width */
  fullWidth?: boolean
}

export function MobileButton({
  className,
  size = 'default',
  fullWidth,
  children,
  ...props
}: MobileButtonProps) {
  return (
    <Button
      className={cn(
        // Minimum touch target
        'min-h-[44px] min-w-[44px]',
        // Touch optimization
        'touch-manipulation active:scale-[0.98]',
        // Transition
        'transition-transform duration-150',
        // Full width option
        fullWidth && 'w-full',
        className
      )}
      size={size}
      {...props}
    >
      {children}
    </Button>
  )
}

/**
 * Icon-only button with proper touch target
 */
interface MobileIconButtonProps extends Omit<ButtonProps, 'size'> {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Icon element */
  icon: React.ReactNode
  /** Accessible label */
  'aria-label': string
}

export function MobileIconButton({
  className,
  size = 'md',
  icon,
  ...props
}: MobileIconButtonProps) {
  const sizeStyles = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  }

  const iconSizeStyles = {
    sm: '[&_svg]:h-4 [&_svg]:w-4',
    md: '[&_svg]:h-5 [&_svg]:w-5',
    lg: '[&_svg]:h-6 [&_svg]:w-6',
  }

  return (
    <Button
      variant="ghost"
      className={cn(
        // Size
        sizeStyles[size],
        iconSizeStyles[size],
        // Shape
        'rounded-full p-0',
        // Touch optimization
        'touch-manipulation active:scale-95',
        'transition-transform duration-150',
        // Ensure touch target even if visually smaller
        'relative after:absolute after:inset-[-4px] after:content-[""]',
        className
      )}
      {...props}
    >
      {icon}
    </Button>
  )
}

/**
 * Mobile nav bar item
 */
interface MobileNavItemProps {
  icon: React.ReactNode
  label: string
  isActive?: boolean
  onClick?: () => void
  badge?: number
  className?: string
}

export function MobileNavItem({
  icon,
  label,
  isActive,
  onClick,
  badge,
  className,
}: MobileNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Layout
        'flex flex-col items-center justify-center',
        'w-16 py-1',
        // Touch target
        'min-h-[48px] touch-manipulation',
        // Transition
        'transition-colors duration-150',
        // States
        isActive
          ? 'text-primary'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      <div className="relative">
        <span className={cn(
          '[&_svg]:h-[22px] [&_svg]:w-[22px]',
          isActive && '[&_svg]:stroke-[2.5px]'
        )}>
          {icon}
        </span>
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] mt-0.5 font-medium">{label}</span>
    </button>
  )
}

/**
 * Mobile action row - horizontal scrollable action buttons
 */
interface MobileActionRowProps {
  children: React.ReactNode
  className?: string
}

export function MobileActionRow({ children, className }: MobileActionRowProps) {
  return (
    <div
      className={cn(
        'flex gap-2 overflow-x-auto scrollbar-hide',
        '-mx-4 px-4 py-2',
        'snap-x snap-mandatory',
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Mobile chip/tag component
 */
interface MobileChipProps {
  children: React.ReactNode
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function MobileChip({
  children,
  selected,
  onClick,
  className,
}: MobileChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        // Base
        'inline-flex items-center justify-center',
        'h-8 px-3 rounded-full',
        'text-sm font-medium whitespace-nowrap',
        'touch-manipulation snap-start',
        'transition-colors duration-150',
        // States
        selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80',
        className
      )}
    >
      {children}
    </button>
  )
}

/**
 * Mobile list item with touch feedback
 */
interface MobileListItemProps {
  children: React.ReactNode
  onClick?: () => void
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  rightContent?: React.ReactNode
  className?: string
}

export function MobileListItem({
  children,
  onClick,
  leftIcon,
  rightIcon,
  rightContent,
  className,
}: MobileListItemProps) {
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      onClick={onClick}
      className={cn(
        // Layout
        'flex items-center gap-3 w-full',
        'min-h-[48px] px-4 py-3',
        // Touch feedback
        onClick && 'touch-manipulation active:bg-muted/50',
        'transition-colors duration-150',
        className
      )}
    >
      {leftIcon && (
        <span className="flex-shrink-0 text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">
          {leftIcon}
        </span>
      )}
      <span className="flex-1 text-left">{children}</span>
      {rightContent}
      {rightIcon && (
        <span className="flex-shrink-0 text-muted-foreground [&_svg]:h-5 [&_svg]:w-5">
          {rightIcon}
        </span>
      )}
    </Component>
  )
}

/**
 * Mobile bottom sheet handle
 */
export function MobileSheetHandle({ className }: { className?: string }) {
  return (
    <div className={cn('flex justify-center py-3', className)}>
      <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
    </div>
  )
}

/**
 * Mobile safe area wrapper
 * Adds padding for notches and home indicators
 */
interface MobileSafeAreaProps {
  children: React.ReactNode
  top?: boolean
  bottom?: boolean
  className?: string
}

export function MobileSafeArea({
  children,
  top,
  bottom,
  className,
}: MobileSafeAreaProps) {
  return (
    <div
      className={cn(
        top && 'pt-[env(safe-area-inset-top)]',
        bottom && 'pb-[env(safe-area-inset-bottom)]',
        className
      )}
    >
      {children}
    </div>
  )
}
