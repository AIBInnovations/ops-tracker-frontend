import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, TextField } from '@/components/ui/Field'
import { Select } from '@/components/ui/Select'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { useToast } from '@/components/ui/Toast'
import { ClientFormModal } from '@/components/clients/ClientFormModal'
import { useAppStore } from '@/store/useAppStore'
import { priorityLabel, projectStatusLabel } from '@/lib/tone'
import { routes } from '@/lib/routes'
import type { Priority, ProjectStatus, ProjectType } from '@/types/entities'

interface ProjectFormModalProps {
  open: boolean
  onClose: () => void
}

export function ProjectFormModal({ open, onClose }: ProjectFormModalProps) {
  const clients = useAppStore((s) => s.clients)
  const addProject = useAppStore((s) => s.addProject)
  const { toast } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [type, setType] = useState<ProjectType>('client')
  const [clientId, setClientId] = useState(clients[1]?.id ?? clients[0]?.id ?? '')
  const [startDate, setStartDate] = useState('2026-08-21')
  const [deadline, setDeadline] = useState('2026-09-21')
  const [priority, setPriority] = useState<Priority>('medium')
  const [status, setStatus] = useState<ProjectStatus>('planning')
  const [clientModalOpen, setClientModalOpen] = useState(false)

  const reset = () => {
    setName('')
    setType('client')
    setStartDate('2026-08-21')
    setDeadline('2026-09-21')
    setPriority('medium')
    setStatus('planning')
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    const project = addProject({
      name: name.trim(),
      clientId: type === 'inhouse' ? 'c0' : clientId,
      type,
      startDate,
      deadline,
      priority,
      status,
    })
    reset()
    onClose()
    toast({
      title: 'Project created',
      description: `${project.name} is ready for tasks.`,
      tone: 'success',
      action: { label: 'Open project', onClick: () => navigate(routes.project(project.id)) },
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New project"
      subtitle="Tasks added to this project feed the global bucket the scheduler draws from."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!name.trim()}>
            Create project
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Project name" required>
          <TextField
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Compressor Housing Batch"
            autoFocus
          />
        </Field>

        <Field label="Type">
          <SegmentedControl
            value={type}
            onChange={setType}
            segments={[
              { value: 'client' as ProjectType, label: 'Client work' },
              { value: 'inhouse' as ProjectType, label: 'In-house R&D' },
            ]}
          />
        </Field>

        <Field label="Client" hint={type === 'inhouse' ? 'In-house work is booked against the internal R&D account.' : undefined}>
          <div className="flex items-center gap-2">
            <Select
              value={type === 'inhouse' ? 'c0' : clientId}
              onChange={setClientId}
              disabled={type === 'inhouse'}
              className="min-w-0 flex-1"
              options={clients
                .filter((c) => (type === 'inhouse' ? c.id === 'c0' : c.id !== 'c0'))
                .map((c) => ({ value: c.id, label: c.name, meta: c.code }))}
            />
            {/* Creating the client here saves abandoning a half-filled project
                form just to add the customer it belongs to. */}
            <Button
              size="md"
              icon={<Plus size={14} />}
              disabled={type === 'inhouse'}
              onClick={() => setClientModalOpen(true)}
            >
              New
            </Button>
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Start date">
            <TextField type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Deadline">
            <TextField type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <Select
              value={priority}
              onChange={(v) => setPriority(v as Priority)}
              options={(Object.keys(priorityLabel) as Priority[]).map((k) => ({ value: k, label: priorityLabel[k] }))}
            />
          </Field>
          <Field label="Status">
            <Select
              value={status}
              onChange={(v) => setStatus(v as ProjectStatus)}
              options={(Object.keys(projectStatusLabel) as ProjectStatus[]).map((k) => ({
                value: k,
                label: projectStatusLabel[k],
              }))}
            />
          </Field>
        </div>
      </div>

      <ClientFormModal
        open={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onCreated={setClientId}
      />
    </Modal>
  )
}
