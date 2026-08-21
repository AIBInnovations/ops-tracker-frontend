import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { formatHours, formatPercent } from '@/lib/format'
import { routes } from '@/lib/routes'
import type { MachineTypeUtilization } from '@/lib/selectors'

interface HeadlineCardProps {
  label: string
  value: ReactNode
  delta?: { value: string; direction: 'up' | 'down'; caption?: string }
  /** Plain supporting line, when there is no meaningful change to report. */
  helper?: ReactNode
  badge?: ReactNode
  actions?: ReactNode
  children?: ReactNode
}

/**
 * The page's opening card: one headline figure, its change, the two actions
 * that follow from it, and a short breakdown list beneath.
 */
export function HeadlineCard({ label, value, delta, helper, badge, actions, children }: HeadlineCardProps) {
  return (
    <Card padding={false} className="flex flex-col">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <Text variant="bodySm" tone="muted" className="font-semibold">
            {label}
          </Text>
          {badge}
        </div>
        <div className="mt-2">
          <Text variant="metricLg">{value}</Text>
        </div>
        {delta && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-sm font-semibold',
                delta.direction === 'up' ? 'text-success-fg' : 'text-danger-fg',
              )}
            >
              {delta.direction === 'up' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
              {delta.value}
            </span>
            {delta.caption && (
              <Text variant="bodySm" tone="subtle">
                {delta.caption}
              </Text>
            )}
          </div>
        )}
        {helper && !delta && (
          <div className="mt-1.5">
            <Text variant="bodySm" tone="subtle">
              {helper}
            </Text>
          </div>
        )}
        {actions && <div className="mt-4 grid grid-cols-2 gap-2.5">{actions}</div>}
      </div>
      {children}
    </Card>
  )
}

/**
 * Breakdown strip under the headline — one tile per machine type, echoing the
 * reference's wallet row: name, figure, and a live status word.
 */
export function MachineTypeStrip({ rows }: { rows: MachineTypeUtilization[] }) {
  const top = rows.slice(0, 3)

  return (
    <div className="border-t border-line p-5 pt-4">
      <div className="mb-3 flex items-center gap-2">
        <Text variant="bodySm" className="font-semibold">
          Machine types
        </Text>
        <Text variant="bodySm" tone="faint">
          |
        </Text>
        <Text variant="bodySm" tone="subtle">
          {rows.length} in service
        </Text>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {top.map((row) => {
          const live = row.runningNow > 0
          return (
            <Link
              key={row.machineType.id}
              to={routes.machineType(row.machineType.id)}
              className="min-w-0 rounded-xl border border-line p-3 transition-colors hover:bg-surface-hover"
            >
              <Text
                variant="bodySm"
                tone="muted"
                truncate
                title={row.machineType.name}
                className="font-semibold"
              >
                {row.machineType.name.replace(/^M\/C\s*\d+\s*—\s*/, '')}
              </Text>
              <div className="mt-1.5">
                <Text variant="bodyMd" numeric className="font-bold">
                  {formatHours(row.scheduledHours)}
                </Text>
              </div>
              <div className="mt-0.5">
                <Text variant="bodySm" tone="subtle" truncate>
                  {row.totalMachines} units
                </Text>
              </div>
              <span
                className={cn(
                  'mt-1.5 block text-xs font-semibold',
                  live ? 'text-success-fg' : 'text-fg-faint',
                )}
              >
                {live ? 'Running' : 'Idle'}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/** Capacity meter — the reference's spending-limit card, in plant terms. */
export function CapacityCard({ usedHours, capacityHours }: { usedHours: number; capacityHours: number }) {
  const pct = capacityHours > 0 ? Math.min(100, (usedHours / capacityHours) * 100) : 0

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <Text variant="headingSm">Weekly capacity used</Text>
        <Text variant="bodySm" tone="subtle" numeric>
          {formatPercent(pct)}
        </Text>
      </div>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-accent-track">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <Text variant="bodySm" tone="muted" numeric>
          <span className="font-bold text-fg">{formatHours(usedHours)}</span> scheduled
        </Text>
        <Text variant="bodySm" tone="subtle" numeric>
          {formatHours(capacityHours)}
        </Text>
      </div>
    </Card>
  )
}
