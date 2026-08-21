import { type ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarRange,
  Factory,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Moon,
  Package,
  Search,
  Sun,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { routes } from '@/lib/routes'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { Tooltip } from '@/components/ui/Tooltip'

interface RailItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  end?: boolean
  badge?: boolean
}

const ITEMS: RailItem[] = [
  { to: routes.dashboard(), label: 'Overview', icon: LayoutDashboard, end: true },
  { to: routes.tasks(), label: 'Task bucket', icon: ListChecks },
  { to: routes.timeline(), label: 'Timeline', icon: CalendarRange },
  { to: routes.machines(), label: 'Machines', icon: Factory },
  { to: routes.utilization(), label: 'Utilization', icon: Gauge },
  { to: routes.projects(), label: 'Projects', icon: Package },
  { to: routes.clients(), label: 'Clients', icon: Users },
  { to: routes.alerts(), label: 'Alerts', icon: AlertTriangle, badge: true },
]

/**
 * Narrow icon-only rail. The header pills carry the same destinations by name;
 * this gives the same reach in one click from any scroll position.
 */
export function IconRail() {
  const alerts = useAppStore((s) => s.alerts)
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)

  const utilityClass =
    'flex h-10 w-10 items-center justify-center rounded-xl text-fg-subtle transition-colors hover:bg-surface-hover hover:text-fg'

  return (
    <aside className="z-header hidden w-[68px] shrink-0 flex-col items-center border-r border-line bg-surface py-4 md:flex">
      <div className="flex flex-col items-center gap-1">
        <Tooltip content={theme === 'dark' ? 'Light theme' : 'Dark theme'} side="right">
          <button type="button" onClick={toggleTheme} aria-label="Toggle theme" className={utilityClass}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </Tooltip>
        <Tooltip content="Search  ⌘K" side="right">
          <button type="button" onClick={() => setCommandOpen(true)} aria-label="Search" className={utilityClass}>
            <Search size={17} />
          </button>
        </Tooltip>
      </div>

      <div className="my-3 h-px w-8 bg-line" />

      <nav className="no-scrollbar flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto">
        {ITEMS.map(({ to, label, icon: Icon, end, badge }) => (
          <Tooltip key={to} content={label} side="right">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                  isActive ? 'bg-ink text-white' : 'text-fg-subtle hover:bg-surface-hover hover:text-fg',
                )
              }
            >
              <Icon size={17} strokeWidth={2} />
              {badge && criticalCount > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
              )}
            </NavLink>
          </Tooltip>
        ))}
      </nav>

      <div className="mt-3 flex flex-col items-center gap-1">
        <Tooltip content="Command menu" side="right">
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            aria-label="Command menu"
            className={utilityClass}
          >
            <LifeBuoy size={17} />
          </button>
        </Tooltip>
      </div>
    </aside>
  )
}
