import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ArrowRight, Calculator, CalendarRange, GitBranch } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card, CardHeader, CardSection } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'
import { ButtonLink } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { EmptyState } from '@/components/ui/EmptyState'
import { BlockStack, InlineStack } from '@/components/ui/Stack'
import { Metric } from '@/components/ui/Metric'
import { Meter } from '@/components/ui/Progress'
import { useToast } from '@/components/ui/Toast'
import { TaskTable } from '@/components/tasks/TaskTable'
import { ClientLink, MachineLink, MachineTypeLink, ProjectLink, TaskLink } from '@/components/links/EntityLinks'
import { useAppStore } from '@/store/useAppStore'
import { buildTaskRows, getSubtasks, getTaskDependents } from '@/lib/selectors'
import { formatCurrency, formatDate, formatDateTime, formatHours, formatPercent } from '@/lib/format'
import { priorityLabel, priorityTone, taskStatusLabel, taskStatusTone } from '@/lib/tone'
import { routes } from '@/lib/routes'
import { SCHEDULE_ORIGIN } from '@/engine'
import type { Task, TaskStatus } from '@/types/entities'

export function TaskDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { tasks, projects, clients, machineTypes, blocks, updateTaskStatus } = useAppStore()
  const { toast } = useToast()

  const allRows = useMemo(
    () => buildTaskRows(tasks, projects, clients, machineTypes, blocks),
    [tasks, projects, clients, machineTypes, blocks],
  )
  const row = allRows.find((r) => r.task.id === id)

  const dependencies = useMemo(
    () => (row ? row.task.dependsOn.map((depId) => tasks.find((t) => t.id === depId)).filter(Boolean) : []),
    [row, tasks],
  )
  const dependents = useMemo(() => (row ? getTaskDependents(tasks, row.task.id) : []), [row, tasks])
  const subtaskRows = useMemo(() => {
    if (!row) return []
    const ids = new Set(getSubtasks(tasks, row.task.id).map((t) => t.id))
    return allRows.filter((r) => ids.has(r.task.id))
  }, [row, tasks, allRows])

  if (!row) {
    return (
      <Page title="Task not found">
        <Card>
          <EmptyState
            title="This task no longer exists"
            description="It may have been removed from the bucket."
            action={<ButtonLink to={routes.tasks()}>Back to task bucket</ButtonLink>}
          />
        </Card>
      </Page>
    )
  }

  const { task, block, project, client, machineType } = row
  const elapsedPct =
    block && row.isCurrent
      ? Math.min(
          100,
          Math.max(
            0,
            ((SCHEDULE_ORIGIN.getTime() - new Date(block.startAt).getTime()) / 3_600_000 / block.durationHrs) * 100,
          ),
        )
      : 0

  return (
    <Page
      title={task.name}
      subtitle={task.description || `${task.operationType} operation`}
      titleAccessory={
        <>
          <Badge tone={taskStatusTone[task.status]} dot pulse={task.status === 'in_progress'}>
            {taskStatusLabel[task.status]}
          </Badge>
          <Badge tone={priorityTone[task.priority]}>{priorityLabel[task.priority]} priority</Badge>
          <Badge variant="outline" className="font-mono">
            {task.id.toUpperCase()}
          </Badge>
        </>
      }
      maxWidth="wide"
      actions={
        <>
          <Select
            value={task.status}
            className="w-44"
            aria-label="Task status"
            options={(Object.keys(taskStatusLabel) as TaskStatus[]).map((k) => ({ value: k, label: taskStatusLabel[k] }))}
            onChange={(next) => {
              updateTaskStatus(task.id, next as TaskStatus)
              toast({
                title: `Marked ${taskStatusLabel[next as TaskStatus].toLowerCase()}`,
                description: 'The bucket was rescheduled from this change.',
                tone: 'success',
              })
            }}
          />
          {project && (
            <ButtonLink to={routes.project(project.id)} variant="primary">
              Open project
            </ButtonLink>
          )}
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.6fr_1fr]">
        <BlockStack gap={4}>
          <Card>
            <CardHeader title="Work order" />
            <DescriptionList
              columns={3}
              items={[
                { label: 'Project', value: project ? <ProjectLink id={project.id} /> : '—' },
                { label: 'Client', value: client ? <ClientLink id={client.id} /> : '—' },
                { label: 'Operation', value: task.operationType },
                {
                  label: 'Required machine type',
                  value: machineType ? <MachineTypeLink id={machineType.id} /> : '—',
                },
                {
                  label: 'Assigned unit',
                  value: block ? <MachineLink id={block.machineId} /> : <Text tone="faint">Not assigned</Text>,
                },
                { label: 'Deadline', value: <span className="tabular-nums">{formatDate(task.deadline)}</span> },
              ]}
            />
          </Card>

          <Card>
            <CardHeader
              title="Lot and duration"
              icon={<Calculator size={13} />}
              subtitle="Duration is derived from batch size and cycle time, never entered by hand"
            />
            <DescriptionList
              columns={4}
              items={[
                { label: 'Batch size', value: `${task.batchSize.toLocaleString('en-IN')} pcs` },
                { label: 'Time per piece', value: `${task.timePerPieceMin} min` },
                {
                  label: 'Calculated duration',
                  value: <span className="font-semibold">{formatHours(block?.durationHrs ?? 0)}</span>,
                },
                { label: 'Price per piece', value: formatCurrency(task.pricePerPiece) },
              ]}
            />
            <div className="mt-4 rounded-lg bg-surface-sunken px-3 py-2.5">
              <Text variant="bodyMd" tone="muted">
                {task.batchSize.toLocaleString('en-IN')} pcs × {task.timePerPieceMin} min ={' '}
                <span className="font-semibold text-fg">{formatHours(block?.durationHrs ?? 0)}</span>
                {machineType && (
                  <>
                    {' '}
                    on {machineType.name} at{' '}
                    <span className="font-semibold text-fg">{formatCurrency(machineType.hourlyRate)}/hr</span>
                  </>
                )}
              </Text>
            </div>
          </Card>

          {subtaskRows.length > 0 && (
            <Card padding={false}>
              <CardHeader inset divider title="Subtasks" subtitle={`${subtaskRows.length} child operations`} />
              <TaskTable
                rows={subtaskRows}
                density="compact"
                columns={['task', 'machine', 'duration', 'window', 'status']}
              />
            </Card>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <RelationCard
              title="Depends on"
              subtitle="Must finish before this task can start"
              icon={<GitBranch size={13} />}
              items={dependencies as Task[]}
              emptyText="No upstream dependencies — this task can start as soon as a machine frees up."
            />
            <RelationCard
              title="Blocks"
              subtitle="Waiting on this task to finish"
              icon={<ArrowRight size={13} />}
              items={dependents}
              emptyText="Nothing downstream is waiting on this task."
            />
          </div>
        </BlockStack>

        <BlockStack gap={4}>
          <Card>
            <CardHeader title="Schedule" subtitle="Assigned by the deterministic scheduler" />
            {block ? (
              <BlockStack gap={3}>
                <DescriptionList
                  layout="rows"
                  items={[
                    { label: 'Starts', value: <span className="font-medium tabular-nums">{formatDateTime(block.startAt)}</span> },
                    { label: 'Finishes', value: <span className="font-medium tabular-nums">{formatDateTime(block.endAt)}</span> },
                    { label: 'Duration', value: <span className="tabular-nums">{formatHours(block.durationHrs)}</span> },
                  ]}
                />
                {row.isCurrent && (
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <Text variant="bodySm" tone="subtle">
                        Run progress
                      </Text>
                      <Text variant="bodySm" tone="muted" numeric>
                        {formatPercent(elapsedPct)} elapsed
                      </Text>
                    </div>
                    <Meter value={elapsedPct} tone="accent" />
                  </div>
                )}
                <ButtonLink
                  to={routes.timeline({ focus: task.id, machineType: machineType?.id })}
                  fullWidth
                  icon={<CalendarRange size={14} />}
                >
                  Show on timeline
                </ButtonLink>
              </BlockStack>
            ) : (
              <Text variant="bodyMd" tone="subtle">
                Not scheduled — resolve upstream dependencies first.
              </Text>
            )}
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Metric size="sm" label="Run cost" value={formatCurrency(block?.cost ?? 0)} />
            <Metric size="sm" label="Revenue" value={formatCurrency(block?.revenue ?? 0)} />
          </div>

          <Card>
            <CardHeader title="Profitability" />
            <BlockStack gap={2}>
              <InlineStack justify="between">
                <Text variant="bodyMd" tone="muted">
                  Profit on this run
                </Text>
                <Text variant="headingMd" tone={(block?.profit ?? 0) >= 0 ? 'success' : 'danger'}>
                  {formatCurrency(block?.profit ?? 0)}
                </Text>
              </InlineStack>
              <InlineStack justify="between">
                <Text variant="bodyMd" tone="muted">
                  Margin rate
                </Text>
                <Text variant="bodyMd" numeric>
                  {formatPercent(block && block.revenue > 0 ? (block.profit / block.revenue) * 100 : 0)}
                </Text>
              </InlineStack>
            </BlockStack>
          </Card>

          <Card padding={false}>
            <CardSection>
              <Text variant="bodySm" tone="subtle">
                Changing this task&rsquo;s status re-runs the scheduler across the whole bucket, so downstream dates and
                machine assignments update everywhere.
              </Text>
            </CardSection>
          </Card>
        </BlockStack>
      </div>
    </Page>
  )
}

function RelationCard({
  title,
  subtitle,
  icon,
  items,
  emptyText,
}: {
  title: string
  subtitle: string
  icon: React.ReactNode
  items: Task[]
  emptyText: string
}) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      {items.length === 0 ? (
        <Text variant="bodyMd" tone="subtle">
          {emptyText}
        </Text>
      ) : (
        <BlockStack gap={2}>
          {items.map((dep) => (
            <InlineStack
              key={dep.id}
              gap={2}
              justify="between"
              className="rounded-md bg-surface-sunken px-3 py-2"
            >
              <InlineStack gap={2} className="min-w-0 text-fg-faint">
                {icon}
                <TaskLink id={dep.id} />
              </InlineStack>
              <Badge tone={taskStatusTone[dep.status]}>{taskStatusLabel[dep.status]}</Badge>
            </InlineStack>
          ))}
        </BlockStack>
      )}
    </Card>
  )
}
