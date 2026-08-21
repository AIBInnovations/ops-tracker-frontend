import type { Task } from '@/types/entities'

export function durationHrs(task: Task): number {
  return (task.batchSize * task.timePerPieceMin) / 60
}

export function taskCost(task: Task, hourlyRate: number): number {
  return durationHrs(task) * hourlyRate
}

export function taskRevenue(task: Task): number {
  return task.batchSize * task.pricePerPiece
}

export function taskProfit(task: Task, hourlyRate: number): number {
  return taskRevenue(task) - taskCost(task, hourlyRate)
}
