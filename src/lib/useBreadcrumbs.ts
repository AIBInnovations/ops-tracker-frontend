import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { routes } from '@/lib/routes'
import { useAppStore } from '@/store/useAppStore'

export interface Crumb {
  label: string
  to?: string
}

const SECTION_LABEL: Record<string, string> = {
  projects: 'Projects',
  tasks: 'Task bucket',
  clients: 'Clients',
  machines: 'Machines',
  timeline: 'Timeline',
  utilization: 'Utilization',
  alerts: 'Alerts',
}

/**
 * Resolves the URL into a human trail, looking record names up in the store
 * so a crumb reads "Titanium Bracket Assembly" rather than "p1".
 */
export function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation()
  const { projects, tasks, clients, machineTypes } = useAppStore()

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return [{ label: 'Overview' }]

    const [section, first, second] = segments
    const crumbs: Crumb[] = [{ label: SECTION_LABEL[section] ?? section, to: `/${section}` }]

    if (!first) return crumbs

    if (section === 'projects') {
      crumbs.push({ label: projects.find((p) => p.id === first)?.name ?? first })
    } else if (section === 'tasks') {
      crumbs.push({ label: tasks.find((t) => t.id === first)?.name ?? first })
    } else if (section === 'clients') {
      crumbs.push({ label: clients.find((c) => c.id === first)?.name ?? first })
    } else if (section === 'machines') {
      const machineType = machineTypes.find((mt) => mt.id === first)
      crumbs.push({
        label: machineType?.name ?? first,
        to: second ? routes.machineType(first) : undefined,
      })
      if (second) {
        const machine = machineType?.machines.find((m) => m.id === second)
        crumbs.push({ label: machine?.code ?? second })
      }
    }

    return crumbs
  }, [pathname, projects, tasks, clients, machineTypes])
}
