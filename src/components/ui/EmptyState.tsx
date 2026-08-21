import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Text } from './Text'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  size?: 'sm' | 'md'
  className?: string
}

export function EmptyState({ icon, title, description, action, size = 'md', className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 px-6 text-center',
        size === 'sm' ? 'py-8' : 'py-16',
        className,
      )}
    >
      {icon && (
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-surface-sunken text-fg-faint ring-1 ring-inset ring-line-subtle">
          {icon}
        </div>
      )}
      <Text variant="headingSm">{title}</Text>
      {description && (
        <div className="max-w-[36ch]">
          <Text variant="bodyMd" tone="subtle">
            {description}
          </Text>
        </div>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
