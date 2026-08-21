import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { Text } from './Text'
import { Tooltip } from './Tooltip'

export type SegmentTone = 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const fillClass: Record<SegmentTone, string> = {
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-line-strong',
}

const dotClass: Record<SegmentTone, string> = fillClass

export interface Segment {
  label: string
  /** Drives the bar proportion. Always the raw number, never a formatted one. */
  value: number
  tone: SegmentTone
  /** Shown instead of `value` in the legend — currency, hours, and the like. */
  display?: string
  /** Deeplink to the records this slice represents. */
  to?: string
}

export interface Overrun {
  label: string
  /** How far the segments run past the total. Always positive. */
  value: number
  display?: string
  /** Names the line the segments crossed, e.g. "Revenue ₹43,875". */
  baselineLabel?: string
}

interface StatGroupProps {
  label: string
  /** Headline figure. Pass a formatted string for money. */
  total: ReactNode
  /** Unit shown after the total — "units", "tasks", "hrs". */
  totalUnit?: string
  segments: Segment[]
  /**
   * Set when the segments exceed the total — a job that cost more than it
   * earned. The excess is hatched red past a baseline tick instead of being
   * clamped away, so a loss cannot be mistaken for breaking even.
   */
  overrun?: Overrun
  /** Badge pinned beside the label — a risk count, a status. */
  flag?: ReactNode
  /** Small print under the legend. */
  footnote?: ReactNode
  className?: string
}

/**
 * Part-to-whole stat card.
 *
 * Several numbers that add up to one more read better as a single card than
 * as a row of tiles: the bar carries the proportions for free, tiles cannot,
 * and a lone number in a 250px box is mostly whitespace. Use this whenever the
 * segments are slices of `total`; use `Metric` when a figure stands alone.
 */
