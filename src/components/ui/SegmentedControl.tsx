import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface Segment<T extends string> {
  value: T
  label: ReactNode
  ariaLabel?: string
}

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  segments: Segment<T>[]
  size?: 'sm' | 'md'
  className?: string
}

/** Compact mutually-exclusive switch — Day/Week, list density, chart range. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  segments,
  size = 'md',
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-md bg-surface-sunken p-0.5 ring-1 ring-inset ring-line-subtle',
        className,
      )}
    >
      {segments.map((seg) => {
        const active = seg.value === value
        return (
          <button
            key={seg.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={seg.ariaLabel}
            onClick={() => onChange(seg.value)}
            className={cn(
              'inline-flex items-center justify-center gap-1.5 rounded-sm font-medium transition-all',
              size === 'sm' ? 'h-6 px-2 text-xs' : 'h-7 px-2.5 text-sm',
              active
                ? 'bg-surface text-fg shadow-xs ring-1 ring-inset ring-line-subtle'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {seg.label}
          </button>
        )
      })}
    </div>
  )
}
