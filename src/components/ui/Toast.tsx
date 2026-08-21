import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Text } from './Text'

export type ToastTone = 'default' | 'success' | 'warning' | 'danger' | 'info'

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  /** Milliseconds before auto-dismiss. Pass 0 to require a manual dismiss. */
  duration?: number
  action?: { label: string; onClick: () => void }
}

interface ToastRecord extends ToastOptions {
  id: number
}

interface ToastContextValue {
  toast: (options: ToastOptions) => number
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneConfig: Record<ToastTone, { icon: typeof Info; className: string }> = {
  default: { icon: Info, className: 'text-fg-subtle' },
  success: { icon: CheckCircle2, className: 'text-success-fg' },
  warning: { icon: AlertTriangle, className: 'text-warning-fg' },
  danger: { icon: XCircle, className: 'text-danger-fg' },
  info: { icon: Info, className: 'text-info-fg' },
}

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const toast = useCallback(
    (options: ToastOptions) => {
      const id = nextId++
      // Keep the stack shallow — older toasts fall off rather than pile up.
      setToasts((prev) => [...prev.slice(-3), { ...options, id }])
      const duration = options.duration ?? 4500
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        )
      }
      return id
    },
    [dismiss],
  )

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          aria-live="polite"
          className="pointer-events-none fixed bottom-4 right-4 z-toast flex w-[min(380px,calc(100vw-32px))] flex-col gap-2"
        >
          {toasts.map((t) => {
            const { icon: Icon, className } = toneConfig[t.tone ?? 'default']
            return (
              <div
                key={t.id}
                role="status"
                className="pointer-events-auto flex animate-toast-in items-start gap-2.5 rounded-2xl bg-surface-raised p-4 shadow-popover"
              >
                <Icon size={16} className={cn('mt-px shrink-0', className)} />
                <div className="min-w-0 flex-1">
                  <Text variant="headingSm">{t.title}</Text>
                  {t.description && (
                    <Text variant="bodySm" tone="muted" className="mt-0.5 block">
                      {t.description}
                    </Text>
                  )}
                  {t.action && (
                    <button
                      type="button"
                      onClick={() => {
                        t.action!.onClick()
                        dismiss(t.id)
                      }}
                      className="mt-1.5 text-sm font-medium text-accent-fg underline-offset-2 hover:underline"
                    >
                      {t.action.label}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                  className="-m-0.5 shrink-0 rounded-xs p-0.5 text-fg-faint transition-colors hover:bg-surface-hover hover:text-fg"
                >
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
