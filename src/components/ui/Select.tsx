import { useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Popover } from './Popover'
import { Text } from './Text'

export interface SelectOption {
  value: string
  label: string
  /** Right-aligned secondary text — counts, rates, codes. */
  meta?: string
  icon?: ReactNode
  /** Groups options under a heading in the panel. */
  group?: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  /** Adds a filter input once the list is long enough to need one. */
  searchable?: boolean
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
  panelClassName?: string
  'aria-label'?: string
  /** Rendered before the selected label in the trigger — e.g. "Project:". */
  prefixLabel?: string
}

/**
 * Custom select. Replaces the native control so trigger, panel and options
 * carry the same tokens as the rest of the app in both themes, and so
 * options can show icons and a meta column.
 */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'Select',
  searchable,
  disabled,
  size = 'md',
  className,
  panelClassName,
  prefixLabel,
  ...rest
}: SelectProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const selected = options.find((o) => o.value === value)
  const autoSearch = searchable ?? options.length > 8

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return options
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.meta?.toLowerCase().includes(q))
  }, [options, query])

  const grouped = useMemo(() => {
    const map = new Map<string, SelectOption[]>()
    for (const opt of filtered) {
      const key = opt.group ?? ''
      const list = map.get(key) ?? []
      list.push(opt)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [filtered])

  const close = () => {
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center justify-between gap-1.5 rounded-md bg-surface text-base text-fg',
          'shadow-xs ring-1 ring-inset ring-line transition-[box-shadow,background-color]',
          'hover:ring-line-strong focus-visible:ring-2 focus-visible:ring-accent',
          'disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-fg-faint',
          size === 'sm' ? 'h-9 px-3' : 'h-10 px-3.5',
          open && 'ring-2 ring-accent',
          className ?? 'w-full',
        )}
        {...rest}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {selected?.icon && <span className="shrink-0 text-fg-subtle">{selected.icon}</span>}
          {prefixLabel && <span className="shrink-0 text-fg-subtle">{prefixLabel}</span>}
          <span className={cn('truncate', !selected && 'text-fg-faint')}>{selected?.label ?? placeholder}</span>
        </span>
        <ChevronDown size={14} className={cn('shrink-0 text-fg-subtle transition-transform', open && 'rotate-180')} />
      </button>

      <Popover
        open={open}
        onClose={close}
        anchorRef={triggerRef}
        matchWidth
        className={cn('min-w-[200px]', panelClassName)}
      >
        {autoSearch && (
          <div className="sticky top-0 -m-1 mb-1 border-b border-line bg-surface-raised p-1.5">
            <div className="relative">
              <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-fg-subtle" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter"
                className="h-9 w-full rounded-lg bg-surface-sunken pl-8 pr-3 text-base text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="px-2 py-6 text-center">
            <Text variant="bodySm" tone="subtle">
              No matches
            </Text>
          </div>
        )}

        {grouped.map(([group, opts]) => (
          <div key={group || 'ungrouped'}>
            {group && (
              <div className="px-2 pb-1 pt-2">
                <Text variant="label" tone="faint">
                  {group}
                </Text>
              </div>
            )}
            {opts.map((opt) => {
              const isSelected = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(opt.value)
                    close()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-base transition-colors',
                    isSelected ? 'bg-surface-selected text-fg' : 'text-fg hover:bg-surface-hover',
                  )}
                >
                  {opt.icon && <span className="shrink-0 text-fg-subtle">{opt.icon}</span>}
                  <span className="min-w-0 flex-1 truncate">{opt.label}</span>
                  {opt.meta && <span className="shrink-0 text-sm tabular-nums text-fg-faint">{opt.meta}</span>}
                  {isSelected && <Check size={14} className="shrink-0 text-accent-fg" />}
                </button>
              )
            })}
          </div>
        ))}
      </Popover>
    </>
  )
}
