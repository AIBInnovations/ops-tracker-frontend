import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Text } from './Text'

const itemBase =
  'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-base transition-colors ' +
  'disabled:pointer-events-none disabled:text-fg-faint'

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-2 pb-1 pt-1.5">
      <Text variant="label" tone="faint">
        {children}
      </Text>
    </div>
  )
}

export function MenuSeparator() {
  return <div className="my-1 h-px bg-line" />
}

interface MenuItemProps {
  icon?: ReactNode
  suffix?: ReactNode
  tone?: 'default' | 'danger'
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
}

export function MenuItem({ icon, suffix, tone = 'default', selected, disabled, onClick, children }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        itemBase,
        tone === 'danger'
          ? 'text-danger-fg hover:bg-danger-soft'
          : 'text-fg hover:bg-surface-hover active:bg-surface-active',
      )}
    >
      {icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center text-fg-subtle">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {selected && <Check size={14} className="shrink-0 text-accent-fg" />}
      {suffix && <span className="shrink-0 text-fg-faint">{suffix}</span>}
    </button>
  )
}

export function MenuLink({ to, icon, suffix, children }: { to: string; icon?: ReactNode; suffix?: ReactNode; children: ReactNode }) {
  return (
    <Link to={to} role="menuitem" className={cn(itemBase, 'text-fg hover:bg-surface-hover')}>
      {icon && <span className="flex h-4 w-4 shrink-0 items-center justify-center text-fg-subtle">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {suffix && <span className="shrink-0 text-fg-faint">{suffix}</span>}
    </Link>
  )
}

export function MenuList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div role="menu" className={cn('min-w-[180px]', className)}>
      {children}
    </div>
  )
}
