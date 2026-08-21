import { NavLink } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarRange,
  Factory,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Package,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { routes } from '@/lib/routes'
import { useAppStore } from '@/store/useAppStore'
import { Drawer } from '@/components/ui/Drawer'
import { Text } from '@/components/ui/Text'

const SECTIONS = [
  { heading: undefined, items: [{ to: routes.dashboard(), label: 'Overview', icon: LayoutDashboard, end: true }] },
  {
    heading: 'Production',
    items: [
      { to: routes.tasks(), label: 'Task bucket', icon: ListChecks },
      { to: routes.timeline(), label: 'Timeline', icon: CalendarRange },
      { to: routes.machines(), label: 'Machines', icon: Factory },
      { to: routes.utilization(), label: 'Utilization', icon: Gauge },
    ],
  },
  {
    heading: 'Order book',
    items: [
      { to: routes.projects(), label: 'Projects', icon: Package },
      { to: routes.clients(), label: 'Clients', icon: Users },
    ],
  },
  {
    heading: 'Exceptions',
    items: [{ to: routes.alerts(), label: 'Alerts', icon: AlertTriangle }],
  },
] as const

/** Sidebar equivalent for viewports too narrow to hold the rail. */
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const alerts = useAppStore((s) => s.alerts)
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length

  return (
    <Drawer open={open} onClose={onClose} title="Aadiushmaa Engineers" subtitle="Production planning" side="right" size="sm">
      <nav className="p-4">
        {SECTIONS.map((section, i) => (
          <div key={section.heading ?? i} className={cn(i > 0 && 'mt-5')}>
            {section.heading && (
              <div className="px-3 pb-1.5">
                <Text variant="label" tone="faint">
                  {section.heading}
                </Text>
              </div>
            )}
            <div className="flex flex-col gap-1">
              {section.items.map(({ to, label, icon: Icon, ...rest }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={'end' in rest ? rest.end : undefined}
                  className={({ isActive }) =>
                    cn(
                      'flex h-11 items-center gap-3 rounded-xl px-3 text-md font-medium transition-colors',
                      isActive
                        ? 'bg-ink text-white'
                        : 'text-fg-muted hover:bg-surface-sunken hover:text-fg',
                    )
                  }
                >
                  <Icon size={16} className="shrink-0" />
                  <span className="flex-1 truncate">{label}</span>
                  {label === 'Alerts' && criticalCount > 0 && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-2xs font-bold tabular-nums text-white">
                      {criticalCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </Drawer>
  )
}
