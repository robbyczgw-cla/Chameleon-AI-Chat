'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { XIcon } from 'lucide-react'

import { cn } from '@/lib/utils'

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" container={typeof window !== 'undefined' ? document.body : undefined} {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  nested = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay> & { nested?: boolean }) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      data-nested={nested ? 'true' : undefined}
      className={cn(
        // GPU-OPTIMIZED: Reduced backdrop effects
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-black/40',
        nested ? 'z-[10998]' : 'z-[9998]',
        className,
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  nested = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  nested?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay nested={nested} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-nested={nested ? 'true' : undefined}
        className={cn(
          // GPU-OPTIMIZED: Removed backdrop-blur-xl - was 24px blur!
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-1/2 top-1/2 flex flex-col w-full max-w-[calc(100%-2rem)] max-h-[min(90vh,calc(100dvh-2rem))] md:max-h-[calc(100vh-3rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-hairline shadow-apple-2 duration-200 sm:max-w-lg',
          nested ? 'z-[10999]' : 'z-[9999]',
          className,
        )}
        style={{
          willChange: 'transform, opacity',
          backgroundColor: 'var(--background)',
          opacity: 1,
        }}
        {...props}
      >
        {/* Close button - sticky at top right */}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="absolute top-3 right-3 z-[60] h-8 w-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 pt-12">
          {children}
        </div>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-header"
      className={cn('flex flex-col gap-2 text-center sm:text-left', className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
        className,
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn('text-lg leading-none font-semibold', className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
