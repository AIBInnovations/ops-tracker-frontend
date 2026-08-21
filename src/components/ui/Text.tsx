import type { ElementType, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type TextVariant =
  | 'display'
  | 'pageTitle'
  | 'headingLg'
  | 'headingMd'
  | 'headingSm'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodySm'
  | 'metricLg'
  | 'metric'
  | 'metricSm'
  | 'label'
  | 'mono'

export type TextTone =
  | 'default'
  | 'muted'
  | 'subtle'
  | 'faint'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inverted'

const variantClass: Record<TextVariant, string> = {
  display: 'text-4xl font-bold',
  pageTitle: 'text-2xl font-bold',
  headingLg: 'text-xl font-semibold',
  headingMd: 'text-md font-semibold',
  headingSm: 'text-base font-semibold',
  bodyLg: 'text-md font-normal',
  bodyMd: 'text-base font-normal',
  bodySm: 'text-sm font-normal',
  metricLg: 'text-3xl font-bold tabular-nums',
  metric: 'text-2xl font-bold tabular-nums',
  metricSm: 'text-lg font-semibold tabular-nums',
  label: 'text-2xs font-semibold uppercase tracking-[0.06em]',
  mono: 'font-mono text-sm',
}

const toneClass: Record<TextTone, string> = {
  default: 'text-fg',
  muted: 'text-fg-muted',
  subtle: 'text-fg-subtle',
  faint: 'text-fg-faint',
  accent: 'text-accent-fg',
  success: 'text-success-fg',
  warning: 'text-warning-fg',
  danger: 'text-danger-fg',
  inverted: 'text-fg-inverted',
}

interface TextProps {
  as?: ElementType
  variant?: TextVariant
  tone?: TextTone
  truncate?: boolean
  numeric?: boolean
  className?: string
  title?: string
  children: ReactNode
}

/**
 * Single source of truth for type. Every string renders through this so the
 * scale cannot drift into one-off font sizes scattered across pages.
 */
export function Text({
  as: Component = 'span',
  variant = 'bodyMd',
  tone = 'default',
  truncate = false,
  numeric = false,
  className,
  title,
  children,
}: TextProps) {
  return (
    <Component
      title={title}
      className={cn(
        variantClass[variant],
        toneClass[tone],
        truncate && 'block truncate',
        numeric && 'tabular-nums',
        className,
      )}
    >
      {children}
    </Component>
  )
}
