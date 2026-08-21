export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type ProjectType = 'client' | 'inhouse'

export type ProjectStatus = 'planning' | 'in_progress' | 'on_hold' | 'completed'

export type TaskStatus = 'blocked' | 'scheduled' | 'in_progress' | 'completed' | 'overdue'

export type MachineStatus = 'available' | 'running' | 'maintenance'

export interface Client {
  id: string
  code: string
  name: string
}

export interface Project {
  id: string
  name: string
  clientId: string
  type: ProjectType
  startDate: string
  deadline: string
  priority: Priority
  status: ProjectStatus
}

export interface Machine {
  id: string
  code: string
  machineTypeId: string
  status: MachineStatus
}

export interface MachineType {
  id: string
  name: string
  description: string
  hourlyRate: number
  machines: Machine[]
}

export interface Task {
  id: string
  name: string
  description: string
  projectId: string
  operationType: string
  machineTypeId: string
  batchSize: number
  timePerPieceMin: number
  pricePerPiece: number
  priority: Priority
  deadline: string
  status: TaskStatus
  dependsOn: string[]
  parentTaskId?: string
}

export interface ScheduledBlock {
  taskId: string
  machineId: string
  machineTypeId: string
  startAt: string
  endAt: string
  durationHrs: number
  cost: number
  revenue: number
  profit: number
}

export type AlertType =
  | 'deadline-risk'
  | 'overdue'
  | 'dependency-block'
  | 'maintenance-conflict'
  | 'low-priority-high-cost'
  | 'idle-machine'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  message: string
  taskId?: string
  projectId?: string
  machineId?: string
}
