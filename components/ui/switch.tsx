'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'
import { toggle } from '@/lib/mobile-design-tokens'

/**
 * Switch component using centralized design tokens
 * @see /lib/mobile-design-tokens.ts for dimension values
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
      style={{
        height: `${toggle.track.height}px`,
        width: `${toggle.track.width}px`,
        minHeight: `${toggle.track.height}px`,
        maxHeight: `${toggle.track.height}px`,
        minWidth: `${toggle.track.width}px`,
        maxWidth: `${toggle.track.width}px`,
      }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'bg-white pointer-events-none block rounded-full',
          'transition-transform duration-200 ease-in-out',
          `data-[state=checked]:translate-x-[${toggle.thumb.offsetChecked}px]`,
          `data-[state=unchecked]:translate-x-[${toggle.thumb.offsetUnchecked}px]`,
        )}
        style={{
          height: `${toggle.thumb.size}px`,
          width: `${toggle.thumb.size}px`,
        }}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
