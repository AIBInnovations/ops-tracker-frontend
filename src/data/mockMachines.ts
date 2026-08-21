import type { Machine, MachineType } from '@/types/entities'

function machines(prefix: string, typeId: string, statuses: Machine['status'][]): Machine[] {
  return statuses.map((status, i) => ({
    id: `${typeId}-${i + 1}`,
    code: `${prefix}-${String(i + 1).padStart(2, '0')}`,
    machineTypeId: typeId,
    status,
  }))
}

export const mockMachineTypes: MachineType[] = [
  {
    id: 'mt1',
    name: 'M/C 1 — CNC Lathe',
    description: 'Turning operations for cylindrical and profiled parts.',
    hourlyRate: 250,
    machines: machines('CNC', 'mt1', ['running', 'running', 'available', 'available']),
  },
  {
    id: 'mt2',
    name: 'M/C 2 — Vertical Machining Center',
    description: '3-axis milling for brackets, housings and plates.',
    hourlyRate: 450,
    machines: machines('VMC', 'mt2', ['running', 'running', 'running', 'maintenance']),
  },
  {
    id: 'mt3',
    name: 'M/C 3 — Wire EDM',
    description: 'Precision wire-cut electrical discharge machining.',
    hourlyRate: 700,
    machines: machines('EDM', 'mt3', ['running', 'available', 'available']),
  },
  {
    id: 'mt4',
    name: 'M/C 4 — 5-Axis Machining Center',
    description: 'Complex multi-axis milling for aerospace-grade geometry.',
    hourlyRate: 1000,
    machines: machines('FX', 'mt4', ['running', 'running', 'maintenance']),
  },
  {
    id: 'mt5',
    name: 'M/C 5 — Precision Grinding',
    description: 'Surface and cylindrical grinding for tight tolerances.',
    hourlyRate: 1400,
    machines: machines('GR', 'mt5', ['running', 'available']),
  },
  {
    id: 'mt6',
    name: 'M/C 6 — DMLS Additive Printer',
    description: 'Direct metal laser sintering for titanium/Inconel parts.',
    hourlyRate: 2000,
    machines: machines('AM', 'mt6', ['running', 'available']),
  },
]
