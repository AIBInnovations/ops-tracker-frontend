import { CircleCheck, Wrench } from 'lucide-react'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/components/ui/Toast'
import { useAppStore } from '@/store/useAppStore'
import type { Machine } from '@/types/entities'

/**
 * Operators control whether a unit is *in service*; whether it is running
 * right now is derived from the schedule, never set by hand. Keeping the two
 * separate avoids a unit reading "Idle" next to a control saying "Running".
 */
export function ServiceStatusSelect({
  machine,
  className = 'w-44',
  size = 'md',
}: {
  machine: Machine
  className?: string
  size?: 'sm' | 'md'
}) {
  const updateMachineStatus = useAppStore((s) => s.updateMachineStatus)
  const { toast } = useToast()
  const value = machine.status === 'maintenance' ? 'maintenance' : 'available'

  return (
    <Select
      value={value}
      size={size}
      className={className}
      aria-label={`${machine.code} service state`}
      options={[
        { value: 'available', label: 'In service', icon: <CircleCheck size={13} /> },
        { value: 'maintenance', label: 'Under maintenance', icon: <Wrench size={13} /> },
      ]}
      onChange={(next) => {
        const status = next === 'maintenance' ? 'maintenance' : 'available'
        updateMachineStatus(machine.id, status)
        toast({
          title: status === 'maintenance' ? `${machine.code} taken out of service` : `${machine.code} back in service`,
          description: 'The bucket was rescheduled across every remaining unit.',
          tone: status === 'maintenance' ? 'warning' : 'success',
        })
      }}
    />
  )
}
