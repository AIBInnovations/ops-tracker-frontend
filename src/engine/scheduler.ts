import type { MachineType, ScheduledBlock, Task } from '@/types/entities'
import { durationHrs, taskCost, taskRevenue } from './costing'
import { priorityRank, SCHEDULE_ORIGIN } from './scheduleOrigin'

interface ScheduleInput {
  tasks: Task[]
  machineTypes: MachineType[]
}

/**
 * Deterministic greedy list-scheduler.
 *
 * Order: topological (dependencies first), tie-broken by priority then
 * deadline then task id — so the same bucket always produces the same
 * schedule. Each task is assigned to the earliest-free non-maintenance
 * physical machine of its required machine type; completed tasks are
 * placed in the fixed past (they don't consume future machine capacity).
 */
export function runScheduler({ tasks, machineTypes }: ScheduleInput): Map<string, ScheduledBlock> {
  const machineTypeById = new Map(machineTypes.map((mt) => [mt.id, mt]))
  const taskById = new Map(tasks.map((t) => [t.id, t]))

  const machineFreeAt = new Map<string, Date>()
  for (const mt of machineTypes) {
    for (const m of mt.machines) {
      if (m.status !== 'maintenance') machineFreeAt.set(m.id, new Date(SCHEDULE_ORIGIN))
    }
  }

  const blocks = new Map<string, ScheduledBlock>()

  // Completed tasks: fixed historical block ending at (deadline end-of-day),
  // capped so it never lands after the schedule origin.
  for (const task of tasks) {
    if (task.status !== 'completed') continue
    const mt = machineTypeById.get(task.machineTypeId)
    if (!mt) continue
    const hrs = durationHrs(task)
    const deadlineEnd = new Date(`${task.deadline}T17:00:00`)
    const endAt = deadlineEnd < SCHEDULE_ORIGIN ? deadlineEnd : new Date(SCHEDULE_ORIGIN)
    const startAt = new Date(endAt.getTime() - hrs * 3_600_000)
    const machineId = mt.machines.find((m) => m.status !== 'maintenance')?.id ?? mt.machines[0].id
    blocks.set(task.id, {
      taskId: task.id,
      machineId,
      machineTypeId: mt.id,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      durationHrs: hrs,
      cost: taskCost(task, mt.hourlyRate),
      revenue: taskRevenue(task),
      profit: taskRevenue(task) - taskCost(task, mt.hourlyRate),
    })
  }

  // In-progress tasks: already underway — anchor them partway through their
  // run (instead of starting fresh at origin) so the dashboard shows real
  // elapsed time/cost instead of every "current" task reading zero.
  const IN_PROGRESS_FRACTION = 0.35
  for (const task of tasks) {
    if (task.status !== 'in_progress') continue
    const mt = machineTypeById.get(task.machineTypeId)
    if (!mt) continue
    const hrs = durationHrs(task)
    const machineId = mt.machines.find((m) => machineFreeAt.has(m.id))?.id
    if (!machineId) continue
    const startAt = new Date(SCHEDULE_ORIGIN.getTime() - IN_PROGRESS_FRACTION * hrs * 3_600_000)
    const endAt = new Date(startAt.getTime() + hrs * 3_600_000)
    machineFreeAt.set(machineId, endAt)
    blocks.set(task.id, {
      taskId: task.id,
      machineId,
      machineTypeId: mt.id,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      durationHrs: hrs,
      cost: taskCost(task, mt.hourlyRate),
      revenue: taskRevenue(task),
      profit: taskRevenue(task) - taskCost(task, mt.hourlyRate),
    })
  }

  // Remaining tasks: topological order via repeated selection of the best
  // ready task (all dependencies already scheduled).
  const pending = tasks.filter((t) => t.status !== 'completed' && t.status !== 'in_progress')
  const scheduledIds = new Set(blocks.keys())

  const compareReady = (a: Task, b: Task) => {
    const pr = priorityRank(a.priority) - priorityRank(b.priority)
    if (pr !== 0) return pr
    const dl = a.deadline.localeCompare(b.deadline)
    if (dl !== 0) return dl
    return a.id.localeCompare(b.id)
  }

  const remaining = [...pending]
  while (remaining.length > 0) {
    const ready = remaining.filter((t) => t.dependsOn.every((depId) => scheduledIds.has(depId) || !taskById.has(depId)))
    if (ready.length === 0) break // dependency cycle safeguard — leave rest unscheduled
    ready.sort(compareReady)
    const task = ready[0]

    const mt = machineTypeById.get(task.machineTypeId)
    if (!mt) {
      scheduledIds.add(task.id)
      remaining.splice(remaining.indexOf(task), 1)
      continue
    }

    const earliestStart = task.dependsOn.reduce((acc, depId) => {
      const depBlock = blocks.get(depId)
      if (!depBlock) return acc
      const depEnd = new Date(depBlock.endAt)
      return depEnd > acc ? depEnd : acc
    }, new Date(SCHEDULE_ORIGIN))

    const candidates = mt.machines.filter((m) => machineFreeAt.has(m.id))
    let bestMachineId = candidates[0]?.id
    let bestStart: Date | null = null
    for (const m of candidates) {
      const freeAt = machineFreeAt.get(m.id)!
      const start = freeAt > earliestStart ? freeAt : earliestStart
      if (!bestStart || start < bestStart || (start.getTime() === bestStart.getTime() && freeAt < machineFreeAt.get(bestMachineId!)!)) {
        bestStart = start
        bestMachineId = m.id
      }
    }

    if (!bestMachineId || !bestStart) {
      scheduledIds.add(task.id)
      remaining.splice(remaining.indexOf(task), 1)
      continue
    }

    const hrs = durationHrs(task)
    const endAt = new Date(bestStart.getTime() + hrs * 3_600_000)
    machineFreeAt.set(bestMachineId, endAt)

    blocks.set(task.id, {
      taskId: task.id,
      machineId: bestMachineId,
      machineTypeId: mt.id,
      startAt: bestStart.toISOString(),
      endAt: endAt.toISOString(),
      durationHrs: hrs,
      cost: taskCost(task, mt.hourlyRate),
      revenue: taskRevenue(task),
      profit: taskRevenue(task) - taskCost(task, mt.hourlyRate),
    })
    scheduledIds.add(task.id)
    remaining.splice(remaining.indexOf(task), 1)
  }

  return blocks
}
