import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, TextField } from '@/components/ui/Field'
import { Avatar } from '@/components/ui/Avatar'
import { Text } from '@/components/ui/Text'
import { useToast } from '@/components/ui/Toast'
import { useAppStore } from '@/store/useAppStore'
import { routes } from '@/lib/routes'

interface ClientFormModalProps {
  open: boolean
  onClose: () => void
  /** Skips the toast's deeplink when the caller keeps the user in place. */
  onCreated?: (clientId: string) => void
}

/** Next free `C{n}` code, so operators are not asked to invent one. */
function suggestCode(existing: string[]): string {
  const used = new Set(existing)
  for (let n = 1; n < 999; n++) {
    if (!used.has(`C${n}`)) return `C${n}`
  }
  return ''
}

export function ClientFormModal({ open, onClose, onCreated }: ClientFormModalProps) {
  const clients = useAppStore((s) => s.clients)
  const addClient = useAppStore((s) => s.addClient)
  const { toast } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [touchedCode, setTouchedCode] = useState(false)

  // Reset and re-suggest a code every time the modal opens, since another
  // client may have claimed the previous suggestion in the meantime.
  useEffect(() => {
    if (!open) return
    setName('')
    setTouchedCode(false)
    setCode(suggestCode(clients.map((c) => c.code)))
  }, [open, clients])

  const trimmedName = name.trim()
  const trimmedCode = code.trim().toUpperCase()

  const duplicateName = clients.some((c) => c.name.toLowerCase() === trimmedName.toLowerCase())
  const duplicateCode = clients.some((c) => c.code.toUpperCase() === trimmedCode)
  const canSubmit = trimmedName.length > 0 && trimmedCode.length > 0 && !duplicateName && !duplicateCode

  const handleSubmit = () => {
    if (!canSubmit) return
    const client = addClient({ name: trimmedName, code: trimmedCode })
    onClose()
    onCreated?.(client.id)
    toast({
      title: `${client.name} added`,
      description: 'Create a project against this client to start scheduling work.',
      tone: 'success',
      action: { label: 'New project', onClick: () => navigate(routes.projects({ client: client.id })) },
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="New client"
      subtitle="Clients group projects in the order book and roll up their own revenue and fulfillment dates."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit}>
            Create client
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Client name"
          required
          error={duplicateName ? 'A client with this name already exists.' : undefined}
        >
          <TextField
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (!touchedCode) setCode(suggestCode(clients.map((c) => c.code)))
            }}
            placeholder="e.g. Kestrel Marine Systems"
            autoFocus
          />
        </Field>

        <Field
          label="Client code"
          hint="Short reference used in tables and exports."
          error={duplicateCode ? 'This code is already in use.' : undefined}
        >
          <TextField
            value={code}
            onChange={(e) => {
              setTouchedCode(true)
              setCode(e.target.value)
            }}
            maxLength={8}
            className="w-32 font-mono uppercase"
          />
        </Field>

        <div className="flex items-center gap-3 rounded-lg bg-surface-sunken px-3 py-2.5">
          <Avatar name={trimmedName || 'New client'} size="lg" square />
          <div className="min-w-0">
            <Text variant="bodyMd" truncate className="font-medium">
              {trimmedName || 'New client'}
            </Text>
            <Text variant="bodySm" tone="faint" className="block font-mono">
              {trimmedCode || '—'}
            </Text>
          </div>
        </div>
      </div>
    </Modal>
  )
}
