import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Coins,
  Factory,
  ListChecks,
  Timer,
} from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card, CardHeader } from '@/components/ui/Card'
import { Metric } from '@/components/ui/Metric'
import { Banner } from '@/components/ui/Banner'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SearchField } from '@/components/ui/Field'
import { Text } from '@/components/ui/Text'
import { DailyLoadChart, ProfitLossChart, ProjectStatusChart } from '@/components/dashboard/DashboardCharts'
import { CapacityCard, HeadlineCard, MachineTypeStrip } from '@/components/dashboard/OverviewPanels'
import { StatTile } from '@/components/dashboard/FeatureCards'
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
  computeUtilization,
  sumFinancials,
  type TaskRow,
} from '@/lib/selectors'
import { formatCurrency, formatHours, formatPercent } from '@/lib/format'
import { routes } from '@/lib/routes'
import { SCHEDULE_ORIGIN } from '@/engine'

const WINDOW_DAYS = 7

/** Rows shown in the overview panel before deferring to the full task bucket. */
const PANEL_ROWS = 12

/** Exceptions listed beside it; tuned so both columns end at the same line. */
const PANEL_ALERTS = 4

export function DashboardPage() {
  const { tasks, projects, clients, machineTypes, blocks, alerts } = useAppStore()
  const [drawerRow, setDrawerRow] = useState<TaskRow | undefined>()
  const [query, setQuery] = useState('')

  const taskRows = useMemo(
    () => buildTaskRows(tasks, projects, clients, machineTypes, blocks),
    [tasks, projects, clients, machineTypes, blocks],
  )
  const machineActivity = useMemo(() => buildMachineActivity(machineTypes, taskRows), [machineTypes, taskRows])
  const fulfillment = useMemo(() => buildOrderFulfillment(projects, clients, taskRows), [projects, clients, taskRows])
  const financials = useMemo(() => sumFinancials(taskRows), [taskRows])
  const series = useMemo(() => buildDailySeries(blocks, SCHEDULE_ORIGIN, WINDOW_DAYS), [blocks])

  const windowEnd = useMemo(
    () => new Date(SCHEDULE_ORIGIN.getTime() + WINDOW_DAYS * 86_400_000),
    [],
  )
  const floor = useMemo(
    () => computeFloorLoad(machineTypes, blocks, SCHEDULE_ORIGIN, windowEnd),
    [machineTypes, blocks, windowEnd],
  )
  const utilization = useMemo(
    () => computeUtilization(machineTypes, blocks, SCHEDULE_ORIGIN, windowEnd),
    [machineTypes, blocks, windowEnd],
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

  const capacityPerDay = WINDOW_DAYS > 0 ? floor.capacityHours / WINDOW_DAYS : 0

  const visibleUpcoming = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matched = q
      ? upcoming.filter((r) =>
          [r.task.name, r.project?.name, r.machineCode].some((v) => v?.toLowerCase().includes(q)),
        )
      : upcoming
    return matched.slice(0, PANEL_ROWS)
  }, [upcoming, query])

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
          <ButtonLink to={routes.tasks()} icon={<ListChecks size={15} />}>
            Task bucket
          </ButtonLink>
          <ButtonLink to={routes.timeline()} variant="primary" icon={<CalendarRange size={15} />}>
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

      {/* Three-column composition: headline column, stat grid, and the chart. */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,2.3fr)]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          <HeadlineCard
            label="Scheduled revenue"
            value={formatCurrency(financials.revenue)}
            helper={`${formatPercent(financials.marginPct)} blended margin on ${formatHours(floor.busyHours)}`}
            actions={
              <>
                <ButtonLink to={routes.tasks()} variant="primary" size="md" fullWidth icon={<ListChecks size={15} />}>
                  Tasks
                </ButtonLink>
                <ButtonLink to={routes.timeline()} variant="secondary" size="md" fullWidth icon={<CalendarRange size={15} />}>
                  Timeline
                </ButtonLink>
              </>
            }
          >
            <MachineTypeStrip rows={utilization} />
          </HeadlineCard>

          <CapacityCard usedHours={floor.busyHours} capacityHours={floor.capacityHours} />

          <div className="grid grid-cols-2 gap-5">
            <StatTile
              label="Landing in 48 hours"
              value={upcoming.length}
              icon={<Timer size={18} />}
              tone="ink"
              to={routes.tasks()}
            />
            <StatTile
              label={atRisk.length > 0 ? 'Orders at risk' : 'Orders on plan'}
              value={atRisk.length > 0 ? atRisk.length : fulfillment.length}
              icon={<AlertTriangle size={18} />}
              tone="accent"
              to={routes.projects({ status: 'in_progress' })}
            />
          </div>

          <Card padding={false} className="flex flex-1 flex-col">
            <CardHeader
              inset
              divider
              title="Exceptions"
              subtitle={`${alerts.length} open · ${criticalAlerts.length} critical`}
              action={
                <ButtonLink to={routes.alerts()} size="sm" variant="secondary" iconAfter={<ArrowRight size={13} />}>
                  All
                </ButtonLink>
              }
            />
            {alerts.length === 0 ? (
              <EmptyState
                size="sm"
                icon={<AlertTriangle size={20} />}
                title="No open exceptions"
                description="Everything is tracking to plan."
              />
            ) : (
              <div>
                {alerts.slice(0, PANEL_ALERTS).map((a) => (
                  <AlertRow key={a.id} alert={a} compact />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right region: stat grid beside the chart, table beneath both */}
        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Metric
                label="Floor utilization"
                value={formatPercent(floor.utilizationPct)}
                helper={`of ${formatHours(floor.capacityHours)} capacity`}
                icon={<Factory size={16} />}
                to={routes.utilization()}
                filled
              />
              <Metric
                label="Machines running"
                value={`${runningNow} / ${totalMachines}`}
                helper={`${idleNow} idle · ${maintenanceNow} in service`}
                icon={<Factory size={16} />}
                to={routes.machines()}
              />
              <Metric
                label="Open tasks"
                value={openTasks}
                helper={`${blockedTasks} blocked`}
                icon={<ListChecks size={16} />}
                to={routes.tasks()}
              />
              <Metric
                label="Scheduled profit"
                value={formatCurrency(financials.profit)}
                helper={`${formatPercent(financials.marginPct)} blended margin`}
                icon={<Coins size={16} />}
                to={routes.utilization()}
              />
            </div>

            <ProfitLossChart series={series} />
          </div>

          <Card padding={false}>
            <CardHeader
              inset
              divider
              title="Landing in the next 48 hours"
              subtitle="Which tasks complete, on which machine, and when"
              action={
                <>
                  <SearchField
                    value={query}
                    onValueChange={setQuery}
                    placeholder="Search"
                    aria-label="Search tasks landing in the next 48 hours"
                    className="w-full sm:w-52"
                  />
                  <ButtonLink to={routes.tasks()} size="md" variant="secondary" iconAfter={<ArrowRight size={13} />}>
                    View all
                  </ButtonLink>
                </>
              }
            />
            <TaskTable
              rows={visibleUpcoming}
              columns={['task', 'project', 'window', 'status']}
              fluid
              defaultSort={{ key: 'window', dir: 'asc' }}
              density="compact"
              onRowClick={setDrawerRow}
              activeId={drawerRow?.task.id}
              emptyState={
                <EmptyState
                  icon={<CheckCircle2 size={20} />}
                  title={query ? 'No matching tasks' : 'Nothing completes in the next two days'}
                  description={
                    query
                      ? 'Try a different task, project or machine code.'
                      : 'The next scheduled finish falls outside this window.'
                  }
                />
              }
            />
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <ProjectStatusChart rows={taskRows} />
        <DailyLoadChart series={series} capacityPerDay={capacityPerDay} />
      </div>

      <MachineFloorCard rows={machineActivity} onSelectTask={setDrawerRow} />

      <FulfillmentCard rows={fulfillment} />

      <TaskDrawer row={drawerRow} open={Boolean(drawerRow)} onClose={() => setDrawerRow(undefined)} />
    </Page>
  )
}
