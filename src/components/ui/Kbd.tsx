import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Keyboard hint chip. Sized to sit inline with 13px body text. */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[18px] min-w-[18px] select-none items-center justify-center rounded-xs px-1',
        'bg-surface-sunken font-sans text-2xs font-semibold text-fg-subtle ring-1 ring-inset ring-line',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
