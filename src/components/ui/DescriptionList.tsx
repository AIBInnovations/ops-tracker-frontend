import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { useIsWide } from '@/lib/useMediaQuery'
import { Text } from './Text'

export interface DescriptionItem {
  label: string
  value: ReactNode
}

interface DescriptionListProps {
  items: DescriptionItem[]
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  /** `rows` puts label and value on one line — for narrow drawer columns. */
  layout?: 'grid' | 'rows'
  className?: string
}

const colClass = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-3 lg:grid-cols-5',
  6: 'sm:grid-cols-3 lg:grid-cols-6',
} as const

/** Label/value pairs used across every detail surface. */
export function DescriptionList({ items, columns = 4, layout = 'grid', className }: DescriptionListProps) {
  const isWide = useIsWide()

  // A six-column grid collapsing to one column on a phone becomes twelve
  // stacked lines. Paired rows say the same thing in half the height.
  const useRows = layout === 'rows' || (!isWide && columns > 2)

  if (useRows) {
    return (
      <dl className={cn('flex flex-col divide-y divide-line-subtle', className)}>
        {items.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0">
            <dt className="shrink-0">
              <Text variant="bodySm" tone="subtle">
                {item.label}
              </Text>
            </dt>
            <dd className="m-0 min-w-0 text-right text-base">{item.value}</dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-4', colClass[columns], className)}>
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="mb-1">
            <Text variant="bodySm" tone="subtle">
              {item.label}
            </Text>
          </dt>
          <dd className="m-0 text-base">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
