import { useRef, type ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarRange,
  ChevronsLeft,
  Factory,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Moon,
  Package,
  PanelLeft,
  Search,
  Settings,
  Sun,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { routes } from '@/lib/routes'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { Avatar } from '@/components/ui/Avatar'
import { Kbd } from '@/components/ui/Kbd'
import { Popover } from '@/components/ui/Popover'
import { MenuItem, MenuLabel, MenuList, MenuSeparator } from '@/components/ui/Menu'
import { Text } from '@/components/ui/Text'
import { Tooltip } from '@/components/ui/Tooltip'
import { useState } from 'react'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string }>
  end?: boolean
  badge?: 'alerts'
}

const SECTIONS: { heading?: string; items: NavItem[] }[] = [
  { items: [{ to: routes.dashboard(), label: 'Overview', icon: LayoutDashboard, end: true }] },
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
    items: [{ to: routes.alerts(), label: 'Alerts', icon: AlertTriangle, badge: 'alerts' }],
  },
]

export function Sidebar() {
  const alerts = useAppStore((s) => s.alerts)
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)

  const accountRef = useRef<HTMLButtonElement>(null)
  const [accountOpen, setAccountOpen] = useState(false)

  const navClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'group relative flex h-7 items-center gap-2.5 rounded-md text-base font-medium transition-colors',
      collapsed ? 'justify-center px-0' : 'px-2',
      isActive
        ? 'bg-surface-selected text-accent-fg'
        : 'text-fg-muted hover:bg-surface-hover hover:text-fg',
    )

  return (
    <aside
      className={cn(
        'z-header hidden shrink-0 flex-col border-r border-line bg-app transition-[width] duration-200 md:flex',
        collapsed ? 'w-14' : 'w-58',
      )}
    >
      {/* Workspace identity */}
      <div className={cn('flex h-12 shrink-0 items-center gap-2', collapsed ? 'justify-center px-2' : 'px-3')}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-accent text-xs font-bold text-accent-on">
          AE
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <Text variant="headingSm" truncate>
              Aadiushmaa
            </Text>
          </div>
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            className="rounded-sm p-1 text-fg-faint transition-colors hover:bg-surface-hover hover:text-fg"
          >
            <ChevronsLeft size={15} />
          </button>
        )}
      </div>

      {/* Command palette trigger */}
      <div className={cn('shrink-0 pb-2', collapsed ? 'px-2' : 'px-3')}>
        {collapsed ? (
          <Tooltip content="Search  ⌘K" side="right">
            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              aria-label="Search"
              className="flex h-7 w-full items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
            >
              <Search size={15} />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="flex h-7 w-full items-center gap-2 rounded-md bg-surface px-2 text-base text-fg-subtle shadow-card transition-colors hover:bg-surface-hover"
          >
            <Search size={14} className="shrink-0" />
            <span className="flex-1 text-left">Search</span>
            <Kbd>⌘K</Kbd>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn('min-h-0 flex-1 overflow-y-auto pb-3', collapsed ? 'px-2' : 'px-3')}>
        {SECTIONS.map((section, i) => (
          <div key={section.heading ?? i} className={cn(i > 0 && 'mt-4')}>
            {section.heading && !collapsed && (
              <div className="px-2 pb-1">
                <Text variant="label" tone="faint">
                  {section.heading}
                </Text>
              </div>
            )}
            {section.heading && collapsed && <div className="mx-2 mb-2 h-px bg-line" />}
            <div className="flex flex-col gap-0.5">
              {section.items.map(({ to, label, icon: Icon, end, badge }) => {
                const showBadge = badge === 'alerts' && criticalCount > 0
                const link = (
                  <NavLink key={to} to={to} end={end} className={navClass}>
                    {({ isActive }) => (
                      <>
                        {isActive && !collapsed && (
                          <span className="absolute -left-3 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-accent" />
                        )}
                        <Icon size={15} strokeWidth={2} className="shrink-0" />
                        {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
                        {showBadge &&
                          (collapsed ? (
                            <span className="absolute right-1.5 top-1 h-1.5 w-1.5 rounded-full bg-danger" />
                          ) : (
                            <span className="shrink-0 rounded-xs bg-danger-soft px-1 text-2xs font-semibold tabular-nums text-danger-fg">
                              {criticalCount}
                            </span>
                          ))}
                      </>
                    )}
                  </NavLink>
                )
                return collapsed ? (
                  <Tooltip key={to} content={label} side="right">
                    {link}
                  </Tooltip>
                ) : (
                  link
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: theme, expand, account */}
      <div className={cn('shrink-0 border-t border-line py-2', collapsed ? 'px-2' : 'px-3')}>
        <div className={cn('flex items-center gap-1', collapsed && 'flex-col')}>
          {collapsed && (
            <Tooltip content="Expand sidebar" side="right">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
                className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
              >
                <PanelLeft size={15} />
              </button>
            </Tooltip>
          )}
          <button
            ref={accountRef}
            type="button"
            onClick={() => setAccountOpen((v) => !v)}
            className={cn(
              'flex h-8 items-center gap-2 rounded-md transition-colors hover:bg-surface-hover',
              collapsed ? 'w-8 justify-center px-0' : 'min-w-0 flex-1 px-1.5',
            )}
          >
            <Avatar name="Planning Desk" size="sm" />
            {!collapsed && (
              <span className="min-w-0 flex-1 text-left">
                <Text variant="bodySm" truncate className="font-medium">
                  Planning desk
                </Text>
              </span>
            )}
          </button>
          {!collapsed && (
            <Tooltip content={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <Popover open={accountOpen} onClose={() => setAccountOpen(false)} anchorRef={accountRef} placement="top-start">
        <MenuList>
          <MenuLabel>Aadiushmaa Engineers</MenuLabel>
          <MenuItem icon={theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />} onClick={toggleTheme}>
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </MenuItem>
          <MenuItem icon={<Settings size={14} />} onClick={() => setAccountOpen(false)}>
            Preferences
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Search size={14} />} suffix={<Kbd>⌘K</Kbd>} onClick={() => {
            setAccountOpen(false)
            setCommandOpen(true)
          }}>
            Command menu
          </MenuItem>
        </MenuList>
      </Popover>
    </aside>
  )
}
