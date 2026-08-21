import type { Alert, MachineType, Project, ScheduledBlock, Task } from '@/types/entities'
import { SCHEDULE_ORIGIN } from './scheduleOrigin'

interface AlertsInput {
  tasks: Task[]
  projects: Project[]
  machineTypes: MachineType[]
  blocks: Map<string, ScheduledBlock>
}

const DAY_MS = 86_400_000
const HIGH_COST_THRESHOLD = 1000

export function buildAlerts({ tasks, projects, machineTypes, blocks }: AlertsInput): Alert[] {
  const alerts: Alert[] = []
  const taskById = new Map(tasks.map((t) => [t.id, t]))
  const machineTypeById = new Map(machineTypes.map((mt) => [mt.id, mt]))
  let seq = 0
  const nextId = (type: string) => `al-${type}-${seq++}`

  // --- Project-level deadline risk / overdue ---
  for (const project of projects) {
    const projectTasks = tasks.filter((t) => t.projectId === project.id)
    const ends = projectTasks
      .map((t) => blocks.get(t.id)?.endAt)
      .filter((d): d is string => Boolean(d))
      .map((d) => new Date(d))
    if (ends.length === 0) continue
    const expectedCompletion = new Date(Math.max(...ends.map((d) => d.getTime())))
    const deadlineEnd = new Date(`${project.deadline}T17:00:00`)
    const diffDays = Math.round((expectedCompletion.getTime() - deadlineEnd.getTime()) / DAY_MS)

    if (diffDays > 0) {
      alerts.push({
        id: nextId('proj-over'),
        type: 'deadline-risk',
        severity: 'critical',
        message: `${project.name} is projected to finish ${diffDays} day${diffDays === 1 ? '' : 's'} after its ${project.deadline} deadline.`,
        projectId: project.id,
      })
    } else if (diffDays > -2) {
      alerts.push({
        id: nextId('proj-risk'),
        type: 'deadline-risk',
        severity: 'warning',
        message: `${project.name} has little buffer before its ${project.deadline} deadline — expected completion ${expectedCompletion.toISOString().slice(0, 10)}.`,
        projectId: project.id,
      })
    }
  }

  // --- Task-level overdue ---
  for (const task of tasks) {
    if (task.status === 'completed') continue
    const deadlineEnd = new Date(`${task.deadline}T17:00:00`)
    if (deadlineEnd < SCHEDULE_ORIGIN) {
      const diffDays = Math.round((SCHEDULE_ORIGIN.getTime() - deadlineEnd.getTime()) / DAY_MS)
      alerts.push({
        id: nextId('task-overdue'),
        type: 'overdue',
        severity: 'critical',
        message: `"${task.name}" is overdue by ${diffDays} day${diffDays === 1 ? '' : 's'} (deadline ${task.deadline}).`,
        taskId: task.id,
        projectId: task.projectId,
      })
    }
  }

  // --- Dependency cascade blocks (blocked task waiting on an overdue upstream) ---
  const overdueTaskIds = new Set(alerts.filter((a) => a.type === 'overdue').map((a) => a.taskId))
  for (const task of tasks) {
    if (task.status !== 'blocked') continue
    if (task.priority !== 'urgent' && task.priority !== 'high') continue
    const blockedBy = task.dependsOn.find((depId) => overdueTaskIds.has(depId))
    if (blockedBy) {
      const dep = taskById.get(blockedBy)
      alerts.push({
        id: nextId('dep-block'),
        type: 'dependency-block',
        severity: 'warning',
        message: `"${task.name}" is blocked waiting on overdue dependency "${dep?.name ?? blockedBy}".`,
        taskId: task.id,
        projectId: task.projectId,
      })
    }
  }

  // --- Maintenance capacity ---
  for (const mt of machineTypes) {
    const maint = mt.machines.filter((m) => m.status === 'maintenance')
    if (maint.length > 0) {
      alerts.push({
        id: nextId('maint'),
        type: 'maintenance-conflict',
        severity: 'warning',
        message: `${maint.length} of ${mt.machines.length} ${mt.name} machines under maintenance (${maint.map((m) => m.code).join(', ')}) — capacity reduced.`,
        machineId: maint[0].id,
      })
    }
  }

  // --- High-cost machine on low/medium priority task ---
  for (const task of tasks) {
    if (task.status === 'completed') continue
    if (task.parentTaskId) continue // setup/inspection subtasks are overhead, not standalone scheduling decisions
    if (task.priority !== 'low' && task.priority !== 'medium') continue
    const mt = machineTypeById.get(task.machineTypeId)
    if (!mt || mt.hourlyRate < HIGH_COST_THRESHOLD) continue
    alerts.push({
      id: nextId('cost-mismatch'),
      type: 'low-priority-high-cost',
      severity: 'warning',
      message: `"${task.name}" (${task.priority} priority) occupies ${mt.name} at ₹${mt.hourlyRate}/hr — reassess priority or scheduling order.`,
      taskId: task.id,
      projectId: task.projectId,
    })
  }

  // --- Idle machines ---
  const busyMachineIds = new Set<string>()
  for (const block of blocks.values()) {
    const start = new Date(block.startAt)
    const end = new Date(block.endAt)
    const withinWindow = start.getTime() - SCHEDULE_ORIGIN.getTime() < 2 * DAY_MS
    if (end > SCHEDULE_ORIGIN && withinWindow) busyMachineIds.add(block.machineId)
  }
  for (const mt of machineTypes) {
    for (const m of mt.machines) {
      if (m.status === 'available' && !busyMachineIds.has(m.id)) {
        alerts.push({
          id: nextId('idle'),
          type: 'idle-machine',
          severity: 'info',
          message: `${m.code} (${mt.name}) has no work queued in the next 48 hours.`,
          machineId: m.id,
        })
      }
    }
  }

  const severityRank: Record<Alert['severity'], number> = { critical: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => severityRank[a.severity] - severityRank[b.severity])
}
