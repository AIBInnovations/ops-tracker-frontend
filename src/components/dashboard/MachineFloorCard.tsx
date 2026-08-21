import { useMemo, useState } from 'react'
import { ArrowRight, Factory } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { AppLink } from '@/components/ui/Link'
import { Meter } from '@/components/ui/Progress'
import { Tabs } from '@/components/ui/Tabs'
import { Text } from '@/components/ui/Text'
import { ClientLink, ProjectLink } from '@/components/links/EntityLinks'
import { formatCurrency, formatDateTime, formatHours } from '@/lib/format'
import { machineStatusLabel, machineStatusTone } from '@/lib/tone'
import { routes } from '@/lib/routes'
import { SCHEDULE_ORIGIN } from '@/engine'
import type { MachineActivityRow, TaskRow } from '@/lib/selectors'

const TABS = [
  { key: 'all', label: 'All units' },
  { key: 'running', label: 'Running' },
  { key: 'available', label: 'Idle' },
  { key: 'maintenance', label: 'Maintenance' },
]

/**
 * Answers the first question management asks: which machine is producing
 * what, and when does it come off. One row per physical unit, derived from
 * the computed schedule rather than a hand-set status flag.
 */
export function MachineFloorCard({
  rows,
  onSelectTask,
}: {
  rows: MachineActivityRow[]
  onSelectTask?: (row: TaskRow) => void
}) {
  const [tab, setTab] = useState('all')

  const counts = useMemo(
    () => ({
      all: rows.length,
      running: rows.filter((r) => r.effectiveStatus === 'running').length,
      available: rows.filter((r) => r.effectiveStatus === 'available').length,
      maintenance: rows.filter((r) => r.effectiveStatus === 'maintenance').length,
    }),
    [rows],
  )

  const filtered = tab === 'all' ? rows : rows.filter((r) => r.effectiveStatus === tab)

  const columns: Column<MachineActivityRow>[] = [
    {
      key: 'machine',
      header: 'Machine',
      sticky: true,
      width: '190px',
      sortValue: (r) => r.machine.code,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-sm text-2xs font-bold',
              r.effectiveStatus === 'running'
                ? 'bg-accent-soft text-accent-fg'
                : r.effectiveStatus === 'maintenance'
                  ? 'bg-warning-soft text-warning-fg'
                  : 'bg-surface-sunken text-fg-subtle',
            )}
          >
            <Factory size={13} />
          </span>
          <div className="min-w-0">
            <AppLink
              to={routes.machine(r.machineType.id, r.machine.id)}
              tone="subtle"
              className="font-mono text-sm font-medium"
            >
              {r.machine.code}
            </AppLink>
            <Text variant="bodySm" tone="faint" truncate className="block">
              {r.machineType.name}
            </Text>
          </div>
        </div>
      ),
    },
    {
      key: 'operation',
      header: 'Current operation',
      sortValue: (r) => r.row?.task.name ?? '',
      render: (r) =>
        r.row ? (
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => onSelectTask?.(r.row!)}
              className="max-w-full truncate text-left text-base font-medium text-fg underline-offset-2 transition-colors hover:text-accent-fg hover:underline"
            >
              {r.row.task.name}
            </button>
            <Text variant="bodySm" tone="faint" className="block">
              {r.row.isCurrent ? 'Running now' : 'Next up'} · {r.row.task.operationType}
            </Text>
          </div>
        ) : (
          <Text variant="bodyMd" tone="faint">
            {r.effectiveStatus === 'maintenance' ? 'Under maintenance' : 'No work queued'}
          </Text>
        ),
    },
    {
      key: 'project',
      header: 'Project / Client',
      hideBelow: 'lg',
      sortValue: (r) => r.row?.project?.name ?? '',
      render: (r) =>
        r.row?.project ? (
          <div className="min-w-0">
            <ProjectLink id={r.row.project.id} />
            {r.row.client && (
              <div>
                <ClientLink id={r.row.client.id} className="text-sm text-fg-subtle" />
              </div>
            )}
          </div>
        ) : (
          <span className="text-fg-faint">—</span>
        ),
    },
    {
      key: 'finish',
      header: 'Expected finish',
      sortValue: (r) => (r.row?.block ? new Date(r.row.block.endAt).getTime() : Number.MAX_SAFE_INTEGER),
      render: (r) =>
        r.row?.block ? (
          <span className="tabular-nums">{formatDateTime(r.row.block.endAt)}</span>
        ) : (
          <span className="text-fg-faint">—</span>
        ),
    },
    {
      key: 'progress',
      header: 'Run progress',
      width: '140px',
      hideBelow: 'xl',
      sortValue: (r) => {
        if (!r.row?.block || !r.row.isCurrent) return -1
        const elapsed = (SCHEDULE_ORIGIN.getTime() - new Date(r.row.block.startAt).getTime()) / 3_600_000
        return (elapsed / r.row.block.durationHrs) * 100
      },
      render: (r) => {
        if (!r.row?.block) return <span className="text-fg-faint">—</span>
        if (!r.row.isCurrent) {
          return (
            <Text variant="bodySm" tone="faint" numeric>
              Starts {formatDateTime(r.row.block.startAt)}
            </Text>
          )
        }
        const elapsed = (SCHEDULE_ORIGIN.getTime() - new Date(r.row.block.startAt).getTime()) / 3_600_000
        const pct = Math.min(100, Math.max(0, (elapsed / r.row.block.durationHrs) * 100))
        return <Meter value={pct} tone="accent" showValue />
      },
    },
    {
      key: 'status',
      header: 'Status',
      // Running units first — an alphabetical sort would bury them under "available".
      sortValue: (r) => ({ running: 0, available: 1, maintenance: 2 })[r.effectiveStatus],
      render: (r) => (
        <Badge tone={machineStatusTone[r.effectiveStatus]} dot pulse={r.effectiveStatus === 'running'}>
          {machineStatusLabel[r.effectiveStatus]}
        </Badge>
      ),
    },
    {
      key: 'cost',
      header: 'Job cost',
      align: 'end',
      sortValue: (r) => r.row?.block?.cost ?? -1,
      render: (r) => {
        if (!r.row?.block) return <span className="text-fg-faint">—</span>
        return (
          <div>
            <div className="font-medium tabular-nums">{formatCurrency(r.row.block.cost)}</div>
            <Text variant="bodySm" tone="faint" numeric>
              {formatHours(r.row.block.durationHrs)}
            </Text>
          </div>
        )
      },
    },
  ]

  return (
    <Card padding={false}>
      <CardHeader
        inset
        title="Which machine is producing what"
        subtitle="Live assignment across every physical unit on the floor"
        action={
          <ButtonLink to={routes.timeline()} size="sm" variant="ghost" iconAfter={<ArrowRight size={13} />}>
            Open timeline
          </ButtonLink>
        }
      />
      <div className="border-b border-line px-3 pb-2">
        <Tabs
          variant="pill"
          active={tab}
          onChange={setTab}
          items={TABS.map((t) => ({ ...t, count: counts[t.key as keyof typeof counts] }))}
        />
      </div>
      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(r) => r.machine.id}
        rowHref={(r) => routes.machine(r.machineType.id, r.machine.id)}
        defaultSort={{ key: 'status', dir: 'asc' }}
        emptyState={<EmptyState icon={<Factory size={20} />} title="No units in this state" size="sm" />}
      />
    </Card>
  )
}
