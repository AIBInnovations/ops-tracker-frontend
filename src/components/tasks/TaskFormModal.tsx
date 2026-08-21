import { useMemo, useState } from 'react'
import { Calculator } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Checkbox, Field, TextArea, TextField } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { MetricCell, MetricRow } from '@/components/ui/Metric'
import { Text } from '@/components/ui/Text'
import { useToast } from '@/components/ui/Toast'
import { useAppStore } from '@/store/useAppStore'
import { formatCurrency, formatHours } from '@/lib/format'
import { priorityLabel } from '@/lib/tone'
import type { Priority } from '@/types/entities'

interface TaskFormModalProps {
  open: boolean
  onClose: () => void
  projectId: string
}

export function TaskFormModal({ open, onClose, projectId }: TaskFormModalProps) {
  const machineTypes = useAppStore((s) => s.machineTypes)
  const tasks = useAppStore((s) => s.tasks)
  const addTask = useAppStore((s) => s.addTask)
  const { toast } = useToast()

  const projectTasks = useMemo(() => tasks.filter((t) => t.projectId === projectId), [tasks, projectId])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [operationType, setOperationType] = useState('')
  const [machineTypeId, setMachineTypeId] = useState(machineTypes[0]?.id ?? '')
  const [batchSize, setBatchSize] = useState(100)
  const [timePerPieceMin, setTimePerPieceMin] = useState(10)
  const [pricePerPiece, setPricePerPiece] = useState(50)
  const [priority, setPriority] = useState<Priority>('medium')
  const [deadline, setDeadline] = useState('2026-09-21')
  const [dependsOn, setDependsOn] = useState<string[]>([])
  const [parentTaskId, setParentTaskId] = useState('')

  const durationHrs = (batchSize * timePerPieceMin) / 60
  const machineType = machineTypes.find((mt) => mt.id === machineTypeId)
  const cost = machineType ? durationHrs * machineType.hourlyRate : 0
  const revenue = batchSize * pricePerPiece
  const profit = revenue - cost

  const reset = () => {
    setName('')
    setDescription('')
    setOperationType('')
    setBatchSize(100)
    setTimePerPieceMin(10)
    setPricePerPiece(50)
    setPriority('medium')
    setDependsOn([])
    setParentTaskId('')
  }

  const toggleDep = (id: string) =>
    setDependsOn((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]))

  const handleSubmit = () => {
    if (!name.trim() || !machineTypeId) return
    addTask({
      name: name.trim(),
      description: description.trim(),
      projectId,
      operationType: operationType.trim() || 'Operation',
      machineTypeId,
      batchSize,
      timePerPieceMin,
      pricePerPiece,
      priority,
      deadline,
      status: dependsOn.length > 0 ? 'blocked' : 'scheduled',
      dependsOn,
      parentTaskId: parentTaskId || undefined,
    })
    const label = name.trim()
    reset()
    onClose()
    toast({
      title: `${label} added to the bucket`,
      description: `${formatHours(durationHrs)} on ${machineType?.name ?? 'the assigned type'} — the plan was recomputed.`,
      tone: 'success',
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="New task"
      subtitle="Duration is derived from the lot, not entered by hand."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!name.trim()}>
            Add task
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Task name" required>
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wire EDM — Slot Cut"
              autoFocus
            />
          </Field>
          <Field label="Operation type">
            <TextField
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              placeholder="e.g. Milling"
            />
          </Field>
        </div>

        <Field label="Description">
          <TextArea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>

        <Field label="Required machine type" hint="The scheduler picks the specific physical unit for you.">
          <Select
            value={machineTypeId}
            onChange={setMachineTypeId}
            options={machineTypes.map((mt) => ({
              value: mt.id,
              label: mt.name,
              meta: `${formatCurrency(mt.hourlyRate)}/hr`,
            }))}
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Batch size">
            <TextField
              type="number"
              min={1}
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              suffix="pcs"
            />
          </Field>
          <Field label="Time per piece">
            <TextField
              type="number"
              min={1}
              value={timePerPieceMin}
              onChange={(e) => setTimePerPieceMin(Number(e.target.value))}
              suffix="min"
            />
          </Field>
          <Field label="Price per piece">
            <TextField
              type="number"
              min={0}
              value={pricePerPiece}
              onChange={(e) => setPricePerPiece(Number(e.target.value))}
              prefix="₹"
            />
          </Field>
        </div>

        <div className="rounded-lg bg-surface-sunken p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Calculator size={13} className="text-fg-subtle" />
            <Text variant="bodySm" tone="muted">
              {batchSize.toLocaleString('en-IN')} pcs × {timePerPieceMin} min ={' '}
              <span className="font-semibold text-fg">{formatHours(durationHrs)}</span>
              {machineType && <> at {formatCurrency(machineType.hourlyRate)}/hr</>}
            </Text>
          </div>
          <MetricRow className="grid-cols-3 bg-surface">
            <MetricCell label="Run cost" value={formatCurrency(cost)} />
            <MetricCell label="Revenue" value={formatCurrency(revenue)} />
            <MetricCell label="Profit" value={formatCurrency(profit)} tone={profit >= 0 ? 'success' : 'danger'} />
          </MetricRow>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <Select
              value={priority}
              onChange={(v) => setPriority(v as Priority)}
              options={(Object.keys(priorityLabel) as Priority[]).map((k) => ({ value: k, label: priorityLabel[k] }))}
            />
          </Field>
          <Field label="Deadline">
            <TextField type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
        </div>

        <Field label="Parent task" hint="Set this to nest the new task as a subtask.">
          <Select
            value={parentTaskId}
            onChange={setParentTaskId}
            placeholder="None — top-level task"
            options={[
              { value: '', label: 'None — top-level task' },
              ...projectTasks.map((t) => ({ value: t.id, label: t.name, meta: t.id.toUpperCase() })),
            ]}
          />
        </Field>

        {projectTasks.length > 0 && (
          <Field label="Depends on" hint="Selected tasks must finish before this one can start.">
            <div className="flex max-h-36 flex-col gap-1 overflow-y-auto rounded-md bg-surface p-2 ring-1 ring-inset ring-line">
              {projectTasks.map((t) => (
                <Checkbox
                  key={t.id}
                  checked={dependsOn.includes(t.id)}
                  onChange={() => toggleDep(t.id)}
                  label={
                    <span className="flex items-center gap-1.5">
                      {t.name}
                      <span className="font-mono text-sm text-fg-faint">{t.id.toUpperCase()}</span>
                    </span>
                  }
                  className="rounded-sm px-1 py-1 hover:bg-surface-hover"
                />
              ))}
            </div>
          </Field>
        )}
      </div>
    </Modal>
  )
}
