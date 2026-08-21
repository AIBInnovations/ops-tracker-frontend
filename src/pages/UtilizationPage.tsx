import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Page } from '@/components/ui/Page'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatGroup, revenueSplit } from '@/components/ui/StatGroup'
import { Badge } from '@/components/ui/Badge'
import { Text } from '@/components/ui/Text'
import { Meter } from '@/components/ui/Progress'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { AppLink } from '@/components/ui/Link'
import { useAppStore } from '@/store/useAppStore'
import { buildDailySeries, computeUtilization, type MachineTypeUtilization } from '@/lib/selectors'
import { formatCurrency, formatHours, formatPercent } from '@/lib/format'
import { marginTone, profitClass, utilizationTone } from '@/lib/tone'
import { useChartTheme } from '@/lib/useChartTheme'
import { useIsWide } from '@/lib/useMediaQuery'
import { routes } from '@/lib/routes'
import { SCHEDULE_ORIGIN } from '@/engine'

const shortName = (name: string) => name.replace(/^M\/C \d+ — /, '')

export function UtilizationPage() {
  const { machineTypes, blocks } = useAppStore()
  const chart = useChartTheme()
  const isWide = useIsWide()
  const [metric, setMetric] = useState<'utilization' | 'profit'>('utilization')

  const utilization = useMemo(
    () =>
      computeUtilization(machineTypes, blocks, SCHEDULE_ORIGIN, new Date(SCHEDULE_ORIGIN.getTime() + 7 * 86_400_000)),
    [machineTypes, blocks],
  )
  const series = useMemo(() => buildDailySeries(blocks, SCHEDULE_ORIGIN, 7), [blocks])

  const totals = utilization.reduce(
    (acc, u) => ({
      machines: acc.machines + u.totalMachines,
      running: acc.running + u.runningNow,
      idle: acc.idle + u.idleNow,
      maintenance: acc.maintenance + u.maintenanceNow,
      cost: acc.cost + u.cost,
      revenue: acc.revenue + u.revenue,
      hours: acc.hours + u.scheduledHours,
    }),
    { machines: 0, running: 0, idle: 0, maintenance: 0, cost: 0, revenue: 0, hours: 0 },
  )
  const profit = totals.revenue - totals.cost
  const margin = totals.revenue > 0 ? (profit / totals.revenue) * 100 : 0

  const best = [...utilization].sort((a, b) => b.profit - a.profit)[0]

  const barColor = (v: number) =>
    ({ danger: chart.danger, warning: chart.warning, accent: chart.accent, success: chart.success, neutral: chart.tick })[
      utilizationTone(v)
    ]

  const chartData = utilization.map((u) => ({
    name: shortName(u.machineType.name),
    utilization: Math.round(u.utilizationPct),
    profit: Math.round(u.profit),
  }))

  const trendData = series.map((d) => ({
    label: d.date.toLocaleDateString('en-IN', { weekday: 'short' }),
    cost: Math.round(d.cost),
    revenue: Math.round(d.revenue),
  }))

  const columns: Column<MachineTypeUtilization>[] = [
    {
      key: 'type',
      header: 'Machine type',
      sticky: true,
      width: '260px',
      sortValue: (u) => u.machineType.name,
      render: (u) => (
        <div>
          <AppLink to={routes.machineType(u.machineType.id)} tone="subtle" className="font-medium">
            {u.machineType.name}
          </AppLink>
          <Text variant="bodySm" tone="faint" numeric className="block">
            {formatCurrency(u.machineType.hourlyRate)}/hr · {u.totalMachines} units
          </Text>
        </div>
      ),
    },
    {
      key: 'state',
      header: 'Running / Idle / Maint.',
      hideBelow: 'lg',
      sortValue: (u) => -u.runningNow,
      render: (u) => (
        <span className="tabular-nums text-fg-muted">
          <span className="font-semibold text-fg">{u.runningNow}</span> / {u.idleNow} / {u.maintenanceNow}
        </span>
      ),
    },
    {
      key: 'utilization',
      header: 'Utilization (7d)',
      width: '160px',
      sortValue: (u) => u.utilizationPct,
      render: (u) => <Meter value={u.utilizationPct} tone={utilizationTone(u.utilizationPct)} showValue />,
    },
    {
      key: 'hours',
      header: 'Scheduled hours',
      align: 'end',
      sortValue: (u) => u.scheduledHours,
      render: (u) => <span className="tabular-nums">{formatHours(u.scheduledHours)}</span>,
    },
    {
      key: 'cost',
      header: 'Cost',
      align: 'end',
      sortValue: (u) => u.cost,
      render: (u) => <span className="tabular-nums">{formatCurrency(u.cost)}</span>,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'end',
      sortValue: (u) => u.revenue,
      render: (u) => <span className="tabular-nums">{formatCurrency(u.revenue)}</span>,
    },
    {
      key: 'profit',
      header: 'Profit',
      align: 'end',
      sortValue: (u) => u.profit,
      render: (u) => (
        <span className={`font-semibold tabular-nums ${profitClass(u.profit)}`}>{formatCurrency(u.profit)}</span>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      align: 'end',
      sortValue: (u) => (u.revenue > 0 ? (u.profit / u.revenue) * 100 : 0),
      render: (u) => {
        const m = u.revenue > 0 ? (u.profit / u.revenue) * 100 : 0
        return <Badge tone={marginTone(m)}>{formatPercent(m)}</Badge>
      },
    },
  ]

  return (
    <Page
      title="Utilization and profitability"
      subtitle="Where capacity is going, and whether it is going to the right revenue."
      maxWidth="wide"
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <StatGroup
          label="Machine floor"
          total={totals.machines}
          totalUnit="units"
          flag={
            totals.maintenance > 0 ? (
              <Badge tone="warning" dot>
                {totals.maintenance} out of service
              </Badge>
            ) : undefined
          }
          segments={[
            { label: 'Running', value: totals.running, tone: 'accent', to: routes.machines() },
            { label: 'Idle', value: totals.idle, tone: 'neutral', to: routes.machines() },
            { label: 'Maintenance', value: totals.maintenance, tone: 'warning', to: routes.machines() },
          ]}
          footnote={`${formatHours(totals.hours)} of work queued across every type.`}
        />
        <StatGroup
          label="Scheduled revenue"
          total={formatCurrency(totals.revenue)}
          flag={
            <Badge tone={profit >= 0 ? 'success' : 'danger'}>{formatPercent(margin)} blended margin</Badge>
          }
          {...revenueSplit({ revenue: totals.revenue, cost: totals.cost, profit: profit }, formatCurrency)}
          footnote={
            best
              ? `Best earner: ${shortName(best.machineType.name)} at ${formatCurrency(best.profit)} profit.`
              : undefined
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader
            title={metric === 'utilization' ? 'Utilization by machine type' : 'Profit by machine type'}
            subtitle={
              metric === 'utilization'
                ? 'Scheduled hours over the next 7 days against two-shift capacity'
                : 'Revenue booked against machine cost for scheduled work'
            }
            action={
              <SegmentedControl
                size="sm"
                value={metric}
                onChange={setMetric}
                segments={[
                  { value: 'utilization' as const, label: 'Utilization' },
                  { value: 'profit' as const, label: 'Profit' },
                ]}
              />
            }
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis
                  dataKey="name"
                  // Six machine-type names cannot share a phone's width without
                  // colliding; below `sm` the tooltip carries the label instead.
                  tick={isWide ? { fontSize: 11, fill: chart.tick } : false}
                  axisLine={{ stroke: chart.axis }}
                  tickLine={false}
                  interval={0}
                  angle={isWide ? -14 : 0}
                  textAnchor="end"
                  height={isWide ? 52 : 8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chart.tick }}
                  axisLine={false}
                  tickLine={false}
                  width={metric === 'utilization' ? 44 : 60}
                  domain={metric === 'utilization' ? [0, 100] : undefined}
                  tickFormatter={(v: number) => (metric === 'utilization' ? `${v}%` : `${Math.round(v / 1000)}k`)}
                />
                <RechartsTooltip
                  cursor={{ fill: chart.cursor }}
                  contentStyle={chart.tooltip}
                  labelStyle={chart.tooltipLabel}
                  itemStyle={chart.tooltipItem}
                  labelFormatter={(label) => label}
                  formatter={(value) =>
                    metric === 'utilization'
                      ? [`${value}%`, 'Utilization']
                      : [formatCurrency(Number(value)), 'Profit']
                  }
                />
                <Bar dataKey={metric} radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {chartData.map((d, i) => (
                    <Cell
                      key={i}
                      fill={
                        metric === 'utilization'
                          ? barColor(d.utilization)
                          : d.profit >= 0
                            ? chart.success
                            : chart.danger
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Cost against revenue, day by day"
            subtitle="Scheduled blocks split across the next seven calendar days"
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.accent} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={chart.accent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chart.warning} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={chart.warning} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: chart.tick }}
                  axisLine={{ stroke: chart.axis }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: chart.tick }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
                />
                <RechartsTooltip
                  cursor={{ stroke: chart.axis }}
                  contentStyle={chart.tooltip}
                  labelStyle={chart.tooltipLabel}
                  itemStyle={chart.tooltipItem}
                  formatter={(value, name) => [formatCurrency(Number(value)), name === 'revenue' ? 'Revenue' : 'Cost']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={chart.accent}
                  strokeWidth={2}
                  fill="url(#revenueFill)"
                />
                <Area type="monotone" dataKey="cost" stroke={chart.warning} strokeWidth={2} fill="url(#costFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: chart.accent }} />
              <Text variant="bodySm" tone="subtle">
                Revenue
              </Text>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: chart.warning }} />
              <Text variant="bodySm" tone="subtle">
                Machine cost
              </Text>
            </span>
          </div>
        </Card>
      </div>

      <Card padding={false}>
        <CardHeader
          inset
          divider
          title="Cost versus revenue by machine type"
          subtitle="Across every task currently scheduled from the bucket"
        />
        <DataTable
          columns={columns}
          rows={utilization}
          rowKey={(u) => u.machineType.id}
          rowHref={(u) => routes.machineType(u.machineType.id)}
          defaultSort={{ key: 'profit', dir: 'desc' }}
          footer={[
            <span key="t">Total</span>,
            <span key="s" />,
            <span key="u" />,
            <span key="h">{formatHours(totals.hours)}</span>,
            <span key="c">{formatCurrency(totals.cost)}</span>,
            <span key="r">{formatCurrency(totals.revenue)}</span>,
            <span key="p" className={profitClass(profit)}>
              {formatCurrency(profit)}
            </span>,
            <span key="m">{formatPercent(margin)}</span>,
          ]}
        />
      </Card>
    </Page>
  )
}
