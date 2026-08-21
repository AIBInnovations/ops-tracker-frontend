import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Text } from './Text'

export const controlBase =
  'w-full rounded-md bg-surface text-base text-fg placeholder:text-fg-faint ' +
  'ring-1 ring-inset ring-line shadow-xs transition-[box-shadow,background-color] ' +
  'hover:ring-line-strong ' +
  'focus:outline-none focus:ring-2 focus:ring-accent ' +
  'disabled:bg-surface-sunken disabled:text-fg-faint disabled:ring-line-subtle disabled:cursor-not-allowed'

interface FieldProps {
  label: string
  children: ReactNode
  hint?: ReactNode
  error?: string
  labelHidden?: boolean
  required?: boolean
  className?: string
}

export function Field({ label, children, hint, error, labelHidden = false, required, className }: FieldProps) {
  return (
    <label className={cn('block', className)}>
      {!labelHidden && (
        <span className="mb-1.5 flex items-center gap-1">
          <Text variant="bodySm" tone="muted" className="font-medium">
            {label}
          </Text>
          {required && <span className="text-danger-fg">*</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block">
          <Text variant="bodySm" tone="danger">
            {error}
          </Text>
        </span>
      ) : (
        hint && (
          <span className="mt-1 block">
            <Text variant="bodySm" tone="subtle">
              {hint}
            </Text>
          </span>
        )
      )}
    </label>
  )
}

export const TextField = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { prefix?: ReactNode; suffix?: ReactNode }>(
  function TextField({ className, prefix, suffix, ...props }, ref) {
    if (!prefix && !suffix) {
      return <input ref={ref} {...props} className={cn(controlBase, 'h-10 px-3.5', className)} />
    }
    return (
      <span className="relative block">
        {prefix && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-fg-subtle">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          {...props}
          className={cn(controlBase, 'h-10', prefix ? 'pl-8' : 'pl-3.5', suffix ? 'pr-10' : 'pr-3.5', className)}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-fg-subtle">
            {suffix}
          </span>
        )}
      </span>
    )
  },
)

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(controlBase, 'resize-y px-2.5 py-1.5', className)} />
}

interface SearchFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string
  onValueChange: (value: string) => void
  className?: string
}

export function SearchField({ value, onValueChange, className, ...props }: SearchFieldProps) {
  return (
    <div className={cn('relative', className)}>
      <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-subtle" />
      <input
        {...props}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(controlBase, 'h-10 pl-9 pr-9')}
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange('')}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-fg-subtle transition-colors hover:bg-surface-active hover:text-fg"
        >
          <X size={12} />
        </button>
      )}
    </div>
  )
}

export function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  className,
  ...props
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  className?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked' | 'type'>) {
  return (
    <label className={cn('inline-flex cursor-pointer select-none items-center gap-2', className)}>
      <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
        <input
          {...props}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          ref={(el) => {
            if (el) el.indeterminate = indeterminate && !checked
          }}
          className="peer h-4 w-4 cursor-pointer appearance-none rounded-xs bg-surface ring-1 ring-inset ring-line-strong transition-colors checked:bg-accent checked:ring-accent indeterminate:bg-accent indeterminate:ring-accent"
        />
        <svg
          viewBox="0 0 16 16"
          className="pointer-events-none absolute h-3 w-3 text-accent-on opacity-0 peer-checked:opacity-100"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 8.5l3.2 3.2L13 5" />
        </svg>
        <span className="pointer-events-none absolute h-0.5 w-2 rounded-full bg-accent-on opacity-0 peer-indeterminate:opacity-100" />
      </span>
      {label && <span className="text-base text-fg">{label}</span>}
    </label>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  size = 'md',
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  size?: 'sm' | 'md'
}) {
  const dims = size === 'sm' ? { track: 'h-4 w-7', knob: 'h-3 w-3', shift: 'translate-x-3' } : { track: 'h-5 w-9', knob: 'h-4 w-4', shift: 'translate-x-4' }
  return (
    <label className="inline-flex cursor-pointer select-none items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative shrink-0 rounded-full p-0.5 transition-colors',
          dims.track,
          checked ? 'bg-accent' : 'bg-line-strong',
        )}
      >
        <span
          className={cn(
            'block rounded-full bg-white shadow-xs transition-transform',
            dims.knob,
            checked && dims.shift,
          )}
        />
      </button>
      {label && <span className="text-base text-fg">{label}</span>}
    </label>
  )
}
