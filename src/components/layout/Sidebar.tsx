import { type ComponentType } from 'react'
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

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  end?: boolean
  badge?: boolean
}

const SECTIONS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Production',
    items: [
      { to: routes.dashboard(), label: 'Overview', icon: LayoutDashboard, end: true },
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
      { to: routes.alerts(), label: 'Alerts', icon: AlertTriangle, badge: true },
    ],
  },
]

/**
 * The app's only navigation. Labels are spelled out rather than left as bare
 * icons — with nothing duplicating these destinations in the header, an
 * icon-only rail would make every jump a guess.
 */
export function Sidebar() {
  const alerts = useAppStore((s) => s.alerts)
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length

  return (
    <aside className="z-header hidden w-60 shrink-0 flex-col border-r border-line bg-surface py-4 md:flex">
      <nav className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3">
        {SECTIONS.map((section, i) => (
          <div key={section.heading} className={cn(i > 0 && 'mt-6')}>
            <div className="px-3 pb-1.5">
              <span className="text-2xs font-bold uppercase tracking-[0.12em] text-fg-faint">{section.heading}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ to, label, icon: Icon, end, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex h-11 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors',
                      isActive ? 'bg-ink text-white' : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
                    )
                  }
                >
                  <Icon size={17} strokeWidth={2} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {badge && criticalCount > 0 && (
                    <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 text-2xs font-bold tabular-nums text-white">
                      {criticalCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
