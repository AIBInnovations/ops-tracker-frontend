import { useMemo, useState } from 'react'
import { Package, Plus } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card, CardFooter } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { Meter } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { AppLink } from '@/components/ui/Link'
import { Avatar } from '@/components/ui/Avatar'
import { ProjectFormModal } from '@/components/projects/ProjectFormModal'
import { useAppStore } from '@/store/useAppStore'
import {
  buildOrderFulfillment,
  buildTaskRows,
  computeProjectProgress,
  sumFinancials,
  type ProjectFulfillmentRow,
} from '@/lib/selectors'
import { formatCurrency, formatDate } from '@/lib/format'
import { priorityLabel, priorityTone, projectStatusLabel, projectStatusTone } from '@/lib/tone'
import { useQueryState } from '@/lib/useQueryState'
import { routes } from '@/lib/routes'
import type { ProjectStatus } from '@/types/entities'

interface ProjectRow extends ProjectFulfillmentRow {
  progress: number
  revenue: number
  profit: number
  openTasks: number
  totalTasks: number
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'client', label: 'Client work' },
  { key: 'inhouse', label: 'In-house' },
  { key: 'at_risk', label: 'At risk' },
]

export function ProjectsPage() {
  const { projects, clients, tasks, machineTypes, blocks } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [tab, setTab] = useQueryState('tab')
  const [statusFilter, setStatusFilter] = useQueryState('status')
  const [clientFilter, setClientFilter] = useQueryState('client')
  const [query, setQuery] = useQueryState('q', '')

  const taskRows = useMemo(
    () => buildTaskRows(tasks, projects, clients, machineTypes, blocks),
    [tasks, projects, clients, machineTypes, blocks],
  )

  const rows: ProjectRow[] = useMemo(() => {
    const fulfillment = buildOrderFulfillment(projects, clients, taskRows)
    return fulfillment.map((f) => {
      const projectTaskRows = taskRows.filter((r) => r.project?.id === f.project.id)
      const financials = sumFinancials(projectTaskRows)
      return {
        ...f,
        progress: computeProjectProgress(tasks, f.project.id),
        revenue: financials.revenue,
        profit: financials.profit,
        openTasks: projectTaskRows.filter((r) => r.task.status !== 'completed').length,
        totalTasks: projectTaskRows.length,
      }
    })
  }, [projects, clients, taskRows, tasks])

  const scoped = rows.filter((r) => {
    if (statusFilter !== 'all' && r.project.status !== statusFilter) return false
    if (clientFilter !== 'all' && r.project.clientId !== clientFilter) return false
    if (query.trim() && !r.project.name.toLowerCase().includes(query.trim().toLowerCase())) return false
    return true
  })

  const matchTab = (r: ProjectRow, key: string) => {
    if (key === 'client') return r.project.type === 'client'
    if (key === 'inhouse') return r.project.type === 'inhouse'
    if (key === 'at_risk') return r.overdue || r.atRisk
    return true
  }

  const filtered = scoped.filter((r) => matchTab(r, tab))
  const activeFilterCount = [statusFilter, clientFilter].filter((f) => f !== 'all').length
  const hasFilters = activeFilterCount > 0 || query.trim() !== ''

  const totals = filtered.reduce(
    (acc, r) => ({ revenue: acc.revenue + r.revenue, profit: acc.profit + r.profit }),
    { revenue: 0, profit: 0 },
  )

  const columns: Column<ProjectRow>[] = [
    {
      key: 'project',
      header: 'Project',
      sticky: true,
      width: '280px',
      sortValue: (r) => r.project.name,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.project.name} size="sm" square />
          <div className="min-w-0">
            <AppLink to={routes.project(r.project.id)} tone="subtle" className="truncate font-medium">
              {r.project.name}
            </AppLink>
            <Text variant="bodySm" tone="faint" className="block">
              <span className="font-mono">{r.project.id.toUpperCase()}</span> · {r.openTasks} of {r.totalTasks} open
            </Text>
          </div>
        </div>
      ),
    },
    {
      key: 'client',
      header: 'Client',
      sortValue: (r) => r.client?.name ?? '',
      render: (r) => (r.client ? <AppLink to={routes.client(r.client.id)} tone="subtle">{r.client.name}</AppLink> : '—'),
    },
    {
      key: 'type',
      header: 'Type',
      hideBelow: 'lg',
      sortValue: (r) => r.project.type,
      render: (r) => (
        <Badge variant="outline">{r.project.type === 'client' ? 'Client' : 'In-house'}</Badge>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      hideBelow: 'lg',
      sortValue: (r) => r.project.priority,
      render: (r) => <Badge tone={priorityTone[r.project.priority]}>{priorityLabel[r.project.priority]}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (r) => r.project.status,
      render: (r) => (
        <Badge tone={projectStatusTone[r.project.status]} dot pulse={r.project.status === 'in_progress'}>
          {projectStatusLabel[r.project.status]}
        </Badge>
      ),
    },
    {
      key: 'progress',
      header: 'Progress',
      width: '150px',
      sortValue: (r) => r.progress,
      render: (r) => <Meter value={r.progress} tone={r.progress === 100 ? 'success' : 'accent'} showValue />,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'end',
      hideBelow: 'xl',
      sortValue: (r) => r.revenue,
      render: (r) => <span className="tabular-nums">{formatCurrency(r.revenue)}</span>,
    },
    {
      key: 'deadline',
      header: 'Deadline',
      sortValue: (r) => r.project.deadline,
      render: (r) => <span className="tabular-nums">{formatDate(r.project.deadline)}</span>,
    },
    {
      key: 'fulfillment',
      header: 'Fulfillment',
      sortValue: (r) => (r.overdue ? 0 : r.atRisk ? 1 : 2),
      render: (r) =>
        r.overdue ? (
          <Badge tone="danger" dot>
            Past deadline
          </Badge>
        ) : r.atRisk ? (
          <Badge tone="warning" dot>
            Tight
          </Badge>
        ) : (
          <Badge tone="success" dot>
            On schedule
          </Badge>
        ),
    },
  ]

  return (
    <Page
      title="Projects"
      subtitle="Client and in-house work, broken into the tasks that feed the bucket."
      maxWidth="wide"
      actions={
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
          Add project
        </Button>
      }
    >
      <Card padding={false}>
        <Tabs
          items={TABS.map((t) => ({ ...t, count: scoped.filter((r) => matchTab(r, t.key)).length }))}
          active={tab}
          onChange={setTab}
        />
        <Toolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search projects"
          resultLabel={`${filtered.length} of ${rows.length} projects`}
          activeFilterCount={activeFilterCount}
          onClear={
            hasFilters
              ? () => {
                  setStatusFilter('all')
                  setClientFilter('all')
                  setQuery('')
                }
              : undefined
          }
        >
          <Select
            value={clientFilter}
            onChange={setClientFilter}
            className="w-44"
            aria-label="Client"
            options={[{ value: 'all', label: 'All clients' }, ...clients.map((c) => ({ value: c.id, label: c.name, meta: c.code }))]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-40"
            aria-label="Status"
            options={[
              { value: 'all', label: 'All statuses' },
              ...(Object.keys(projectStatusLabel) as ProjectStatus[]).map((k) => ({
                value: k,
                label: projectStatusLabel[k],
              })),
            ]}
          />
        </Toolbar>
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.project.id}
          rowHref={(r) => routes.project(r.project.id)}
          defaultSort={{ key: 'deadline', dir: 'asc' }}
          emptyState={
            <EmptyState
              icon={<Package size={20} />}
              title="No projects match"
              description="Adjust the filters, or add a project to start planning work."
              action={
                <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
                  Add project
                </Button>
              }
            />
          }
        />
        {filtered.length > 0 && (
          <CardFooter>
            <Text variant="bodySm" tone="subtle" numeric>
              {filtered.length} project{filtered.length === 1 ? '' : 's'} in view
            </Text>
            <Text variant="bodySm" tone="muted" numeric>
              Revenue <span className="font-semibold text-fg">{formatCurrency(totals.revenue)}</span> · Profit{' '}
              <span className="font-semibold text-success-fg">{formatCurrency(totals.profit)}</span>
            </Text>
          </CardFooter>
        )}
      </Card>
      <ProjectFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Page>
  )
}
