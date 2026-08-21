import { Fragment, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Wrench } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatCurrency, formatDateTime, formatHours } from '@/lib/format'
import { taskStatusBar, taskStatusLabel } from '@/lib/tone'
import { routes } from '@/lib/routes'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { SCHEDULE_ORIGIN } from '@/engine'
import type { TaskRow } from '@/lib/selectors'
import type { MachineType } from '@/types/entities'

export type GanttZoom = 'day' | 'week' | 'fortnight'

interface GanttChartProps {
  machineTypes: MachineType[]
  taskRows: TaskRow[]
  windowStart: Date
  windowEnd: Date
  zoom: GanttZoom
  focusTaskId?: string
  onSelectTask?: (row: TaskRow) => void
}

const ROW_H = 36
const GROUP_H = 30
const HEADER_H = 44

// The machine rail is fixed while the grid scrolls, so on a phone it has to
// give most of the width back to the schedule itself.
const LABEL_W_DESKTOP = 200
const LABEL_W_MOBILE = 116

const PX_PER_HOUR: Record<GanttZoom, number> = { day: 58, week: 16, fortnight: 8 }

interface Tick {
  offsetHours: number
  primary: string
  secondary?: string
  major: boolean
  /** Off-shift and weekend bands get a shaded ground. */
  shaded?: boolean
  widthHours: number
}

