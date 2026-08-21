import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Text } from './Text'

interface CardProps {
  children: ReactNode
  /** Off for tables and lists that manage their own edge padding. */
  padding?: boolean
  /** Removes the shadow, leaving only the hairline — for nested surfaces. */
  flat?: boolean
  className?: string
}

export function Card({ children, padding = true, flat = false, className }: CardProps) {
  return (
    <div
      className={cn(
        'min-w-0 rounded-2xl bg-surface',
        flat ? 'ring-1 ring-line' : 'shadow-card',
        padding && 'p-5',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  /** Adds edge padding when the Card itself is unpadded. */
  inset?: boolean
  /** Draws the hairline under the header — for stacked sections. */
  divider?: boolean
  className?: string
}

export function CardHeader({
  title,
  subtitle,
  action,
  icon,
  inset = false,
  divider = false,
  className,
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        // Below `sm` the action drops under the title — a segmented control
        // beside a heading squeezes the heading into three wrapped lines.
        'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
        inset ? 'px-5 pb-4 pt-5' : 'pb-4',
        divider && 'border-b border-line',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-fg">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <Text as="h2" variant="headingMd">
            {title}
          </Text>
          {subtitle && (
            <Text as="p" variant="bodySm" tone="subtle" className="mt-0.5 block">
              {subtitle}
            </Text>
          )}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
    </div>
  )
}

/** Horizontally divided region inside a Card. */
export function CardSection({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('border-t border-line-subtle p-5 first:border-t-0', className)}>{children}</div>
}

/** Muted strip pinned to the bottom of a card — totals, hints, secondary actions. */
export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-b-2xl border-t border-line-subtle bg-surface-sunken px-5 py-3',
        className,
      )}
    >
      {children}
    </div>
  )
}
