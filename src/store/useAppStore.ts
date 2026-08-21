import { create } from 'zustand'
import { computeSchedule } from '@/engine'
import { mockClients } from '@/data/mockClients'
import { mockMachineTypes } from '@/data/mockMachines'
import { mockProjects } from '@/data/mockProjects'
import { mockTasks } from '@/data/mockTasks'
import type {
  Alert,
  Client,
  Machine,
  MachineStatus,
  MachineType,
  Project,
  ScheduledBlock,
  Task,
  TaskStatus,
} from '@/types/entities'

function nextId(prefix: string, count: number): string {
  return `${prefix}${count + 1}`
}

interface AppState {
  clients: Client[]
  projects: Project[]
  machineTypes: MachineType[]
  tasks: Task[]
  blocks: Map<string, ScheduledBlock>
  alerts: Alert[]

  addClient: (input: Omit<Client, 'id'>) => Client
  addProject: (input: Omit<Project, 'id'>) => Project
  addTask: (input: Omit<Task, 'id'>) => Task
  addMachineType: (input: Omit<MachineType, 'id' | 'machines'> & { machineCount: number }) => MachineType
  updateTaskStatus: (taskId: string, status: TaskStatus) => void
  updateMachineStatus: (machineId: string, status: MachineStatus) => void
}

function recompute(projects: Project[], machineTypes: MachineType[], tasks: Task[]) {
  const { blocks, alerts } = computeSchedule({ tasks, projects, machineTypes })
  return { blocks, alerts }
}

export const useAppStore = create<AppState>((set, get) => {
  const initial = recompute(mockProjects, mockMachineTypes, mockTasks)

  return {
    clients: mockClients,
    projects: mockProjects,
    machineTypes: mockMachineTypes,
    tasks: mockTasks,
    blocks: initial.blocks,
    alerts: initial.alerts,

    addClient: (input) => {
      const { clients } = get()
      // c0 is the reserved in-house account, so real clients start at c1 and
      // the numeric suffix is derived from the highest existing one.
      const maxIndex = clients.reduce((max, c) => {
        const n = Number(c.id.replace(/^c/, ''))
        return Number.isFinite(n) ? Math.max(max, n) : max
      }, 0)
      const client: Client = { ...input, id: `c${maxIndex + 1}` }
      set({ clients: [...clients, client] })
      return client
    },

    addProject: (input) => {
      const { projects } = get()
      const project: Project = { ...input, id: nextId('p', projects.length) }
      const nextProjects = [...projects, project]
      const { blocks, alerts } = recompute(nextProjects, get().machineTypes, get().tasks)
      set({ projects: nextProjects, blocks, alerts })
      return project
    },

    addTask: (input) => {
      const { tasks } = get()
      const task: Task = { ...input, id: nextId('t', tasks.length) }
      const nextTasks = [...tasks, task]
      const { blocks, alerts } = recompute(get().projects, get().machineTypes, nextTasks)
      set({ tasks: nextTasks, blocks, alerts })
      return task
    },

    addMachineType: (input) => {
      const { machineTypes } = get()
      const id = nextId('mt', machineTypes.length)
      const machines: Machine[] = Array.from({ length: input.machineCount }, (_, i) => ({
        id: `${id}-${i + 1}`,
        code: `${input.name.slice(0, 3).toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
        machineTypeId: id,
        status: 'available' as MachineStatus,
      }))
      const machineType: MachineType = {
        id,
        name: input.name,
        description: input.description,
        hourlyRate: input.hourlyRate,
        machines,
      }
      const nextMachineTypes = [...machineTypes, machineType]
      const { blocks, alerts } = recompute(get().projects, nextMachineTypes, get().tasks)
      set({ machineTypes: nextMachineTypes, blocks, alerts })
      return machineType
    },

    updateTaskStatus: (taskId, status) => {
      const nextTasks = get().tasks.map((t) => (t.id === taskId ? { ...t, status } : t))
      const { blocks, alerts } = recompute(get().projects, get().machineTypes, nextTasks)
      set({ tasks: nextTasks, blocks, alerts })
    },

    updateMachineStatus: (machineId, status) => {
      const nextMachineTypes = get().machineTypes.map((mt) => ({
        ...mt,
        machines: mt.machines.map((m) => (m.id === machineId ? { ...m, status } : m)),
      }))
      const { blocks, alerts } = recompute(get().projects, nextMachineTypes, get().tasks)
      set({ machineTypes: nextMachineTypes, blocks, alerts })
    },
  }
})
