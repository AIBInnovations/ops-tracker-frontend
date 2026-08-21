import { useMemo, useState } from 'react'
import { CalendarRange, CheckCircle2, Inbox, LayoutList, Rows3, Table2 } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card, CardFooter } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Toolbar, BulkActionBar, BulkAction } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Select'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { Button, ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Text } from '@/components/ui/Text'
import { useToast } from '@/components/ui/Toast'
import { TaskTable } from '@/components/tasks/TaskTable'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { BucketSummaryDrawer } from '@/components/tasks/BucketSummaryDrawer'
import { useAppStore } from '@/store/useAppStore'
import { buildTaskRows, sumFinancials, type TaskRow } from '@/lib/selectors'
import { useQueryState } from '@/lib/useQueryState'
import { formatCurrency, formatHours } from '@/lib/format'
import { priorityLabel, taskStatusLabel } from '@/lib/tone'
import { routes } from '@/lib/routes'
import type { Priority, TaskStatus } from '@/types/entities'

const TABS: { key: string; label: string; match: (status: TaskStatus) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'in_progress', label: 'In progress', match: (s) => s === 'in_progress' },
  { key: 'scheduled', label: 'Scheduled', match: (s) => s === 'scheduled' },
  { key: 'blocked', label: 'Blocked', match: (s) => s === 'blocked' },
  { key: 'overdue', label: 'Overdue', match: (s) => s === 'overdue' },
  { key: 'completed', label: 'Completed', match: (s) => s === 'completed' },
]

