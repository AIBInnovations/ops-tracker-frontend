import { useMemo } from 'react'
import { ArrowRight, CalendarRange, ExternalLink, GitBranch } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { DescriptionList } from '@/components/ui/DescriptionList'
import { Drawer, DrawerSection } from '@/components/ui/Drawer'
import { MetricCell, MetricRow } from '@/components/ui/Metric'
import { Meter } from '@/components/ui/Progress'
import { Select } from '@/components/ui/Select'
import { Text } from '@/components/ui/Text'
import { useToast } from '@/components/ui/Toast'
import { ClientLink, MachineLink, MachineTypeLink, ProjectLink, TaskLink } from '@/components/links/EntityLinks'
import { formatCurrency, formatDate, formatDateTime, formatHours, formatPercent } from '@/lib/format'
import { priorityLabel, priorityTone, taskStatusLabel, taskStatusTone } from '@/lib/tone'
import { getSubtasks, getTaskDependents, type TaskRow } from '@/lib/selectors'
import { routes } from '@/lib/routes'
import { useAppStore } from '@/store/useAppStore'
import { SCHEDULE_ORIGIN } from '@/engine'
import type { TaskStatus } from '@/types/entities'

interface TaskDrawerProps {
  row?: TaskRow
  open: boolean
  onClose: () => void
}

/**
 * Detail surface for a single task. Opening it never costs the operator their
 * place in the bucket or the timeline, which is the whole point of putting
 * task detail in a drawer rather than on its own route.
 */
