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
        'rounded-lg bg-surface',
        flat ? 'ring-1 ring-line' : 'shadow-card',
        padding && 'p-4',
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
        inset ? 'px-4 pb-3 pt-3.5' : 'pb-3',
        divider && 'border-b border-line',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && (
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-surface-sunken text-fg-muted">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <Text as="h2" variant="headingSm">
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
  return <div className={cn('border-t border-line-subtle p-4 first:border-t-0', className)}>{children}</div>
}

/** Muted strip pinned to the bottom of a card — totals, hints, secondary actions. */
export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-b-lg border-t border-line bg-surface-sunken px-4 py-2.5',
        className,
      )}
    >
      {children}
    </div>
  )
}