function buildTicks(windowStart: Date, windowEnd: Date, zoom: GanttZoom): Tick[] {
  const ticks: Tick[] = []
  const cursor = new Date(windowStart)

  if (zoom === 'day') {
    cursor.setMinutes(0, 0, 0)
    while (cursor <= windowEnd) {
      const offset = (cursor.getTime() - windowStart.getTime()) / 3_600_000
      if (offset >= 0 && cursor.getHours() % 2 === 0) {
        ticks.push({
          offsetHours: offset,
          primary: cursor.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
          major: cursor.getHours() === 0,
          // Plant runs two 8-hour shifts from 06:00; the rest is dead time.
          shaded: cursor.getHours() < 6 || cursor.getHours() >= 22,
          widthHours: 2,
        })
      }
      cursor.setHours(cursor.getHours() + 1)
    }
    return ticks
  }

  cursor.setHours(0, 0, 0, 0)
  while (cursor <= windowEnd) {
    const offset = (cursor.getTime() - windowStart.getTime()) / 3_600_000
    if (offset >= -24) {
      const weekend = cursor.getDay() === 0 || cursor.getDay() === 6
      ticks.push({
        offsetHours: Math.max(0, offset),
        primary: cursor.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        secondary: cursor.toLocaleDateString('en-IN', { weekday: 'short' }),
        major: cursor.getDay() === 1,
        shaded: weekend,
        widthHours: 24,
      })
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return ticks
}

/**
 * Machine-by-machine schedule board. Rows are physical units grouped by
 * machine type; the horizontal axis is real time, so a bar's width is the
 * literal run length rather than an abstract "effort" unit.
 */
export function GanttChart({
  machineTypes,
  taskRows,
  windowStart,
  windowEnd,
  zoom,
  focusTaskId,
  onSelectTask,
}: GanttChartProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const isDesktop = useIsDesktop()
  const LABEL_W = isDesktop ? LABEL_W_DESKTOP : LABEL_W_MOBILE

  const pxPerHour = PX_PER_HOUR[zoom]
  const totalHours = (windowEnd.getTime() - windowStart.getTime()) / 3_600_000
  const totalWidth = totalHours * pxPerHour

  const blocksByMachine = useMemo(() => {
    const map = new Map<string, TaskRow[]>()
    for (const row of taskRows) {
      if (!row.block) continue
      const list = map.get(row.block.machineId) ?? []
      list.push(row)
      map.set(row.block.machineId, list)
    }
    return map
  }, [taskRows])

  const ticks = useMemo(() => buildTicks(windowStart, windowEnd, zoom), [windowStart, windowEnd, zoom])

  const originOffset = (SCHEDULE_ORIGIN.getTime() - windowStart.getTime()) / 3_600_000
  const showOrigin = originOffset >= 0 && originOffset <= totalHours

  const toggleGroup = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="relative overflow-auto rounded-2xl bg-surface shadow-card" style={{ maxHeight: '70vh' }}>
      <div style={{ width: LABEL_W + totalWidth, minWidth: '100%' }}>
        {/* Time axis */}
        <div className="sticky top-0 z-sticky flex bg-surface-sunken" style={{ height: HEADER_H }}>
          <div
            className="sticky left-0 z-10 flex shrink-0 items-center border-b border-r border-line bg-surface-sunken px-3"
            style={{ width: LABEL_W }}
          >
            <Text variant="label" tone="subtle">
              Machine
            </Text>
          </div>
          <div className="relative border-b border-line" style={{ width: totalWidth }}>
            {ticks.map((tick, i) => (
              <div
                key={i}
                className={cn(
                  'absolute top-0 flex h-full flex-col justify-center border-l px-2',
                  tick.major ? 'border-line-strong' : 'border-line-subtle',
                  tick.shaded && 'bg-fg/[0.045]',
                )}
                style={{ left: tick.offsetHours * pxPerHour, width: tick.widthHours * pxPerHour }}
              >
                {tick.secondary && (
                  <Text variant="bodySm" tone="faint" className="leading-none">
                    {tick.secondary}
                  </Text>
                )}
                <Text
                  variant="bodySm"
                  tone={tick.major ? 'default' : 'muted'}
                  className={cn('leading-tight', tick.major && 'font-semibold')}
                >
                  {tick.primary}
                </Text>
              </div>
            ))}
            {showOrigin && (
              <div className="absolute top-0 z-20 h-full" style={{ left: originOffset * pxPerHour }}>
                <span className="absolute -left-px top-1.5 -translate-x-1/2 whitespace-nowrap rounded-xs bg-danger px-1.5 py-0.5 text-2xs font-semibold text-white">
                  NOW
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Machine rows */}
        {machineTypes.map((mt) => {
          const isCollapsed = collapsed.has(mt.id)
          const typeRows = mt.machines.flatMap((m) => blocksByMachine.get(m.id) ?? [])
          const typeHours = typeRows.reduce((s, r) => s + (r.block?.durationHrs ?? 0), 0)

          return (
            <Fragment key={mt.id}>
              <div className="flex" style={{ height: GROUP_H }}>
                <button
                  type="button"
                  onClick={() => toggleGroup(mt.id)}
                  className="sticky left-0 z-10 flex shrink-0 items-center gap-1.5 border-b border-r border-line bg-surface-sunken px-2 transition-colors hover:bg-surface-hover"
                  style={{ width: LABEL_W }}
                >
                  <ChevronDown
                    size={13}
                    className={cn('shrink-0 text-fg-faint transition-transform', isCollapsed && '-rotate-90')}
                  />
                  <Text variant="bodySm" truncate className="flex-1 text-left font-semibold">
                    {mt.name}
                  </Text>
                  <Text variant="bodySm" tone="faint" numeric className="shrink-0">
                    {mt.machines.length}
                  </Text>
                </button>
                <div className="relative border-b border-line bg-surface-sunken" style={{ width: totalWidth }}>
                  <span className="absolute left-2 top-1/2 hidden -translate-y-1/2 sm:block">
                    <Text variant="bodySm" tone="faint" numeric>
                      {formatHours(typeHours)} queued · {formatCurrency(mt.hourlyRate)}/hr
                    </Text>
                  </span>
                </div>
              </div>

              {!isCollapsed &&
                mt.machines.map((machine) => {
                  const rows = blocksByMachine.get(machine.id) ?? []
                  const isDown = machine.status === 'maintenance'
                  return (
                    <div key={machine.id} className="flex" style={{ height: ROW_H }}>
                      <div
                        className="sticky left-0 z-10 flex shrink-0 items-center justify-between gap-2 border-b border-r border-line-subtle bg-surface px-3"
                        style={{ width: LABEL_W }}
                      >
                        <Link
                          to={routes.machine(mt.id, machine.id)}
                          className="truncate font-mono text-sm font-medium text-fg transition-colors hover:text-accent-fg"
                        >
                          {machine.code}
                        </Link>
                        {isDown && (
                          <Tooltip content="Under maintenance — no work routed here">
                            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-xs bg-warning-soft text-warning-fg">
                              <Wrench size={10} />
                            </span>
                          </Tooltip>
                        )}
                      </div>

                      <div
                        className={cn('relative border-b border-line-subtle', isDown && 'bg-warning-soft/30')}
                        style={{ width: totalWidth }}
                      >
                        {ticks.map((tick, i) => (
                          <div
                            key={i}
                            className={cn(
                              'absolute top-0 h-full border-l',
                              tick.major ? 'border-line' : 'border-line-subtle',
                              tick.shaded && 'bg-fg/[0.035]',
                            )}
                            style={{ left: tick.offsetHours * pxPerHour, width: tick.widthHours * pxPerHour }}
                          />
                        ))}

                        {showOrigin && (
                          <div
                            className="absolute top-0 z-10 h-full w-px bg-danger"
                            style={{ left: originOffset * pxPerHour }}
                          />
                        )}

                        {rows.map((row) => {
                          const block = row.block!
                          const start = new Date(block.startAt).getTime()
                          const end = new Date(block.endAt).getTime()
                          if (end < windowStart.getTime() || start > windowEnd.getTime()) return null

                          const left = Math.max(0, (start - windowStart.getTime()) / 3_600_000) * pxPerHour
                          const right = Math.min(totalHours, (end - windowStart.getTime()) / 3_600_000) * pxPerHour
                          const width = Math.max(6, right - left)
                          const isFocus = focusTaskId === row.task.id
                          const bar = taskStatusBar[row.task.status]

                          return (
                            <Tooltip
                              key={row.task.id}
                              delay={120}
                              content={
                                <div className="flex flex-col gap-0.5 py-0.5">
                                  <span className="font-semibold">{row.task.name}</span>
                                  <span className="opacity-80">
                                    {row.project?.name ?? '—'}
                                    {row.client ? ` · ${row.client.name}` : ''}
                                  </span>
                                  <span className="opacity-80 tabular-nums">
                                    {formatDateTime(block.startAt)} → {formatDateTime(block.endAt)}
                                  </span>
                                  <span className="opacity-80 tabular-nums">
                                    {formatHours(block.durationHrs)} · {formatCurrency(block.cost)} cost ·{' '}
                                    {taskStatusLabel[row.task.status]}
                                  </span>
                                </div>
                              }
                            >
                              <button
                                type="button"
                                onClick={() => onSelectTask?.(row)}
                                aria-label={`${row.task.name}, ${taskStatusLabel[row.task.status]}`}
                                className={cn(
                                  'absolute top-1 flex h-[calc(100%-8px)] items-center overflow-hidden rounded-sm px-1.5',
                                  'text-xs font-medium transition-[filter,box-shadow] hover:brightness-105',
                                  isFocus && 'z-20 ring-2 ring-accent ring-offset-1 ring-offset-surface',
                                )}
                                style={{
                                  left,
                                  width,
                                  backgroundColor: bar.fill,
                                  color: bar.text,
                                  boxShadow: `inset 2px 0 0 0 ${bar.edge}`,
                                }}
                              >
                                <span className="truncate">{row.task.name}</span>
                              </button>
                            </Tooltip>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
            </Fragment>
          )
        })}

        {machineTypes.length === 0 && (
          <div className="flex items-center justify-center py-16">
            <Text variant="bodyMd" tone="subtle">
              No machines match the current filters
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}

/** Legend shared by the timeline toolbar and any embedded mini-timeline. */
export function GanttLegend() {
  const order: (keyof typeof taskStatusBar)[] = ['in_progress', 'scheduled', 'completed', 'overdue', 'blocked']
  return (
    <div className="flex flex-wrap items-center gap-3">
      {order.map((status) => (
        <span key={status} className="flex items-center gap-1.5">
          <span
            className="h-2.5 w-2.5 rounded-xs"
            style={{ backgroundColor: taskStatusBar[status].fill, boxShadow: `inset 1px 0 0 0 ${taskStatusBar[status].edge}` }}
          />
          <Text variant="bodySm" tone="subtle">
            {taskStatusLabel[status]}
          </Text>
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <Badge tone="danger" variant="solid" className="px-1 py-0 text-2xs">
          NOW
        </Badge>
        <Text variant="bodySm" tone="subtle">
          Plan origin
        </Text>
      </span>
    </div>
  )
}
