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
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 bg-gradient-to-br from-black/25 via-black/15 to-black/10 backdrop-blur-md',
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
  backgroundImage,
  backgroundTexture = false,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
  nested?: boolean
  backgroundImage?: string
  backgroundTexture?: boolean
}) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay nested={nested} />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        data-nested={nested ? 'true' : undefined}
        className={cn(
          'relative isolate bg-background/95 supports-[backdrop-filter]:backdrop-blur-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed left-1/2 top-1/2 grid w-full max-w-[calc(100%-2rem)] max-h-[min(90vh,calc(100dvh-2rem))] md:max-h-[calc(100vh-3rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border/60 p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.35),0_8px_30px_-18px_rgba(0,0,0,0.25)] ring-1 ring-black/5 duration-200 sm:max-w-lg',
          nested ? 'z-[10999]' : 'z-[9999]',
          className,
        )}
        style={{
          willChange: 'transform, opacity',
          backgroundColor: 'hsl(var(--background))',
          opacity: 1,
          ...(backgroundImage
            ? {
                backgroundImage,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              }
            : {}),
        }}
        {...props}
      >
        {backgroundTexture && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60 mix-blend-soft-light"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.08), transparent 40%), radial-gradient(circle at 80% 0%, rgba(99,102,241,0.10), transparent 35%), radial-gradient(circle at 50% 100%, rgba(0,0,0,0.08), transparent 40%), linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 50%, rgba(255,255,255,0.04) 100%), url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"160\" viewBox=\"0 0 160 160\"%3E%3Cfilter id=\"n\" x=\"0\" y=\"0\" width=\"100%25\" height=\"100%25\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"2\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23n)\" opacity=\"0.08\"/%3E%3C/svg%3E')",
            }}
          />
        )}
        <div className="relative flex flex-col gap-4 max-h-full overflow-y-auto">
          {children}
        </div>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-80 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

type DialogHeaderProps = React.ComponentProps<'div'> & {
  icon?: React.ReactNode
  subtitle?: React.ReactNode
  title?: React.ReactNode
  align?: 'start' | 'center'
}

function DialogHeader({
  className,
  children,
  icon,
  subtitle,
  title,
  align = 'start',
  ...props
}: DialogHeaderProps) {
  const structured = icon || subtitle || title

  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col gap-3',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
      {...props}
    >
      {structured ? (
        <div className={cn('flex w-full gap-3', align === 'center' ? 'justify-center' : 'items-start')}>
          {icon && (
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/15 shadow-sm">
              {icon}
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-1">
            {title && (
              <DialogTitle className="text-xl font-semibold leading-tight">
                {title}
              </DialogTitle>
            )}
            {subtitle && (
              <DialogDescription className="text-sm leading-relaxed">
                {subtitle}
              </DialogDescription>
            )}
            {children}
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3',
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
