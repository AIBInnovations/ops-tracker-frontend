import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, ArrowUpRight } from 'lucide-react'
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
  default: 'bg-surface-sunken text-fg-subtle',
  accent: 'bg-accent-soft text-accent-fg',
  success: 'bg-success-soft text-success-fg',
  warning: 'bg-warning-soft text-warning-fg',
  danger: 'bg-danger-soft text-danger-fg',
}

export interface MetricDelta {
  /** Pre-formatted, e.g. "7%". */
  value: string
  direction: 'up' | 'down'
  /** Trailing context, e.g. "This month". */
  caption?: string
  /** Set when a rise is bad — cost, downtime, overdue counts. */
  inverted?: boolean
}

interface MetricProps {
  label: string
  value: ReactNode
  /** Small change chip under the value, as in the reference stat cards. */
  delta?: MetricDelta
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
  /**
   * Renders the tile as a solid accent panel. Reserved for the one figure a
   * page leads with — more than one and the emphasis cancels out.
   */
  filled?: boolean
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
  delta,
  helper,
  tone = 'default',
  to,
  icon,
  visual,
  filled = false,
  size = 'md',
  className,
}: MetricProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {filled ? (
            <span className="block truncate text-sm font-semibold text-white/75">{label}</span>
          ) : (
            <Text variant="bodySm" tone="muted" truncate className="font-semibold">
              {label}
            </Text>
          )}
          <div className="mt-2">
            {filled ? (
              <span
                className={cn(
                  'font-display font-bold tabular-nums text-white',
                  size === 'sm' ? 'text-lg' : 'text-2xl',
                )}
              >
                {value}
              </span>
            ) : (
              <Text variant={size === 'sm' ? 'metricSm' : 'metric'}>{value}</Text>
            )}
          </div>
          {delta && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 text-sm font-semibold',
                  filled
                    ? 'text-white'
                    : (delta.direction === 'up') !== Boolean(delta.inverted)
                      ? 'text-success-fg'
                      : 'text-danger-fg',
                )}
              >
                {delta.direction === 'up' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
                {delta.value}
              </span>
              {delta.caption && (
                <span className={cn('truncate text-sm', filled ? 'text-white/70' : 'text-fg-subtle')}>
                  {delta.caption}
                </span>
              )}
            </div>
          )}

          {helper && (
            <div className="mt-1">
              {filled ? (
                <span className="block truncate text-sm text-white/70">{helper}</span>
              ) : (
                <Text variant="bodySm" tone="subtle" truncate>
                  {helper}
                </Text>
              )}
            </div>
          )}
        </div>

        {icon ? (
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              filled ? 'bg-white/20 text-white' : medallionTone[tone],
            )}
          >
            {icon}
          </span>
        ) : (
          to && (
            // Mirrors the reference's round corner affordance on every tile.
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors',
                filled
                  ? 'bg-white/20 text-white group-hover:bg-white/30'
                  : 'bg-surface-sunken text-fg-subtle group-hover:bg-accent group-hover:text-accent-on',
              )}
            >
              <ArrowUpRight size={15} />
            </span>
          )
        )}
      </div>

      {visual && <div className="mt-4">{visual}</div>}
    </>
  )

  const base = cn(
    'group flex min-w-0 flex-col rounded-2xl p-5',
    filled ? 'bg-brand shadow-glow' : 'bg-surface shadow-card',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={cn(base, 'transition-shadow duration-200 hover:shadow-md')}>
        {body}
      </Link>
    )
  }
  return <div className={base}>{body}</div>
}

/** Metrics laid out as one connected band — used inside cards and drawers. */
export function MetricRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid divide-x divide-line-subtle rounded-2xl bg-surface-sunken', className)}>{children}</div>
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
    <div className="px-4 py-3">
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
