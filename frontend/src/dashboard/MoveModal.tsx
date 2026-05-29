import { useCallback, useEffect, useState } from 'react'
import { listFolders, type FolderResponse } from '../lib/api'
import Button from '../components/Button'
import { Folder, HardDrive, ChevronRight, X } from '../components/Icon'

type Props = {
  open: boolean
  // Folders being moved — cannot be a destination (would be a no-op / cycle).
  excludedFolderIds: number[]
  loading?: boolean
  error?: string | null
  onConfirm: (targetFolderId: number | null) => void
  onCancel: () => void
}

function MoveModal({
  open,
  excludedFolderIds,
  loading,
  error,
  onConfirm,
  onCancel,
}: Props) {
  const [trail, setTrail] = useState<FolderResponse[]>([])
  const [folders, setFolders] = useState<FolderResponse[]>([])
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const currentId = trail.length ? trail[trail.length - 1].id : null

  const load = useCallback(async () => {
    setBusy(true)
    setLoadError(null)
    try {
      setFolders(await listFolders(currentId))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load folders.')
    } finally {
      setBusy(false)
    }
  }, [currentId])

  useEffect(() => {
    if (open) {
      setTrail([])
    }
  }, [open])

  useEffect(() => {
    if (open) load()
  }, [open, load])

  if (!open) return null

  const excluded = new Set(excludedFolderIds)
  const targetIsExcluded = currentId != null && excluded.has(currentId)

  return (
    <div
      className="modal__scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Move items"
    >
      <div className="modal" style={{ maxWidth: 480 }}>
        <span className="modal__halo" aria-hidden />
        <header className="modal__head">
          <div className="modal__head-text">
            <span className="modal__head-icon">
              <Folder size={16} />
            </span>
            <div>
              <h3>Move to…</h3>
              <p>Pick a destination folder.</p>
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

        <div style={{ padding: '14px 22px 0' }}>
          <nav className="fb__crumbs" aria-label="Destination path">
            <button
              className={`fb__crumb ${trail.length === 0 ? 'fb__crumb--active' : ''}`}
              onClick={() => setTrail([])}
            >
              <HardDrive size={14} />
              <span>My Vault</span>
            </button>
            {trail.map((f, i) => (
              <span
                key={f.id}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                <span className="fb__crumb-sep">
                  <ChevronRight size={12} />
                </span>
                <button
                  className={`fb__crumb ${i === trail.length - 1 ? 'fb__crumb--active' : ''}`}
                  onClick={() => setTrail((t) => t.slice(0, i + 1))}
                >
                  {f.name}
                </button>
              </span>
            ))}
          </nav>
        </div>

        <div
          style={{
            margin: '12px 22px',
            maxHeight: 280,
            overflowY: 'auto',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--r-md)',
          }}
        >
          {busy ? (
            <div className="fb__state">Loading…</div>
          ) : loadError ? (
            <div className="fb__state fb__error">{loadError}</div>
          ) : folders.length === 0 ? (
            <div className="fb__state">No subfolders here.</div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 6 }}>
              {folders.map((f) => {
                const disabled = excluded.has(f.id)
                return (
                  <li key={f.id}>
                    <button
                      className="fb__item"
                      style={{
                        opacity: disabled ? 0.45 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                      }}
                      disabled={disabled}
                      onClick={() => setTrail((t) => [...t, f])}
                    >
                      <span className="fb__icon">
                        <Folder size={16} />
                      </span>
                      <span className="fb__body">
                        <span className="fb__name">{f.name}</span>
                      </span>
                      <span className="fb__crumb-sep">
                        <ChevronRight size={14} />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error && (
          <div className="fb__state fb__error" style={{ padding: '0 22px 8px' }}>
            {error}
          </div>
        )}

        <footer className="modal__foot">
          <span className="modal__foot-meta">
            Destination:{' '}
            <strong>
              {trail.length ? trail[trail.length - 1].name : 'My Vault (root)'}
            </strong>
          </span>
          <div className="modal__foot-actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => onConfirm(currentId)}
              loading={loading}
              disabled={targetIsExcluded}
            >
              Move here
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default MoveModal
