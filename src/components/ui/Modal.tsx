import { useCallback, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useEscapeKey, useFocusTrap, useLockBodyScroll } from '@/lib/useDismissable'
import { Button } from './Button'
import { Text } from './Text'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

const widthClass: Record<ModalSize, string> = {
  sm: 'max-w-[420px]',
  md: 'max-w-[560px]',
  lg: 'max-w-[720px]',
  xl: 'max-w-[920px]',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  size?: ModalSize
  footer?: ReactNode
  children: ReactNode
  /** Off when the body renders its own edge-to-edge sections. */
  padded?: boolean
  className?: string
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  size = 'md',
  footer,
  children,
  padded = true,
  className,
}: ModalProps) {
  const close = useCallback(() => onClose(), [onClose])
  useLockBodyScroll(open)
  useEscapeKey(open, close)
  const panelRef = useFocusTrap<HTMLDivElement>(open)

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-start justify-center overflow-y-auto p-4 sm:p-6">
      <div
        className="fixed inset-0 animate-fade-in"
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
          'relative my-[6vh] flex w-full flex-col rounded-xl bg-surface shadow-modal outline-none animate-scale-in',
          widthClass[size],
          className,
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <Text as="h2" variant="headingMd">
              {title}
            </Text>
            {subtitle && (
              <Text as="p" variant="bodySm" tone="subtle" className="mt-0.5 block">
                {subtitle}
              </Text>
            )}
          </div>
          <Button variant="ghost" size="sm" icon={<X size={15} />} onClick={close} aria-label="Close" />
        </header>

        <div className={cn('max-h-[62vh] min-h-0 flex-1 overflow-y-auto', padded && 'px-5 py-4')}>{children}</div>

        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-2 rounded-b-xl border-t border-line bg-surface-sunken px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'accent'
}

/** Single-decision dialog — used wherever an action is not trivially undoable. */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm()
              onClose()
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3">
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
            tone === 'danger' ? 'bg-danger-soft text-danger-fg' : 'bg-accent-soft text-accent-fg',
          )}
        >
          <AlertTriangle size={16} />
        </span>
        <Text variant="bodyMd" tone="muted">
          {description}
        </Text>
      </div>
    </Modal>
  )
}