export function TaskDrawer({ row, open, onClose }: TaskDrawerProps) {
  const tasks = useAppStore((s) => s.tasks)
  const updateTaskStatus = useAppStore((s) => s.updateTaskStatus)
  const { toast } = useToast()

  const dependencies = useMemo(
    () => (row ? row.task.dependsOn.map((id) => tasks.find((t) => t.id === id)).filter(Boolean) : []),
    [row, tasks],
  )
  const dependents = useMemo(() => (row ? getTaskDependents(tasks, row.task.id) : []), [row, tasks])
  const subtasks = useMemo(() => (row ? getSubtasks(tasks, row.task.id) : []), [row, tasks])

  if (!row) return null

  const { task, block, project, client, machineType } = row
  const elapsedPct =
    block && row.isCurrent
      ? Math.min(
          100,
          Math.max(0, ((SCHEDULE_ORIGIN.getTime() - new Date(block.startAt).getTime()) / 3_600_000 / block.durationHrs) * 100),
        )
      : 0

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="md"
      title={task.name}
      subtitle={`${task.id.toUpperCase()} · ${task.operationType}`}
      titleAccessory={
        <Badge tone={taskStatusTone[task.status]} dot pulse={task.status === 'in_progress'}>
          {taskStatusLabel[task.status]}
        </Badge>
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <ButtonLink to={routes.task(task.id)} variant="primary" iconAfter={<ExternalLink size={13} />}>
            Open full record
          </ButtonLink>
        </>
      }
    >
      <DrawerSection title="Status">
        <div className="flex items-center gap-2">
          <Select
            value={task.status}
            className="w-44"
            aria-label="Task status"
            options={(Object.keys(taskStatusLabel) as TaskStatus[]).map((key) => ({
              value: key,
              label: taskStatusLabel[key],
            }))}
            onChange={(next) => {
              updateTaskStatus(task.id, next as TaskStatus)
              toast({
                title: `${task.name} marked ${taskStatusLabel[next as TaskStatus].toLowerCase()}`,
                description: 'The bucket was rescheduled — downstream dates may have moved.',
                tone: 'success',
              })
            }}
          />
          <Badge tone={priorityTone[task.priority]}>{priorityLabel[task.priority]} priority</Badge>
        </div>
        {row.isCurrent && block && (
          <div className="mt-3">
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
      </DrawerSection>

      <DrawerSection title="Work order">
        <DescriptionList
          layout="rows"
          items={[
            { label: 'Project', value: project ? <ProjectLink id={project.id} /> : '—' },
            { label: 'Client', value: client ? <ClientLink id={client.id} /> : '—' },
            { label: 'Required machine type', value: machineType ? <MachineTypeLink id={machineType.id} /> : '—' },
            {
              label: 'Assigned unit',
              value: block ? <MachineLink id={block.machineId} /> : <Text tone="faint">Not assigned</Text>,
            },
            { label: 'Deadline', value: <span className="tabular-nums">{formatDate(task.deadline)}</span> },
          ]}
        />
        {task.description && (
          <Text variant="bodySm" tone="muted" className="mt-3 block border-t border-line-subtle pt-3">
            {task.description}
          </Text>
        )}
      </DrawerSection>

      <DrawerSection title="Lot and duration">
        <div className="rounded-lg bg-surface-sunken px-3 py-2.5">
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
        <MetricRow className="mt-3 grid-cols-3">
          <MetricCell label="Run cost" value={formatCurrency(block?.cost ?? 0)} />
          <MetricCell label="Revenue" value={formatCurrency(block?.revenue ?? 0)} />
          <MetricCell
            label="Profit"
            value={formatCurrency(block?.profit ?? 0)}
            tone={(block?.profit ?? 0) >= 0 ? 'success' : 'danger'}
          />
        </MetricRow>
      </DrawerSection>

      <DrawerSection
        title="Schedule"
        action={
          block && (
            <ButtonLink
              to={routes.timeline({ focus: task.id, machineType: machineType?.id })}
              size="xs"
              variant="ghost"
              icon={<CalendarRange size={12} />}
            >
              Timeline
            </ButtonLink>
          )
        }
      >
        {block ? (
          <DescriptionList
            layout="rows"
            items={[
              { label: 'Starts', value: <span className="font-medium tabular-nums">{formatDateTime(block.startAt)}</span> },
              { label: 'Finishes', value: <span className="font-medium tabular-nums">{formatDateTime(block.endAt)}</span> },
              { label: 'Duration', value: <span className="tabular-nums">{formatHours(block.durationHrs)}</span> },
            ]}
          />
        ) : (
          <Text variant="bodySm" tone="subtle">
            Not scheduled — resolve upstream dependencies first.
          </Text>
        )}
      </DrawerSection>

      {(dependencies.length > 0 || dependents.length > 0 || subtasks.length > 0) && (
        <DrawerSection title="Dependencies">
          <div className="flex flex-col gap-3">
            {dependencies.length > 0 && (
              <RelationList
                caption="Must finish first"
                icon={<GitBranch size={12} />}
                items={dependencies.map((d) => ({ id: d!.id, status: d!.status }))}
              />
            )}
            {dependents.length > 0 && (
              <RelationList
                caption="Waiting on this task"
                icon={<ArrowRight size={12} />}
                items={dependents.map((d) => ({ id: d.id, status: d.status }))}
              />
            )}
            {subtasks.length > 0 && (
              <RelationList
                caption="Subtasks"
                icon={<GitBranch size={12} />}
                items={subtasks.map((d) => ({ id: d.id, status: d.status }))}
              />
            )}
          </div>
        </DrawerSection>
      )}

      <DrawerSection>
        <Text variant="bodySm" tone="faint">
          Changing this task&rsquo;s status re-runs the scheduler across the whole bucket, so downstream dates and
          machine assignments update everywhere.
        </Text>
      </DrawerSection>
    </Drawer>
  )
}

function RelationList({
  caption,
  icon,
  items,
}: {
  caption: string
  icon: React.ReactNode
  items: { id: string; status: TaskStatus }[]
}) {
  return (
    <div>
      <Text variant="bodySm" tone="subtle" className="mb-1.5 block">
        {caption}
      </Text>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-md bg-surface-sunken px-2.5 py-1.5"
          >
            <span className="flex min-w-0 items-center gap-1.5 text-fg-faint">
              {icon}
              <TaskLink id={item.id} />
            </span>
            <Badge tone={taskStatusTone[item.status]}>{taskStatusLabel[item.status]}</Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
