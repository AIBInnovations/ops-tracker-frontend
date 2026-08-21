import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { Text } from './Text'

interface PageProps {
  title: string
  subtitle?: ReactNode
  titleAccessory?: ReactNode
  actions?: ReactNode
  children: ReactNode
  maxWidth?: 'narrow' | 'default' | 'wide'
  /** Rendered flush under the header — filter strips, tab bars. */
  toolbar?: ReactNode
}

const widthClass = {
  narrow: 'max-w-[820px]',
  default: 'max-w-[1400px]',
  wide: 'max-w-none',
} as const

export function Page({
  title,
  subtitle,
  titleAccessory,
  actions,
  children,
  maxWidth = 'default',
  toolbar,
}: PageProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className={cn('mx-auto w-full px-5 pb-12 pt-5 lg:px-6', widthClass[maxWidth])}>
        <header className="mb-5">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                <Text as="h1" variant="pageTitle">
                  {title}
                </Text>
                {titleAccessory}
              </div>
              {subtitle && (
                <Text as="p" variant="bodyMd" tone="muted" className="mt-1 block max-w-[70ch]">
                  {subtitle}
                </Text>
              )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
          {toolbar && <div className="mt-4">{toolbar}</div>}
        </header>
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </div>
  )
}
