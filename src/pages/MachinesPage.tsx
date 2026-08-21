import { useMemo, useState } from 'react'
import { Factory, Plus } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { StatGroup } from '@/components/ui/StatGroup'
import { Meter, StackedMeter } from '@/components/ui/Progress'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { EmptyState } from '@/components/ui/EmptyState'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { AppLink } from '@/components/ui/Link'
import { MachineTypeCard } from '@/components/machines/MachineTypeCard'
import { MachineTypeFormModal } from '@/components/machines/MachineTypeFormModal'
import { useAppStore } from '@/store/useAppStore'
import { buildTaskRows, computeUtilization, machineTypeQueue, type MachineTypeUtilization } from '@/lib/selectors'
import { formatCurrency, formatHours } from '@/lib/format'
import { profitClass, utilizationTone } from '@/lib/tone'
import { routes } from '@/lib/routes'
import { SCHEDULE_ORIGIN } from '@/engine'

export function MachinesPage() {
  const { machineTypes, tasks, projects, clients, blocks } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [view, setView] = useState<'grid' | 'table'>('grid')

  const windowEnd = new Date(SCHEDULE_ORIGIN.getTime() + 7 * 86_400_000)
  const utilization = useMemo(
    () => computeUtilization(machineTypes, blocks, SCHEDULE_ORIGIN, windowEnd),
    // windowEnd is derived from the fixed schedule origin, so it is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [machineTypes, blocks],
  )
  const taskRows = useMemo(
    () => buildTaskRows(tasks, projects, clients, machineTypes, blocks),
    [tasks, projects, clients, machineTypes, blocks],
  )

  const totals = utilization.reduce(
    (acc, u) => ({
      machines: acc.machines + u.totalMachines,
      running: acc.running + u.runningNow,
      idle: acc.idle + u.idleNow,
      maintenance: acc.maintenance + u.maintenanceNow,
    }),
    { machines: 0, running: 0, idle: 0, maintenance: 0 },
  )

  const rates = machineTypes.map((mt) => mt.hourlyRate)
  const cheapestRate = rates.length ? Math.min(...rates) : 0
  const dearestRate = rates.length ? Math.max(...rates) : 0

  const capacity = utilization.reduce(
    (acc, u) => {
      // Two 8-hour shifts a day on every unit that is not in maintenance.
      const total = acc.total + (u.totalMachines - u.maintenanceNow) * 7 * 16
      const booked = acc.booked + (u.utilizationPct / 100) * (u.totalMachines - u.maintenanceNow) * 7 * 16
      return { total, booked }
    },
    { total: 0, booked: 0 },
  )
  const capacityFree = Math.max(0, capacity.total - capacity.booked)

  const columns: Column<MachineTypeUtilization>[] = [
    {
      key: 'type',
      header: 'Machine type',
      sticky: true,
      width: '300px',
      sortValue: (u) => u.machineType.name,
      render: (u) => (
        <div className="max-w-sm">
          <AppLink to={routes.machineType(u.machineType.id)} tone="subtle" className="font-medium">
            {u.machineType.name}
          </AppLink>
          <Text variant="bodySm" tone="faint" truncate className="block">
            {u.machineType.description}
          </Text>
        </div>
      ),
    },
    {
      key: 'rate',
      header: 'Hourly rate',
      align: 'end',
      sortValue: (u) => u.machineType.hourlyRate,
      render: (u) => (
        <span className="font-medium tabular-nums">{formatCurrency(u.machineType.hourlyRate)}/hr</span>
      ),
    },
    {
      key: 'state',
      header: 'Running / Idle / Maint.',
      width: '180px',
      sortValue: (u) => -u.runningNow,
      render: (u) => (
        <div>
          <span className="tabular-nums text-fg-muted">
            <span className="font-semibold text-fg">{u.runningNow}</span> / {u.idleNow} / {u.maintenanceNow}
            <span className="text-fg-faint"> of {u.totalMachines}</span>
          </span>
          <StackedMeter
            className="mt-1"
            segments={[
              { value: u.runningNow, tone: 'accent', label: 'Running' },
              { value: u.idleNow, tone: 'neutral', label: 'Idle' },
              { value: u.maintenanceNow, tone: 'warning', label: 'Maintenance' },
            ]}
          />
        </div>
      ),
    },
    {
      key: 'utilization',
      header: 'Utilization (7d)',
      width: '160px',
      sortValue: (u) => u.utilizationPct,
      render: (u) => <Meter value={u.utilizationPct} tone={utilizationTone(u.utilizationPct)} showValue />,
    },
    {
      key: 'queue',
      header: 'Queued work',
      align: 'end',
      hideBelow: 'lg',
      sortValue: (u) => u.scheduledHours,
      render: (u) => (
        <span className="tabular-nums">
          {formatHours(u.scheduledHours)}
          <span className="ml-1 text-fg-faint">/ {machineTypeQueue(taskRows, u.machineType.id).length} tasks</span>
        </span>
      ),
    },
    {
      key: 'profit',
      header: 'Profit',
      align: 'end',
      sortValue: (u) => u.profit,
      render: (u) => (
        <span className={`font-medium tabular-nums ${profitClass(u.profit)}`}>{formatCurrency(u.profit)}</span>
      ),
    },
    {
      key: 'health',
      header: 'Capacity',
      sortValue: (u) => (u.maintenanceNow > 0 ? 0 : u.utilizationPct >= 85 ? 1 : 2),
      render: (u) =>
        u.maintenanceNow > 0 ? (
          <Badge tone="warning" dot>
            Reduced
          </Badge>
        ) : u.utilizationPct >= 85 ? (
          <Badge tone="danger" dot>
            Saturated
          </Badge>
        ) : (
          <Badge tone="success" dot>
            Healthy
          </Badge>
        ),
    },
  ]

  return (
    <Page
      title="Machines"
      subtitle="Machine type profiles — tasks specify a type, the scheduler picks the unit."
      maxWidth="wide"
      actions={
        <>
          <SegmentedControl
            value={view}
            onChange={setView}
            segments={[
              { value: 'grid' as const, label: 'Cards' },
              { value: 'table' as const, label: 'Table' },
            ]}
          />
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
            Add machine type
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <StatGroup
          label="Machine floor"
          total={totals.machines}
          totalUnit="units"
          flag={
            totals.maintenance > 0 ? (
              <Badge tone="warning" dot>
                Capacity reduced
              </Badge>
            ) : undefined
          }
          segments={[
            { label: 'Running', value: totals.running, tone: 'accent', to: routes.timeline() },
            { label: 'Idle', value: totals.idle, tone: 'neutral', to: routes.tasks({ status: 'scheduled' }) },
            { label: 'Maintenance', value: totals.maintenance, tone: 'warning' },
          ]}
          footnote={`${machineTypes.length} machine types · ${formatCurrency(cheapestRate)}–${formatCurrency(dearestRate)}/hr`}
        />
        <StatGroup
          label="Capacity, next 7 days"
          total={formatHours(capacity.total)}
          segments={[
            { label: 'Booked', value: capacity.booked, tone: 'accent', display: formatHours(capacity.booked) },
            { label: 'Free', value: capacityFree, tone: 'neutral', display: formatHours(capacityFree) },
          ]}
          footnote="Measured against two 8-hour shifts on every in-service unit."
        />
      </div>

      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {utilization.map((u) => (
            <MachineTypeCard
              key={u.machineType.id}
              stats={u}
              queueCount={machineTypeQueue(taskRows, u.machineType.id).length}
            />
          ))}
          {utilization.length === 0 && (
            <Card className="md:col-span-2 xl:col-span-3">
              <EmptyState
                icon={<Factory size={20} />}
                title="No machine types yet"
                description="Add a machine type to start scheduling work against it."
                action={
                  <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
                    Add machine type
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      ) : (
        <Card padding={false}>
          <DataTable
            columns={columns}
            rows={utilization}
            rowKey={(u) => u.machineType.id}
            rowHref={(u) => routes.machineType(u.machineType.id)}
            defaultSort={{ key: 'rate', dir: 'desc' }}
            emptyState={
              <EmptyState
                icon={<Factory size={20} />}
                title="No machine types yet"
                description="Add a machine type to start scheduling work against it."
                action={
                  <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
                    Add machine type
                  </Button>
                }
              />
            }
          />
        </Card>
      )}

      <MachineTypeFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Page>
  )
}
