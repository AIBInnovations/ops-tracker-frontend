import { useMemo } from 'react'
import { useUiStore } from '@/store/useUiStore'

export interface ChartTheme {
  grid: string
  axis: string
  tick: string
  accent: string
  /** Lighter violet for a second bar in the same family. */
  accentSoft: string
  /** Empty-capacity track behind a capsule bar. */
  track: string
  /** Coral counterpart — the second series in a two-series chart. */
  pink: string
  success: string
  warning: string
  danger: string
  cursor: string
  /** Ordered categorical ramp for charts with more than two series. */
  series: string[]
  tooltip: React.CSSProperties
  /** Recharts styles the label and items separately from the container. */
  tooltipLabel: React.CSSProperties
  tooltipItem: React.CSSProperties
}

type ChartPalette = Omit<ChartTheme, 'tooltip' | 'tooltipLabel' | 'tooltipItem'>

const LIGHT: ChartPalette = {
  grid: '#eceae6',
  axis: '#e9e7e3',
  tick: '#8c8a84',
  accent: '#f4551e',
  accentSoft: '#fbb59a',
  track: '#ffe2d6',
  /* The second column in every paired series. */
  pink: '#1a1a1a',
  success: '#1aa06b',
  warning: '#e2951b',
  danger: '#e2483f',
  cursor: 'rgba(244,85,30,0.06)',
  series: ['#f4551e', '#1a1a1a', '#fbb59a', '#7a4a36', '#1aa06b', '#e2951b'],
}

const DARK: ChartPalette = {
  grid: '#302f2d',
  axis: '#3d3c39',
  tick: '#a6a39d',
  accent: '#fa6a36',
  accentSoft: '#c9714c',
  track: '#482a1e',
  pink: '#f5f4f2',
  success: '#34c794',
  warning: '#f0b04a',
  danger: '#f47486',
  cursor: 'rgba(250,106,54,0.12)',
  series: ['#fa6a36', '#f5f4f2', '#c9714c', '#8a5236', '#34c794', '#f0b04a'],
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
        borderRadius: 14,
        border: 'none',
        padding: '10px 12px',
        background: theme === 'dark' ? '#222221' : '#ffffff',
        color: theme === 'dark' ? '#f5f4f2' : '#1a1a1a',
        fontSize: 12,
        boxShadow:
          theme === 'dark'
            ? '0 0 0 1px rgba(255,255,255,0.06), 0 18px 40px -10px rgba(0,0,0,0.65)'
            : '0 0 0 1px rgba(76,55,145,0.05), 0 18px 40px -10px rgba(76,55,145,0.18)',
      },
      tooltipLabel: {
        color: theme === 'dark' ? '#f5f4f2' : '#1a1a1a',
        fontWeight: 600,
        marginBottom: 4,
      },
      tooltipItem: {
        color: theme === 'dark' ? '#a6a39d' : '#716f6a',
        padding: 0,
      },
    }
  }, [theme])
}
