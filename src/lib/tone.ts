import type { BadgeTone } from '@/components/ui/Badge'
import type { MeterTone } from '@/components/ui/Progress'
import type { AlertSeverity, MachineStatus, Priority, ProjectStatus, TaskStatus } from '@/types/entities'

export const taskStatusTone: Record<TaskStatus, BadgeTone> = {
  blocked: 'neutral',
  scheduled: 'info',
  in_progress: 'accent',
  completed: 'success',
  overdue: 'danger',
}

export const taskStatusLabel: Record<TaskStatus, string> = {
  blocked: 'Blocked',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  overdue: 'Overdue',
}

export const projectStatusTone: Record<ProjectStatus, BadgeTone> = {
  planning: 'neutral',
  in_progress: 'accent',
  on_hold: 'warning',
  completed: 'success',
}

export const projectStatusLabel: Record<ProjectStatus, string> = {
  planning: 'Planning',
  in_progress: 'In progress',
  on_hold: 'On hold',
  completed: 'Completed',
}

export const machineStatusTone: Record<MachineStatus, BadgeTone> = {
  available: 'neutral',
  running: 'accent',
  maintenance: 'warning',
}

export const machineStatusLabel: Record<MachineStatus, string> = {
  available: 'Idle',
  running: 'Running',
  maintenance: 'Maintenance',
}

export const priorityTone: Record<Priority, BadgeTone> = {
  low: 'neutral',
  medium: 'neutral',
  high: 'warning',
  urgent: 'danger',
}

export const priorityLabel: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

/** Ranked so priority can drive sort order as well as colour. */
export const priorityRankLabel: Record<Priority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

export const alertSeverityTone: Record<AlertSeverity, BadgeTone> = {
  critical: 'danger',
  warning: 'warning',
  info: 'info',
}

export const alertSeverityLabel: Record<AlertSeverity, string> = {
  critical: 'Critical',
  warning: 'Warning',
  info: 'Info',
}

/**
 * Timeline bars need solid fills rather than the badge's tinted ground.
 * Values are token-driven so the bars re-tune themselves in dark mode
 * instead of glowing at full saturation against a near-black grid.
 */
export const taskStatusBar: Record<TaskStatus, { fill: string; text: string; edge: string }> = {
  blocked: {
    fill: 'rgb(var(--c-fg-faint) / 0.35)',
    text: 'rgb(var(--c-fg))',
    edge: 'rgb(var(--c-fg-faint))',
  },
  scheduled: {
    fill: 'rgb(var(--c-accent) / 0.22)',
    text: 'rgb(var(--c-accent-fg))',
    edge: 'rgb(var(--c-accent) / 0.55)',
  },
  in_progress: {
    fill: 'rgb(var(--c-accent))',
    text: 'rgb(var(--c-on-accent))',
    edge: 'rgb(var(--c-accent))',
  },
  completed: {
    fill: 'rgb(var(--c-success) / 0.2)',
    text: 'rgb(var(--c-success-fg))',
    edge: 'rgb(var(--c-success) / 0.5)',
  },
  overdue: {
    fill: 'rgb(var(--c-danger))',
    text: '#ffffff',
    edge: 'rgb(var(--c-danger))',
  },
}

/** One definition of what a utilization number means, used by every view. */
export function utilizationTone(pct: number): MeterTone {
  if (pct >= 85) return 'danger'
  if (pct < 30) return 'warning'
  return 'accent'
}

export function utilizationBadgeTone(pct: number): BadgeTone {
  if (pct >= 85) return 'danger'
  if (pct < 30) return 'warning'
  return 'accent'
}

/** Gross-margin bands for machine time; negative margin is always critical. */
export function marginTone(pct: number): BadgeTone {
  if (pct < 0) return 'danger'
  if (pct < 15) return 'warning'
  return 'success'
}

/** Profit figures read green when positive and red when the job loses money. */
export function profitClass(value: number): string {
  return value >= 0 ? 'text-success-fg' : 'text-danger-fg'
}
