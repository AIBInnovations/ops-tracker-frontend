import { useMemo, useState } from 'react'
import { Plus, Users } from 'lucide-react'
import { Page } from '@/components/ui/Page'
import { Card } from '@/components/ui/Card'
import { Toolbar } from '@/components/ui/Toolbar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatGroup, revenueSplit } from '@/components/ui/StatGroup'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { AppLink } from '@/components/ui/Link'
import { Avatar } from '@/components/ui/Avatar'
import { ClientFormModal } from '@/components/clients/ClientFormModal'
import { useAppStore } from '@/store/useAppStore'
import { buildClientRollups, buildOrderFulfillment, buildTaskRows, type ClientRollup } from '@/lib/selectors'
import { formatCurrency, formatDate, formatPercent } from '@/lib/format'
import { profitClass } from '@/lib/tone'
import { useQueryState } from '@/lib/useQueryState'
import { routes } from '@/lib/routes'

export function ClientsPage() {
  const { clients, projects, tasks, machineTypes, blocks } = useAppStore()
  const [query, setQuery] = useQueryState('q', '')
  const [modalOpen, setModalOpen] = useState(false)

  const rollups = useMemo(() => {
    const taskRows = buildTaskRows(tasks, projects, clients, machineTypes, blocks)
    const fulfillment = buildOrderFulfillment(projects, clients, taskRows)
    return buildClientRollups(clients, projects, taskRows, fulfillment)
  }, [clients, projects, tasks, machineTypes, blocks])

  const filtered = rollups.filter(
    (r) => !query.trim() || r.client.name.toLowerCase().includes(query.trim().toLowerCase()),
  )

  const withWork = rollups.filter((r) => r.projects.length > 0).length
  const totalRevenue = rollups.reduce((s, r) => s + r.financials.revenue, 0)
  const totalProfit = rollups.reduce((s, r) => s + r.financials.profit, 0)
  const clientsAtRisk = rollups.filter((r) => r.atRiskProjects > 0).length
  const totalCost = rollups.reduce((s, r) => s + r.financials.cost, 0)
  const totalProjects = rollups.reduce((s, r) => s + r.projects.length, 0)
  const blendedMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0

  const columns: Column<ClientRollup>[] = [
    {
      key: 'client',
      header: 'Client',
      sticky: true,
      width: '240px',
      sortValue: (r) => r.client.name,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={r.client.name} size="md" square />
          <div className="min-w-0">
            <AppLink to={routes.client(r.client.id)} tone="subtle" className="truncate font-medium">
              {r.client.name}
            </AppLink>
            <Text variant="bodySm" tone="faint" className="block font-mono">
              {r.client.code}
            </Text>
          </div>
        </div>
      ),
    },
    {
      key: 'projects',
      header: 'Projects',
      align: 'end',
      sortValue: (r) => r.projects.length,
      render: (r) => <span className="tabular-nums">{r.projects.length}</span>,
    },
    {
      key: 'openTasks',
      header: 'Open tasks',
      align: 'end',
      sortValue: (r) => r.openTaskCount,
      render: (r) => (
        <span className="tabular-nums">
          {r.openTaskCount}
          <span className="ml-1 text-fg-faint">/ {r.taskCount}</span>
        </span>
      ),
    },
    {
      key: 'revenue',
      header: 'Revenue',
      align: 'end',
      sortValue: (r) => r.financials.revenue,
      render: (r) => <span className="tabular-nums">{formatCurrency(r.financials.revenue)}</span>,
    },
    {
      key: 'profit',
      header: 'Profit',
      align: 'end',
      sortValue: (r) => r.financials.profit,
      render: (r) => (
        <span className={`font-medium tabular-nums ${profitClass(r.financials.profit)}`}>
          {formatCurrency(r.financials.profit)}
        </span>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      align: 'end',
      hideBelow: 'lg',
      sortValue: (r) => r.financials.marginPct,
      render: (r) => <span className="tabular-nums">{formatPercent(r.financials.marginPct)}</span>,
    },
    {
      key: 'completion',
      header: 'All work done by',
      sortValue: (r) => r.expectedCompletion?.getTime() ?? 0,
      render: (r) => (
        <span className="tabular-nums">
          {r.expectedCompletion ? formatDate(r.expectedCompletion.toISOString()) : '—'}
        </span>
      ),
    },
    {
      key: 'risk',
      header: 'Fulfillment',
      sortValue: (r) => -r.atRiskProjects,
      render: (r) =>
        r.projects.length === 0 ? (
          <Badge tone="neutral" dot>
            No work yet
          </Badge>
        ) : r.atRiskProjects > 0 ? (
          <Badge tone="danger" dot>
            {r.atRiskProjects} at risk
          </Badge>
        ) : (
          <Badge tone="success" dot>
            On schedule
          </Badge>
        ),
    },
  ]

  return (
    <Page
      title="Clients"
      subtitle="Order book by customer, rolled up from every scheduled task."
      maxWidth="wide"
      actions={
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
          Add client
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatGroup
          label="Fulfillment"
          total={rollups.length}
          totalUnit={rollups.length === 1 ? 'client' : 'clients'}
          flag={
            clientsAtRisk > 0 ? (
              <Badge tone="danger" dot>
                {clientsAtRisk} at risk
              </Badge>
            ) : (
              <Badge tone="success" dot>
                All on schedule
              </Badge>
            )
          }
          segments={[
            { label: 'At risk', value: clientsAtRisk, tone: 'danger' },
            { label: 'On schedule', value: withWork - clientsAtRisk, tone: 'success' },
            { label: 'No work yet', value: rollups.length - withWork, tone: 'neutral' },
          ]}
          footnote={`${totalProjects} project${totalProjects === 1 ? '' : 's'} booked across the order book.`}
        />
        <StatGroup
          label="Scheduled revenue"
          total={formatCurrency(totalRevenue)}
          flag={
            <Badge tone={totalProfit >= 0 ? 'success' : 'danger'}>
              {formatPercent(blendedMargin)} margin
            </Badge>
          }
          {...revenueSplit({ revenue: totalRevenue, cost: totalCost, profit: totalProfit }, formatCurrency)}
          footnote="Every task the scheduler has placed, priced at its machine type's hourly rate."
        />
      </div>

      <Card padding={false}>
        <Toolbar
          query={query}
          onQueryChange={setQuery}
          placeholder="Search clients"
          resultLabel={`${filtered.length} of ${rollups.length} clients`}
        />
        <DataTable
          columns={columns}
          rows={filtered}
          rowKey={(r) => r.client.id}
          rowHref={(r) => routes.client(r.client.id)}
          defaultSort={{ key: 'revenue', dir: 'desc' }}
          emptyState={
            <EmptyState
              icon={<Users size={20} />}
              title={query.trim() ? 'No clients match' : 'No clients yet'}
              description={
                query.trim() ? 'Try a different search.' : 'Add a client to start booking projects against it.'
              }
              action={
                <Button variant="primary" icon={<Plus size={14} />} onClick={() => setModalOpen(true)}>
                  Add client
                </Button>
              }
            />
          }
        />
      </Card>

      <ClientFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Page>
  )
}
