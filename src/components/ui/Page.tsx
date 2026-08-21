import { Fragment, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useBreadcrumbs } from '@/lib/useBreadcrumbs'
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
  narrow: 'max-w-[880px]',
  default: 'max-w-[1480px]',
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
  const crumbs = useBreadcrumbs()

  return (
    // Horizontal is clipped, not scrolled: wide tables and the gantt carry
    // their own overflow-x containers, so the page itself never needs one.
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
      <div className={cn('mx-auto w-full px-4 pb-14 pt-6 lg:px-6', widthClass[maxWidth])}>
        <header className="mb-6">
          {crumbs.length > 1 && (
            <nav aria-label="Breadcrumb" className="mb-2 flex min-w-0 flex-wrap items-center gap-1">
              {crumbs.map((crumb, i) => (
                <Fragment key={`${crumb.label}-${i}`}>
                  {i > 0 && <ChevronRight size={13} className="shrink-0 text-fg-faint" />}
                  {crumb.to && i < crumbs.length - 1 ? (
                    <Link
                      to={crumb.to}
                      className="shrink-0 rounded-md px-1 py-0.5 text-sm font-medium text-fg-subtle transition-colors hover:text-fg"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="min-w-0 truncate px-1 py-0.5 text-sm font-medium text-fg-muted">
                      {crumb.label}
                    </span>
                  )}
                </Fragment>
              ))}
            </nav>
          )}
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2.5">
                <Text as="h1" variant="pageTitle">
                  {title}
                </Text>
                {titleAccessory}
              </div>
              {subtitle && (
                <Text as="p" variant="bodyMd" tone="muted" className="mt-1.5 block max-w-[70ch]">
                  {subtitle}
                </Text>
              )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
          </div>
          {toolbar && <div className="mt-5">{toolbar}</div>}
        </header>
        <div className="flex flex-col gap-5">{children}</div>
      </div>
    </div>
  )
}
