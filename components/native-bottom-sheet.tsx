'use client'

import { useEffect, useRef, useState, ReactNode } from 'react'
import { Capacitor } from '@capacitor/core'
import { cn } from '@/lib/utils'

const isNative = Capacitor.isNativePlatform()
const isAndroid = Capacitor.getPlatform() === 'android'

interface NativeBottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
  title?: string
  showHandle?: boolean
  snapPoints?: number[]
  className?: string
}

/**
 * Native Bottom Sheet Component
 * Uses native-feeling bottom sheet on Android, falls back to regular dialog on web/iOS
 * Maintains 100% functionality while providing native UX
 */
export function NativeBottomSheet({
  open,
  onOpenChange,
  children,
  title,
  showHandle = true,
  snapPoints = [0.5, 0.9],
  className,
}: NativeBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startY = useRef(0)
  const currentSnapIndex = useRef(0)

  // Handle backdrop click
  const handleBackdropClick = () => {
    // Trigger haptic feedback on native
    if (isNative) {
      import('@/lib/capacitor/haptics').then(({ nativeHaptics }) => {
        nativeHaptics.impact('light')
      })
    }
    onOpenChange(false)
  }

  // Handle drag start
  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isAndroid) return
    setIsDragging(true)
    startY.current = 'touches' in e ? e.touches[0].clientY : e.clientY
  }

  // Handle drag move
  const handleDragMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging || !isAndroid) return
    const currentY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const diff = currentY - startY.current
    if (diff > 0) {
      setDragY(diff)
    }
  }

  // Handle drag end
  const handleDragEnd = () => {
    if (!isAndroid) return
    setIsDragging(false)

    // If dragged more than 100px, close the sheet
    if (dragY > 100) {
      if (isNative) {
        import('@/lib/capacitor/haptics').then(({ nativeHaptics }) => {
          nativeHaptics.impact('medium')
        })
      }
      onOpenChange(false)
    }
    setDragY(0)
  }

  // Handle back button on Android
  useEffect(() => {
    if (!open || !isAndroid) return

    const handleBackButton = (e: Event) => {
      e.preventDefault()
      onOpenChange(false)
    }

    document.addEventListener('chameleon:close-dialog', handleBackButton)
    return () => {
      document.removeEventListener('chameleon:close-dialog', handleBackButton)
    }
  }, [open, onOpenChange])

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  // Use native Android bottom sheet styling
  if (isAndroid) {
    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-50 bg-black/60 transition-opacity duration-300"
          style={{
            opacity: open ? 1 - dragY / 300 : 0,
          }}
          onClick={handleBackdropClick}
        />

        {/* Sheet */}
        <div
          ref={sheetRef}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-[var(--native-surface-container-low,#171d18)]',
            'rounded-t-[28px] shadow-2xl',
            'max-h-[90vh] overflow-hidden',
            'transition-transform duration-300',
            className
          )}
          style={{
            transform: `translateY(${dragY}px)`,
            transitionTimingFunction: isDragging ? 'linear' : 'cubic-bezier(0.2, 0, 0, 1)',
            transitionDuration: isDragging ? '0ms' : '300ms',
            animation: !isDragging && dragY === 0 ? 'native-sheet-enter 0.4s cubic-bezier(0.2, 0, 0, 1)' : undefined,
          }}
        >
          {/* Handle */}
          {showHandle && (
            <div
              className="pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              onMouseDown={handleDragStart}
              onMouseMove={isDragging ? handleDragMove : undefined}
              onMouseUp={handleDragEnd}
              onMouseLeave={isDragging ? handleDragEnd : undefined}
            >
              <div className="w-8 h-1 rounded-full bg-[var(--native-outline-variant,#414941)] mx-auto" />
            </div>
          )}

          {/* Title */}
          {title && (
            <div className="px-6 py-4 border-b border-[var(--native-outline-variant,#414941)]">
              <h2 className="text-xl font-normal text-white">{title}</h2>
            </div>
          )}

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] overscroll-contain">
            {children}
          </div>

          {/* Safe area padding */}
          <div className="pb-[env(safe-area-inset-bottom,0)]" />
        </div>
      </>
    )
  }

  // Fallback for non-Android (iOS, Web) - use standard dialog overlay
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      />
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-background rounded-t-2xl shadow-2xl',
          'max-h-[90vh] overflow-hidden',
          'animate-in slide-in-from-bottom duration-300',
          className
        )}
      >
        {showHandle && (
          <div className="pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto" />
          </div>
        )}
        {title && (
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
        <div className="pb-[env(safe-area-inset-bottom,0)]" />
      </div>
    </>
  )
}

export default NativeBottomSheet
