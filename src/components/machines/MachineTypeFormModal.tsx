import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, TextArea, TextField } from '@/components/ui/Field'
import { Text } from '@/components/ui/Text'
import { useToast } from '@/components/ui/Toast'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency } from '@/lib/format'

interface MachineTypeFormModalProps {
  open: boolean
  onClose: () => void
}

export function MachineTypeFormModal({ open, onClose }: MachineTypeFormModalProps) {
  const addMachineType = useAppStore((s) => s.addMachineType)
  const { toast } = useToast()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [hourlyRate, setHourlyRate] = useState(500)
  const [machineCount, setMachineCount] = useState(2)

  const reset = () => {
    setName('')
    setDescription('')
    setHourlyRate(500)
    setMachineCount(2)
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    const created = addMachineType({
      name: name.trim(),
      description: description.trim(),
      hourlyRate,
      machineCount,
    })
    reset()
    onClose()
    toast({
      title: `${created.name} added`,
      description: `${created.machines.length} units are now available to the scheduler.`,
      tone: 'success',
    })
  }

  const codePreview = name.trim() ? name.trim().slice(0, 3).toUpperCase() : 'XXX'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New machine type"
      subtitle="Tasks request a type; the scheduler picks which physical unit runs the job."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!name.trim()}>
            Create machine type
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Machine type name" required>
          <TextField
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. M/C 7 — Laser Cutter"
            autoFocus
          />
        </Field>
        <Field label="Description">
          <TextArea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this type is used for"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hourly operational rate" hint="Drives run cost and every profitability figure.">
            <TextField
              type="number"
              min={0}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(Number(e.target.value))}
              prefix="₹"
              suffix="/hr"
            />
          </Field>
          <Field label="Number of units">
            <TextField
              type="number"
              min={1}
              value={machineCount}
              onChange={(e) => setMachineCount(Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="rounded-lg bg-surface-sunken px-3 py-2.5">
          <Text variant="bodySm" tone="muted">
            Creates{' '}
            <span className="font-mono font-semibold text-fg">
              {Array.from({ length: Math.min(machineCount, 3) }, (_, i) => `${codePreview}-${String(i + 1).padStart(2, '0')}`).join(', ')}
              {machineCount > 3 && ` … +${machineCount - 3} more`}
            </span>{' '}
            at {formatCurrency(hourlyRate)}/hr each.
          </Text>
        </div>
      </div>
    </Modal>
  )
}
