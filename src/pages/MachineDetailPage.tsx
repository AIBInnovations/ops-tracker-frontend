import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CalendarRange } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'
import { ButtonLink } from '@/components/ui/Button'
import { Banner } from '@/components/ui/Banner'
import { Metric } from '@/components/ui/Metric'
import { Meter } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { ServiceStatusSelect } from '@/components/machines/ServiceStatusSelect'
import { TaskTable } from '@/components/tasks/TaskTable'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { ClientLink, MachineTypeLink, ProjectLink } from '@/components/links/EntityLinks'
import { AppLink } from '@/components/ui/Link'
import { useAppStore } from '@/store/useAppStore'
import { buildTaskRows, findMachine, machineQueue, sumFinancials, type TaskRow } from '@/lib/selectors'
import { formatCurrency, formatDateTime, formatHours, formatPercent } from '@/lib/format'
import { machineStatusLabel, machineStatusTone, utilizationTone } from '@/lib/tone'
import { routes } from '@/lib/routes'
import { PLANT_HOURS_PER_DAY, SCHEDULE_ORIGIN } from '@/engine'
import type { MachineStatus } from '@/types/entities'

export function MachineDetailPage() {
  const { typeId = '', machineId = '' } = useParams<{ typeId: string; machineId: string }>()
  const { machineTypes, tasks, projects, clients, blocks } = useAppStore()
  const [drawerRow, setDrawerRow] = useState<TaskRow | undefined>()

  const found = findMachine(machineTypes, machineId)

  const taskRows = useMemo(
    () => buildTaskRows(tasks, projects, clients, machineTypes, blocks),
    [tasks, projects, clients, machineTypes, blocks],
  )
  const queue = useMemo(() => machineQueue(taskRows, machineId), [taskRows, machineId])

  if (!found) {
    return (
      <Page title="Machine not found">
        <Card>
          <EmptyState
            title="This machine no longer exists"
            action={<ButtonLink to={routes.machines()}>Back to machines</ButtonLink>}
          />
        </Card>
      </Page>
    )
  }

  const { machine, machineType } = found
  const current = queue.find((r) => r.isCurrent)
  const upcoming = queue.filter((r) => r.isUpcoming)
  const financials = sumFinancials(queue)

  // Busy share of the next seven days for this single unit.
  const windowEnd = SCHEDULE_ORIGIN.getTime() + 7 * 86_400_000
  const busyHours = queue.reduce((sum, r) => {
    if (!r.block) return sum
    const s = Math.max(new Date(r.block.startAt).getTime(), SCHEDULE_ORIGIN.getTime())
    const e = Math.min(new Date(r.block.endAt).getTime(), windowEnd)
    return sum + Math.max(0, e - s) / 3_600_000
  }, 0)
  const utilizationPct = machine.status === 'maintenance' ? 0 : (busyHours / (7 * PLANT_HOURS_PER_DAY)) * 100

  const effectiveStatus: MachineStatus =
    machine.status === 'maintenance' ? 'maintenance' : current ? 'running' : 'available'

  const currentProgress =
    current?.block
      ? Math.min(
          100,
          Math.max(
            0,
            ((SCHEDULE_ORIGIN.getTime() - new Date(current.block.startAt).getTime()) /
              3_600_000 /
              current.block.durationHrs) *
              100,
          ),
        )
      : 0

  return (
    <Page
      title={machine.code}
      subtitle={`Physical unit of ${machineType.name}`}
      titleAccessory={
        <Badge tone={machineStatusTone[effectiveStatus]} dot pulse={effectiveStatus === 'running'}>
          {machineStatusLabel[effectiveStatus]}
        </Badge>
      }
      maxWidth="wide"
      actions={
        <>
          <ServiceStatusSelect machine={machine} />
          <ButtonLink
            to={routes.timeline({ machineType: typeId })}
            variant="primary"
            icon={<CalendarRange size={14} />}
          >
            View on timeline
          </ButtonLink>
        </>
      }
    >
      {machine.status === 'maintenance' && (
        <Banner tone="warning" title="Unit is out of service">
          <Text variant="bodyMd" tone="muted">
            The scheduler routes no work to {machine.code} while it is under maintenance, reducing {machineType.name}{' '}
            capacity.
          </Text>
        </Banner>
      )}

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-5">
        <Metric label="Queued tasks" value={queue.length} helper={`${upcoming.length} still upcoming`} />
        <Metric label="Queued hours" value={formatHours(financials.hours)} />
        <Metric
          label="Utilization (7d)"
          value={formatPercent(utilizationPct)}
          tone={utilizationPct >= 85 ? 'danger' : utilizationPct < 30 ? 'warning' : 'default'}
          visual={<Meter value={utilizationPct} tone={utilizationTone(utilizationPct)} />}
        />
        <Metric
          label="Run cost"
          value={formatCurrency(financials.cost)}
          helper={`At ${formatCurrency(machineType.hourlyRate)}/hr`}
        />
        <Metric
          label="Profit generated"
          value={formatCurrency(financials.profit)}
          tone={financials.profit >= 0 ? 'success' : 'danger'}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Running now" />
          {current ? (
            <>
              <DescriptionList
                columns={2}
                items={[
                  {
                    label: 'Task',
                    value: (
                      <AppLink to={routes.task(current.task.id)} tone="subtle" className="font-medium">
                        {current.task.name}
                      </AppLink>
                    ),
                  },
                  { label: 'Project', value: current.project ? <ProjectLink id={current.project.id} /> : '—' },
                  { label: 'Client', value: current.client ? <ClientLink id={current.client.id} /> : '—' },
                  {
                    label: 'Finishes',
                    value: current.block ? (
                      <span className="tabular-nums">{formatDateTime(current.block.endAt)}</span>
                    ) : (
                      '—'
                    ),
                  },
                ]}
              />
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between">
                  <Text variant="bodySm" tone="subtle">
                    Run progress
                  </Text>
                  <Text variant="bodySm" tone="muted" numeric>
                    {formatPercent(currentProgress)} elapsed
                  </Text>
                </div>
                <Meter value={currentProgress} tone="accent" />
              </div>
            </>
          ) : (
            <Text variant="bodyMd" tone="subtle">
              {machine.status === 'maintenance'
                ? 'Out of service — no work assigned.'
                : 'Idle right now. The next queued job appears below.'}
            </Text>
          )}
        </Card>

        <Card>
          <CardHeader title="Unit profile" />
          <DescriptionList
            columns={2}
            items={[
              { label: 'Unit code', value: <span className="font-mono font-semibold">{machine.code}</span> },
              { label: 'Machine type', value: <MachineTypeLink id={machineType.id} /> },
              {
                label: 'Hourly rate',
                value: <span className="font-semibold tabular-nums">{formatCurrency(machineType.hourlyRate)}/hr</span>,
              },
              {
                label: 'Next available',
                value: (
                  <span className="tabular-nums">
                    {queue.length > 0 ? formatDateTime(queue[queue.length - 1].block!.endAt) : 'Immediately'}
                  </span>
                ),
              },
            ]}
          />
        </Card>
      </div>

      <Card padding={false}>
        <CardHeader inset divider title="Work queue" subtitle={`Everything routed to ${machine.code}, in run order`} />
        <TaskTable
          rows={queue}
          columns={['task', 'project', 'client', 'batch', 'duration', 'window', 'cost', 'status']}
          defaultSort={{ key: 'window', dir: 'asc' }}
          onRowClick={setDrawerRow}
          activeId={drawerRow?.task.id}
          emptyState={
            <EmptyState
              title="No work queued on this unit"
              description="The scheduler has not routed any tasks here in the current plan."
              size="sm"
            />
          }
        />
      </Card>

      <TaskDrawer row={drawerRow} open={Boolean(drawerRow)} onClose={() => setDrawerRow(undefined)} />
    </Page>
  )
}
