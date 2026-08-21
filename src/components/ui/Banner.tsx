import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Text } from './Text'

export type BannerTone = 'info' | 'success' | 'warning' | 'danger'

const toneConfig: Record<BannerTone, { wrap: string; icon: typeof Info; iconClass: string }> = {
  info: { wrap: 'bg-info-soft ring-info-border', icon: Info, iconClass: 'text-info-fg' },
  success: { wrap: 'bg-success-soft ring-success-border', icon: CheckCircle2, iconClass: 'text-success-fg' },
  warning: { wrap: 'bg-warning-soft ring-warning-border', icon: AlertTriangle, iconClass: 'text-warning-fg' },
  danger: { wrap: 'bg-danger-soft ring-danger-border', icon: XCircle, iconClass: 'text-danger-fg' },
}

interface BannerProps {
  tone?: BannerTone
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
  onDismiss?: () => void
  className?: string
}

export function Banner({ tone = 'info', title, children, action, onDismiss, className }: BannerProps) {
  const { wrap, icon: Icon, iconClass } = toneConfig[tone]
  return (
    <div className={cn('rounded-2xl p-4 ring-1 ring-inset', wrap, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <Icon size={16} strokeWidth={2.2} className={cn('mt-0.5 shrink-0', iconClass)} />
          <div className="min-w-0">
            <Text variant="headingSm">{title}</Text>
            {children && <div className="mt-0.5">{children}</div>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {action}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="rounded-full p-1.5 text-fg-subtle transition-colors hover:bg-black/5 hover:text-fg dark:hover:bg-white/10"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
