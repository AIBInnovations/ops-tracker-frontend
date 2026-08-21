import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'info'
export type BadgeVariant = 'soft' | 'outline' | 'solid'

const softClass: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunken text-fg-muted',
  accent: 'bg-accent-soft text-accent-fg',
  success: 'bg-success-soft text-success-fg',
  warning: 'bg-warning-soft text-warning-fg',
  danger: 'bg-danger-soft text-danger-fg',
  info: 'bg-info-soft text-info-fg',
}

const outlineClass: Record<BadgeTone, string> = {
  neutral: 'text-fg-muted ring-1 ring-inset ring-line',
  accent: 'text-accent-fg ring-1 ring-inset ring-accent-border',
  success: 'text-success-fg ring-1 ring-inset ring-success-border',
  warning: 'text-warning-fg ring-1 ring-inset ring-warning-border',
  danger: 'text-danger-fg ring-1 ring-inset ring-danger-border',
  info: 'text-info-fg ring-1 ring-inset ring-info-border',
}

const solidClass: Record<BadgeTone, string> = {
  neutral: 'bg-fg-muted text-surface',
  accent: 'bg-accent text-accent-on',
  success: 'bg-success text-white',
  warning: 'bg-warning text-white',
  danger: 'bg-danger text-white',
  info: 'bg-info text-white',
}

export const dotClass: Record<BadgeTone, string> = {
  neutral: 'bg-fg-faint',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
}

interface BadgeProps {
  tone?: BadgeTone
  variant?: BadgeVariant
  dot?: boolean
  /** Pulses the dot — reserved for states that are live right now. */
  pulse?: boolean
  icon?: ReactNode
  className?: string
  children: ReactNode
}

export function Badge({
  tone = 'neutral',
  variant = 'soft',
  dot = false,
  pulse = false,
  icon,
  className,
  children,
}: BadgeProps) {
  const style = variant === 'solid' ? solidClass : variant === 'outline' ? outlineClass : softClass
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold',
        style[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            variant === 'solid' ? 'bg-current' : dotClass[tone],
            pulse && 'animate-pulse-dot',
          )}
        />
      )}
      {icon}
      <span className="truncate">{children}</span>
    </span>
  )
}

/** Bare status dot for dense contexts where a full badge would crowd. */
export function StatusDot({ tone = 'neutral', pulse = false }: { tone?: BadgeTone; pulse?: boolean }) {
  return (
    <span
      className={cn('inline-block h-2 w-2 shrink-0 rounded-full', dotClass[tone], pulse && 'animate-pulse-dot')}
    />
  )
}
