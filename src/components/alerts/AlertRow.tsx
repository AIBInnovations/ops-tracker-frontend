import { useMemo } from 'react'
import { AlertTriangle, ArrowRight, Clock, GitBranch, PauseCircle, TrendingDown, Wrench } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { alertSeverityTone } from '@/lib/tone'
import { routes } from '@/lib/routes'
import { useAppStore } from '@/store/useAppStore'
import type { Alert } from '@/types/entities'

const ICONS: Record<Alert['type'], typeof AlertTriangle> = {
  overdue: AlertTriangle,
  'deadline-risk': Clock,
  'dependency-block': GitBranch,
  'maintenance-conflict': Wrench,
  'low-priority-high-cost': TrendingDown,
  'idle-machine': PauseCircle,
}

export const ALERT_TYPE_LABEL: Record<Alert['type'], string> = {
  overdue: 'Overdue',
  'deadline-risk': 'Deadline risk',
  'dependency-block': 'Dependency block',
  'maintenance-conflict': 'Maintenance',
  'low-priority-high-cost': 'Profitability',
  'idle-machine': 'Idle machine',
}

const severityChrome: Record<Alert['severity'], { icon: string; rail: string }> = {
  critical: { icon: 'bg-danger-soft text-danger-fg', rail: 'bg-danger' },
  warning: { icon: 'bg-warning-soft text-warning-fg', rail: 'bg-warning' },
  info: { icon: 'bg-info-soft text-info-fg', rail: 'bg-info' },
}

/**
 * One exception, one line. The severity rail carries the urgency so the
 * message itself can stay plain — a wall of coloured text is unreadable at
 * sixteen open exceptions.
 */
export function AlertRow({ alert, compact = false }: { alert: Alert; compact?: boolean }) {
  const machineTypes = useAppStore((s) => s.machineTypes)

  /** Every alert resolves back to the exact record that raised it. */
  const target = useMemo((): { to: string; label: string } | undefined => {
    if (alert.taskId) return { to: routes.task(alert.taskId), label: 'View task' }
    if (alert.projectId) return { to: routes.project(alert.projectId), label: 'View project' }
    if (alert.machineId) {
      for (const mt of machineTypes) {
        if (mt.machines.some((m) => m.id === alert.machineId)) {
          return { to: routes.machine(mt.id, alert.machineId), label: 'View machine' }
        }
      }
      return { to: routes.machines(), label: 'View machines' }
    }
    return undefined
  }, [alert, machineTypes])

  const Icon = ICONS[alert.type]
  const chrome = severityChrome[alert.severity]

  const rail = <span className={cn('absolute inset-y-0 left-0 w-0.5', chrome.rail)} />
  const glyph = (
    <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', chrome.icon)}>
      <Icon size={13} strokeWidth={2.2} />
    </span>
  )
  const typeBadge = (
    <Badge tone={alertSeverityTone[alert.severity]} variant="outline" className="shrink-0">
      {ALERT_TYPE_LABEL[alert.type]}
    </Badge>
  )

  // The dashboard rail is a narrow column, so there the message wraps under
  // the badge instead of competing with it for horizontal space.
  if (compact) {
    return (
      <div className="group relative border-b border-line-subtle px-5 py-3 transition-colors last:border-b-0 hover:bg-surface-hover">
        {rail}
        <div className="flex items-center gap-2">
          {glyph}
          {typeBadge}
        </div>
        <Text variant="bodySm" tone="muted" className="mt-1.5 block">
          {alert.message}
        </Text>
      </div>
    )
  }

  return (
    <div className="group relative flex items-center gap-3 border-b border-line-subtle px-5 py-3 transition-colors last:border-b-0 hover:bg-surface-hover">
      {rail}
      {glyph}
      {typeBadge}
      <Text variant="bodyMd" tone="muted" truncate className="min-w-0 flex-1">
        {alert.message}
      </Text>
      {target && (
        <ButtonLink
          to={target.to}
          size="sm"
          variant="ghost"
          iconAfter={<ArrowRight size={13} />}
          className="shrink-0 opacity-70 transition-opacity group-hover:opacity-100"
        >
          {target.label}
        </ButtonLink>
      )}
    </div>
  )
}
