import { useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card, CardHeader } from '@/components/ui/Card'
import { Tabs } from '@/components/ui/Tabs'
import { Toolbar } from '@/components/ui/Toolbar'
import { Select } from '@/components/ui/Select'
import { StatGroup, type Segment, type SegmentTone } from '@/components/ui/StatGroup'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { AlertRow, ALERT_TYPE_LABEL } from '@/components/alerts/AlertRow'
import { useAppStore } from '@/store/useAppStore'
import { useQueryState } from '@/lib/useQueryState'
import { routes } from '@/lib/routes'
import type { AlertType } from '@/types/entities'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning', label: 'Warning' },
  { key: 'info', label: 'Info' },
]

export function AlertsPage() {
  const alerts = useAppStore((s) => s.alerts)
  const [severity, setSeverity] = useQueryState('severity')
  const [typeFilter, setTypeFilter] = useQueryState('type')

  const counts = useMemo(
    () => ({
      critical: alerts.filter((a) => a.severity === 'critical').length,
      warning: alerts.filter((a) => a.severity === 'warning').length,
      info: alerts.filter((a) => a.severity === 'info').length,
    }),
    [alerts],
  )

  /**
   * Severity says how loud an exception is; cause says what to go and fix.
   * Grouping by type surfaces the single change that clears the most rows.
   */
  const typeBreakdown = useMemo<Segment[]>(() => {
    const byType = new Map<AlertType, { count: number; tone: SegmentTone }>()
    for (const a of alerts) {
      const tone: SegmentTone = a.severity === 'critical' ? 'danger' : a.severity === 'warning' ? 'warning' : 'info'
      const entry = byType.get(a.type)
      byType.set(a.type, { count: (entry?.count ?? 0) + 1, tone: entry?.tone ?? tone })
    }
    return [...byType.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .map(([type, { count, tone }]) => ({
        label: ALERT_TYPE_LABEL[type],
        value: count,
        tone,
        to: routes.alerts({ type }),
      }))
  }, [alerts])

  const topType = useMemo(() => {
    const byType = new Map<AlertType, number>()
    for (const a of alerts) byType.set(a.type, (byType.get(a.type) ?? 0) + 1)
    const ranked = [...byType.entries()].sort((a, b) => b[1] - a[1])[0]
    return ranked ? { type: ranked[0], count: ranked[1] } : undefined
  }, [alerts])

  const scoped = alerts.filter((a) => typeFilter === 'all' || a.type === typeFilter)
  const filtered = scoped.filter((a) => severity === 'all' || a.severity === severity)

  const presentTypes = Array.from(new Set(alerts.map((a) => a.type))) as AlertType[]

  return (
    <Page
      title="Alerts and exceptions"
      subtitle="Deadline risk, overdue work, dependency blockages and profitability warnings — all derived live from the current plan."
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <StatGroup
          label="By severity"
          total={alerts.length}
          totalUnit={alerts.length === 1 ? 'exception' : 'exceptions'}
          flag={
            counts.critical > 0 ? (
              <Badge tone="danger" dot>
                {counts.critical} need a decision today
              </Badge>
            ) : (
              <Badge tone="success" dot>
                Nothing critical
              </Badge>
            )
          }
          segments={[
            { label: 'Critical', value: counts.critical, tone: 'danger', to: routes.alerts({ severity: 'critical' }) },
            { label: 'Warning', value: counts.warning, tone: 'warning', to: routes.alerts({ severity: 'warning' }) },
            { label: 'Informational', value: counts.info, tone: 'info', to: routes.alerts({ severity: 'info' }) },
          ]}
          footnote="Recomputed from the plan every time the bucket changes."
        />
        <StatGroup
          label="By cause"
          // Same 16 exceptions as the card beside it, cut a different way —
          // so the headline has to be the same number the bar adds up to.
          total={alerts.length}
          totalUnit={alerts.length === 1 ? 'exception' : 'exceptions'}
          flag={
            topType ? (
              <Badge tone="neutral">Mostly {ALERT_TYPE_LABEL[topType.type].toLowerCase()}</Badge>
            ) : undefined
          }
          segments={typeBreakdown}
          footnote="Fixing the dominant cause clears the most exceptions at once."
        />
      </div>

      <Card padding={false}>
        <CardHeader inset title="Open exceptions" subtitle="Recomputed every time the bucket changes" />
        <Tabs
          items={TABS.map((t) => ({
            ...t,
            count: t.key === 'all' ? scoped.length : scoped.filter((a) => a.severity === t.key).length,
          }))}
          active={severity}
          onChange={setSeverity}
        />
        <Toolbar
          resultLabel={`${filtered.length} of ${alerts.length} exceptions`}
          activeFilterCount={typeFilter === 'all' ? 0 : 1}
          onClear={typeFilter !== 'all' ? () => setTypeFilter('all') : undefined}
        >
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            className="w-56"
            aria-label="Exception type"
            options={[
              { value: 'all', label: 'All exception types' },
              ...presentTypes.map((t) => ({
                value: t,
                label: ALERT_TYPE_LABEL[t],
                meta: String(alerts.filter((a) => a.type === t).length),
              })),
            ]}
          />
        </Toolbar>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 size={20} />}
            title="Nothing to action here"
            description="No exceptions match the current filters."
          />
        ) : (
          <div>
            {filtered.map((a) => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </div>
        )}
      </Card>
    </Page>
  )
}
