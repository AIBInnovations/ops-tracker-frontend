import { useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

type Side = 'top' | 'bottom' | 'left' | 'right'

interface TooltipProps {
  content: ReactNode
  side?: Side
  /** Delay before showing, so cursor sweeps don't flash tooltips. */
  delay?: number
  className?: string
  children: ReactNode
}

/**
 * Lightweight hover/focus tooltip. Renders through a portal so it escapes
 * table and timeline overflow containers.
 */
export function Tooltip({ content, side = 'top', delay = 250, className, children }: TooltipProps) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)

  const show = () => {
    timer.current = setTimeout(() => {
      const rect = wrapRef.current?.getBoundingClientRect()
      if (!rect) return
      const offset = 8
      const map: Record<Side, { top: number; left: number }> = {
        top: { top: rect.top - offset, left: rect.left + rect.width / 2 },
        bottom: { top: rect.bottom + offset, left: rect.left + rect.width / 2 },
        left: { top: rect.top + rect.height / 2, left: rect.left - offset },
        right: { top: rect.top + rect.height / 2, left: rect.right + offset },
      }
      setCoords(map[side])
    }, delay)
  }

  const hide = () => {
    clearTimeout(timer.current)
    setCoords(null)
  }

  const translate: Record<Side, string> = {
    top: 'translate(-50%, -100%)',
    bottom: 'translate(-50%, 0)',
    left: 'translate(-100%, -50%)',
    right: 'translate(0, -50%)',
  }

  return (
    <>
      <span
        ref={wrapRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="contents"
      >
        {children}
      </span>
      {coords &&
        createPortal(
          <div
            role="tooltip"
            style={{ position: 'fixed', top: coords.top, left: coords.left, transform: translate[side] }}
            className={cn(
              'z-popover max-w-[280px] rounded-md bg-fg px-2 py-1 text-sm font-medium text-fg-inverted',
              'shadow-lg animate-fade-in pointer-events-none',
              className,
            )}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}
