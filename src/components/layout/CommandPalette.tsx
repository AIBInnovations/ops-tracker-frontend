import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarRange,
  CornerDownLeft,
  Factory,
  Gauge,
  LayoutDashboard,
  ListChecks,
  Moon,
  Package,
  Search,
  Sun,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { routes } from '@/lib/routes'
import { useEscapeKey, useFocusTrap, useLockBodyScroll } from '@/lib/useDismissable'
import { useAppStore } from '@/store/useAppStore'
import { useUiStore } from '@/store/useUiStore'
import { Kbd } from '@/components/ui/Kbd'
import { Text } from '@/components/ui/Text'

type IconType = ComponentType<{ size?: number; className?: string }>

interface Command {
  id: string
  label: string
  meta?: string
  group: string
  icon: IconType
  run: () => void
}

/**
 * Global ⌘K menu. Combines navigation, actions and record search in one
 * surface so operators can reach any task, machine or client without
 * remembering which list it lives in.
 */
export function CommandPalette() {
  const navigate = useNavigate()
  const open = useUiStore((s) => s.commandOpen)
  const setOpen = useUiStore((s) => s.setCommandOpen)
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const { tasks, projects, clients, machineTypes } = useAppStore()

  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const panelRef = useFocusTrap<HTMLDivElement>(open)

  useLockBodyScroll(open)
  useEscapeKey(open, () => setOpen(false))

  // ⌘K / Ctrl+K from anywhere in the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!useUiStore.getState().commandOpen)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setOpen])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setCursor(0)
    }
  }, [open])

  useEffect(() => setCursor(0), [query])

  const go = (to: string) => {
    navigate(to)
    setOpen(false)
  }

  const commands = useMemo<Command[]>(() => {
    const q = query.trim().toLowerCase()

    const navigation: Command[] = [
      { id: 'nav-dashboard', label: 'Overview', group: 'Go to', icon: LayoutDashboard, run: () => go(routes.dashboard()) },
      { id: 'nav-tasks', label: 'Task bucket', group: 'Go to', icon: ListChecks, run: () => go(routes.tasks()) },
      { id: 'nav-timeline', label: 'Production timeline', group: 'Go to', icon: CalendarRange, run: () => go(routes.timeline()) },
      { id: 'nav-machines', label: 'Machines', group: 'Go to', icon: Factory, run: () => go(routes.machines()) },
      { id: 'nav-utilization', label: 'Utilization and profitability', group: 'Go to', icon: Gauge, run: () => go(routes.utilization()) },
      { id: 'nav-projects', label: 'Projects', group: 'Go to', icon: Package, run: () => go(routes.projects()) },
      { id: 'nav-clients', label: 'Clients', group: 'Go to', icon: Users, run: () => go(routes.clients()) },
      { id: 'nav-alerts', label: 'Alerts and exceptions', group: 'Go to', icon: AlertTriangle, run: () => go(routes.alerts()) },
    ]

    const actions: Command[] = [
      {
        id: 'action-theme',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        group: 'Actions',
        icon: theme === 'dark' ? Sun : Moon,
        run: () => {
          toggleTheme()
          setOpen(false)
        },
      },
    ]

    if (!q) return [...navigation.slice(0, 5), ...actions]

    const match = (text: string) => text.toLowerCase().includes(q)
    const records: Command[] = []

    for (const t of tasks) {
      if (!match(t.name) && !match(t.id)) continue
      const project = projects.find((p) => p.id === t.projectId)
      records.push({
        id: `task-${t.id}`,
        label: t.name,
        meta: `${t.id.toUpperCase()} · ${project?.name ?? ''}`,
        group: 'Tasks',
        icon: ListChecks,
        run: () => go(routes.task(t.id)),
      })
    }
    for (const p of projects) {
      if (!match(p.name) && !match(p.id)) continue
      const client = clients.find((c) => c.id === p.clientId)
      records.push({
        id: `project-${p.id}`,
        label: p.name,
        meta: client?.name ?? 'In-house',
        group: 'Projects',
        icon: Package,
        run: () => go(routes.project(p.id)),
      })
    }
    for (const c of clients) {
      if (!match(c.name) && !match(c.code)) continue
      records.push({
        id: `client-${c.id}`,
        label: c.name,
        meta: c.code,
        group: 'Clients',
        icon: Users,
        run: () => go(routes.client(c.id)),
      })
    }
    for (const mt of machineTypes) {
      if (match(mt.name)) {
        records.push({
          id: `mt-${mt.id}`,
          label: mt.name,
          meta: `${mt.machines.length} units`,
          group: 'Machines',
          icon: Factory,
          run: () => go(routes.machineType(mt.id)),
        })
      }
      for (const m of mt.machines) {
        if (!match(m.code)) continue
        records.push({
          id: `m-${m.id}`,
          label: m.code,
          meta: mt.name,
          group: 'Machines',
          icon: Factory,
          run: () => go(routes.machine(mt.id, m.id)),
        })
      }
    }

    return [
      ...records.slice(0, 14),
      ...navigation.filter((n) => match(n.label)),
      ...actions.filter((a) => match(a.label)),
    ]
    // `go` and `setOpen` are stable enough for this memo; recomputing on every
    // render would rebuild the list on each keystroke for no benefit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, tasks, projects, clients, machineTypes, theme])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCursor((c) => Math.min(c + 1, commands.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCursor((c) => Math.max(c - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        commands[cursor]?.run()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, commands, cursor])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [cursor])

  if (!open) return null

  let lastGroup = ''

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-start justify-center p-4 pt-[12vh]">
      <div
        className="fixed inset-0 animate-fade-in"
        style={{ backgroundColor: 'rgb(var(--overlay) / var(--overlay-opacity))' }}
        onClick={() => setOpen(false)}
        role="presentation"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        tabIndex={-1}
        className="relative flex w-full max-w-[600px] animate-scale-in flex-col overflow-hidden rounded-xl bg-surface-raised shadow-modal outline-none"
      >
        <div className="flex items-center gap-2.5 border-b border-line px-3.5">
          <Search size={16} className="shrink-0 text-fg-subtle" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, projects, clients, machines…"
            className="h-12 flex-1 bg-transparent text-md text-fg placeholder:text-fg-faint focus:outline-none"
          />
          <Kbd>ESC</Kbd>
        </div>

        <div ref={listRef} className="max-h-[52vh] overflow-y-auto p-1.5">
          {commands.length === 0 && (
            <div className="px-3 py-10 text-center">
              <Text variant="bodyMd" tone="subtle">
                No matches for “{query}”
              </Text>
            </div>
          )}
          {commands.map((cmd, i) => {
            const showGroup = cmd.group !== lastGroup
            lastGroup = cmd.group
            const Icon = cmd.icon
            const active = i === cursor
            return (
              <div key={cmd.id}>
                {showGroup && (
                  <div className="px-2 pb-1 pt-2">
                    <Text variant="label" tone="faint">
                      {cmd.group}
                    </Text>
                  </div>
                )}
                <button
                  type="button"
                  data-active={active}
                  onMouseMove={() => setCursor(i)}
                  onClick={cmd.run}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2 py-2 text-left transition-colors',
                    active ? 'bg-surface-selected' : 'hover:bg-surface-hover',
                  )}
                >
                  <Icon size={15} className="shrink-0 text-fg-subtle" />
                  <span className="min-w-0 flex-1 truncate text-base text-fg">{cmd.label}</span>
                  {cmd.meta && <span className="shrink-0 truncate text-sm text-fg-faint">{cmd.meta}</span>}
                  {active && <CornerDownLeft size={13} className="shrink-0 text-fg-faint" />}
                </button>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-line bg-surface-sunken px-3 py-2">
          <span className="flex items-center gap-1">
            <Kbd>↑</Kbd>
            <Kbd>↓</Kbd>
            <Text variant="bodySm" tone="subtle">
              navigate
            </Text>
          </span>
          <span className="flex items-center gap-1">
            <Kbd>↵</Kbd>
            <Text variant="bodySm" tone="subtle">
              open
            </Text>
          </span>
          <Text variant="bodySm" tone="faint" className="ml-auto">
            {commands.length} result{commands.length === 1 ? '' : 's'}
          </Text>
        </div>
      </div>
    </div>,
    document.body,
  )
}
