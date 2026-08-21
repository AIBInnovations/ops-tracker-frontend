import type { Client, Machine, MachineStatus, MachineType, Project, ScheduledBlock, Task } from '@/types/entities'
import { PLANT_HOURS_PER_DAY, SCHEDULE_ORIGIN } from '@/engine'

export function sortWithSubtasksNested(tasks: Task[]): Task[] {
  const byParent = new Map<string, Task[]>()
  const top: Task[] = []
  for (const task of tasks) {
    if (task.parentTaskId) {
      const list = byParent.get(task.parentTaskId) ?? []
      list.push(task)
      byParent.set(task.parentTaskId, list)
    } else {
      top.push(task)
    }
  }
  const result: Task[] = []
  for (const task of top) {
    result.push(task)
    result.push(...(byParent.get(task.id) ?? []))
  }
  return result
}

export function computeProjectProgress(tasks: Task[], projectId: string): number {
  const projectTasks = tasks.filter((t) => t.projectId === projectId)
  if (projectTasks.length === 0) return 0
  const completed = projectTasks.filter((t) => t.status === 'completed').length
  return (completed / projectTasks.length) * 100
}

export function getClientById(clients: Client[], id: string): Client | undefined {
  return clients.find((c) => c.id === id)
}

export function getProjectById(projects: Project[], id: string): Project | undefined {
  return projects.find((p) => p.id === id)
}

export function getMachineTypeById(machineTypes: MachineType[], id: string): MachineType | undefined {
  return machineTypes.find((mt) => mt.id === id)
}

export function findMachine(machineTypes: MachineType[], machineId: string): { machine: Machine; machineType: MachineType } | undefined {
  for (const mt of machineTypes) {
    const machine = mt.machines.find((m) => m.id === machineId)
    if (machine) return { machine, machineType: mt }
  }
  return undefined
}

export interface TaskRow {
  task: Task
  project?: Project
  client?: Client
  machineType?: MachineType
  block?: ScheduledBlock
  machineCode?: string
  isCurrent: boolean
  isUpcoming: boolean
}

export function buildTaskRows(
  tasks: Task[],
  projects: Project[],
  clients: Client[],
  machineTypes: MachineType[],
  blocks: Map<string, ScheduledBlock>,
): TaskRow[] {
  return tasks.map((task) => {
    const project = getProjectById(projects, task.projectId)
    const client = project ? getClientById(clients, project.clientId) : undefined
    const machineType = getMachineTypeById(machineTypes, task.machineTypeId)
    const block = blocks.get(task.id)
    const machineCode = block ? findMachine(machineTypes, block.machineId)?.machine.code : undefined
    const start = block ? new Date(block.startAt) : undefined
    const end = block ? new Date(block.endAt) : undefined
    const isCurrent = Boolean(start && end && start <= SCHEDULE_ORIGIN && SCHEDULE_ORIGIN < end)
    const isUpcoming = Boolean(start && start > SCHEDULE_ORIGIN)
    return { task, project, client, machineType, block, machineCode, isCurrent, isUpcoming }
  })
}

export interface MachineActivityRow {
  machine: Machine
  machineType: MachineType
  row?: TaskRow
  effectiveStatus: MachineStatus
}

export function buildMachineActivity(machineTypes: MachineType[], taskRows: TaskRow[]): MachineActivityRow[] {
  const rows: MachineActivityRow[] = []
  for (const machineType of machineTypes) {
    for (const machine of machineType.machines) {
      const current = taskRows.find((r) => r.isCurrent && r.block?.machineId === machine.id)
      const next = !current
        ? taskRows
            .filter((r) => r.isUpcoming && r.block?.machineId === machine.id)
            .sort((a, b) => new Date(a.block!.startAt).getTime() - new Date(b.block!.startAt).getTime())[0]
        : undefined
      // Derived from the actual computed schedule, not the static mock
      // status flag — a machine only reads "Running" if it truly has a
      // block covering right now.
      const effectiveStatus: MachineStatus =
        machine.status === 'maintenance' ? 'maintenance' : current ? 'running' : 'available'
      rows.push({ machine, machineType, row: current ?? next, effectiveStatus })
    }
  }
  return rows
}

export interface MachineTypeUtilization {
  machineType: MachineType
  totalMachines: number
  runningNow: number
  maintenanceNow: number
  idleNow: number
  utilizationPct: number
  scheduledHours: number
  cost: number
  revenue: number
  profit: number
}

