import { useEffect, useRef, useState, type DragEvent } from 'react'
import Button from '../components/Button'
import { Upload, X, FileIcon, Check, Cloud } from '../components/Icon'
import { formatBytes } from '../data/mockFiles'
import './UploadModal.css'

type Props = {
  open: boolean
  onClose: () => void
}

type Item = {
  id: string
  name: string
  size: number
  progress: number
  done: boolean
}

function UploadModal({ open, onClose }: Props) {
  const [items, setItems] = useState<Item[]>([])
  const [dragOver, setDragOver] = useState(false)
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
      const t = setTimeout(() => setItems([]), 250)
      return () => clearTimeout(t)
    }
  }, [open])

  function addFiles(files: FileList | File[]) {
    const list = Array.from(files)
    const newItems: Item[] = list.map((f) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      size: f.size,
      progress: 0,
      done: false,
    }))
    setItems((prev) => [...prev, ...newItems])

    newItems.forEach((it) => {
      const tick = setInterval(() => {
        setItems((prev) =>
          prev.map((p) => {
            if (p.id !== it.id) return p
            const next = Math.min(100, p.progress + 6 + Math.random() * 14)
            const done = next >= 100
            if (done) clearInterval(tick)
            return { ...p, progress: next, done }
          }),
        )
      }, 220)
    })
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  if (!open) return null

  const completedCount = items.filter((i) => i.done).length

  return (
    <div
      className="modal__scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
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
          <button className="modal__close" onClick={onClose} aria-label="Close">
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
          <span className="drop__sub">or click to browse · up to 5 GB per file</span>
        </div>

        {items.length > 0 && (
          <ul className="upload-list" aria-label="Upload queue">
            {items.map((it) => (
              <li key={it.id} className={`upload-row ${it.done ? 'is-done' : ''}`}>
                <span className="upload-row__icon">
                  {it.done ? <Check size={14} /> : <FileIcon size={15} />}
                </span>
                <div className="upload-row__body">
                  <div className="upload-row__head">
                    <span className="upload-row__name" title={it.name}>{it.name}</span>
                    <span className="upload-row__size">{formatBytes(it.size)}</span>
                  </div>
                  <div className="upload-row__bar">
                    <span style={{ width: `${it.progress}%` }} />
                  </div>
                </div>
                <span className="upload-row__pct">
                  {it.done ? 'Done' : `${Math.round(it.progress)}%`}
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
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={onClose} disabled={items.length === 0}>
              Done
            </Button>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default UploadModal
