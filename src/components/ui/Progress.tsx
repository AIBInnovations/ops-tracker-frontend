import { cn } from '@/lib/cn'
import { Text } from './Text'

export type MeterTone = 'accent' | 'accentSoft' | 'success' | 'warning' | 'danger' | 'neutral'

const barClass: Record<MeterTone, string> = {
  accent: 'bg-accent',
  accentSoft: 'bg-accent/40',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-fg-faint',
}

interface MeterProps {
  value: number
  tone?: MeterTone
  /** Renders the percentage beside the bar. */
  showValue?: boolean
  size?: 'sm' | 'md'
  className?: string
  label?: string
  /** For meters drawn on a solid accent panel, where the tokens would vanish. */
  inverted?: boolean
}

export function Meter({
  value,
  tone = 'accent',
  showValue = false,
  size = 'md',
  className,
  label,
  inverted = false,
}: MeterProps) {
  const clamped = Math.min(100, Math.max(0, value))
  const bar = (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'w-full overflow-hidden rounded-full',
        inverted ? 'bg-white/25' : 'bg-surface-sunken',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        !showValue && className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-300',
          inverted ? 'bg-white' : barClass[tone],
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )

  if (!showValue) return bar

  return (
    // `w-full` matters in shrink-to-fit parents (a right-aligned description
    // row), where the bar would otherwise resolve to zero width.
    <div className={cn('flex w-full items-center gap-2', className)}>
      {bar}
      <Text variant="bodySm" tone="muted" numeric className="shrink-0 tabular-nums">
        {Math.round(clamped)}%
      </Text>
    </div>
  )
}

/**
 * Proportional stack — one bar split across states (running / idle /
 * maintenance). Reads capacity at a glance without a legend per row.
 */
export function StackedMeter({
  segments,
  className,
}: {
  segments: { value: number; tone: MeterTone; label: string }[]
  className?: string
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1
  return (
    <div className={cn('flex h-2.5 w-full overflow-hidden rounded-full bg-surface-sunken', className)}>
      {segments.map((seg, i) =>
        seg.value > 0 ? (
          <div
            key={i}
            title={`${seg.label}: ${seg.value}`}
            className={cn(barClass[seg.tone], i > 0 && 'border-l border-surface')}
            style={{ width: `${(seg.value / total) * 100}%` }}
          />
        ) : null,
      )}
    </div>
  )
}