export function TaskBucketPage() {
  const { tasks, projects, clients, machineTypes, blocks, updateTaskStatus } = useAppStore()
  const { toast } = useToast()

  const [tab, setTab] = useQueryState('status')
  const [projectFilter, setProjectFilter] = useQueryState('project')
  const [machineTypeFilter, setMachineTypeFilter] = useQueryState('machineType')
  const [clientFilter, setClientFilter] = useQueryState('client')
  const [priorityFilter, setPriorityFilter] = useQueryState('priority')
  const [query, setQuery] = useQueryState('q', '')

  const [density, setDensity] = useState<'compact' | 'comfortable'>('comfortable')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [drawerRow, setDrawerRow] = useState<TaskRow | undefined>()
  const [summaryOpen, setSummaryOpen] = useState(false)

  const rows = useMemo(
    () => buildTaskRows(tasks, projects, clients, machineTypes, blocks),
    [tasks, projects, clients, machineTypes, blocks],
  )

  const scoped = rows.filter((r) => {
    if (projectFilter !== 'all' && r.project?.id !== projectFilter) return false
    if (machineTypeFilter !== 'all' && r.machineType?.id !== machineTypeFilter) return false
    if (clientFilter !== 'all' && r.client?.id !== clientFilter) return false
    if (priorityFilter !== 'all' && r.task.priority !== priorityFilter) return false
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      const haystack = `${r.task.name} ${r.task.id} ${r.task.operationType} ${r.machineCode ?? ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const activeTab = TABS.find((t) => t.key === tab) ?? TABS[0]
  const filtered = scoped.filter((r) => activeTab.match(r.task.status))
  const financials = useMemo(() => sumFinancials(filtered), [filtered])

  const activeFilterCount = [projectFilter, machineTypeFilter, clientFilter, priorityFilter].filter(
    (f) => f !== 'all',
  ).length
  const hasFilters = activeFilterCount > 0 || query.trim() !== ''

  const clearFilters = () => {
    setProjectFilter('all')
    setMachineTypeFilter('all')
    setClientFilter('all')
    setPriorityFilter('all')
    setQuery('')
  }

  const applyStatus = (status: TaskStatus) => {
    const ids = [...selected]
    ids.forEach((id) => updateTaskStatus(id, status))
    setSelected(new Set())
    toast({
      title: `${ids.length} task${ids.length === 1 ? '' : 's'} marked ${taskStatusLabel[status].toLowerCase()}`,
      description: 'The whole bucket was rescheduled from the change.',
      tone: 'success',
    })
  }

  return (
    <Page
      title="Task bucket"
      subtitle="Every task from every project in the single queue the scheduler draws from."
      maxWidth="wide"
      actions={
        <>
          <Button icon={<LayoutList size={14} />} onClick={() => setSummaryOpen(true)}>
            Bucket summary
          </Button>
          <ButtonLink to={routes.timeline()} variant="primary" icon={<CalendarRange size={14} />}>
            Open timeline
          </ButtonLink>
        </>
      }
    >
      <Card padding={false}>
        <Tabs
          items={TABS.map((t) => ({
            key: t.key,
            label: t.label,
            count: scoped.filter((r) => t.match(r.task.status)).length,
          }))}
          active={activeTab.key}
          onChange={setTab}
        />

        <Toolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search tasks, IDs, machines"
          resultLabel={`${filtered.length} of ${rows.length} tasks`}
          onClear={hasFilters ? clearFilters : undefined}
          activeFilterCount={activeFilterCount}
          trailing={
            <SegmentedControl
              size="sm"
              value={density}
              onChange={setDensity}
              segments={[
                { value: 'comfortable' as const, label: <Rows3 size={13} />, ariaLabel: 'Comfortable rows' },
                { value: 'compact' as const, label: <Table2 size={13} />, ariaLabel: 'Compact rows' },
              ]}
            />
          }
        >
          <Select
            value={projectFilter}
            onChange={setProjectFilter}
            className="w-44"
            aria-label="Project"
            options={[{ value: 'all', label: 'All projects' }, ...projects.map((p) => ({ value: p.id, label: p.name }))]}
          />
          <Select
            value={clientFilter}
            onChange={setClientFilter}
            className="w-40"
            aria-label="Client"
            options={[{ value: 'all', label: 'All clients' }, ...clients.map((c) => ({ value: c.id, label: c.name, meta: c.code }))]}
          />
          <Select
            value={machineTypeFilter}
            onChange={setMachineTypeFilter}
            className="w-48"
            aria-label="Machine type"
            options={[
              { value: 'all', label: 'All machine types' },
              ...machineTypes.map((mt) => ({ value: mt.id, label: mt.name, meta: formatCurrency(mt.hourlyRate) })),
            ]}
          />
          <Select
            value={priorityFilter}
            onChange={setPriorityFilter}
            className="w-36"
            aria-label="Priority"
            options={[
              { value: 'all', label: 'All priorities' },
              ...(Object.keys(priorityLabel) as Priority[]).map((k) => ({ value: k, label: priorityLabel[k] })),
            ]}
          />
        </Toolbar>

        <TaskTable
          rows={filtered}
          defaultSort={{ key: 'window', dir: 'asc' }}
          density={density}
          selectedIds={selected}
          onSelectionChange={setSelected}
          onRowClick={setDrawerRow}
          activeId={drawerRow?.task.id}
          columns={[
            'task',
            'project',
            'client',
            'machineType',
            'machine',
            'batch',
            'duration',
            'priority',
            'deadline',
            'window',
            'status',
          ]}
          emptyState={
            <EmptyState
              icon={<Inbox size={20} />}
              title={`No ${activeTab.key === 'all' ? '' : taskStatusLabel[activeTab.key as TaskStatus].toLowerCase()} tasks match`}
              description="Try clearing a filter or switching tabs."
              action={hasFilters ? <Button onClick={clearFilters}>Clear filters</Button> : undefined}
            />
          }
        />

        {filtered.length > 0 && (
          <CardFooter>
            <Text variant="bodySm" tone="subtle" numeric>
              {filtered.length} task{filtered.length === 1 ? '' : 's'} · {formatHours(financials.hours)} of machine time
            </Text>
            <Text variant="bodySm" tone="muted" numeric>
              Cost <span className="font-semibold text-fg">{formatCurrency(financials.cost)}</span> · Revenue{' '}
              <span className="font-semibold text-fg">{formatCurrency(financials.revenue)}</span> · Profit{' '}
              <span className="font-semibold text-success-fg">{formatCurrency(financials.profit)}</span>
            </Text>
          </CardFooter>
        )}
      </Card>

      <BulkActionBar count={selected.size} onClear={() => setSelected(new Set())}>
        <BulkAction icon={<CheckCircle2 size={13} />} onClick={() => applyStatus('completed')}>
          Mark completed
        </BulkAction>
        <BulkAction icon={<CalendarRange size={13} />} onClick={() => applyStatus('scheduled')}>
          Re-queue
        </BulkAction>
      </BulkActionBar>

      <TaskDrawer row={drawerRow} open={Boolean(drawerRow)} onClose={() => setDrawerRow(undefined)} />
      <BucketSummaryDrawer open={summaryOpen} onClose={() => setSummaryOpen(false)} rows={scoped} />
    </Page>
  )
}
