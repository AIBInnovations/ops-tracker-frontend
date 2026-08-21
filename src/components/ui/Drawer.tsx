import { useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useEscapeKey, useFocusTrap, useLockBodyScroll } from '@/lib/useDismissable'
import { Button } from './Button'
import { Text } from './Text'

export type DrawerSide = 'right' | 'bottom'
export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl'

const rightWidth: Record<DrawerSize, string> = {
  sm: 'w-full max-w-[380px]',
  md: 'w-full max-w-[480px]',
  lg: 'w-full max-w-[620px]',
  xl: 'w-full max-w-[820px]',
}

const bottomHeight: Record<DrawerSize, string> = {
  sm: 'h-[38vh]',
  md: 'h-[55vh]',
  lg: 'h-[72vh]',
  xl: 'h-[88vh]',
}

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  /** Pinned beside the close button — status badges, quick actions. */
  titleAccessory?: ReactNode
  side?: DrawerSide
  size?: DrawerSize
  footer?: ReactNode
  children: ReactNode
  className?: string
}

/**
 * Side and bottom sheet. The right drawer is the app's detail surface —
 * inspecting a task or machine never costs the operator their place in the
 * list. The bottom drawer carries wide, table-shaped content that would be
 * cramped in a 480px column.
 */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  titleAccessory,
  side = 'right',
  size = 'md',
  footer,
  children,
  className,
}: DrawerProps) {
  const close = useCallback(() => onClose(), [onClose])
  useLockBodyScroll(open)
  useEscapeKey(open, close)
  const panelRef = useFocusTrap<HTMLDivElement>(open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-drawer">
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ backgroundColor: 'rgb(var(--overlay) / var(--overlay-opacity))' }}
        onClick={close}
        role="presentation"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={cn(
          'absolute flex flex-col bg-surface shadow-modal outline-none',
          side === 'right'
            ? cn('inset-y-0 right-0 animate-slide-right border-l border-line', rightWidth[size])
            : cn('inset-x-0 bottom-0 animate-slide-up rounded-t-3xl border-t border-line', bottomHeight[size]),
          className,
        )}
      >
        {side === 'bottom' && (
          <div className="flex justify-center pt-2.5">
            <span className="h-1 w-9 rounded-full bg-line-strong" />
          </div>
        )}

        <header
          className={cn(
            'flex shrink-0 items-start justify-between gap-3 border-b border-line px-4',
            side === 'bottom' ? 'py-3' : 'py-3.5',
          )}
        >
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <Text as="h2" variant="headingMd" truncate>
                {title}
              </Text>
              {titleAccessory}
            </div>
            {subtitle && (
              <Text as="p" variant="bodySm" tone="subtle" className="mt-0.5 block">
                {subtitle}
              </Text>
            )}
          </div>
          <Button variant="ghost" size="sm" icon={<X size={15} />} onClick={close} aria-label="Close" />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-line bg-surface-sunken px-4 py-3">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** Padded body block — most drawer content wants this, tables do not. */
export function DrawerBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('p-4', className)}>{children}</div>
}

/** Divided region inside a drawer, with an optional heading. */
export function DrawerSection({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn('border-b border-line-subtle px-4 py-3.5 last:border-b-0', className)}>
      {title && (
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <Text variant="label" tone="faint">
            {title}
          </Text>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}
