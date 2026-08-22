import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronDown, Info, Menu as MenuIcon, Moon, Search, Settings, Sun, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'
import { routes } from '@/lib/routes'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Kbd } from '@/components/ui/Kbd'
import { MenuItem, MenuLabel, MenuList, MenuSeparator } from '@/components/ui/Menu'
import { Popover } from '@/components/ui/Popover'
import { Text } from '@/components/ui/Text'
import { Tooltip } from '@/components/ui/Tooltip'
import { ALERT_TYPE_LABEL } from '@/components/alerts/AlertRow'
import { alertSeverityTone } from '@/lib/tone'
import { SCHEDULE_ORIGIN } from '@/engine'


export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const alerts = useAppStore((s) => s.alerts)
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const setCommandOpen = useUiStore((s) => s.setCommandOpen)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)

  const bellRef = useRef<HTMLButtonElement>(null)
  const [bellOpen, setBellOpen] = useState(false)
  const planRef = useRef<HTMLButtonElement>(null)
  const [planOpen, setPlanOpen] = useState(false)
  const accountRef = useRef<HTMLButtonElement>(null)
  const [accountOpen, setAccountOpen] = useState(false)

  const planStamp = SCHEDULE_ORIGIN.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  const chip =
    'flex h-10 w-10 items-center justify-center rounded-full text-fg-muted ring-1 ring-line transition-colors hover:bg-surface-hover hover:text-fg'

  return (
    <header className="z-header flex h-[72px] shrink-0 items-center gap-3 border-b border-line bg-surface px-4 lg:px-5">
      <Button
        variant="ghost"
        size="sm"
        icon={<MenuIcon size={18} />}
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="md:hidden"
      />

      {/* Brand */}
      <Link to={routes.dashboard()} className="flex shrink-0 items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-white">
          <Zap size={18} fill="currentColor" strokeWidth={0} />
        </span>
        <span className="hidden font-display text-lg font-bold tracking-tight text-fg sm:block">Aadiushmaa</span>
      </Link>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Tooltip content="Search  ⌘K">
          <button type="button" onClick={() => setCommandOpen(true)} aria-label="Search" className={chip}>
            <Search size={17} />
          </button>
        </Tooltip>

        <button
          ref={bellRef}
          type="button"
          onClick={() => setBellOpen((v) => !v)}
          aria-label={`Alerts${criticalCount > 0 ? `, ${criticalCount} critical` : ''}`}
          className={cn(chip, 'relative')}
        >
          <Bell size={17} />
          {criticalCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent ring-2 ring-surface" />
          )}
        </button>

        <button
          ref={planRef}
          type="button"
          onClick={() => setPlanOpen((v) => !v)}
          aria-label="Plan status"
          aria-expanded={planOpen}
          className={cn(chip, 'hidden xl:flex')}
        >
          <Info size={17} />
        </button>

        <button
          ref={accountRef}
          type="button"
          onClick={() => setAccountOpen((v) => !v)}
          aria-label="Account menu"
          aria-expanded={accountOpen}
          className="ml-1 flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 ring-1 ring-line transition-colors hover:bg-surface-hover"
        >
          <Avatar name="Planning Desk" size="md" />
          <span className="hidden min-w-0 text-left leading-tight xl:block">
            <span className="block truncate text-sm font-semibold text-fg">Planning desk</span>
            <span className="block truncate text-xs text-fg-subtle">Production control</span>
          </span>
          <ChevronDown
            size={14}
            className={cn('hidden shrink-0 text-fg-faint transition-transform xl:block', accountOpen && 'rotate-180')}
          />
        </button>
      </div>

      <Popover
        open={bellOpen}
        onClose={() => setBellOpen(false)}
        anchorRef={bellRef}
        placement="bottom-end"
        bare
        className="w-[370px]"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <Text variant="headingSm">Exceptions</Text>
          <Badge tone={criticalCount > 0 ? 'danger' : 'success'}>
            {criticalCount > 0 ? `${criticalCount} critical` : 'All clear'}
          </Badge>
        </div>
        <div className="max-h-[320px] overflow-y-auto">
          {alerts.length === 0 && (
            <div className="px-4 py-8 text-center">
              <Text variant="bodySm" tone="subtle">
                Nothing needs attention
              </Text>
            </div>
          )}
          {alerts.slice(0, 6).map((alert) => (
            <div key={alert.id} className="flex gap-2.5 border-b border-line-subtle px-4 py-3 last:border-b-0">
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
            className="flex h-9 items-center justify-center rounded-xl text-base font-semibold text-accent-fg transition-colors hover:bg-accent-soft"
          >
            View all exceptions
          </Link>
        </div>
      </Popover>

      <Popover open={planOpen} onClose={() => setPlanOpen(false)} anchorRef={planRef} placement="bottom-end" bare>
        <div className="w-[280px] p-4">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-success" />
            <Text variant="headingSm">Plan is live</Text>
          </div>
          <Text variant="bodySm" tone="muted" className="mt-2 block">
            The schedule is recomputed from the task bucket on every change — no
            queue, no overnight batch.
          </Text>
          <div className="mt-3 border-t border-line-subtle pt-3">
            <Text variant="bodySm" tone="subtle">
              Last computed
            </Text>
            <Text variant="bodyMd" numeric className="mt-0.5 block font-semibold">
              {planStamp}
            </Text>
          </div>
        </div>
      </Popover>

      <Popover
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        anchorRef={accountRef}
        placement="bottom-end"
      >
        <MenuList>
          <MenuLabel>Aadiushmaa Engineers</MenuLabel>
          <MenuItem
            icon={theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            onClick={() => {
              toggleTheme()
              setAccountOpen(false)
            }}
          >
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </MenuItem>
          <MenuItem
            icon={<Search size={14} />}
            suffix={<Kbd>⌘K</Kbd>}
            onClick={() => {
              setAccountOpen(false)
              setCommandOpen(true)
            }}
          >
            Command menu
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={<Settings size={14} />} onClick={() => setAccountOpen(false)}>
            Preferences
          </MenuItem>
        </MenuList>
      </Popover>
    </header>
  )
}
