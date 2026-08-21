import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ListChecks, Plus } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Banner } from '@/components/ui/Banner'
import { Meter } from '@/components/ui/Progress'
import { StatGroup, revenueSplit } from '@/components/ui/StatGroup'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { EmptyState } from '@/components/ui/EmptyState'
import { TaskTable } from '@/components/tasks/TaskTable'
import { TaskDrawer } from '@/components/tasks/TaskDrawer'
import { AlertRow } from '@/components/alerts/AlertRow'
import { ClientLink } from '@/components/links/EntityLinks'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { useAppStore } from '@/store/useAppStore'
import {
  buildOrderFulfillment,
  buildTaskRows,
  computeProjectProgress,
  sortWithSubtasksNested,
  sumFinancials,
  type TaskRow,
} from '@/lib/selectors'
import { formatCurrency, formatDate, formatHours, formatPercent } from '@/lib/format'
import { priorityLabel, priorityTone, projectStatusLabel, projectStatusTone } from '@/lib/tone'
import { routes } from '@/lib/routes'

export function ProjectDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { projects, clients, tasks, machineTypes, blocks, alerts } = useAppStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerRow, setDrawerRow] = useState<TaskRow | undefined>()

  const project = projects.find((p) => p.id === id)

  const projectTasks = useMemo(() => sortWithSubtasksNested(tasks.filter((t) => t.projectId === id)), [tasks, id])
  const rows = useMemo(
    () => buildTaskRows(projectTasks, projects, clients, machineTypes, blocks),
    [projectTasks, projects, clients, machineTypes, blocks],
  )
  const financials = useMemo(() => sumFinancials(rows), [rows])
  const fulfillment = useMemo(() => {
    const all = buildTaskRows(tasks, projects, clients, machineTypes, blocks)
    return buildOrderFulfillment(projects, clients, all).find((f) => f.project.id === id)
  }, [tasks, projects, clients, machineTypes, blocks, id])

  const projectAlerts = alerts.filter((a) => a.projectId === id)

  if (!project) {
    return (
      <Page title="Project not found">
        <Card>
          <EmptyState
            title="This project no longer exists"
            action={<ButtonLink to={routes.projects()}>Back to projects</ButtonLink>}
          />
        </Card>
      </Page>
    )
  }

  const taskMix = {
    completed: projectTasks.filter((t) => t.status === 'completed').length,
    inProgress: projectTasks.filter((t) => t.status === 'in_progress').length,
    scheduled: projectTasks.filter((t) => t.status === 'scheduled').length,
    blocked: projectTasks.filter((t) => t.status === 'blocked').length,
    overdue: projectTasks.filter((t) => t.status === 'overdue').length,
  }

  const progress = computeProjectProgress(tasks, project.id)
  const completedCount = projectTasks.filter((t) => t.status === 'completed').length

  return (
    <Page
      title={project.name}
      subtitle={project.type === 'client' ? 'Client order' : 'In-house research and development'}
      titleAccessory={
        <>
          <Badge tone={projectStatusTone[project.status]} dot pulse={project.status === 'in_progress'}>
            {projectStatusLabel[project.status]}
          </Badge>
          <Badge tone={priorityTone[project.priority]}>{priorityLabel[project.priority]} priority</Badge>
          <Badge variant="outline" className="font-mono">
            {project.id.toUpperCase()}
          </Badge>
        </>
      }
      maxWidth="wide"
      actions={
        <>
          <ButtonLink to={routes.tasks({ project: project.id })} icon={<ListChecks size={14} />}>
            View in bucket
          </ButtonLink>
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
            Add task
          </Button>
        </>
      }
    >
      {fulfillment?.overdue && (
        <Banner tone="danger" title="Projected to finish after the deadline">
          <Text variant="bodyMd" tone="muted">
            Expected completion{' '}
            {fulfillment.expectedCompletion && formatDate(fulfillment.expectedCompletion.toISOString())} against a{' '}
            {formatDate(project.deadline)} deadline. Re-prioritise upstream tasks or free machine capacity.
          </Text>
        </Banner>
      )}

      <Card>
        <DescriptionList
          columns={6}
          items={[
            { label: 'Client', value: <ClientLink id={project.clientId} className="font-medium" /> },
            {
              label: 'Type',
              value: <Badge variant="outline">{project.type === 'client' ? 'Client' : 'In-house'}</Badge>,
            },
            { label: 'Start date', value: <span className="tabular-nums">{formatDate(project.startDate)}</span> },
            {
              label: 'Deadline',
              value: <span className="font-medium tabular-nums">{formatDate(project.deadline)}</span>,
            },
            {
              label: 'Expected completion',
              value: fulfillment?.expectedCompletion ? (
                <span className={`tabular-nums ${fulfillment.overdue ? 'font-medium text-danger-fg' : ''}`}>
                  {formatDate(fulfillment.expectedCompletion.toISOString())}
                </span>
              ) : (
                '—'
              ),
            },
            {
              label: `Progress · ${completedCount}/${projectTasks.length}`,
              value: <Meter value={progress} tone={progress === 100 ? 'success' : 'accent'} showValue />,
            },
          ]}
        />
      </Card>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatGroup
          label="Operations"
          total={projectTasks.length}
          totalUnit={projectTasks.length === 1 ? 'task' : 'tasks'}
          flag={
            taskMix.blocked > 0 ? (
              <Badge tone="warning" dot>
                {taskMix.blocked} blocked
              </Badge>
            ) : undefined
          }
          segments={[
            { label: 'Completed', value: taskMix.completed, tone: 'success' },
            { label: 'In progress', value: taskMix.inProgress, tone: 'accent' },
            { label: 'Scheduled', value: taskMix.scheduled, tone: 'info' },
            { label: 'Blocked', value: taskMix.blocked, tone: 'neutral' },
            { label: 'Overdue', value: taskMix.overdue, tone: 'danger' },
          ]}
          footnote={`${formatHours(financials.hours)} of machine time across every operation.`}
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
          footnote={
            fulfillment?.expectedCompletion
              ? `Books out on ${formatDate(fulfillment.expectedCompletion.toISOString())}.`
              : undefined
          }
        />
      </div>

      {projectAlerts.length > 0 && (
        <Card padding={false}>
          <CardHeader inset divider title="Exceptions on this project" subtitle={`${projectAlerts.length} open`} />
          <div>
            {projectAlerts.map((a) => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </div>
        </Card>
      )}

      <Card padding={false}>
        <CardHeader
          inset
          divider
          title="Tasks and subtasks"
          subtitle={`${projectTasks.length} operations feeding the global bucket`}
          action={
            <Button size="sm" icon={<Plus size={13} />} onClick={() => setModalOpen(true)}>
              Add task
            </Button>
          }
        />
        <TaskTable
          rows={rows}
          onRowClick={setDrawerRow}
          activeId={drawerRow?.task.id}
          columns={[
            'task',
            'machineType',
            'machine',
            'batch',
            'duration',
            'priority',
            'deadline',
            'window',
            'cost',
            'status',
          ]}
          emptyState={
            <EmptyState
              icon={<ListChecks size={20} />}
              title="No tasks yet"
              description="Add the first operation to schedule this project."
              action={
                <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
                  Add task
                </Button>
              }
            />
          }
        />
      </Card>

      <TaskFormModal open={modalOpen} onClose={() => setModalOpen(false)} projectId={project.id} />
      <TaskDrawer row={drawerRow} open={Boolean(drawerRow)} onClose={() => setDrawerRow(undefined)} />
    </Page>
  )
}
