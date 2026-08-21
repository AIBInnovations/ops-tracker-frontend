import { create } from 'zustand'

export type Theme = 'light' | 'dark'
export type Density = 'compact' | 'comfortable'

const THEME_KEY = 'ppc.theme'
const DENSITY_KEY = 'ppc.density'

function read<T extends string>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  return (window.localStorage.getItem(key) as T | null) ?? fallback
}

/** Applied to <html> so the token overrides in tokens.css take effect. */
export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
}

interface UiState {
  theme: Theme
  density: Density
  commandOpen: boolean

  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setDensity: (density: Density) => void
  setCommandOpen: (open: boolean) => void
}

/**
 * Chrome-level preferences. Kept out of useAppStore so a schedule recompute
 * never re-renders on a theme toggle, and vice versa.
 */
export const useUiStore = create<UiState>((set, get) => ({
  theme: read<Theme>(THEME_KEY, 'light'),
  density: read<Density>(DENSITY_KEY, 'comfortable'),
  commandOpen: false,

  setTheme: (theme) => {
    applyTheme(theme)
    window.localStorage.setItem(THEME_KEY, theme)
    set({ theme })
  },

  toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),

  setDensity: (density) => {
    window.localStorage.setItem(DENSITY_KEY, density)
    set({ density })
  },

  setCommandOpen: (commandOpen) => set({ commandOpen }),
}))
