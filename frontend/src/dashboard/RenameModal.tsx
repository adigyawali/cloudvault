import { useEffect, useState, type FormEvent } from 'react'
import Button from '../components/Button'
import Input from '../components/Input'
import { FileIcon, X } from '../components/Icon'

type Props = {
  open: boolean
  currentName: string
  kind: 'file' | 'folder'
  loading?: boolean
  error?: string | null
  onSubmit: (name: string) => void
  onCancel: () => void
}

function RenameModal({
  open,
  currentName,
  kind,
  loading,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [name, setName] = useState(currentName)

  useEffect(() => {
    if (open) setName(currentName)
  }, [open, currentName])

  if (!open) return null

  const trimmed = name.trim()
  const valid = trimmed.length > 0 && trimmed.length <= 255 && !/[/\\]/.test(trimmed)

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (valid && !loading) onSubmit(trimmed)
  }

  return (
    <div
      className="modal__scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Rename ${kind}`}
    >
      <div className="modal" style={{ maxWidth: 420 }}>
        <span className="modal__halo" aria-hidden />
        <header className="modal__head">
          <div className="modal__head-text">
            <span className="modal__head-icon">
              <FileIcon size={16} />
            </span>
            <div>
              <h3>Rename {kind}</h3>
              <p>Give this {kind} a new name.</p>
            </div>
          </div>
          <button
            className="modal__close"
            onClick={onCancel}
            aria-label="Close"
            disabled={loading}
          >
            <X size={16} />
          </button>
        </header>
        <form className="fb__modal-form" onSubmit={submit}>
          <Input
            label="Name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            error={
              error ||
              (name.length > 0 && !valid
                ? 'Use a non-empty name without slashes.'
                : undefined)
            }
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={loading} disabled={!valid}>
              Rename
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RenameModal
