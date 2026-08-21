// Fixed "now" for the deterministic scheduling demo — anchored to the
// project's mock "today" so the schedule/Gantt stay consistent regardless
// of the wall-clock date the app happens to be viewed on.
export const SCHEDULE_ORIGIN = new Date('2026-08-21T08:00:00')

const PRIORITY_RANK: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export function priorityRank(priority: string): number {
  return PRIORITY_RANK[priority] ?? 9
}

/**
 * Capacity baseline for utilization maths: the plant runs two 8-hour shifts.
 * Measuring against a 24h day would understate every machine and make the
 * utilization colours meaningless.
 */
export const PLANT_HOURS_PER_DAY = 16
