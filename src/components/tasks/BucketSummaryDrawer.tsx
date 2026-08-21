import { useMemo } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { Badge } from '@/components/ui/Badge'
import { Meter } from '@/components/ui/Progress'
import { Text } from '@/components/ui/Text'
import { MetricCell, MetricRow } from '@/components/ui/Metric'
import { AppLink } from '@/components/ui/Link'
import { formatCurrency, formatHours, formatPercent } from '@/lib/format'
import { profitClass, taskStatusLabel, taskStatusTone } from '@/lib/tone'
import { routes } from '@/lib/routes'
import { sumFinancials, type TaskRow } from '@/lib/selectors'
import type { TaskStatus } from '@/types/entities'

interface Group {
  id: string
  label: string
  href?: string
  count: number
  hours: number
  cost: number
  revenue: number
  profit: number
}

function groupBy(rows: TaskRow[], key: (r: TaskRow) => { id: string; label: string; href?: string } | undefined): Group[] {
  const map = new Map<string, Group>()
  for (const row of rows) {
    const meta = key(row)
    if (!meta) continue
    const entry = map.get(meta.id) ?? {
      id: meta.id,
      label: meta.label,
      href: meta.href,
      count: 0,
      hours: 0,
      cost: 0,
      revenue: 0,
      profit: 0,
    }
    entry.count += 1
    entry.hours += row.block?.durationHrs ?? 0
    entry.cost += row.block?.cost ?? 0
    entry.revenue += row.block?.revenue ?? 0
    entry.profit += row.block?.profit ?? 0
    map.set(meta.id, entry)
  }
  return [...map.values()].sort((a, b) => b.hours - a.hours)
}

/**
 * Bottom sheet: the bucket's composition in one glance. Lives in a bottom
 * drawer because these are three wide tables — a 480px side panel would
 * force each of them into a scroll box.
 */
export function BucketSummaryDrawer({
  open,
  onClose,
  rows,
}: {
  open: boolean
  onClose: () => void
  rows: TaskRow[]
}) {
  const totals = useMemo(() => sumFinancials(rows), [rows])

  const byMachineType = useMemo(
    () =>
      groupBy(rows, (r) =>
        r.machineType
          ? { id: r.machineType.id, label: r.machineType.name, href: routes.machineType(r.machineType.id) }
          : undefined,
      ),
    [rows],
  )
  const byProject = useMemo(
    () =>
      groupBy(rows, (r) =>
        r.project ? { id: r.project.id, label: r.project.name, href: routes.project(r.project.id) } : undefined,
      ),
    [rows],
  )
  const byStatus = useMemo(() => {
    const order: TaskStatus[] = ['in_progress', 'scheduled', 'blocked', 'overdue', 'completed']
    return order
      .map((status) => {
        const subset = rows.filter((r) => r.task.status === status)
        const fin = sumFinancials(subset)
        return { status, count: subset.length, hours: fin.hours }
      })
      .filter((s) => s.count > 0)
  }, [rows])

  const maxHours = Math.max(...byMachineType.map((g) => g.hours), ...byProject.map((g) => g.hours), 1)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="bottom"
      size="lg"
      title="Bucket summary"
      subtitle={`${rows.length} tasks in the current filter — where the machine time and the money go`}
    >
      <div className="p-4">
        <MetricRow className="grid-cols-2 sm:grid-cols-4">
          <MetricCell label="Machine time" value={formatHours(totals.hours)} />
          <MetricCell label="Run cost" value={formatCurrency(totals.cost)} />
          <MetricCell label="Revenue" value={formatCurrency(totals.revenue)} />
          <MetricCell
            label={`Profit · ${formatPercent(totals.marginPct)} margin`}
            value={formatCurrency(totals.profit)}
            tone={totals.profit >= 0 ? 'success' : 'danger'}
          />
        </MetricRow>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <GroupPanel title="By machine type" groups={byMachineType} maxHours={maxHours} />
          <GroupPanel title="By project" groups={byProject} maxHours={maxHours} />

          <section>
            <Text variant="label" tone="faint" className="mb-2 block">
              By status
            </Text>
            <div className="flex flex-col gap-1.5">
              {byStatus.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center justify-between gap-3 rounded-md bg-surface-sunken px-3 py-2"
                >
                  <Badge tone={taskStatusTone[s.status]} dot>
                    {taskStatusLabel[s.status]}
                  </Badge>
                  <Text variant="bodySm" tone="muted" numeric>
                    {s.count} task{s.count === 1 ? '' : 's'} · {formatHours(s.hours)}
                  </Text>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Drawer>
  )
}

function GroupPanel({ title, groups, maxHours }: { title: string; groups: Group[]; maxHours: number }) {
  return (
    <section>
      <Text variant="label" tone="faint" className="mb-2 block">
        {title}
      </Text>
      <div className="flex flex-col gap-2">
        {groups.slice(0, 7).map((g) => (
          <div key={g.id} className="rounded-md bg-surface-sunken px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              {g.href ? (
                <AppLink to={g.href} tone="subtle" className="truncate font-medium">
                  {g.label}
                </AppLink>
              ) : (
                <Text variant="bodyMd" truncate className="font-medium">
                  {g.label}
                </Text>
              )}
              <Text variant="bodySm" tone="muted" numeric className="shrink-0">
                {formatHours(g.hours)}
              </Text>
            </div>
            <Meter value={(g.hours / maxHours) * 100} tone="accent" size="sm" className="mt-1.5" />
            <div className="mt-1.5 flex items-center justify-between">
              <Text variant="bodySm" tone="faint" numeric>
                {g.count} task{g.count === 1 ? '' : 's'} · {formatCurrency(g.cost)} cost
              </Text>
              <Text variant="bodySm" numeric className={`font-medium ${profitClass(g.profit)}`}>
                {formatCurrency(g.profit)}
              </Text>
            </div>
          </div>
        ))}
        {groups.length === 0 && (
          <Text variant="bodySm" tone="subtle">
            Nothing in this filter.
          </Text>
        )}
      </div>
    </section>
  )
}
