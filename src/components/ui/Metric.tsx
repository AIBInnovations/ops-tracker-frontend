import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Text, type TextTone } from './Text'

export type MetricTone = 'default' | 'accent' | 'success' | 'warning' | 'danger'

const valueTone: Record<MetricTone, TextTone> = {
  default: 'default',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
}

const medallionTone: Record<MetricTone, string> = {
  default: 'bg-surface-sunken text-fg-subtle ring-line-subtle',
  accent: 'bg-accent-soft text-accent-fg ring-accent-border',
  success: 'bg-success-soft text-success-fg ring-success-border',
  warning: 'bg-warning-soft text-warning-fg ring-warning-border',
  danger: 'bg-danger-soft text-danger-fg ring-danger-border',
}

interface MetricProps {
  label: string
  value: ReactNode
  helper?: ReactNode
  tone?: MetricTone
  /** Turns the whole tile into a deeplink to the underlying records. */
  to?: string
  /**
   * Rendered as a tinted medallion on the right. Give every standalone tile
   * one — a lone number in a 250px box is otherwise mostly whitespace.
   */
  icon?: ReactNode
  /** Full-width visual under the value — a Sparkline or Meter. */
  visual?: ReactNode
  size?: 'sm' | 'md'
  className?: string
}

/**
 * KPI tile for a figure that genuinely stands alone. When several figures are
 * slices of one total — machine states, alert severities, cost against
 * revenue — use `StatGroup` instead so the proportions come through.
 */
export function Metric({
  label,
  value,
  helper,
  tone = 'default',
  to,
  icon,
  visual,
  size = 'md',
  className,
}: MetricProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Text variant="bodySm" tone="muted" truncate className="font-medium">
            {label}
          </Text>
          <div className="mt-1.5">
            <Text variant={size === 'sm' ? 'metricSm' : 'metric'} tone={valueTone[tone]}>
              {value}
            </Text>
          </div>
          {helper && (
            <div className="mt-0.5">
              <Text variant="bodySm" tone="subtle" truncate>
                {helper}
              </Text>
            </div>
          )}
        </div>

        {icon ? (
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset',
              medallionTone[tone],
            )}
          >
            {icon}
          </span>
        ) : (
          to && (
            <ArrowUpRight
              size={14}
              className="shrink-0 text-fg-faint opacity-0 transition-opacity group-hover:opacity-100"
            />
          )
        )}
      </div>

      {visual && <div className="mt-3">{visual}</div>}
    </>
  )

  const base = cn('group flex flex-col rounded-lg bg-surface p-4 shadow-card', className)

  if (to) {
    return (
      <Link to={to} className={cn(base, 'transition-colors hover:bg-surface-hover')}>
        {body}
      </Link>
    )
  }
  return <div className={base}>{body}</div>
}

/** Metrics laid out as one connected band — used inside cards and drawers. */
export function MetricRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid divide-x divide-line-subtle rounded-lg bg-surface-sunken', className)}>{children}</div>
  )
}

export function MetricCell({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  tone?: MetricTone
}) {
  return (
    <div className="px-3 py-2.5">
      <Text variant="bodySm" tone="subtle" truncate>
        {label}
      </Text>
      <div className="mt-0.5">
        <Text variant="metricSm" tone={valueTone[tone]}>
          {value}
        </Text>
      </div>
    </div>
  )
}
