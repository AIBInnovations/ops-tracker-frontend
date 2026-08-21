import { useAppStore } from '@/store/useAppStore'
import type { Task, TaskStatus } from '@/types/entities'

export async function getTasks(): Promise<Task[]> {
  return useAppStore.getState().tasks
}

export async function createTask(input: Omit<Task, 'id'>): Promise<Task> {
  return useAppStore.getState().addTask(input)
}

export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  useAppStore.getState().updateTaskStatus(taskId, status)
}
