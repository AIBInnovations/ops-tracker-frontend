import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Keyboard hint chip. Sized to sit inline with 13px body text.
 *
 * `tone="onNav"` is for the violet rail, where the surface tokens would
 * disappear into the gradient.
 */
export function Kbd({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode
  tone?: 'default' | 'onNav'
  className?: string
}) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[19px] min-w-[19px] select-none items-center justify-center rounded-xs px-1.5',
        'font-sans text-2xs font-semibold ring-1 ring-inset',
        tone === 'onNav'
          ? 'bg-white/15 text-white/75 ring-white/25'
          : 'bg-surface-sunken text-fg-subtle ring-line',
        className,
      )}
    >
      {children}
    </kbd>
  )
}
