import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowRight, CalendarRange, ListChecks } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Page } from '@/components/ui/Page'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'
import { ButtonLink } from '@/components/ui/Button'
import { Metric } from '@/components/ui/Metric'
import { Meter } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { AppLink } from '@/components/ui/Link'
import { ServiceStatusSelect } from '@/components/machines/ServiceStatusSelect'
import { TaskTable } from '@/components/tasks/TaskTable'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { useAppStore } from '@/store/useAppStore'
import {
  buildMachineActivity,
  buildTaskRows,
  computeUtilization,
  machineQueue,
  machineTypeQueue,
  type TaskRow,
} from '@/lib/selectors'
import { formatCurrency, formatDateTime, formatHours, formatPercent } from '@/lib/format'
import { machineStatusLabel, machineStatusTone, utilizationTone } from '@/lib/tone'
import { routes } from '@/lib/routes'
import { SCHEDULE_ORIGIN } from '@/engine'

export function MachineTypeDetailPage() {
  const { typeId = '' } = useParams<{ typeId: string }>()
  const { machineTypes, tasks, projects, clients, blocks } = useAppStore()
  const [drawerRow, setDrawerRow] = useState<TaskRow | undefined>()

  const machineType = machineTypes.find((mt) => mt.id === typeId)

  const taskRows = useMemo(
    () => buildTaskRows(tasks, projects, clients, machineTypes, blocks),
    [tasks, projects, clients, machineTypes, blocks],
  )
  const activity = useMemo(() => buildMachineActivity(machineTypes, taskRows), [machineTypes, taskRows])
  const utilization = useMemo(
    () =>
      computeUtilization(machineTypes, blocks, SCHEDULE_ORIGIN, new Date(SCHEDULE_ORIGIN.getTime() + 7 * 86_400_000)),
    [machineTypes, blocks],
  )

  if (!machineType) {
    return (
      <Page title="Machine type not found">
        <Card>
          <EmptyState
            title="This machine type no longer exists"
            action={<ButtonLink to={routes.machines()}>Back to machines</ButtonLink>}
          />
        </Card>
      </Page>
    )
  }

  const stats = utilization.find((u) => u.machineType.id === typeId)!
  const queue = machineTypeQueue(taskRows, typeId)
  const units = activity.filter((a) => a.machineType.id === typeId)

  return (
    <Page
      title={machineType.name}
      subtitle={machineType.description}
      titleAccessory={
        <Badge tone="accent" variant="outline">
          {formatCurrency(machineType.hourlyRate)}/hr
        </Badge>
      }
      maxWidth="wide"
      actions={
        <>
          <ButtonLink to={routes.tasks({ machineType: typeId })} icon={<ListChecks size={14} />}>
            View tasks
          </ButtonLink>
          <ButtonLink to={routes.timeline({ machineType: typeId })} variant="primary" icon={<CalendarRange size={14} />}>
            View on timeline
          </ButtonLink>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
        <Metric label="Units" value={stats.totalMachines} helper={`${stats.runningNow} running now`} />
        <Metric
          label="Utilization (7d)"
          value={formatPercent(stats.utilizationPct)}
          tone={stats.utilizationPct >= 85 ? 'danger' : stats.utilizationPct < 30 ? 'warning' : 'default'}
          visual={<Meter value={stats.utilizationPct} tone={utilizationTone(stats.utilizationPct)} />}
        />
        <Metric label="Queued hours" value={formatHours(stats.scheduledHours)} helper={`${queue.length} tasks`} />
        <Metric label="Run cost" value={formatCurrency(stats.cost)} helper={`Revenue ${formatCurrency(stats.revenue)}`} />
        <Metric
          label="Profit"
          value={formatCurrency(stats.profit)}
          tone={stats.profit >= 0 ? 'success' : 'danger'}
          helper={`${formatPercent(stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0)} margin`}
        />
      </div>

      <Card>
        <CardHeader title="Units" subtitle="Each unit runs its own queue — the scheduler balances across them" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {units.map((unit) => {
            const unitQueue = machineQueue(taskRows, unit.machine.id)
            const unitHours = unitQueue.reduce((s, r) => s + (r.block?.durationHrs ?? 0), 0)
            return (
              <div
                key={unit.machine.id}
                className={cn(
                  'rounded-lg bg-surface-sunken p-3 ring-1 ring-inset',
                  unit.effectiveStatus === 'maintenance' ? 'ring-warning-border' : 'ring-line-subtle',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <AppLink
                      to={routes.machine(machineType.id, unit.machine.id)}
                      tone="subtle"
                      className="font-mono text-md font-semibold"
                    >
                      {unit.machine.code}
                    </AppLink>
                    <div className="mt-1">
                      <Badge
                        tone={machineStatusTone[unit.effectiveStatus]}
                        dot
                        pulse={unit.effectiveStatus === 'running'}
                      >
                        {machineStatusLabel[unit.effectiveStatus]}
                      </Badge>
                    </div>
                  </div>
                  <ServiceStatusSelect machine={unit.machine} size="sm" className="w-40 shrink-0" />
                </div>

                <div className="mt-3 border-t border-line pt-2.5">
                  {unit.row ? (
                    <>
                      <Text variant="bodySm" tone="faint">
                        {unit.row.isCurrent ? 'Running now' : 'Next up'}
                      </Text>
                      <button
                        type="button"
                        onClick={() => setDrawerRow(unit.row)}
                        className="mt-0.5 block max-w-full truncate text-left text-base font-medium text-fg underline-offset-2 transition-colors hover:text-accent-fg hover:underline"
                      >
                        {unit.row.task.name}
                      </button>
                      {unit.row.block && (
                        <Text variant="bodySm" tone="subtle" numeric className="block">
                          Finishes {formatDateTime(unit.row.block.endAt)}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text variant="bodySm" tone="faint">
                      {unit.effectiveStatus === 'maintenance' ? 'Under maintenance' : 'No work queued'}
                    </Text>
                  )}
                  <Text variant="bodySm" tone="subtle" numeric className="mt-2 block">
                    {unitQueue.length} task{unitQueue.length === 1 ? '' : 's'} · {formatHours(unitHours)} queued
                  </Text>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card padding={false}>
        <CardHeader
          inset
          divider
          title="Work queue"
          subtitle={`Every task routed to ${machineType.name}, in scheduled order`}
          action={
            <ButtonLink
              to={routes.tasks({ machineType: typeId })}
              size="sm"
              variant="ghost"
              iconAfter={<ArrowRight size={13} />}
            >
              Open in bucket
            </ButtonLink>
          }
        />
        <TaskTable
          rows={queue}
          columns={['task', 'project', 'client', 'machine', 'batch', 'duration', 'window', 'cost', 'status']}
          defaultSort={{ key: 'window', dir: 'asc' }}
          onRowClick={setDrawerRow}
          activeId={drawerRow?.task.id}
          emptyState={<EmptyState title="Nothing queued on this machine type" size="sm" />}
        />
      </Card>

      <TaskDrawer row={drawerRow} open={Boolean(drawerRow)} onClose={() => setDrawerRow(undefined)} />
    </Page>
  )
}
