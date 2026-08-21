import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Crosshair, SlidersHorizontal, X } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'
import { Tooltip } from '@/components/ui/Tooltip'
import { GanttChart, GanttLegend, type GanttZoom } from '@/components/gantt/GanttChart'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { useAppStore } from '@/store/useAppStore'
import { buildTaskRows, sumFinancials, type TaskRow } from '@/lib/selectors'
import { useQueryState } from '@/lib/useQueryState'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { formatCurrency, formatHours } from '@/lib/format'
import { taskStatusLabel } from '@/lib/tone'
import { SCHEDULE_ORIGIN } from '@/engine'
import type { TaskStatus } from '@/types/entities'

const SPAN_DAYS: Record<GanttZoom, number> = { day: 1, week: 7, fortnight: 14 }

function startOfDay(d: Date) {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function TimelinePage() {
  const { tasks, projects, clients, machineTypes, blocks } = useAppStore()
  const [params, setParams] = useSearchParams()
  const focusTaskId = params.get('focus') ?? undefined

  const [zoom, setZoom] = useState<GanttZoom>('week')
  const [windowStart, setWindowStart] = useState(startOfDay(SCHEDULE_ORIGIN))
  const [machineTypeFilter, setMachineTypeFilter] = useQueryState('machineType')
  const [projectFilter, setProjectFilter] = useQueryState('project')
  const [statusFilter, setStatusFilter] = useQueryState('status')
  const [drawerRow, setDrawerRow] = useState<TaskRow | undefined>()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const isDesktop = useIsDesktop()

  const rows = useMemo(
    () => buildTaskRows(tasks, projects, clients, machineTypes, blocks),
    [tasks, projects, clients, machineTypes, blocks],
  )

  const filteredRows = rows.filter((r) => {
    if (projectFilter !== 'all' && r.project?.id !== projectFilter) return false
    if (statusFilter !== 'all' && r.task.status !== statusFilter) return false
    return true
  })

  const filteredMachineTypes =
    machineTypeFilter === 'all' ? machineTypes : machineTypes.filter((mt) => mt.id === machineTypeFilter)

  const windowEnd = new Date(windowStart.getTime() + SPAN_DAYS[zoom] * 86_400_000)

  const shift = (dir: 1 | -1) =>
    setWindowStart(new Date(windowStart.getTime() + dir * SPAN_DAYS[zoom] * 86_400_000))

  const visible = filteredRows.filter((r) => {
    if (!r.block) return false
    const s = new Date(r.block.startAt).getTime()
    const e = new Date(r.block.endAt).getTime()
    return e >= windowStart.getTime() && s <= windowEnd.getTime()
  })
  const windowFinancials = useMemo(() => sumFinancials(visible), [visible])

  const focusRow = focusTaskId ? rows.find((r) => r.task.id === focusTaskId) : undefined

  const activeFilterCount = [machineTypeFilter, projectFilter, statusFilter].filter((f) => f !== 'all').length

  const filterControls = (
    <>
      <Select
        value={machineTypeFilter}
        onChange={setMachineTypeFilter}
        className="w-48"
        size="sm"
        aria-label="Machine type"
        options={[
          { value: 'all', label: 'All machine types' },
          ...machineTypes.map((mt) => ({ value: mt.id, label: mt.name, meta: `${mt.machines.length} units` })),
        ]}
      />
      <Select
        value={projectFilter}
        onChange={setProjectFilter}
        className="w-44"
        size="sm"
        aria-label="Project"
        options={[{ value: 'all', label: 'All projects' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
      />
      <Select
        value={statusFilter}
        onChange={setStatusFilter}
        className="w-40"
        size="sm"
        aria-label="Status"
        options={[
          { value: 'all', label: 'All statuses' },
          ...(Object.keys(taskStatusLabel) as TaskStatus[]).map((k) => ({ value: k, label: taskStatusLabel[k] })),
        ]}
      />
    </>
  )

  const rangeLabel =
    zoom === 'day'
      ? windowStart.toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'short' })
      : `${windowStart.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} – ${new Date(
          windowEnd.getTime() - 1,
        ).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}`

  return (
    <Page
      title="Production timeline"
      subtitle="Machine-by-machine schedule produced by the deterministic planner."
      maxWidth="wide"
      actions={
        <SegmentedControl
          value={zoom}
          onChange={setZoom}
          segments={[
            { value: 'day' as GanttZoom, label: 'Day' },
            { value: 'week' as GanttZoom, label: 'Week' },
            { value: 'fortnight' as GanttZoom, label: '2 weeks' },
          ]}
        />
      }
    >
      <Card padding={false}>
        <div className="flex flex-wrap items-center gap-2 p-3">
          <div className="flex items-center rounded-full bg-surface-sunken p-1">
            <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} onClick={() => shift(-1)} aria-label="Previous period" />
            <span className="min-w-[168px] px-1 text-center text-base font-medium tabular-nums">{rangeLabel}</span>
            <Button variant="ghost" size="sm" icon={<ChevronRight size={14} />} onClick={() => shift(1)} aria-label="Next period" />
          </div>
          <Button size="sm" icon={<Crosshair size={13} />} onClick={() => setWindowStart(startOfDay(SCHEDULE_ORIGIN))}>
            Today
          </Button>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {isDesktop ? (
              filterControls
            ) : (
              <Button size="sm" icon={<SlidersHorizontal size={13} />} onClick={() => setFiltersOpen(true)}>
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-0.5 rounded-xs bg-accent-soft px-1 text-2xs font-semibold tabular-nums text-accent-fg">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line px-3 py-2">
          <Tooltip content="Machine time and cost booked inside the visible window">
            <Text variant="bodySm" tone="muted" numeric>
              <span className="font-semibold text-fg">{visible.length}</span> task{visible.length === 1 ? '' : 's'} in view ·{' '}
              {formatHours(windowFinancials.hours)} · {formatCurrency(windowFinancials.cost)} cost
            </Text>
          </Tooltip>
          <div className="ml-auto">
            <GanttLegend />
          </div>
        </div>

        {focusRow && (
          <div className="flex items-center gap-2 border-t border-line bg-accent-soft px-3 py-2">
            <Badge tone="accent" dot>
              Highlighting {focusRow.task.id.toUpperCase()}
            </Badge>
            <Text variant="bodySm" tone="muted">
              {focusRow.task.name}
            </Text>
            <Button
              variant="ghost"
              size="xs"
              icon={<X size={12} />}
              aria-label="Clear highlight"
              className="ml-auto"
              onClick={() =>
                setParams(
                  (prev) => {
                    const next = new URLSearchParams(prev)
                    next.delete('focus')
                    return next
                  },
                  { replace: true },
                )
              }
            />
          </div>
        )}
      </Card>

      <GanttChart
        machineTypes={filteredMachineTypes}
        taskRows={filteredRows}
        windowStart={windowStart}
        windowEnd={windowEnd}
        zoom={zoom}
        focusTaskId={focusTaskId}
        onSelectTask={setDrawerRow}
      />

      {!isDesktop && (
        <Drawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          side="bottom"
          size="sm"
          title="Filters"
          subtitle={`${visible.length} task${visible.length === 1 ? '' : 's'} in view`}
          footer={
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setMachineTypeFilter('all')
                  setProjectFilter('all')
                  setStatusFilter('all')
                }}
              >
                Clear all
              </Button>
              <Button variant="primary" onClick={() => setFiltersOpen(false)}>
                Show results
              </Button>
            </>
          }
        >
          <div className="flex flex-col gap-3 p-4 [&>*]:!w-full">{filterControls}</div>
        </Drawer>
      )}

      <TaskDrawer row={drawerRow} open={Boolean(drawerRow)} onClose={() => setDrawerRow(undefined)} />
    </Page>
  )
}
