'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

/**
 * Switch component with fixed compact dimensions
 * Track: 32x16px, Thumb: 10x10px
 */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30',
        'focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-muted-foreground/40',
        'inline-flex shrink-0 items-center rounded-full border border-transparent',
        'transition-colors outline-none focus-visible:ring-[2px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={{ width: 32, height: 16, minWidth: 32, minHeight: 16 }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-white pointer-events-none block rounded-full',
          'transition-transform duration-200 ease-in-out',
          'data-[state=unchecked]:translate-x-1',
          'data-[state=checked]:translate-x-[18px]',
        )}
        style={{ width: 10, height: 10 }}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
