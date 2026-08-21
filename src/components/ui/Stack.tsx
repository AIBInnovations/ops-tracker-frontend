import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8
type Align = 'start' | 'center' | 'end' | 'baseline' | 'stretch'
type Justify = 'start' | 'center' | 'end' | 'between'

const gapClass: Record<Gap, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
}

const alignClass: Record<Align, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
}

const justifyClass: Record<Justify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
}

interface StackProps {
  gap?: Gap
  align?: Align
  justify?: Justify
  wrap?: boolean
  className?: string
  children: ReactNode
}

/** Horizontal group. Spacing always comes from gap, never sibling margins. */
export function InlineStack({
  gap = 2,
  align = 'center',
  justify = 'start',
  wrap = false,
  className,
  children,
}: StackProps) {
  return (
    <div className={cn('flex', wrap && 'flex-wrap', gapClass[gap], alignClass[align], justifyClass[justify], className)}>
      {children}
    </div>
  )
}

/** Vertical group. */
export function BlockStack({ gap = 2, align = 'stretch', justify = 'start', className, children }: StackProps) {
  return (
    <div
      className={cn('flex flex-col', gapClass[gap], alignClass[align], justifyClass[justify], className)}
    >
      {children}
    </div>
  )
}