export function computeUtilization(
  machineTypes: MachineType[],
  blocks: Map<string, ScheduledBlock>,
  windowStart: Date,
  windowEnd: Date,
): MachineTypeUtilization[] {
  const blocksByType = new Map<string, ScheduledBlock[]>()
  for (const block of blocks.values()) {
    const list = blocksByType.get(block.machineTypeId) ?? []
    list.push(block)
    blocksByType.set(block.machineTypeId, list)
  }

  return machineTypes.map((machineType) => {
    const typeBlocks = blocksByType.get(machineType.id) ?? []
    const runningNow = typeBlocks.filter((b) => {
      const s = new Date(b.startAt)
      const e = new Date(b.endAt)
      return s <= SCHEDULE_ORIGIN && SCHEDULE_ORIGIN < e
    }).length
    const maintenanceNow = machineType.machines.filter((m) => m.status === 'maintenance').length
    const nonMaintenance = machineType.machines.length - maintenanceNow
    const idleNow = Math.max(0, nonMaintenance - runningNow)

    const windowDays = (windowEnd.getTime() - windowStart.getTime()) / 86_400_000
    const capacityHours = nonMaintenance * windowDays * PLANT_HOURS_PER_DAY
    const busyHours = typeBlocks.reduce((sum, b) => {
      const s = Math.max(new Date(b.startAt).getTime(), windowStart.getTime())
      const e = Math.min(new Date(b.endAt).getTime(), windowEnd.getTime())
      return sum + Math.max(0, e - s) / 3_600_000
    }, 0)
    const utilizationPct = capacityHours > 0 ? (busyHours / capacityHours) * 100 : 0

    const scheduledHours = typeBlocks.reduce((sum, b) => sum + b.durationHrs, 0)
    const cost = typeBlocks.reduce((sum, b) => sum + b.cost, 0)
    const revenue = typeBlocks.reduce((sum, b) => sum + b.revenue, 0)

    return {
      machineType,
      totalMachines: machineType.machines.length,
      runningNow,
      maintenanceNow,
      idleNow,
      utilizationPct,
      scheduledHours,
      cost,
      revenue,
      profit: revenue - cost,
    }
  })
}

export interface ProjectFulfillmentRow {
  project: Project
  client?: Client
  expectedCompletion?: Date
  atRisk: boolean
  overdue: boolean
}

export function buildOrderFulfillment(
  projects: Project[],
  clients: Client[],
  taskRows: TaskRow[],
): ProjectFulfillmentRow[] {
  return projects.map((project) => {
    const client = getClientById(clients, project.clientId)
    const ends = taskRows
      .filter((r) => r.project?.id === project.id && r.block)
      .map((r) => new Date(r.block!.endAt))
    const expectedCompletion = ends.length > 0 ? new Date(Math.max(...ends.map((d) => d.getTime()))) : undefined
    const deadline = new Date(`${project.deadline}T17:00:00`)
    const overdue = Boolean(expectedCompletion && expectedCompletion > deadline)
    const atRisk =
      !overdue && Boolean(expectedCompletion && deadline.getTime() - expectedCompletion.getTime() < 2 * 86_400_000)
    return { project, client, expectedCompletion, atRisk, overdue }
  })
}

/** Tasks that are waiting on the given task — the downstream half of a dependency. */
export function getTaskDependents(tasks: Task[], taskId: string): Task[] {
  return tasks.filter((t) => t.dependsOn.includes(taskId))
}

export function getSubtasks(tasks: Task[], taskId: string): Task[] {
  return tasks.filter((t) => t.parentTaskId === taskId)
}

export interface Financials {
  cost: number
  revenue: number
  profit: number
  hours: number
  marginPct: number
}

export function sumFinancials(rows: TaskRow[]): Financials {
  const cost = rows.reduce((s, r) => s + (r.block?.cost ?? 0), 0)
  const revenue = rows.reduce((s, r) => s + (r.block?.revenue ?? 0), 0)
  const hours = rows.reduce((s, r) => s + (r.block?.durationHrs ?? 0), 0)
  return { cost, revenue, profit: revenue - cost, hours, marginPct: revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0 }
}

export interface ClientRollup {
  client: Client
  projects: Project[]
  taskCount: number
  openTaskCount: number
  financials: Financials
  expectedCompletion?: Date
  earliestDeadline?: Date
  atRiskProjects: number
}

