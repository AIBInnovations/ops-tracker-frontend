import { Link } from 'react-router-dom'
import { ArrowUpRight, Factory } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { Meter } from '@/components/ui/Progress'
import { Text } from '@/components/ui/Text'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatCurrency, formatHours, formatPercent } from '@/lib/format'
import { profitClass, utilizationTone } from '@/lib/tone'
import { routes } from '@/lib/routes'
import type { MachineTypeUtilization } from '@/lib/selectors'

const unitDot: Record<'running' | 'idle' | 'maintenance', string> = {
  running: 'bg-accent',
  idle: 'bg-line-strong',
  maintenance: 'bg-warning',
}

/**
 * Card view of a machine type. The unit strip is the point of the card —
 * it shows how many physical machines exist and what each of them is doing,
 * which a single utilization percentage hides.
 */
export function MachineTypeCard({ stats, queueCount }: { stats: MachineTypeUtilization; queueCount: number }) {
  const { machineType: mt } = stats

  const units: ('running' | 'idle' | 'maintenance')[] = [
    ...Array<'running'>(stats.runningNow).fill('running'),
    ...Array<'idle'>(stats.idleNow).fill('idle'),
    ...Array<'maintenance'>(stats.maintenanceNow).fill('maintenance'),
  ]

  return (
    <Link
      to={routes.machineType(mt.id)}
      className="group flex flex-col rounded-lg bg-surface p-4 shadow-card transition-colors hover:bg-surface-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-fg-muted ring-1 ring-inset ring-line-subtle">
            <Factory size={15} />
          </span>
          <div className="min-w-0">
            <Text variant="headingSm" truncate>
              {mt.name}
            </Text>
            <Text variant="bodySm" tone="faint" truncate className="mt-0.5 block">
              {mt.description}
            </Text>
          </div>
        </div>
        <ArrowUpRight size={14} className="shrink-0 text-fg-faint opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        {units.map((state, i) => (
          <Tooltip key={i} content={`${mt.machines[i]?.code ?? 'Unit'} — ${state}`}>
            <span className={cn('h-1.5 flex-1 rounded-full', unitDot[state])} />
          </Tooltip>
        ))}
      </div>
      <Text variant="bodySm" tone="subtle" className="mt-1.5 block" numeric>
        {stats.runningNow} running · {stats.idleNow} idle
        {stats.maintenanceNow > 0 && ` · ${stats.maintenanceNow} in maintenance`}
      </Text>

      <div className="mt-3 border-t border-line-subtle pt-3">
        <div className="mb-1 flex items-center justify-between">
          <Text variant="bodySm" tone="muted">
            Utilization (7d)
          </Text>
          <Text variant="bodySm" numeric className="font-semibold">
            {formatPercent(stats.utilizationPct)}
          </Text>
        </div>
        <Meter value={stats.utilizationPct} tone={utilizationTone(stats.utilizationPct)} />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-line-subtle pt-3">
        <div>
          <dt>
            <Text variant="bodySm" tone="faint">
              Rate
            </Text>
          </dt>
          <dd className="m-0">
            <Text variant="bodyMd" numeric className="font-semibold">
              {formatCurrency(mt.hourlyRate)}
            </Text>
          </dd>
        </div>
        <div>
          <dt>
            <Text variant="bodySm" tone="faint">
              Queued
            </Text>
          </dt>
          <dd className="m-0">
            <Text variant="bodyMd" numeric className="font-semibold">
              {formatHours(stats.scheduledHours)}
            </Text>
          </dd>
        </div>
        <div>
          <dt>
            <Text variant="bodySm" tone="faint">
              Profit
            </Text>
          </dt>
          <dd className="m-0">
            <span className={cn('text-md font-semibold tabular-nums', profitClass(stats.profit))}>
              {formatCurrency(stats.profit)}
            </span>
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between">
        <Text variant="bodySm" tone="faint" numeric>
          {queueCount} task{queueCount === 1 ? '' : 's'} routed here
        </Text>
        {stats.maintenanceNow > 0 ? (
          <Badge tone="warning" dot>
            Reduced
          </Badge>
        ) : stats.utilizationPct >= 85 ? (
          <Badge tone="danger" dot>
            Saturated
          </Badge>
        ) : (
          <Badge tone="success" dot>
            Healthy
          </Badge>
        )}
      </div>
    </Link>
  )
}
