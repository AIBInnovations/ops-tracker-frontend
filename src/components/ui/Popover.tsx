import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'
import { useEscapeKey } from '@/lib/useDismissable'

export type Placement = 'bottom-start' | 'bottom-end' | 'bottom' | 'top-start' | 'top-end' | 'top' | 'right' | 'left'

interface Position {
  top: number
  left: number
  /** Set when the panel should stretch to the trigger's width. */
  minWidth?: number
  maxHeight: number
}

const GAP = 6
const VIEWPORT_PAD = 8

function computePosition(
  anchor: DOMRect,
  panel: { width: number; height: number },
  placement: Placement,
  matchWidth: boolean,
): Position {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const spaceBelow = vh - anchor.bottom - GAP - VIEWPORT_PAD
  const spaceAbove = anchor.top - GAP - VIEWPORT_PAD

  let side: 'top' | 'bottom' | 'left' | 'right' = placement.startsWith('top')
    ? 'top'
    : placement.startsWith('left')
      ? 'left'
      : placement.startsWith('right')
        ? 'right'
        : 'bottom'

  // Flip vertically when the preferred side cannot hold the panel.
  if (side === 'bottom' && panel.height > spaceBelow && spaceAbove > spaceBelow) side = 'top'
  else if (side === 'top' && panel.height > spaceAbove && spaceBelow > spaceAbove) side = 'bottom'

  const maxHeight = Math.max(
    140,
    side === 'top' ? spaceAbove : side === 'bottom' ? spaceBelow : vh - 2 * VIEWPORT_PAD,
  )

  let top: number
  let left: number

  if (side === 'top') {
    top = anchor.top - Math.min(panel.height, maxHeight) - GAP
  } else if (side === 'bottom') {
    top = anchor.bottom + GAP
  } else {
    top = anchor.top
  }

  if (side === 'left') left = anchor.left - panel.width - GAP
  else if (side === 'right') left = anchor.right + GAP
  else if (placement.endsWith('-end')) left = anchor.right - panel.width
  else if (placement === 'bottom' || placement === 'top') left = anchor.left + anchor.width / 2 - panel.width / 2
  else left = anchor.left

  // Keep the panel fully on screen.
  left = Math.min(Math.max(VIEWPORT_PAD, left), Math.max(VIEWPORT_PAD, vw - panel.width - VIEWPORT_PAD))
  top = Math.min(Math.max(VIEWPORT_PAD, top), Math.max(VIEWPORT_PAD, vh - VIEWPORT_PAD - 40))

  return { top, left, minWidth: matchWidth ? anchor.width : undefined, maxHeight }
}

interface PopoverProps {
  open: boolean
  onClose: () => void
  /** The element the panel anchors to. */
  anchorRef: RefObject<HTMLElement | null>
  placement?: Placement
  /** Stretches the panel to at least the trigger width — used by Select. */
  matchWidth?: boolean
  className?: string
  children: ReactNode
  /** Escape-hatch for panels that own their own padding. */
  bare?: boolean
}

/**
 * Portal-rendered floating panel with viewport flipping. Deliberately
 * dependency-free: the app only needs anchored panels, not full collision
 * middleware, and a portal keeps panels clear of table overflow clipping.
 */
export function Popover({
  open,
  onClose,
  anchorRef,
  placement = 'bottom-start',
  matchWidth = false,
  className,
  children,
  bare = false,
}: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<Position | null>(null)

  const reposition = useCallback(() => {
    const anchor = anchorRef.current
    const panel = panelRef.current
    if (!anchor || !panel) return
    setPosition(
      computePosition(
        anchor.getBoundingClientRect(),
        { width: panel.offsetWidth, height: panel.offsetHeight },
        placement,
        matchWidth,
      ),
    )
  }, [anchorRef, placement, matchWidth])

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null)
      return
    }
    reposition()
  }, [open, reposition])

  useEffect(() => {
    if (!open) return
    const onScrollOrResize = () => reposition()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
    }
  }, [open, reposition])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      if (anchorRef.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open, onClose, anchorRef])

  // Shares the overlay stack with drawers and modals, so Escape on a select
  // opened inside a drawer closes the select and leaves the drawer standing.
  useEscapeKey(open, onClose)

  if (!open) return null

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      style={{
        position: 'fixed',
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        minWidth: position?.minWidth,
        maxHeight: position?.maxHeight,
        visibility: position ? 'visible' : 'hidden',
      }}
      className={cn(
        'z-popover overflow-y-auto rounded-lg bg-surface-raised shadow-popover animate-scale-in origin-top',
        !bare && 'p-1',
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  )
}
