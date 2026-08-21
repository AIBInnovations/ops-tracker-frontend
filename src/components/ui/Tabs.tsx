import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface TabItem {
  key: string
  label: ReactNode
  count?: number
  icon?: ReactNode
}

interface TabsProps {
  items: TabItem[]
  active: string
  onChange: (key: string) => void
  /** `underline` for page-level navigation, `pill` for filter strips. */
  variant?: 'underline' | 'pill'
  className?: string
}

export function Tabs({ items, active, onChange, variant = 'underline', className }: TabsProps) {
  if (variant === 'pill') {
    return (
      <div className={cn('no-scrollbar flex items-center gap-1 overflow-x-auto', className)}>
        {items.map((item) => {
          const isActive = item.key === active
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onChange(item.key)}
              className={cn(
                'inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-surface-selected text-accent-fg'
                  : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
              )}
            >
              {item.icon}
              {item.label}
              {item.count !== undefined && (
                <span
                  className={cn(
                    'rounded-xs px-1 text-2xs font-semibold tabular-nums',
                    isActive ? 'bg-accent/15 text-accent-fg' : 'bg-surface-sunken text-fg-subtle',
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={cn('no-scrollbar flex items-center gap-4 overflow-x-auto border-b border-line px-4', className)}>
      {items.map((item) => {
        const isActive = item.key === active
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'relative inline-flex h-9 shrink-0 items-center gap-1.5 text-base font-medium transition-colors',
              isActive ? 'text-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-xs px-1 text-2xs font-semibold tabular-nums',
                  isActive ? 'bg-accent-soft text-accent-fg' : 'bg-surface-sunken text-fg-subtle',
                )}
              >
                {item.count}
              </span>
            )}
            <span
              className={cn(
                'absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-colors',
                isActive ? 'bg-accent' : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
