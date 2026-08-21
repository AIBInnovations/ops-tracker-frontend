import { useId, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Text'

/**
 * The violet feature cards. These carry their own foreground because they sit
 * on a gradient rather than a surface token, so nothing inside them may use
 * `text-fg`-family classes.
 */

interface TrendCardProps {
  label: string
  value: ReactNode
  caption?: ReactNode
  values: number[]
  to?: string
  tone?: 'accent' | 'ink'
  className?: string
}

/**
 * Gradient hero with a filled trend wave — the "how is the week shaping up"
 * card. The wave is drawn as a smoothed path so it reads as a shape rather
 * than a data-precise line; exact figures live in the tiles beside it.
 */
export function TrendCard({ label, value, caption, values, to, tone = 'accent', className }: TrendCardProps) {
  const fillId = useId()
  const width = 240
  const height = 92

  const path = smoothPath(values, width, height)

  const body = (
    <>
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white/70">{label}</p>
          <p className="mt-1.5 font-display text-3xl font-bold tabular-nums text-white">{value}</p>
          {caption && <p className="mt-1 truncate text-sm text-white/65">{caption}</p>}
        </div>
        {to && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors group-hover:bg-white/30">
            <ArrowUpRight size={16} />
          </span>
        )}
      </div>

      {path && (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[92px] w-full"
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${path} L${width},${height} L0,${height} Z`} fill={`url(#${fillId})`} />
          <path
            d={path}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}
    </>
  )

  const base = cn(
    'group relative flex min-h-[164px] min-w-0 flex-col overflow-hidden rounded-2xl p-5',
    tone === 'ink' ? 'bg-ink' : 'bg-brand shadow-glow',
    className,
  )

  return to ? (
    <Link to={to} className={cn(base, 'transition-transform duration-200 hover:-translate-y-0.5')}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  )
}

interface RingCardProps {
  title: string
  subtitle?: ReactNode
  /** 0–100. Drives the ring sweep. */
  percent: number
  centerLabel?: ReactNode
  stats?: { label: string; value: ReactNode }[]
  to?: string
  className?: string
}

/**
 * Light gauge panel — a single ratio drawn as a violet arc on a soft track,
 * with the figure in the middle. Kept on a white surface so the dashboard
 * carries one solid accent panel, not three competing ones.
 */
export function RingCard({ title, subtitle, percent, centerLabel, stats, to, className }: RingCardProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const radius = 54
  const circumference = 2 * Math.PI * radius
  // Three-quarter sweep, so the gap reads as a gauge rather than a donut.
  const arc = 0.75
  const gradientId = useId()

  const body = (
    <div className="flex flex-1 flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Text as="h2" variant="headingMd">
            {title}
          </Text>
          {subtitle && (
            <Text as="p" variant="bodySm" tone="subtle" className="mt-0.5 block">
              {subtitle}
            </Text>
          )}
        </div>
        {to && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-fg-subtle transition-colors group-hover:bg-accent group-hover:text-accent-on">
            <ArrowUpRight size={15} />
          </span>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center py-4">
        <div className="relative">
          <svg width={140} height={140} viewBox="0 0 140 140" aria-hidden="true" className="rotate-[135deg]">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgb(var(--c-accent))" />
                <stop offset="100%" stopColor="rgb(var(--c-accent) / 0.55)" />
              </linearGradient>
            </defs>
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="rgb(var(--c-accent-track))"
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={`${circumference * arc} ${circumference}`}
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth={16}
              strokeLinecap="round"
              strokeDasharray={`${circumference * arc * (clamped / 100)} ${circumference}`}
              className="transition-[stroke-dasharray] duration-700 ease-out"
            />
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-3xl font-bold tabular-nums text-fg">{Math.round(clamped)}%</span>
            {centerLabel && (
              <span className="mt-0.5 text-center text-sm font-medium text-fg-subtle">{centerLabel}</span>
            )}
          </span>
        </div>
      </div>

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 gap-3 border-t border-line-subtle pt-4">
          {stats.map((stat) => (
            <div key={stat.label} className="min-w-0">
              <p className="truncate text-2xs font-bold uppercase tracking-[0.08em] text-fg-faint">{stat.label}</p>
              <p className="mt-0.5 truncate font-display text-md font-bold tabular-nums text-fg">{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const base = cn(
    'group flex min-w-0 flex-col rounded-2xl bg-surface p-5 shadow-card',
    className,
  )

  return to ? (
    <Link to={to} className={cn(base, 'transition-shadow duration-200 hover:shadow-md')}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  )
}

interface StatTileProps {
  label: string
  value: ReactNode
  icon: ReactNode
  tone?: 'accent' | 'pink' | 'ink'
  to?: string
  className?: string
}

/** Small gradient square — the reference's paired "1.1K / 10K" tiles. */
export function StatTile({ label, value, icon, tone = 'accent', to, className }: StatTileProps) {
  const body = (
    <>
      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white">{icon}</span>
      <div className="mt-auto">
        <p className="font-display text-2xl font-bold tabular-nums text-white">{value}</p>
        <p className="mt-0.5 text-sm font-medium leading-snug text-white/70">{label}</p>
      </div>
      <span className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors group-hover:bg-white/30">
        <ArrowUpRight size={15} />
      </span>
    </>
  )

  const base = cn(
    'group relative flex min-h-[160px] min-w-0 flex-col overflow-hidden rounded-2xl p-5',
    tone === 'pink' ? 'bg-brand-deep shadow-glow' : tone === 'ink' ? 'bg-ink' : 'bg-brand shadow-glow',
    className,
  )

  return to ? (
    <Link to={to} className={cn(base, 'transition-transform duration-200 hover:-translate-y-0.5')}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  )
}

/**
 * Catmull-Rom style smoothing. Recharts is overkill for a decorative wave,
 * and a raw polyline reads as jagged at this size.
 */
function smoothPath(values: number[], width: number, height: number): string | null {
  if (values.length < 2) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const top = height * 0.28
  const usable = height - top - 10

  const pts = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: top + (1 - (v - min) / range) * usable,
  }))

  let d = `M${pts[0].x.toFixed(2)},${pts[0].y.toFixed(2)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i]
    const n = pts[i + 1]
    const cx = (p.x + n.x) / 2
    d += ` C${cx.toFixed(2)},${p.y.toFixed(2)} ${cx.toFixed(2)},${n.y.toFixed(2)} ${n.x.toFixed(2)},${n.y.toFixed(2)}`
  }
  return d
}
