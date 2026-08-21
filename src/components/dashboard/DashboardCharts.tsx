import { useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardHeader } from '@/components/ui/Card'
import { Text } from '@/components/ui/Text'
import { useChartTheme } from '@/lib/useChartTheme'
import { formatCurrency, formatHours } from '@/lib/format'
import type { DailySlice, TaskRow } from '@/lib/selectors'

/** Two-dot legend, sat in the card header as in the reference. */
function SeriesLegend({ a, b }: { a: string; b: string }) {
  const chart = useChartTheme()
  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: chart.accent }} />
        <Text variant="bodySm" tone="subtle">
          {a}
        </Text>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ background: chart.pink }} />
        <Text variant="bodySm" tone="subtle">
          {b}
        </Text>
      </span>
    </div>
  )
}

const axisTick = (fill: string) => ({ fontSize: 11, fill, fontWeight: 500 })

/** Order names are long; the axis gets a short form and the tooltip the rest. */
function shortLabel(name: string): string {
  const clean = name.replace(/^R&D\s*—\s*/, '')
  return clean.length > 12 ? `${clean.slice(0, 11)}…` : clean
}

/**
 * Task status split per project — outstanding work against completed, drawn as
 * paired columns so every chart on the page shares one mark.
 */
export function ProjectStatusChart({ rows }: { rows: TaskRow[] }) {
  const chart = useChartTheme()

  const data = useMemo(() => {
    const byProject = new Map<string, { name: string; outstanding: number; done: number }>()
    for (const row of rows) {
      if (!row.project) continue
      const entry = byProject.get(row.project.id) ?? { name: shortLabel(row.project.name), outstanding: 0, done: 0 }
      if (row.task.status === 'completed') entry.done += 1
      else entry.outstanding += 1
      byProject.set(row.project.id, entry)
    }
    return [...byProject.values()]
      .sort((a, b) => b.outstanding + b.done - (a.outstanding + a.done))
      .slice(0, 7)
  }, [rows])

  return (
    <Card className="flex flex-col">
      <CardHeader title="Work by project" subtitle="Outstanding tasks against completed" action={<SeriesLegend a="Outstanding" b="Completed" />} />
      <div className="min-h-[240px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: -8, bottom: 0 }} barGap={4} barCategoryGap="30%">
            <CartesianGrid stroke={chart.grid} strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="name"
              tick={axisTick(chart.tick)}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-24}
              textAnchor="end"
              height={70}
            />
            <YAxis tick={axisTick(chart.tick)} axisLine={false} tickLine={false} width={38} allowDecimals={false} />
            <RechartsTooltip
              cursor={{ fill: chart.cursor }}
              contentStyle={chart.tooltip}
              labelStyle={chart.tooltipLabel}
              itemStyle={chart.tooltipItem}
              formatter={(value, name) => [`${value} tasks`, name === 'outstanding' ? 'Outstanding' : 'Completed']}
            />
            <Bar isAnimationActive={false} dataKey="outstanding" fill={chart.accent} radius={[6, 6, 0, 0]} maxBarSize={14} />
            <Bar isAnimationActive={false} dataKey="done" fill={chart.pink} radius={[6, 6, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

/** Scheduled load per day, split into running work and idle capacity. */
export function DailyLoadChart({ series, capacityPerDay }: { series: DailySlice[]; capacityPerDay: number }) {
  const chart = useChartTheme()

  const data = useMemo(
    () =>
      series.map((d) => ({
        label: d.date.toLocaleDateString('en-IN', { weekday: 'short' }),
        scheduled: Math.round(d.hours * 10) / 10,
        spare: Math.max(0, Math.round((capacityPerDay - d.hours) * 10) / 10),
      })),
    [series, capacityPerDay],
  )

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Daily load"
        subtitle="Scheduled hours against spare capacity"
        action={<SeriesLegend a="Scheduled" b="Spare" />}
      />
      <div className="min-h-[240px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barGap={4} barCategoryGap="30%">
            <CartesianGrid stroke={chart.grid} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" tick={axisTick(chart.tick)} axisLine={false} tickLine={false} height={32} />
            <YAxis tick={axisTick(chart.tick)} axisLine={false} tickLine={false} width={40} />
            <RechartsTooltip
              cursor={{ fill: chart.cursor }}
              contentStyle={chart.tooltip}
              labelStyle={chart.tooltipLabel}
              itemStyle={chart.tooltipItem}
              formatter={(value, name) => [formatHours(Number(value)), name === 'scheduled' ? 'Scheduled' : 'Spare']}
            />
            <Bar isAnimationActive={false} dataKey="scheduled" fill={chart.accent} radius={[6, 6, 0, 0]} maxBarSize={14} />
            <Bar isAnimationActive={false} dataKey="spare" fill={chart.pink} radius={[6, 6, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export function ProfitLossChart({ series }: { series: DailySlice[] }) {
  const chart = useChartTheme()

  const data = useMemo(
    () =>
      series.map((d) => ({
        label: d.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        revenue: Math.round(d.revenue),
        cost: Math.round(d.cost),
      })),
    [series],
  )

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Profit and loss"
        subtitle="Scheduled revenue against machine cost"
        action={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: chart.accent }} />
              <Text variant="bodySm" tone="subtle">
                Revenue
              </Text>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: chart.pink }} />
              <Text variant="bodySm" tone="subtle">
                Cost
              </Text>
            </span>
          </div>
        }
      />
      <div className="min-h-[200px] flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -12, bottom: 0 }} barGap={4} barCategoryGap="30%">
            <CartesianGrid stroke={chart.grid} strokeDasharray="4 4" vertical={false} />
            <XAxis dataKey="label" tick={axisTick(chart.tick)} axisLine={false} tickLine={false} height={34} />
            <YAxis
              tick={axisTick(chart.tick)}
              axisLine={false}
              tickLine={false}
              width={52}
              tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
            />
            <RechartsTooltip
              cursor={{ fill: chart.cursor }}
              contentStyle={chart.tooltip}
              labelStyle={chart.tooltipLabel}
              itemStyle={chart.tooltipItem}
              formatter={(value, name) => [formatCurrency(Number(value)), name === 'revenue' ? 'Revenue' : 'Cost']}
            />
            <Bar
              isAnimationActive={false}
              dataKey="revenue"
              fill={chart.accent}
              radius={[6, 6, 0, 0]}
              maxBarSize={14}
            />
            <Bar isAnimationActive={false} dataKey="cost" fill={chart.pink} radius={[6, 6, 0, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
