import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'subtle' | 'danger' | 'link'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-white hover:bg-ink-hover active:bg-ink disabled:bg-ink/40',
  accent:
    'bg-accent text-accent-on hover:bg-accent-hover active:bg-accent-active disabled:bg-accent/40',
  secondary:
    'bg-surface text-fg ring-1 ring-inset ring-line hover:bg-surface-hover active:bg-surface-active ' +
    'disabled:text-fg-faint',
  ghost: 'bg-transparent text-fg-muted hover:bg-surface-sunken hover:text-fg active:bg-surface-active',
  subtle: 'bg-surface-sunken text-fg hover:bg-surface-active active:bg-surface-active',
  danger:
    'bg-danger text-white shadow-xs hover:brightness-110 active:brightness-95 disabled:opacity-50',
  link: 'bg-transparent px-0 text-accent-fg hover:underline underline-offset-2',
}

const sizeClass: Record<ButtonSize, string> = {
  xs: 'h-7 gap-1 rounded-full px-2.5 text-xs',
  sm: 'h-8 gap-1.5 rounded-full px-3.5 text-sm',
  md: 'h-10 gap-2 rounded-full px-4.5 text-base',
  lg: 'h-11 gap-2 rounded-full px-6 text-md',
}

const iconOnlySize: Record<ButtonSize, string> = {
  xs: 'h-7 w-7 p-0',
  sm: 'h-8 w-8 p-0',
  md: 'h-10 w-10 p-0',
  lg: 'h-11 w-11 p-0',
}

interface BaseProps {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: ReactNode
  iconAfter?: ReactNode
  fullWidth?: boolean
  loading?: boolean
  className?: string
  children?: ReactNode
}

function classesFor({
  variant = 'secondary',
  size = 'md',
  fullWidth,
  className,
  iconOnly,
}: BaseProps & { iconOnly?: boolean }) {
  return cn(
    'relative inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold',
    'transition-[background-color,box-shadow,color,opacity] duration-150',
    'disabled:pointer-events-none disabled:opacity-60',
    variantClass[variant],
    sizeClass[size],
    iconOnly && iconOnlySize[size],
    fullWidth && 'w-full',
    className,
  )
}

export interface ButtonProps
  extends BaseProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'className'> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, icon, iconAfter, fullWidth, loading, children, className, disabled, ...rest },
  ref,
) {
  const iconOnly = !children && Boolean(icon)
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={classesFor({ variant, size, fullWidth, className, iconOnly })}
      {...rest}
    >
      {loading && <Loader2 size={14} className="absolute animate-spin" />}
      <span className={cn('inline-flex items-center gap-1.5', loading && 'opacity-0')}>
        {icon}
        {children}
        {iconAfter}
      </span>
    </button>
  )
})

interface ButtonLinkProps extends BaseProps {
  to: string
  title?: string
  'aria-label'?: string
}

/** Same visual contract as Button, but navigates. */
export function ButtonLink({
  to,
  variant,
  size,
  icon,
  iconAfter,
  fullWidth,
  children,
  className,
  title,
  ...rest
}: ButtonLinkProps) {
  const iconOnly = !children && Boolean(icon)
  return (
    <Link
      to={to}
      title={title}
      className={classesFor({ variant, size, fullWidth, className, iconOnly })}
      {...rest}
    >
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {children}
        {iconAfter}
      </span>
    </Link>
  )
}
