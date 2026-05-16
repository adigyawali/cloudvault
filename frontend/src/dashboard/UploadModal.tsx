import { useEffect, useRef, useState, type DragEvent } from 'react'
import Button from '../components/Button'
import { Upload, X, FileIcon, Check, Cloud } from '../components/Icon'
import { formatBytes } from '../lib/format'
import { uploadFile } from '../lib/api'
import './UploadModal.css'

type Props = {
  open: boolean
  onClose: () => void
  // Folder the files should be uploaded into; null = root.
  folderId: number | null
  // Called after at least one file finished uploading, so the listing refreshes.
  onUploaded?: () => void
}

type Item = {
  id: string
  name: string
  size: number
  progress: number
  done: boolean
  error?: string
}

function UploadModal({ open, onClose, folderId, onUploaded }: Props) {
  const [items, setItems] = useState<Item[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const uploadedRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      const t = setTimeout(() => {
        setItems([])
        uploadedRef.current = false
      }, 250)
      return () => clearTimeout(t)
    }
  }, [open])

  function patch(id: string, next: Partial<Item>) {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...next } : p)))
  }

  async function addFiles(files: FileList | File[]) {
    const list = Array.from(files)
    if (list.length === 0) return

    const queued: { item: Item; file: File }[] = list.map((f) => ({
      file: f,
      item: {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: f.size,
        progress: 0,
        done: false,
      },
    }))
    setItems((prev) => [...prev, ...queued.map((q) => q.item)])

    setBusy(true)
    for (const { item, file } of queued) {
      try {
        await uploadFile(file, folderId, (pct) => patch(item.id, { progress: pct }))
        patch(item.id, { progress: 100, done: true })
        uploadedRef.current = true
      } catch (err) {
        patch(item.id, {
          error: err instanceof Error ? err.message : 'Upload failed',
        })
      }
    }
    setBusy(false)
    if (uploadedRef.current) onUploaded?.()
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  function handleClose() {
    if (busy) return
    onClose()
  }

  if (!open) return null

  const completedCount = items.filter((i) => i.done).length

  return (
    <div
      className="modal__scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Upload files"
    >
      <div className="modal">
        <span className="modal__halo" aria-hidden />

        <header className="modal__head">
          <div className="modal__head-text">
            <span className="modal__head-icon">
              <Cloud size={16} />
            </span>
            <div>
              <h3>Upload to your vault</h3>
              <p>Drop files here or pick from your device.</p>
            </div>
          </div>
          <button className="modal__close" onClick={handleClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>

        <div
          className={`drop ${dragOver ? 'is-over' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
        >
          <div className="drop__bg" aria-hidden />
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <span className="drop__icon">
            <Upload size={20} />
          </span>
          <span className="drop__title">
            {dragOver ? 'Release to upload' : 'Drag & drop files'}
          </span>
          <span className="drop__sub">or click to browse</span>
        </div>

        {items.length > 0 && (
          <ul className="upload-list" aria-label="Upload queue">
            {items.map((it) => (
              <li
                key={it.id}
                className={`upload-row ${it.done ? 'is-done' : ''}`}
              >
                <span className="upload-row__icon">
                  {it.done ? <Check size={14} /> : <FileIcon size={15} />}
                </span>
                <div className="upload-row__body">
                  <div className="upload-row__head">
                    <span className="upload-row__name" title={it.name}>
                      {it.name}
                    </span>
                    <span className="upload-row__size">{formatBytes(it.size)}</span>
                  </div>
                  <div className="upload-row__bar">
                    <span style={{ width: `${it.progress}%` }} />
                  </div>
                </div>
                <span className="upload-row__pct">
                  {it.error ? 'Failed' : it.done ? 'Done' : `${Math.round(it.progress)}%`}
                </span>
              </li>
            ))}
          </ul>
        )}

        <footer className="modal__foot">
          <span className="modal__foot-meta">
            {items.length === 0
              ? 'Nothing in the queue yet.'
              : `${completedCount} of ${items.length} complete`}
          </span>
          <div className="modal__foot-actions">
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={busy}>
              {completedCount > 0 ? 'Close' : 'Cancel'}
            </Button>
            <Button
              size="sm"
              onClick={handleClose}
              disabled={busy || items.length === 0}
            >
              Done
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default UploadModal
