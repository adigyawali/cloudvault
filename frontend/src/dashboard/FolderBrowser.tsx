import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  listFolders,
  listFiles,
  createFolder,
  deleteFolder,
  type FolderResponse,
  type FileResponse,
} from '../lib/api'
import { formatBytes } from '../lib/format'
import FileViewer from './FileViewer'
import Button from '../components/Button'
import Input from '../components/Input'
import {
  Folder,
  FileIcon,
  Plus,
  Trash,
  HardDrive,
  ChevronRight,
  X,
  Cloud,
  Upload,
} from '../components/Icon'
import './FolderBrowser.css'

type Props = {
  // Reports the folder currently being viewed (null = root) so uploads target it.
  onFolderChange?: (id: number | null) => void
  // Bumping this number forces a re-fetch (e.g. after an upload completes).
  reloadKey?: number
  onRequestUpload?: () => void
}

function FolderBrowser({ onFolderChange, reloadKey, onRequestUpload }: Props) {
  // Breadcrumb trail; empty array means we're at the root.
  const [trail, setTrail] = useState<FolderResponse[]>([])
  const [folders, setFolders] = useState<FolderResponse[]>([])
  const [files, setFiles] = useState<FileResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [viewing, setViewing] = useState<FileResponse | null>(null)

  const currentId = trail.length ? trail[trail.length - 1].id : null

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [f, fl] = await Promise.all([listFolders(currentId), listFiles(currentId)])
      setFolders(f)
      setFiles(fl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load this folder.')
    } finally {
      setLoading(false)
    }
  }, [currentId])

  useEffect(() => {
    load()
  }, [load, reloadKey])

  useEffect(() => {
    onFolderChange?.(currentId)
  }, [currentId, onFolderChange])

  function openFolder(folder: FolderResponse) {
    setTrail((t) => [...t, folder])
  }

  function jumpTo(index: number) {
    // index -1 = root
    setTrail((t) => (index < 0 ? [] : t.slice(0, index + 1)))
  }

  async function onCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    try {
      await createFolder(name, currentId)
      setNewName('')
      setCreating(false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create folder.')
    } finally {
      setSaving(false)
    }
  }

  async function onDelete(folder: FolderResponse) {
    if (!confirm(`Delete "${folder.name}" and everything inside it?`)) return
    try {
      await deleteFolder(folder.id)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete folder.')
    }
  }

  const isEmpty = !loading && !error && folders.length === 0 && files.length === 0

  return (
    <div className="fb">
      <div className="fb__bar">
        <nav className="fb__crumbs" aria-label="Folder path">
          <button
            className={`fb__crumb ${trail.length === 0 ? 'fb__crumb--active' : ''}`}
            onClick={() => jumpTo(-1)}
          >
            <HardDrive size={14} />
            <span>My Vault</span>
          </button>
          {trail.map((folder, i) => (
            <span key={folder.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="fb__crumb-sep">
                <ChevronRight size={12} />
              </span>
              <button
                className={`fb__crumb ${i === trail.length - 1 ? 'fb__crumb--active' : ''}`}
                onClick={() => jumpTo(i)}
              >
                {folder.name}
              </button>
            </span>
          ))}
        </nav>

        <div style={{ display: 'flex', gap: 8 }}>
          {onRequestUpload && (
            <button className="fb__new fb__new--ghost" onClick={onRequestUpload}>
              <Upload size={14} />
              Upload
            </button>
          )}
          <button className="fb__new" onClick={() => setCreating(true)}>
            <Plus size={14} />
            New folder
          </button>
        </div>
      </div>

      {error && <div className="fb__state fb__error">{error}</div>}

      {loading ? (
        <div className="fb__state">Loading…</div>
      ) : isEmpty ? (
        <div className="fb__state">
          <div style={{ marginBottom: 8 }}>
            <Cloud size={24} />
          </div>
          This folder is empty. Create a folder to get started.
        </div>
      ) : (
        <ul className="fb__grid">
          {folders.map((folder) => (
            <li key={`d-${folder.id}`}>
              <button className="fb__item" onClick={() => openFolder(folder)}>
                <span className="fb__icon">
                  <Folder size={18} />
                </span>
                <span className="fb__body">
                  <span className="fb__name" title={folder.name}>
                    {folder.name}
                  </span>
                  <span className="fb__meta">Folder</span>
                </span>
                <span
                  className="fb__del"
                  role="button"
                  aria-label={`Delete ${folder.name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(folder)
                  }}
                >
                  <Trash size={13} />
                </span>
              </button>
            </li>
          ))}
          {files.map((file) => (
            <li key={`f-${file.id}`}>
              <button
                className="fb__item fb__item--file"
                onClick={() => setViewing(file)}
              >
                <span className="fb__icon fb__icon--file">
                  <FileIcon size={18} />
                </span>
                <span className="fb__body">
                  <span className="fb__name" title={file.name}>
                    {file.name}
                  </span>
                  <span className="fb__meta">{formatBytes(file.size)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <div
          className="modal__scrim"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreating(false)
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Create folder"
        >
          <div className="modal" style={{ maxWidth: 420 }}>
            <span className="modal__halo" aria-hidden />
            <header className="modal__head">
              <div className="modal__head-text">
                <span className="modal__head-icon">
                  <Folder size={16} />
                </span>
                <div>
                  <h3>New folder</h3>
                  <p>
                    {trail.length
                      ? `Inside "${trail[trail.length - 1].name}"`
                      : 'At the root of your vault'}
                  </p>
                </div>
              </div>
              <button
                className="modal__close"
                onClick={() => setCreating(false)}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </header>
            <form className="fb__modal-form" onSubmit={onCreate}>
              <Input
                label="Folder name"
                placeholder="e.g. Project assets"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={saving}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={saving} disabled={!newName.trim()}>
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FileViewer file={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}

export default FolderBrowser
