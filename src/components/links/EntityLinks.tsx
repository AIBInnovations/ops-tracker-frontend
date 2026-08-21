import { useMemo } from 'react'
import { Factory, ListChecks, Package, Users } from 'lucide-react'
import { AppLink } from '@/components/ui/Link'
import { useAppStore } from '@/store/useAppStore'
import { routes } from '@/lib/routes'

type LinkTone = 'accent' | 'subtle'

interface EntityLinkProps {
  id: string
  tone?: LinkTone
  /** Renders a small leading glyph so the entity type reads at a glance. */
  withIcon?: boolean
  className?: string
}

const iconClass = 'mr-1 inline-block shrink-0 align-[-2px] text-fg-faint'

const Dash = () => <span className="text-fg-faint">—</span>

export function ProjectLink({ id, tone = 'subtle', withIcon = false, className }: EntityLinkProps) {
  const project = useAppStore((s) => s.projects.find((p) => p.id === id))
  if (!project) return <Dash />
  return (
    <AppLink to={routes.project(id)} tone={tone} className={className} title={`Open ${project.name}`}>
      {withIcon && <Package size={13} className={iconClass} />}
      {project.name}
    </AppLink>
  )
}

export function ClientLink({ id, tone = 'subtle', withIcon = false, className }: EntityLinkProps) {
  const client = useAppStore((s) => s.clients.find((c) => c.id === id))
  if (!client) return <Dash />
  return (
    <AppLink to={routes.client(id)} tone={tone} className={className} title={`Open ${client.name}`}>
      {withIcon && <Users size={13} className={iconClass} />}
      {client.name}
    </AppLink>
  )
}

export function TaskLink({ id, tone = 'subtle', withIcon = false, className }: EntityLinkProps) {
  const task = useAppStore((s) => s.tasks.find((t) => t.id === id))
  if (!task) return <Dash />
  return (
    <AppLink to={routes.task(id)} tone={tone} className={className} title={`Open ${task.name}`}>
      {withIcon && <ListChecks size={13} className={iconClass} />}
      {task.name}
    </AppLink>
  )
}

export function MachineTypeLink({ id, tone = 'subtle', withIcon = false, className }: EntityLinkProps) {
  const machineType = useAppStore((s) => s.machineTypes.find((mt) => mt.id === id))
  if (!machineType) return <Dash />
  return (
    <AppLink to={routes.machineType(id)} tone={tone} className={className} title={`Open ${machineType.name}`}>
      {withIcon && <Factory size={13} className={iconClass} />}
      {machineType.name}
    </AppLink>
  )
}

/** Links a physical machine unit (CNC-01) through to its schedule page. */
export function MachineLink({ id, tone = 'subtle', withIcon = false, className }: EntityLinkProps) {
  // Select the stable array and derive here — returning a fresh object from
  // the selector would make every snapshot compare unequal and loop forever.
  const machineTypes = useAppStore((s) => s.machineTypes)
  const found = useMemo(() => {
    for (const mt of machineTypes) {
      const machine = mt.machines.find((m) => m.id === id)
      if (machine) return { machine, machineType: mt }
    }
    return undefined
  }, [machineTypes, id])

  if (!found) return <Dash />
  return (
    <AppLink
      to={routes.machine(found.machineType.id, id)}
      tone={tone}
      className={className}
      title={`Open ${found.machine.code}`}
    >
      {withIcon && <Factory size={13} className={iconClass} />}
      <span className="font-mono text-sm">{found.machine.code}</span>
    </AppLink>
  )
}
