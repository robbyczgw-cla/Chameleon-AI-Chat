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
        'peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-muted-foreground/30 focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-muted-foreground/40 inline-flex h-[10px] w-[22px] shrink-0 items-center rounded-full border border-transparent transition-colors outline-none focus-visible:ring-[2px] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={
          'bg-white pointer-events-none block h-[6px] w-[6px] rounded-full transition-transform duration-200 ease-in-out data-[state=checked]:translate-x-[14px] data-[state=unchecked]:translate-x-[2px]'
        }
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
