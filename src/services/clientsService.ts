import { useAppStore } from '@/store/useAppStore'
import type { Client } from '@/types/entities'

export async function getClients(): Promise<Client[]> {
  return useAppStore.getState().clients
}

export async function getClient(id: string): Promise<Client | undefined> {
  return useAppStore.getState().clients.find((c) => c.id === id)
}

export async function createClient(input: Omit<Client, 'id'>): Promise<Client> {
  return useAppStore.getState().addClient(input)
}
