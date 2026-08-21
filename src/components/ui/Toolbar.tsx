import { useState, type ReactNode } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { Button } from './Button'
import { Drawer } from './Drawer'
import { SearchField } from './Field'
import { Text } from './Text'

interface ToolbarProps {
  query?: string
  onQueryChange?: (value: string) => void
  placeholder?: string
  /** Filter controls. Below `md` these move into a bottom sheet. */
  children?: ReactNode
  /** Right-aligned count, e.g. "24 of 40 tasks". */
  resultLabel?: string
  /** Shown as a Clear button when any filter is active. */
  onClear?: () => void
  /** Drives the count chip on the mobile Filters button. */
  activeFilterCount?: number
  trailing?: ReactNode
  className?: string
}

/**
 * Search + filter row above a DataTable. On a phone a row of four selects
 * costs more vertical space than the first three result rows, so below `md`
 * the filters collapse into a sheet and only search stays inline.
 */
export function Toolbar({
  query,
  onQueryChange,
  placeholder = 'Search',
  children,
  resultLabel,
  onClear,
  activeFilterCount = 0,
  trailing,
  className,
}: ToolbarProps) {
  const isDesktop = useIsDesktop()
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <div className={cn('flex flex-wrap items-center gap-2.5 border-b border-line px-5 py-3.5', className)}>
        {onQueryChange && (
          <SearchField
            value={query ?? ''}
            onValueChange={onQueryChange}
            placeholder={placeholder}
            className="min-w-0 flex-1 md:w-56 md:flex-none"
            aria-label={placeholder}
          />
        )}

        {children &&
          (isDesktop ? (
            children
          ) : (
            <Button
              size="md"
              icon={<SlidersHorizontal size={14} />}
              onClick={() => setSheetOpen(true)}
              aria-label="Filters"
            >
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-2xs font-bold tabular-nums text-accent-fg">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          ))}

        {onClear && isDesktop && (
          <Button variant="ghost" size="sm" icon={<X size={13} />} onClick={onClear}>
            Clear
          </Button>
        )}

        {(resultLabel || trailing) && (
          <div className="ml-auto flex items-center gap-2 pl-2">
            {resultLabel && (
              <Text variant="bodySm" tone="subtle" numeric className="hidden sm:inline">
                {resultLabel}
              </Text>
            )}
            {trailing}
          </div>
        )}
      </div>

      {children && !isDesktop && (
        <Drawer
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          side="bottom"
          size="sm"
          title="Filters"
          subtitle={resultLabel}
          footer={
            <>
              {onClear && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    onClear()
                    setSheetOpen(false)
                  }}
                >
                  Clear all
                </Button>
              )}
              <Button variant="primary" onClick={() => setSheetOpen(false)}>
                Show results
              </Button>
            </>
          }
        >
          {/* Filters carry desktop widths (w-44 and friends); inside the
              sheet every one of them should fill the row instead. */}
          <div className="flex flex-col gap-3 p-4 [&>*]:!w-full">{children}</div>
        </Drawer>
      )}
    </>
  )
}

interface BulkActionBarProps {
  count: number
  onClear: () => void
  children: ReactNode
}

/**
 * Floating action bar for multi-select. Anchored to the viewport rather than
 * the table so the selection stays actionable no matter how far the operator
 * has scrolled down a long bucket.
 */
export function BulkActionBar({ count, onClear, children }: BulkActionBarProps) {
  if (count === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-drawer flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-full animate-toast-in items-center gap-2 overflow-x-auto rounded-xl bg-fg px-3 py-2 shadow-xl sm:gap-3">
        <span className="flex shrink-0 items-center gap-2 pl-1">
          <span className="flex h-5 min-w-5 items-center justify-center rounded-sm bg-fg-inverted/15 px-1.5 text-xs font-semibold tabular-nums text-fg-inverted">
            {count}
          </span>
          <span className="hidden text-base font-medium text-fg-inverted sm:inline">selected</span>
        </span>
        <span className="h-4 w-px shrink-0 bg-fg-inverted/20" />
        <div className="flex shrink-0 items-center gap-1">{children}</div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear selection"
          className="ml-1 shrink-0 rounded-sm p-1 text-fg-inverted/60 transition-colors hover:bg-fg-inverted/10 hover:text-fg-inverted"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

/** Compact action button that reads correctly on the dark bulk bar. */
export function BulkAction({
  icon,
  onClick,
  children,
}: {
  icon?: ReactNode
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-7 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-base font-medium text-fg-inverted transition-colors hover:bg-fg-inverted/10"
    >
      {icon}
      {children}
    </button>
  )
}
