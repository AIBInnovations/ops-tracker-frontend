import type { MachineType, Project, Task } from '@/types/entities'
import { buildAlerts } from './alerts'
import { runScheduler } from './scheduler'

export { PLANT_HOURS_PER_DAY, SCHEDULE_ORIGIN } from './scheduleOrigin'
export { durationHrs, taskCost, taskProfit, taskRevenue } from './costing'

export function computeSchedule({
  tasks,
  projects,
  machineTypes,
}: {
  tasks: Task[]
  projects: Project[]
  machineTypes: MachineType[]
}) {
  const blocks = runScheduler({ tasks, machineTypes })
  const alerts = buildAlerts({ tasks, projects, machineTypes, blocks })
  return { blocks, alerts }
}
