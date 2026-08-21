import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CalendarRange, CheckCircle2, ListChecks } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card, CardHeader } from '@/components/ui/Card'
import { Metric } from '@/components/ui/Metric'
import { Meter, StackedMeter } from '@/components/ui/Progress'
import { Sparkline } from '@/components/ui/Sparkline'
import { Banner } from '@/components/ui/Banner'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Text } from '@/components/ui/Text'
import { Badge } from '@/components/ui/Badge'
import { MachineFloorCard } from '@/components/dashboard/MachineFloorCard'
import { FulfillmentCard } from '@/components/dashboard/FulfillmentCard'
import { AlertRow } from '@/components/alerts/AlertRow'
import { TaskTable } from '@/components/tasks/TaskTable'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { useAppStore } from '@/store/useAppStore'
import {
  buildDailySeries,
  buildMachineActivity,
  buildOrderFulfillment,
  buildTaskRows,
  computeFloorLoad,
  sumFinancials,
  type TaskRow,
} from '@/lib/selectors'
import { formatCurrency, formatHours, formatPercent } from '@/lib/format'
import { utilizationTone } from '@/lib/tone'
import { routes } from '@/lib/routes'
import { SCHEDULE_ORIGIN } from '@/engine'

const WINDOW_DAYS = 7

