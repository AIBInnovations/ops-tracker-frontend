import { useMemo } from 'react'
import { useUiStore } from '@/store/useUiStore'

export interface ChartTheme {
  grid: string
  axis: string
  tick: string
  accent: string
  success: string
  warning: string
  danger: string
  cursor: string
  tooltip: React.CSSProperties
  /** Recharts styles the label and items separately from the container. */
  tooltipLabel: React.CSSProperties
  tooltipItem: React.CSSProperties
}

type ChartPalette = Omit<ChartTheme, 'tooltip' | 'tooltipLabel' | 'tooltipItem'>

const LIGHT: ChartPalette = {
  grid: '#ededf0',
  axis: '#e2e2e6',
  tick: '#5c5f62',
  accent: '#5852d8',
  success: '#188a5c',
  warning: '#bf8500',
  danger: '#cd2238',
  cursor: 'rgba(88,82,216,0.07)',
}

const DARK: ChartPalette = {
  grid: '#26262d',
  axis: '#37373f',
  tick: '#9e9eaa',
  accent: '#6f69f5',
  success: '#2eb27a',
  warning: '#e0a528',
  danger: '#eb5264',
  cursor: 'rgba(111,105,245,0.12)',
}

/**
 * Recharts takes literal colour strings rather than CSS variables, so the
 * palette has to be resolved in JS. Keeping it in one hook means charts
 * re-theme with the rest of the app instead of staying stuck in light mode.
 */
export function useChartTheme(): ChartTheme {
  const theme = useUiStore((s) => s.theme)
  return useMemo(() => {
    const base = theme === 'dark' ? DARK : LIGHT
    return {
      ...base,
      tooltip: {
        borderRadius: 8,
        border: 'none',
        background: theme === 'dark' ? '#18181c' : '#ffffff',
        color: theme === 'dark' ? '#f4f4f6' : '#1a1a1c',
        fontSize: 12,
        boxShadow:
          theme === 'dark'
            ? '0 0 0 1px rgba(255,255,255,0.06), 0 12px 32px -8px rgba(0,0,0,0.65)'
            : '0 0 0 1px rgba(18,18,23,0.07), 0 12px 32px -8px rgba(18,18,23,0.16)',
      },
      tooltipLabel: {
        color: theme === 'dark' ? '#f4f4f6' : '#1a1a1c',
        fontWeight: 570,
        marginBottom: 2,
      },
      tooltipItem: {
        color: theme === 'dark' ? '#9e9eaa' : '#5c5f62',
        padding: 0,
      },
    }
  }, [theme])
}
