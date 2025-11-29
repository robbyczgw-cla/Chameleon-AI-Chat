'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30 focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-muted-foreground/40 inline-flex shrink-0 items-center rounded-full border border-transparent transition-colors outline-none focus-visible:ring-[2px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      style={{ height: '16px', width: '32px', minHeight: '16px', maxHeight: '16px', minWidth: '32px', maxWidth: '32px' }}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="bg-white pointer-events-none block rounded-full transition-transform duration-200 ease-in-out data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-[4px]"
        style={{ height: '10px', width: '10px' }}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
