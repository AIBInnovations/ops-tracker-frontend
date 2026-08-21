import type { ReactNode } from 'react'
import { CornerDownRight } from 'lucide-react'
import { DataTable, type Column, type Density, type SortState } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'
import { AppLink } from '@/components/ui/Link'
import { ClientLink, MachineLink, MachineTypeLink, ProjectLink } from '@/components/links/EntityLinks'
import { formatCurrency, formatDate, formatDateTime, formatHours } from '@/lib/format'
import { priorityLabel, priorityTone, profitClass, taskStatusLabel, taskStatusTone } from '@/lib/tone'
import { routes } from '@/lib/routes'
import type { TaskRow } from '@/lib/selectors'

export type TaskColumnKey =
  | 'task'
  | 'project'
  | 'client'
  | 'operation'
  | 'machineType'
  | 'machine'
  | 'batch'
  | 'duration'
  | 'priority'
  | 'deadline'
  | 'window'
  | 'cost'
  | 'profit'
  | 'status'

const DEFAULT_COLUMNS: TaskColumnKey[] = [
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
]

const dash = <span className="text-fg-faint">—</span>

function buildColumn(key: TaskColumnKey): Column<TaskRow> {
  switch (key) {
    case 'task':
      return {
        key,
        header: 'Task',
        sticky: true,
        width: '260px',
        sortValue: (r) => r.task.name,
        render: (r) => (
          <div className={r.task.parentTaskId ? 'pl-4' : ''}>
            <div className="flex items-center gap-1.5">
              {r.task.parentTaskId && <CornerDownRight size={12} className="shrink-0 text-fg-faint" />}
              <AppLink to={routes.task(r.task.id)} tone="subtle" className="truncate font-medium">
                {r.task.name}
              </AppLink>
            </div>
            <Text variant="bodySm" tone="faint" className="mt-0.5 block font-mono">
              {r.task.id.toUpperCase()} · {r.task.operationType}
            </Text>
          </div>
        ),
      }
    case 'project':
      return {
        key,
        header: 'Project',
        sortValue: (r) => r.project?.name ?? '',
        render: (r) => (r.project ? <ProjectLink id={r.project.id} /> : dash),
      }
    case 'client':
      return {
        key,
        header: 'Client',
        hideBelow: 'xl',
        sortValue: (r) => r.client?.name ?? '',
        render: (r) => (r.client ? <ClientLink id={r.client.id} /> : dash),
      }
    case 'operation':
      return { key, header: 'Operation', sortValue: (r) => r.task.operationType, render: (r) => r.task.operationType }
    case 'machineType':
      return {
        key,
        header: 'Machine type',
        hideBelow: 'lg',
        sortValue: (r) => r.machineType?.name ?? '',
        render: (r) => (r.machineType ? <MachineTypeLink id={r.machineType.id} /> : dash),
      }
    case 'machine':
      return {
        key,
        header: 'Assigned',
        sortValue: (r) => r.machineCode ?? '',
        render: (r) => (r.block ? <MachineLink id={r.block.machineId} /> : dash),
      }
    case 'batch':
      return {
        key,
        header: 'Batch',
        align: 'end',
        hideBelow: 'lg',
        sortValue: (r) => r.task.batchSize,
        render: (r) => (
          <span className="tabular-nums">
            {r.task.batchSize.toLocaleString('en-IN')}
            <span className="ml-1 text-fg-faint">pcs</span>
          </span>
        ),
      }
    case 'duration':
      return {
        key,
        header: 'Duration',
        align: 'end',
        sortValue: (r) => r.block?.durationHrs ?? 0,
        render: (r) => <span className="tabular-nums">{formatHours(r.block?.durationHrs ?? 0)}</span>,
      }
    case 'priority':
      return {
        key,
        header: 'Priority',
        sortValue: (r) => r.task.priority,
        render: (r) => <Badge tone={priorityTone[r.task.priority]}>{priorityLabel[r.task.priority]}</Badge>,
      }
    case 'deadline':
      return {
        key,
        header: 'Deadline',
        hideBelow: 'xl',
        sortValue: (r) => r.task.deadline,
        render: (r) => <span className="tabular-nums">{formatDate(r.task.deadline)}</span>,
      }
    case 'window':
      return {
        key,
        header: 'Scheduled',
        sortValue: (r) => (r.block ? new Date(r.block.startAt).getTime() : 0),
        render: (r) =>
          r.block ? (
            <span className="tabular-nums">
              {formatDateTime(r.block.startAt)}
              <span className="mx-1 text-fg-faint">→</span>
              {formatDateTime(r.block.endAt)}
            </span>
          ) : (
            <span className="text-fg-faint">Not scheduled</span>
          ),
      }
    case 'cost':
      return {
        key,
        header: 'Run cost',
        align: 'end',
        sortValue: (r) => r.block?.cost ?? 0,
        render: (r) => <span className="tabular-nums">{formatCurrency(r.block?.cost ?? 0)}</span>,
      }
    case 'profit':
      return {
        key,
        header: 'Profit',
        align: 'end',
        sortValue: (r) => r.block?.profit ?? 0,
        render: (r) => (
          <span className={`font-medium tabular-nums ${profitClass(r.block?.profit ?? 0)}`}>
            {formatCurrency(r.block?.profit ?? 0)}
          </span>
        ),
      }
    case 'status':
      return {
        key,
        header: 'Status',
        sortValue: (r) => r.task.status,
        render: (r) => (
          <Badge tone={taskStatusTone[r.task.status]} dot pulse={r.task.status === 'in_progress'}>
            {taskStatusLabel[r.task.status]}
          </Badge>
        ),
      }
  }
}

interface TaskTableProps {
  rows: TaskRow[]
  columns?: TaskColumnKey[]
  emptyState?: ReactNode
  defaultSort?: SortState
  maxHeight?: string
  density?: Density
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  onRowClick?: (row: TaskRow) => void
  activeId?: string
}

/** Shared by the bucket, project, client, and machine views. */
export function TaskTable({
  rows,
  columns = DEFAULT_COLUMNS,
  emptyState,
  defaultSort,
  maxHeight,
  density,
  selectedIds,
  onSelectionChange,
  onRowClick,
  activeId,
}: TaskTableProps) {
  return (
    <DataTable
      columns={columns.map(buildColumn)}
      rows={rows}
      rowKey={(r) => r.task.id}
      rowHref={(r) => routes.task(r.task.id)}
      onRowClick={onRowClick}
      emptyState={emptyState}
      defaultSort={defaultSort}
      maxHeight={maxHeight}
      density={density}
      selectedIds={selectedIds}
      onSelectionChange={onSelectionChange}
      activeId={activeId}
    />
  )
}
