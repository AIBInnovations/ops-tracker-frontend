import { useEffect, useRef } from 'react'

/** Prevents background scroll while an overlay owns the screen. */
export function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return
    const { overflow, paddingRight } = document.body.style
    const scrollbar = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbar > 0) document.body.style.paddingRight = `${scrollbar}px`
    return () => {
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
    }
  }, [active])
}

/**
 * Every open overlay, innermost last. Drawers, modals and popovers all listen
 * for Escape on `document`, so `stopPropagation` cannot order them — two
 * listeners on the same node both fire. The stack decides instead, which is
 * what keeps Escape on an open select from also closing the drawer holding it.
 */
const escapeStack: symbol[] = []

/** Closes the overlay on Escape, but only while it is the topmost one. */
export function useEscapeKey(active: boolean, onEscape: () => void) {
  // Held in a ref so an inline arrow callback does not re-register the
  // listener on every render, which would shuffle this overlay's stack order.
  const handler = useRef(onEscape)
  useEffect(() => {
    handler.current = onEscape
  })

  useEffect(() => {
    if (!active) return
    const id = Symbol('overlay')
    escapeStack.push(id)

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (escapeStack[escapeStack.length - 1] !== id) return
      e.stopPropagation()
      handler.current()
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      const i = escapeStack.indexOf(id)
      if (i !== -1) escapeStack.splice(i, 1)
    }
  }, [active])
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Keeps Tab focus inside the overlay and restores it to the element that
 * opened the overlay on close — the part of a11y most hand-rolled dialogs
 * skip, and the reason keyboard users get stranded behind a modal.
 */
export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null)
  const restoreTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return
    restoreTo.current = document.activeElement as HTMLElement | null

    const container = ref.current
    // Defer a frame so React's own `autoFocus` lands first. If it did, leave
    // that element alone; otherwise park focus on the panel itself rather than
    // the first control, which would otherwise ring the close button on open.
    const raf = requestAnimationFrame(() => {
      if (container?.contains(document.activeElement)) return
      container?.focus()
    })

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !container) return
      const items = [...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null,
      )
      if (items.length === 0) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      restoreTo.current?.focus?.()
    }
  }, [active])

  return ref
}
