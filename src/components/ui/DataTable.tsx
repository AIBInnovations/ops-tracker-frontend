import { useMemo, useState, type MouseEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Checkbox } from './Field'
import { Text } from './Text'

export interface Column<T> {
  key: string
  header: ReactNode
  render: (row: T) => ReactNode
  align?: 'start' | 'end' | 'center'
  width?: string
  /** Supplying this makes the column sortable. */
  sortValue?: (row: T) => string | number
  /** Pins the column while the table scrolls horizontally. */
  sticky?: boolean
  /** Hidden below this breakpoint so wide tables stay readable. */
  hideBelow?: 'md' | 'lg' | 'xl'
}

export type Density = 'compact' | 'comfortable'

export interface SortState {
  key: string
  dir: 'asc' | 'desc'
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  /** Makes the whole row navigate. Nested links and controls still win. */
  rowHref?: (row: T) => string
  /** Opens a detail surface instead of navigating — used with drawers. */
  onRowClick?: (row: T) => void
  defaultSort?: SortState
  emptyState?: ReactNode
  /** Pinned summary row beneath the body. */
  footer?: ReactNode[]
  maxHeight?: string
  density?: Density
  selectedIds?: Set<string>
  onSelectionChange?: (ids: Set<string>) => void
  /** Highlights a row without selecting it — the open drawer's subject. */
  activeId?: string
  /**
   * Fits the table to its container rather than scrolling sideways. Columns
   * share the available width and long cells truncate. For panels that must
   * not introduce a second scrollbar; full data views stay scrollable.
   */
  fluid?: boolean
  className?: string
}

const alignClass = {
  start: 'text-left',
  end: 'text-right',
  center: 'text-center',
} as const

