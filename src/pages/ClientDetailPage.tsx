import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowRight, ListChecks, Package } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'
import { ButtonLink } from '@/components/ui/Button'
import { Banner } from '@/components/ui/Banner'
import { StatGroup, revenueSplit } from '@/components/ui/StatGroup'
import { Meter } from '@/components/ui/Progress'
import { EmptyState } from '@/components/ui/EmptyState'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { AppLink } from '@/components/ui/Link'
import { TaskTable } from '@/components/tasks/TaskTable'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { useAppStore } from '@/store/useAppStore'
import {
  buildOrderFulfillment,
  buildTaskRows,
  computeProjectProgress,
  sumFinancials,
  type ProjectFulfillmentRow,
  type TaskRow,
} from '@/lib/selectors'
import { formatCurrency, formatDate, formatHours, formatPercent } from '@/lib/format'
import { priorityLabel, priorityTone, projectStatusLabel, projectStatusTone } from '@/lib/tone'
import { routes } from '@/lib/routes'

export function ClientDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { clients, projects, tasks, machineTypes, blocks } = useAppStore()
  const [drawerRow, setDrawerRow] = useState<TaskRow | undefined>()

  const client = clients.find((c) => c.id === id)

  const taskRows = useMemo(
    () => buildTaskRows(tasks, projects, clients, machineTypes, blocks),
    [tasks, projects, clients, machineTypes, blocks],
  )
  const clientProjects = useMemo(() => projects.filter((p) => p.clientId === id), [projects, id])
  const projectIds = useMemo(() => new Set(clientProjects.map((p) => p.id)), [clientProjects])
  const clientTaskRows = useMemo(
    () => taskRows.filter((r) => r.project && projectIds.has(r.project.id)),
    [taskRows, projectIds],
  )
  const financials = useMemo(() => sumFinancials(clientTaskRows), [clientTaskRows])
  const fulfillment = useMemo(
    () => buildOrderFulfillment(projects, clients, taskRows).filter((f) => projectIds.has(f.project.id)),
    [projects, clients, taskRows, projectIds],
  )

  const projectColumns: Column<ProjectFulfillmentRow>[] = useMemo(
    () => [
      {
        key: 'project',
        header: 'Project',
        sticky: true,
        width: '240px',
        sortValue: (r) => r.project.name,
        render: (r) => (
          <div className="min-w-0">
            <AppLink to={routes.project(r.project.id)} tone="subtle" className="font-medium">
              {r.project.name}
            </AppLink>
            <Text variant="bodySm" tone="faint" className="block font-mono">
              {r.project.id.toUpperCase()}
            </Text>
          </div>
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
          <Badge tone={projectStatusTone[r.project.status]} dot>
            {projectStatusLabel[r.project.status]}
          </Badge>
        ),
      },
      {
        key: 'progress',
        header: 'Progress',
        width: '150px',
        sortValue: (r) => computeProjectProgress(tasks, r.project.id),
        render: (r) => {
          const p = computeProjectProgress(tasks, r.project.id)
          return <Meter value={p} tone={p === 100 ? 'success' : 'accent'} showValue />
        },
      },
      {
        key: 'revenue',
        header: 'Revenue',
        align: 'end',
        hideBelow: 'lg',
        sortValue: (r) => sumFinancials(taskRows.filter((t) => t.project?.id === r.project.id)).revenue,
        render: (r) => (
          <span className="tabular-nums">
            {formatCurrency(sumFinancials(taskRows.filter((t) => t.project?.id === r.project.id)).revenue)}
          </span>
        ),
      },
      {
        key: 'expected',
        header: 'Expected',
        sortValue: (r) => r.expectedCompletion?.getTime() ?? 0,
        render: (r) => (
          <span className="tabular-nums">
            {r.expectedCompletion ? formatDate(r.expectedCompletion.toISOString()) : '—'}
          </span>
        ),
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
    ],
    [tasks, taskRows],
  )

  if (!client) {
    return (
      <Page title="Client not found">
        <Card>
          <EmptyState
            title="This client no longer exists"
            action={<ButtonLink to={routes.clients()}>Back to clients</ButtonLink>}
          />
        </Card>
      </Page>
    )
  }

  const atRisk = fulfillment.filter((f) => f.overdue || f.atRisk)
  const ends = clientTaskRows.filter((r) => r.block).map((r) => new Date(r.block!.endAt).getTime())
  const allDoneBy = ends.length ? new Date(Math.max(...ends)) : undefined
  const doneCount = clientTaskRows.filter((r) => r.task.status === 'completed').length

  return (
    <Page
      title={client.name}
      subtitle={client.id === 'c0' ? 'Internal research and development' : `Client code ${client.code}`}
      titleAccessory={
        <Badge variant="outline" className="font-mono">
          {client.code}
        </Badge>
      }
      maxWidth="wide"
      actions={
        <>
          <ButtonLink to={routes.tasks({ client: client.id })} icon={<ListChecks size={14} />}>
            View tasks
          </ButtonLink>
          <ButtonLink to={routes.projects({ client: client.id })} variant="primary" icon={<Package size={14} />}>
            View projects
          </ButtonLink>
        </>
      }
    >
      {atRisk.length > 0 && (
        <Banner
          tone="danger"
          title={`${atRisk.length} project${atRisk.length === 1 ? '' : 's'} at risk for this client`}
        >
          <Text variant="bodyMd" tone="muted">
            {atRisk.map((f) => f.project.name).join(', ')} — expected to finish at or past the committed deadline.
          </Text>
        </Banner>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatGroup
          label="Work booked"
          total={clientTaskRows.length}
          totalUnit={clientTaskRows.length === 1 ? 'task' : 'tasks'}
          flag={
            <Badge tone="neutral">
              {clientProjects.length} project{clientProjects.length === 1 ? '' : 's'}
            </Badge>
          }
          segments={[
            { label: 'Completed', value: doneCount, tone: 'success' },
            {
              label: 'Open',
              value: clientTaskRows.length - doneCount,
              tone: 'accent',
              to: routes.tasks({ client: client.id }),
            },
          ]}
          footnote={`${formatHours(financials.hours)} of machine time${
            allDoneBy ? `, all of it done by ${formatDate(allDoneBy.toISOString())}` : ''
          }.`}
        />
        <StatGroup
          label="Revenue"
          total={formatCurrency(financials.revenue)}
          flag={
            <Badge tone={financials.profit >= 0 ? 'success' : 'danger'}>
              {formatPercent(financials.marginPct)} margin
            </Badge>
          }
          {...revenueSplit({ revenue: financials.revenue, cost: financials.cost, profit: financials.profit }, formatCurrency)}
        />
      </div>

      <Card padding={false}>
        <CardHeader
          inset
          divider
          title="Projects"
          subtitle={allDoneBy ? `All committed work completes by ${formatDate(allDoneBy.toISOString())}` : undefined}
        />
        <DataTable
          columns={projectColumns}
          rows={fulfillment}
          rowKey={(r) => r.project.id}
          rowHref={(r) => routes.project(r.project.id)}
          defaultSort={{ key: 'deadline', dir: 'asc' }}
          emptyState={<EmptyState title="No projects for this client yet" size="sm" />}
        />
      </Card>

      <Card padding={false}>
        <CardHeader
          inset
          divider
          title="All tasks"
          subtitle={`${clientTaskRows.length} operations across every project`}
          action={
            <ButtonLink
              to={routes.tasks({ client: client.id })}
              size="sm"
              variant="ghost"
              iconAfter={<ArrowRight size={13} />}
            >
              Open in bucket
            </ButtonLink>
          }
        />
        <TaskTable
          rows={clientTaskRows}
          columns={['task', 'project', 'machine', 'duration', 'deadline', 'window', 'status']}
          defaultSort={{ key: 'window', dir: 'asc' }}
          maxHeight="520px"
          density="compact"
          onRowClick={setDrawerRow}
          activeId={drawerRow?.task.id}
          emptyState={<EmptyState title="No tasks scheduled for this client" size="sm" />}
        />
      </Card>

      <TaskDrawer row={drawerRow} open={Boolean(drawerRow)} onClose={() => setDrawerRow(undefined)} />
    </Page>
  )
}
