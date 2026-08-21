import { useAppStore } from '@/store/useAppStore'
import type { Project } from '@/types/entities'

// Async-shaped wrapper over the local store — this is the seam a real API
// client slots into later without touching any component.
export async function getProjects(): Promise<Project[]> {
  return useAppStore.getState().projects
}

export async function getProject(id: string): Promise<Project | undefined> {
  return useAppStore.getState().projects.find((p) => p.id === id)
}

export async function createProject(input: Omit<Project, 'id'>): Promise<Project> {
  return useAppStore.getState().addProject(input)
}
