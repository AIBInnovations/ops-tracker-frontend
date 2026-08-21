import { useSyncExternalStore } from 'react'

/**
 * Reads a media query reactively. Used where a breakpoint has to change
 * behaviour rather than just styling — a frozen table column, a chart axis,
 * a filter row that becomes a sheet — which CSS alone cannot express.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    // Server/prerender has no viewport; assume desktop so the dense layout
    // is what hydrates, then correct on the client if the query says otherwise.
    () => true,
  )
}

/** Tailwind's `md` — the point where the sidebar rail appears. */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 768px)')
}

/** Tailwind's `sm` — the point where two-column layouts start to fit. */
export function useIsWide(): boolean {
  return useMediaQuery('(min-width: 640px)')
}