export function StatGroup({
  label,
  total,
  totalUnit,
  segments,
  overrun,
  flag,
  footnote,
  className,
}: StatGroupProps) {
  // The bar always scales to the widest thing it must show: normally the
  // total, but the overspend itself once the segments have run past it.
  const scale = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0)
  // Everything left of the tick is the total the segments were measured against.
  const baseline = overrun ? Math.max(0, scale - overrun.value) : scale
  const baselinePct = scale > 0 ? (baseline / scale) * 100 : 0

  const barPct = (v: number) => (scale > 0 ? (Math.max(0, v) / scale) * 100 : 0)
  // Shares are quoted against the baseline, so an overrun reads as "135% of
  // revenue" rather than being flattened to 100% of a bar it broke out of.
  const sharePct = (v: number) => (baseline > 0 ? (Math.abs(v) / baseline) * 100 : 0)

  // Empty slices are dropped — the missing bar segment already says "none",
  // and "0 · 0%" is only noise. Keep them all when every slice is empty, so
  // the card never renders a legend-less strip.
  const legend = scale > 0 ? segments.filter((seg) => seg.value > 0) : segments

  return (
    <div className={cn('flex flex-col rounded-lg bg-surface p-4 shadow-card', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Text variant="bodySm" tone="muted" truncate className="font-medium">
            {label}
          </Text>
          {flag}
        </div>
        <div className="flex shrink-0 items-baseline gap-1">
          <Text variant="metric">{total}</Text>
          {totalUnit && (
            <Text variant="bodySm" tone="subtle">
              {totalUnit}
            </Text>
          )}
        </div>
      </div>

      <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-sunken ring-1 ring-inset ring-line-subtle">
        <div className="flex h-full w-full gap-0.5">
          {segments.map((seg) =>
            seg.value > 0 ? (
              <Tooltip
                key={seg.label}
                content={`${seg.label}: ${seg.display ?? seg.value} · ${Math.round(sharePct(seg.value))}%`}
              >
                <span
                  className={cn('h-full first:rounded-l-full last:rounded-r-full', fillClass[seg.tone])}
                  style={{ width: `${barPct(seg.value)}%` }}
                />
              </Tooltip>
            ) : null,
          )}
        </div>

        {overrun && overrun.value > 0 && (
          <>
            {/* Hatched so the excess reads as "past the line" rather than as
                just one more category sitting alongside the others. */}
            <Tooltip
              content={`${overrun.label}: ${overrun.display ?? overrun.value} · ${Math.round(
                sharePct(overrun.value),
              )}% over${overrun.baselineLabel ? ` ${overrun.baselineLabel}` : ''}`}
            >
              <span
                className="absolute inset-y-0 right-0 rounded-r-full bg-danger"
                style={{
                  left: `${baselinePct}%`,
                  backgroundImage:
                    'repeating-linear-gradient(45deg, rgb(0 0 0 / 0.28) 0 2px, transparent 2px 5px)',
                }}
              />
            </Tooltip>
            <span
              aria-hidden
              className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-fg"
              style={{ left: `${baselinePct}%` }}
            />
          </>
        )}
      </div>

      <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
        {legend.map((seg) => {
          const body = (
            <>
              <dt className="flex items-center gap-1.5">
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotClass[seg.tone])} />
                <Text variant="bodySm" tone="muted">
                  {seg.label}
                </Text>
              </dt>
              <dd className="m-0 mt-0.5 flex items-baseline gap-1.5 pl-3">
                <Text variant="bodyLg" numeric className="font-semibold">
                  {seg.display ?? seg.value.toLocaleString('en-IN')}
                </Text>
                <Text variant="bodySm" tone="faint" numeric>
                  {Math.round(sharePct(seg.value))}%
                </Text>
              </dd>
            </>
          )

          return seg.to ? (
            <Link
              key={seg.label}
              to={seg.to}
              className="-mx-1 min-w-0 rounded-sm px-1 transition-colors hover:bg-surface-hover"
            >
              {body}
            </Link>
          ) : (
            <div key={seg.label} className="min-w-0">
              {body}
            </div>
          )
        })}

        {overrun && overrun.value > 0 && (
          <div className="min-w-0">
            <dt className="flex items-center gap-1.5">
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, rgb(0 0 0 / 0.28) 0 1px, transparent 1px 2px)',
                }}
              />
              <Text variant="bodySm" tone="danger">
                {overrun.label}
              </Text>
            </dt>
            <dd className="m-0 mt-0.5 flex items-baseline gap-1.5 pl-3">
              <Text variant="bodyLg" tone="danger" numeric className="font-semibold">
                {overrun.display ?? overrun.value.toLocaleString('en-IN')}
              </Text>
              <Text variant="bodySm" tone="danger" numeric className="opacity-70">
                {Math.round(sharePct(overrun.value))}% over
              </Text>
            </dd>
          </div>
        )}
      </dl>

      {footnote && (
        <div className="mt-3 border-t border-line-subtle pt-2.5">
          <Text variant="bodySm" tone="faint">
            {footnote}
          </Text>
        </div>
      )}
    </div>
  )
}

/**
 * Cost-against-revenue split, shared by every page that shows one.
 *
 * A profitable job splits revenue into cost and profit. A loss-making one
 * cannot — cost is larger than the revenue it is measured against — so the
 * excess becomes an overrun past the revenue line instead.
 */
export function revenueSplit(
  { revenue, cost, profit }: { revenue: number; cost: number; profit: number },
  formatMoney: (value: number) => string,
): { segments: Segment[]; overrun?: Overrun } {
  if (profit >= 0) {
    return {
      segments: [
        { label: 'Machine cost', value: cost, tone: 'warning', display: formatMoney(cost) },
        { label: 'Profit', value: profit, tone: 'success', display: formatMoney(profit) },
      ],
    }
  }

  return {
    segments: [{ label: 'Machine cost', value: cost, tone: 'warning', display: formatMoney(cost) }],
    overrun: {
      label: 'Loss',
      value: cost - revenue,
      display: formatMoney(profit),
      baselineLabel: `revenue of ${formatMoney(revenue)}`,
    },
  }
}
