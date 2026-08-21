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
                'inline-flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-accent text-accent-on shadow-glow'
                  : 'text-fg-muted hover:bg-surface-sunken hover:text-fg',
              )}
            >
              {item.icon}
              {item.label}
              {item.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.5 text-2xs font-bold tabular-nums',
                    isActive ? 'bg-white/25 text-accent-on' : 'bg-surface-sunken text-fg-subtle',
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
    <div className={cn('no-scrollbar flex items-center gap-5 overflow-x-auto border-b border-line px-5', className)}>
      {items.map((item) => {
        const isActive = item.key === active
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              'relative inline-flex h-11 shrink-0 items-center gap-2 text-base font-semibold transition-colors',
              isActive ? 'text-accent-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-2xs font-bold tabular-nums',
                  isActive ? 'bg-accent-soft text-accent-fg' : 'bg-surface-sunken text-fg-subtle',
                )}
              >
                {item.count}
              </span>
            )}
            <span
              className={cn(
                'absolute inset-x-0 -bottom-px h-[3px] rounded-full transition-colors',
                isActive ? 'bg-accent' : 'bg-transparent',
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
