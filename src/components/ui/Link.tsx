import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { cn } from '@/lib/cn'

interface AppLinkProps {
  to: string
  children: ReactNode
  /** `subtle` keeps ink colour until hover — for links inside dense cells. */
  tone?: 'accent' | 'subtle'
  className?: string
  title?: string
}

export function AppLink({ to, children, tone = 'accent', className, title }: AppLinkProps) {
  return (
    <RouterLink
      to={to}
      title={title}
      className={cn(
        'rounded-xs underline-offset-2 transition-colors hover:underline',
        tone === 'accent' ? 'text-accent-fg' : 'text-fg hover:text-accent-fg',
        className,
      )}
    >
      {children}
    </RouterLink>
  )
}