export function DashboardPage() {
  const { tasks, projects, clients, machineTypes, blocks, alerts } = useAppStore()
  const [drawerRow, setDrawerRow] = useState<TaskRow | undefined>()

  const taskRows = useMemo(
    () => buildTaskRows(tasks, projects, clients, machineTypes, blocks),
    [tasks, projects, clients, machineTypes, blocks],
  )
  const machineActivity = useMemo(() => buildMachineActivity(machineTypes, taskRows), [machineTypes, taskRows])
  const fulfillment = useMemo(() => buildOrderFulfillment(projects, clients, taskRows), [projects, clients, taskRows])
  const financials = useMemo(() => sumFinancials(taskRows), [taskRows])
  const series = useMemo(() => buildDailySeries(blocks, SCHEDULE_ORIGIN, WINDOW_DAYS), [blocks])
  const floor = useMemo(
    () =>
      computeFloorLoad(
        machineTypes,
        blocks,
        SCHEDULE_ORIGIN,
        new Date(SCHEDULE_ORIGIN.getTime() + WINDOW_DAYS * 86_400_000),
      ),
    [machineTypes, blocks],
  )

  const totalMachines = machineActivity.length
  const runningNow = machineActivity.filter((r) => r.effectiveStatus === 'running').length
  const maintenanceNow = machineActivity.filter((r) => r.effectiveStatus === 'maintenance').length
  const idleNow = totalMachines - runningNow - maintenanceNow
  const openTasks = tasks.filter((t) => t.status !== 'completed').length
  const blockedTasks = tasks.filter((t) => t.status === 'blocked').length
  const atRisk = fulfillment.filter((r) => r.overdue || r.atRisk)
  const criticalAlerts = alerts.filter((a) => a.severity === 'critical')

  // Work landing in the next 48 hours — the "what do I get, and when" view.
  const upcoming = useMemo(
    () =>
      taskRows
        .filter((r) => {
          if (!r.block) return false
          const end = new Date(r.block.endAt).getTime()
          return end >= SCHEDULE_ORIGIN.getTime() && end - SCHEDULE_ORIGIN.getTime() <= 2 * 86_400_000
        })
        .sort((a, b) => new Date(a.block!.endAt).getTime() - new Date(b.block!.endAt).getTime()),
    [taskRows],
  )

  const todayLabel = SCHEDULE_ORIGIN.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Page
      title="Operations control"
      subtitle={`${todayLabel} — one deterministic plan across every project, machine and client.`}
      maxWidth="wide"
      actions={
        <>
          <ButtonLink to={routes.tasks()} icon={<ListChecks size={14} />}>
            Task bucket
          </ButtonLink>
          <ButtonLink to={routes.timeline()} variant="primary" icon={<CalendarRange size={14} />}>
            Production timeline
          </ButtonLink>
        </>
      }
    >
      {criticalAlerts.length > 0 && (
        <Banner
          tone="danger"
          title={`${criticalAlerts.length} exception${criticalAlerts.length === 1 ? '' : 's'} need attention`}
          action={
            <ButtonLink to={routes.alerts({ severity: 'critical' })} size="sm" iconAfter={<ArrowRight size={13} />}>
              Review
            </ButtonLink>
          }
        >
          <Text variant="bodyMd" tone="muted">
            {criticalAlerts[0].message}
          </Text>
        </Banner>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric
          label="Floor utilization"
          value={formatPercent(floor.utilizationPct)}
          helper={`${formatHours(floor.busyHours)} of ${formatHours(floor.capacityHours)} capacity`}
          tone={floor.utilizationPct >= 85 ? 'danger' : floor.utilizationPct < 30 ? 'warning' : 'default'}
          to={routes.utilization()}
          visual={<Meter value={floor.utilizationPct} tone={utilizationTone(floor.utilizationPct)} />}
        />
        <Metric
          label="Machines running"
          value={`${runningNow} / ${totalMachines}`}
          helper={`${idleNow} idle · ${maintenanceNow} in maintenance`}
          to={routes.machines()}
          visual={
            <StackedMeter
              segments={[
                { value: runningNow, tone: 'accent', label: 'Running' },
                { value: idleNow, tone: 'neutral', label: 'Idle' },
                { value: maintenanceNow, tone: 'warning', label: 'Maintenance' },
              ]}
            />
          }
        />
        <Metric
          label="Open tasks"
          value={openTasks}
          helper={`${blockedTasks} blocked on dependencies`}
          to={routes.tasks()}
          visual={<Sparkline values={series.map((d) => d.taskCount)} tone="accent" height={24} />}
        />
        <Metric
          label="Scheduled profit"
          value={formatCurrency(financials.profit)}
          helper={`${formatPercent(financials.marginPct)} blended margin`}
          tone="success"
          to={routes.utilization()}
          visual={<Sparkline values={series.map((d) => d.profit)} tone="success" height={24} />}
        />
        <Metric
          label="Orders at risk"
          value={atRisk.length}
          helper={atRisk.length > 0 ? atRisk.map((r) => r.project.name).slice(0, 2).join(', ') : 'Every order on schedule'}
          tone={atRisk.length > 0 ? 'danger' : 'success'}
          to={routes.projects({ status: 'in_progress' })}
          visual={
            atRisk.length > 0 ? (
              <Badge tone="danger" dot>
                Action needed
              </Badge>
            ) : (
              <Badge tone="success" dot>
                On plan
              </Badge>
            )
          }
        />
      </div>

      <MachineFloorCard rows={machineActivity} onSelectTask={setDrawerRow} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card padding={false}>
          <CardHeader
            inset
            divider
            title="Landing in the next 48 hours"
            subtitle="Which tasks complete, on which machine, and when"
            action={
              <ButtonLink to={routes.tasks()} size="sm" variant="ghost" iconAfter={<ArrowRight size={13} />}>
                View all
              </ButtonLink>
            }
          />
          <TaskTable
            rows={upcoming}
            columns={['task', 'project', 'machine', 'window', 'status']}
            defaultSort={{ key: 'window', dir: 'asc' }}
            maxHeight="360px"
            density="compact"
            onRowClick={setDrawerRow}
            activeId={drawerRow?.task.id}
            emptyState={
              <EmptyState
                icon={<CheckCircle2 size={20} />}
                title="Nothing completes in the next two days"
                description="The next scheduled finish falls outside this window."
              />
            }
          />
        </Card>

        <Card padding={false}>
          <CardHeader
            inset
            divider
            title="Exceptions"
            subtitle={`${alerts.length} open · ${criticalAlerts.length} critical`}
            action={
              <ButtonLink to={routes.alerts()} size="sm" variant="ghost" iconAfter={<ArrowRight size={13} />}>
                View all
              </ButtonLink>
            }
          />
          {alerts.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle size={20} />}
              title="No open exceptions"
              description="Everything is tracking to plan."
            />
          ) : (
            <div className="max-h-[360px] overflow-y-auto">
              {alerts.slice(0, 6).map((a) => (
                <AlertRow key={a.id} alert={a} compact />
              ))}
            </div>
          )}
        </Card>
      </div>

      <FulfillmentCard rows={fulfillment} />

      <TaskDrawer row={drawerRow} open={Boolean(drawerRow)} onClose={() => setDrawerRow(undefined)} />
    </Page>
  )
}
