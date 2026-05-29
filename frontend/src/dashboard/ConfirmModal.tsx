import { useEffect } from 'react'
import Button from '../components/Button'
import { Trash, X } from '../components/Icon'

type Props = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loading,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, loading, onCancel])

  if (!open) return null

  return (
    <div
      className="modal__scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="modal" style={{ maxWidth: 420 }}>
        <span className="modal__halo" aria-hidden />
        <header className="modal__head">
          <div className="modal__head-text">
            <span className="modal__head-icon">
              <Trash size={16} />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{message}</p>
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '16px 22px',
          }}
        >
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button size="sm" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
