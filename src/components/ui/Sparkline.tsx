import { useId } from 'react'
import { cn } from '@/lib/cn'

interface SparklineProps {
  values: number[]
  tone?: 'accent' | 'success' | 'warning' | 'danger'
  height?: number
  className?: string
}

const stroke: Record<NonNullable<SparklineProps['tone']>, string> = {
  accent: 'rgb(var(--c-accent))',
  success: 'rgb(var(--c-success))',
  warning: 'rgb(var(--c-warning))',
  danger: 'rgb(var(--c-danger))',
}

/**
 * Trend shape only — no axes, no ticks. Used inside metric tiles where the
 * exact value is already spelled out above and only the direction matters.
 */
export function Sparkline({ values, tone = 'accent', height = 28, className }: SparklineProps) {
  const gradientId = useId()
  if (values.length < 2) return null

  const width = 100
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)

  const points = values.map((v, i) => [i * step, height - ((v - min) / range) * (height - 4) - 2] as const)
  const line = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('w-full', className)}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke[tone]} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke[tone]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke[tone]}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
