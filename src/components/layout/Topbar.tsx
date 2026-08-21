import { Fragment, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, Menu as MenuIcon, Moon, PanelLeft, Search, Sun } from 'lucide-react'
import { cn } from '@/lib/cn'
import { routes } from '@/lib/routes'
import { useBreadcrumbs } from '@/lib/useBreadcrumbs'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Popover } from '@/components/ui/Popover'
import { Text } from '@/components/ui/Text'
import { Tooltip } from '@/components/ui/Tooltip'
import { ALERT_TYPE_LABEL } from '@/components/alerts/AlertRow'
import { alertSeverityTone } from '@/lib/tone'
import { SCHEDULE_ORIGIN } from '@/engine'

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const crumbs = useBreadcrumbs()
  const alerts = useAppStore((s) => s.alerts)
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)

  const bellRef = useRef<HTMLButtonElement>(null)
  const [bellOpen, setBellOpen] = useState(false)

  const planStamp = SCHEDULE_ORIGIN.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <header className="sticky top-0 z-header flex h-12 shrink-0 items-center gap-2 border-b border-line bg-app/85 px-3 backdrop-blur-md">
      <Button
        variant="ghost"
        size="sm"
        icon={<MenuIcon size={16} />}
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="md:hidden"
      />
      {collapsed && (
        <Button
          variant="ghost"
          size="sm"
          icon={<PanelLeft size={15} />}
          onClick={toggleSidebar}
          aria-label="Expand sidebar"
          className="hidden md:inline-flex"
        />
      )}

      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1">
        {crumbs.map((crumb, i) => (
          <Fragment key={`${crumb.label}-${i}`}>
            {i > 0 && <ChevronRight size={13} className="shrink-0 text-fg-faint" />}
            {crumb.to && i < crumbs.length - 1 ? (
              <Link
                to={crumb.to}
                className="shrink-0 rounded-xs px-1 py-0.5 text-base font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="min-w-0 truncate px-1 py-0.5 text-base font-medium text-fg">{crumb.label}</span>
            )}
          </Fragment>
        ))}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Tooltip content={`Plan computed ${planStamp}`}>
          <span className="mr-1 hidden items-center gap-1.5 rounded-md bg-surface px-2 py-1 shadow-card lg:inline-flex">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-success" />
            <Text variant="bodySm" tone="muted">
              Plan live
            </Text>
          </span>
        </Tooltip>

        <Button
          variant="ghost"
          size="sm"
          icon={<Search size={15} />}
          onClick={() => setCommandOpen(true)}
          aria-label="Search"
          className="md:hidden"
        />

        <Tooltip content={theme === 'dark' ? 'Light theme' : 'Dark theme'}>
          <Button
            variant="ghost"
            size="sm"
            icon={theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            onClick={toggleTheme}
            aria-label="Toggle theme"
          />
        </Tooltip>

        <button
          ref={bellRef}
          type="button"
          onClick={() => setBellOpen((v) => !v)}
          aria-label={`Alerts${criticalCount > 0 ? `, ${criticalCount} critical` : ''}`}
          className="relative flex h-7 w-7 items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
        >
          <Bell size={15} />
          {criticalCount > 0 && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-danger ring-2 ring-app" />
          )}
        </button>
      </div>

      <Popover
        open={bellOpen}
        onClose={() => setBellOpen(false)}
        anchorRef={bellRef}
        placement="bottom-end"
        bare
        className="w-[360px]"
      >
        <div className="flex items-center justify-between border-b border-line px-3 py-2.5">
          <Text variant="headingSm">Exceptions</Text>
          <Badge tone={criticalCount > 0 ? 'danger' : 'success'}>
            {criticalCount > 0 ? `${criticalCount} critical` : 'All clear'}
          </Badge>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {alerts.length === 0 && (
            <div className="px-3 py-8 text-center">
              <Text variant="bodySm" tone="subtle">
                Nothing needs attention
              </Text>
            </div>
          )}
          {alerts.slice(0, 6).map((alert) => (
            <div key={alert.id} className="flex gap-2.5 border-b border-line-subtle px-3 py-2.5 last:border-b-0">
              <span
                className={cn(
                  'mt-1 h-1.5 w-1.5 shrink-0 rounded-full',
                  alert.severity === 'critical'
                    ? 'bg-danger'
                    : alert.severity === 'warning'
                      ? 'bg-warning'
                      : 'bg-info',
                )}
              />
              <div className="min-w-0">
                <Badge tone={alertSeverityTone[alert.severity]} variant="outline">
                  {ALERT_TYPE_LABEL[alert.type]}
                </Badge>
                <Text variant="bodySm" tone="muted" className="mt-1 block">
                  {alert.message}
                </Text>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-line p-2">
          <Link
            to={routes.alerts()}
            onClick={() => setBellOpen(false)}
            className="flex h-7 items-center justify-center rounded-md text-base font-medium text-accent-fg transition-colors hover:bg-surface-hover"
          >
            View all exceptions
          </Link>
        </div>
      </Popover>
    </header>
  )
}
