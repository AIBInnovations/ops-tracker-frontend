import { ArrowRight, PackageCheck } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ButtonLink } from '@/components/ui/Button'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Text } from '@/components/ui/Text'
import { Avatar } from '@/components/ui/Avatar'
import { ProjectLink } from '@/components/links/EntityLinks'
import { formatDate } from '@/lib/format'
import { routes } from '@/lib/routes'
import type { ProjectFulfillmentRow } from '@/lib/selectors'

/** Days between the projected finish and the committed deadline. */
function slackDays(row: ProjectFulfillmentRow): number | undefined {
  if (!row.expectedCompletion) return undefined
  const deadline = new Date(`${row.project.deadline}T17:00:00`)
  return (deadline.getTime() - row.expectedCompletion.getTime()) / 86_400_000
}

export function FulfillmentCard({ rows }: { rows: ProjectFulfillmentRow[] }) {
  const columns: Column<ProjectFulfillmentRow>[] = [
    {
      key: 'client',
      header: 'Client',
      sticky: true,
      width: '220px',
      sortValue: (r) => r.client?.name ?? '',
      render: (r) =>
        r.client ? (
          <div className="flex items-center gap-2.5">
            <Avatar name={r.client.name} size="sm" square />
            <div className="min-w-0">
              <Text variant="bodyMd" truncate className="font-medium">
                {r.client.name}
              </Text>
              <Text variant="bodySm" tone="faint" className="block font-mono">
                {r.client.code}
              </Text>
            </div>
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'project',
      header: 'Project',
      sortValue: (r) => r.project.name,
      render: (r) => <ProjectLink id={r.project.id} />,
    },
    {
      key: 'expected',
      header: 'Expected completion',
      sortValue: (r) => r.expectedCompletion?.getTime() ?? 0,
      render: (r) => (
        <span className="tabular-nums">
          {r.expectedCompletion ? formatDate(r.expectedCompletion.toISOString()) : '—'}
        </span>
      ),
    },
    {
      key: 'deadline',
      header: 'Deadline',
      sortValue: (r) => r.project.deadline,
      render: (r) => <span className="tabular-nums">{formatDate(r.project.deadline)}</span>,
    },
    {
      key: 'slack',
      header: 'Slack',
      align: 'end',
      hideBelow: 'lg',
      sortValue: (r) => slackDays(r) ?? 999,
      render: (r) => {
        const slack = slackDays(r)
        if (slack === undefined) return <span className="text-fg-faint">—</span>
        const days = Math.round(slack)
        return (
          <span
            className={`tabular-nums font-medium ${
              days < 0 ? 'text-danger-fg' : days < 2 ? 'text-warning-fg' : 'text-fg-muted'
            }`}
          >
            {days >= 0 ? `+${days}d` : `${days}d`}
          </span>
        )
      },
    },
    {
      key: 'status',
      header: 'Fulfillment',
      sortValue: (r) => (r.overdue ? 0 : r.atRisk ? 1 : 2),
      render: (r) =>
        r.overdue ? (
          <Badge tone="danger" dot>
            Past deadline
          </Badge>
        ) : r.atRisk ? (
          <Badge tone="warning" dot>
            Tight
          </Badge>
        ) : (
          <Badge tone="success" dot>
            On schedule
          </Badge>
        ),
    },
  ]

  return (
    <Card padding={false}>
      <CardHeader
        inset
        divider
        title="Order fulfillment"
        subtitle="When each client's work finishes, rolled up from the live schedule"
        action={
          <ButtonLink to={routes.clients()} size="sm" variant="ghost" iconAfter={<ArrowRight size={13} />}>
            All clients
          </ButtonLink>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.project.id}
        rowHref={(r) => routes.project(r.project.id)}
        defaultSort={{ key: 'status', dir: 'asc' }}
        emptyState={<EmptyState icon={<PackageCheck size={20} />} title="No orders in the book yet" size="sm" />}
      />
    </Card>
  )
}