const hideClass = {
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
} as const

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  onRowClick,
  defaultSort,
  emptyState,
  footer,
  maxHeight,
  density = 'comfortable',
  selectedIds,
  onSelectionChange,
  activeId,
  fluid = false,
  className,
}: DataTableProps<T>) {
  const navigate = useNavigate()
  const [sort, setSort] = useState<SortState | undefined>(defaultSort)

  const selectable = Boolean(onSelectionChange)
  const cellPad = density === 'compact' ? 'px-5 py-2.5' : 'px-5 py-3.5'

  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return rows
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
      return String(av).localeCompare(String(bv)) * dir
    })
  }, [rows, sort, columns])

  const toggleSort = (key: string) =>
    setSort((prev) => (prev?.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))

  const allIds = useMemo(() => sorted.map(rowKey), [sorted, rowKey])
  const allSelected = selectable && allIds.length > 0 && allIds.every((id) => selectedIds?.has(id))
  const someSelected = selectable && allIds.some((id) => selectedIds?.has(id))

  const toggleAll = () => {
    if (!onSelectionChange) return
    onSelectionChange(allSelected ? new Set() : new Set(allIds))
  }

  const toggleOne = (id: string) => {
    if (!onSelectionChange || !selectedIds) return
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, row: T) => {
    // Let nested deeplinks and controls handle their own click.
    if ((event.target as HTMLElement).closest('a, button, input, label, select')) return
    if (onRowClick) onRowClick(row)
    else if (rowHref) navigate(rowHref(row))
  }

  if (rows.length === 0 && emptyState) return <>{emptyState}</>

  const interactive = Boolean(rowHref || onRowClick)

  return (
    <div
      className={cn(fluid ? 'overflow-x-hidden' : 'overflow-x-auto', className)}
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
    >
      <table
        className={cn('w-full border-separate border-spacing-0', fluid ? 'table-fixed' : 'min-w-max')}
      >
        <thead className="sticky top-0 z-sticky">
          <tr>
            {selectable && (
              <th
                scope="col"
                className="sticky left-0 z-10 w-12 border-b border-line-subtle bg-surface-sunken px-5 py-3"
              >
                <Checkbox checked={Boolean(allSelected)} indeterminate={someSelected} onChange={toggleAll} aria-label="Select all" />
              </th>
            )}
            {columns.map((col, i) => {
              const isSorted = sort?.key === col.key
              const sortable = Boolean(col.sortValue)
              return (
                <th
                  key={col.key}
                  scope="col"
                  style={{ width: col.width }}
                  className={cn(
                    'whitespace-nowrap border-b border-line-subtle bg-surface-sunken px-5 py-3',
                    fluid && 'overflow-hidden text-ellipsis',
                    alignClass[col.align ?? 'start'],
                    col.hideBelow && hideClass[col.hideBelow],
                    col.sticky && cn('md:sticky md:z-10', selectable ? 'md:left-12' : 'md:left-0'),
                    col.sticky && i === 0 && 'md:shadow-[1px_0_0_0_rgb(var(--c-line))]',
                  )}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        'group inline-flex items-center gap-1 rounded-xs text-2xs font-bold uppercase tracking-[0.08em] transition-colors',
                        isSorted ? 'text-fg' : 'text-fg-subtle hover:text-fg',
                        col.align === 'end' && 'flex-row-reverse',
                      )}
                    >
                      {col.header}
                      {isSorted ? (
                        sort!.dir === 'asc' ? (
                          <ArrowUp size={11} strokeWidth={2.5} />
                        ) : (
                          <ArrowDown size={11} strokeWidth={2.5} />
                        )
                      ) : (
                        <ChevronsUpDown
                          size={11}
                          strokeWidth={2.5}
                          className="opacity-0 transition-opacity group-hover:opacity-50"
                        />
                      )}
                    </button>
                  ) : (
                    <Text variant="label" tone="subtle">
                      {col.header}
                    </Text>
                  )}
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-5 py-14 text-center">
                <Text variant="bodyMd" tone="subtle">
                  No records match the current filters
                </Text>
              </td>
            </tr>
          )}
          {sorted.map((row) => {
            const id = rowKey(row)
            const isSelected = selectedIds?.has(id)
            const isActive = activeId === id
            return (
              <tr
                key={id}
                onClick={(e) => handleRowClick(e, row)}
                aria-selected={isSelected}
                className={cn(
                  'group transition-colors',
                  interactive && 'cursor-pointer',
                  isActive
                    ? 'bg-surface-selected'
                    : isSelected
                      ? 'bg-accent-soft/60'
                      : interactive && 'hover:bg-surface-hover',
                )}
              >
                {selectable && (
                  <td
                    className={cn(
                      'sticky left-0 z-10 w-12 border-b border-line-subtle px-5',
                      density === 'compact' ? 'py-2.5' : 'py-3.5',
                      isActive ? 'bg-surface-selected' : isSelected ? 'bg-[rgb(var(--c-accent-soft))]' : 'bg-surface group-hover:bg-surface-hover',
                    )}
                  >
                    <Checkbox checked={Boolean(isSelected)} onChange={() => toggleOne(id)} aria-label={`Select ${id}`} />
                  </td>
                )}
                {columns.map((col, i) => (
                  <td
                    key={col.key}
                    className={cn(
                      'whitespace-nowrap border-b border-line-subtle align-middle text-base',
                      fluid && 'overflow-hidden text-ellipsis',
                      cellPad,
                      alignClass[col.align ?? 'start'],
                      col.hideBelow && hideClass[col.hideBelow],
                      col.sticky &&
                        cn(
                          'md:sticky md:z-10',
                          selectable ? 'md:left-12' : 'md:left-0',
                          isActive
                            ? 'bg-surface-selected'
                            : isSelected
                              ? 'bg-[rgb(var(--c-accent-soft))]'
                              : 'bg-surface group-hover:bg-surface-hover',
                        ),
                      col.sticky && i === 0 && 'md:shadow-[1px_0_0_0_rgb(var(--c-line-subtle))]',
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>

        {footer && (
          <tfoot>
            <tr>
              {selectable && <td className="border-t border-line bg-surface-sunken" />}
              {footer.map((cell, i) => (
                <td
                  key={i}
                  className={cn(
                    'whitespace-nowrap border-t border-line bg-surface-sunken px-5 py-3 text-base font-semibold',
                    alignClass[columns[i]?.align ?? 'start'],
                    columns[i]?.hideBelow && hideClass[columns[i].hideBelow!],
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