export function buildClientRollups(
  clients: Client[],
  projects: Project[],
  taskRows: TaskRow[],
  fulfillment: ProjectFulfillmentRow[],
): ClientRollup[] {
  return clients.map((client) => {
    const clientProjects = projects.filter((p) => p.clientId === client.id)
    const projectIds = new Set(clientProjects.map((p) => p.id))
    const rows = taskRows.filter((r) => r.project && projectIds.has(r.project.id))
    const ends = rows.filter((r) => r.block).map((r) => new Date(r.block!.endAt).getTime())
    const deadlines = clientProjects.map((p) => new Date(`${p.deadline}T17:00:00`).getTime())

    return {
      client,
      projects: clientProjects,
      taskCount: rows.length,
      openTaskCount: rows.filter((r) => r.task.status !== 'completed').length,
      financials: sumFinancials(rows),
      expectedCompletion: ends.length ? new Date(Math.max(...ends)) : undefined,
      earliestDeadline: deadlines.length ? new Date(Math.min(...deadlines)) : undefined,
      atRiskProjects: fulfillment.filter((f) => projectIds.has(f.project.id) && (f.overdue || f.atRisk)).length,
    }
  })
}

/** Chronologically ordered work queue for one physical machine. */
export function machineQueue(taskRows: TaskRow[], machineId: string): TaskRow[] {
  return taskRows
    .filter((r) => r.block?.machineId === machineId)
    .sort((a, b) => new Date(a.block!.startAt).getTime() - new Date(b.block!.startAt).getTime())
}

export function machineTypeQueue(taskRows: TaskRow[], machineTypeId: string): TaskRow[] {
  return taskRows
    .filter((r) => r.block?.machineTypeId === machineTypeId)
    .sort((a, b) => new Date(a.block!.startAt).getTime() - new Date(b.block!.startAt).getTime())
}

export interface DailySlice {
  date: Date
  hours: number
  cost: number
  revenue: number
  profit: number
  taskCount: number
}

/**
 * Splits scheduled blocks across calendar days so trend visuals read real
 * plan data. A block that spans midnight contributes its hours to each day
 * it actually occupies, rather than landing wholly on its start date.
 */
export function buildDailySeries(
  blocks: Map<string, ScheduledBlock>,
  from: Date,
  days: number,
): DailySlice[] {
  const start = new Date(from)
  start.setHours(0, 0, 0, 0)

  return Array.from({ length: days }, (_, i) => {
    const dayStart = new Date(start.getTime() + i * 86_400_000)
    const dayEnd = new Date(dayStart.getTime() + 86_400_000)
    const slice: DailySlice = { date: dayStart, hours: 0, cost: 0, revenue: 0, profit: 0, taskCount: 0 }

    for (const block of blocks.values()) {
      const s = new Date(block.startAt).getTime()
      const e = new Date(block.endAt).getTime()
      const overlap = Math.max(0, Math.min(e, dayEnd.getTime()) - Math.max(s, dayStart.getTime()))
      if (overlap <= 0) continue
      const share = block.durationHrs > 0 ? overlap / 3_600_000 / block.durationHrs : 0
      slice.hours += overlap / 3_600_000
      slice.cost += block.cost * share
      slice.revenue += block.revenue * share
      slice.profit += block.profit * share
      // Attribute the task to the day it finishes — that is the day the
      // customer actually receives it.
      if (e >= dayStart.getTime() && e < dayEnd.getTime()) slice.taskCount += 1
    }
    return slice
  })
}

/** Plant-wide capacity share over a window, used by the overview header. */
export function computeFloorLoad(
  machineTypes: MachineType[],
  blocks: Map<string, ScheduledBlock>,
  windowStart: Date,
  windowEnd: Date,
): { utilizationPct: number; busyHours: number; capacityHours: number } {
  const activeMachines = machineTypes.reduce(
    (n, mt) => n + mt.machines.filter((m) => m.status !== 'maintenance').length,
    0,
  )
  const windowDays = (windowEnd.getTime() - windowStart.getTime()) / 86_400_000
  const capacityHours = activeMachines * windowDays * PLANT_HOURS_PER_DAY

  const busyHours = [...blocks.values()].reduce((sum, b) => {
    const s = Math.max(new Date(b.startAt).getTime(), windowStart.getTime())
    const e = Math.min(new Date(b.endAt).getTime(), windowEnd.getTime())
    return sum + Math.max(0, e - s) / 3_600_000
  }, 0)

  return {
    busyHours,
    capacityHours,
    utilizationPct: capacityHours > 0 ? (busyHours / capacityHours) * 100 : 0,
  }
}
