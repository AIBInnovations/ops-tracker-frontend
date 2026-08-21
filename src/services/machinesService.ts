import { useAppStore } from '@/store/useAppStore'
import type { MachineStatus, MachineType } from '@/types/entities'

export async function getMachineTypes(): Promise<MachineType[]> {
  return useAppStore.getState().machineTypes
}

export async function createMachineType(
  input: Omit<MachineType, 'id' | 'machines'> & { machineCount: number },
): Promise<MachineType> {
  return useAppStore.getState().addMachineType(input)
}

export async function setMachineStatus(machineId: string, status: MachineStatus): Promise<void> {
  useAppStore.getState().updateMachineStatus(machineId, status)
}
