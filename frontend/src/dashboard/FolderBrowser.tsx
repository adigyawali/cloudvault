import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listFolders,
  listFiles,
  createFolder,
  deleteFolder,
  deleteFile,
  renameFolder,
  renameFile,
  moveFolder,
  moveFile,
  favoriteFolder,
  favoriteFile,
  getFolderPath,
  type FolderResponse,
  type FileResponse,
} from '../lib/api'
import { formatBytes } from '../lib/format'
import MoveModal from './MoveModal'
import RenameModal from './RenameModal'
import ConfirmModal from './ConfirmModal'
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
  Star,
  StarFilled,
  ArrowRight,
  More,
  Check,
} from '../components/Icon'
import './FolderBrowser.css'

type Props = {
  onFolderChange?: (id: number | null) => void
  reloadKey?: number
  onRequestUpload?: () => void
  // When set, the browser deep-navigates to this folder (used from Favorites).
  openFolderId?: number | null
}

const keyOf = (kind: 'd' | 'f', id: number) => `${kind}:${id}`

function FolderBrowser({
  onFolderChange,
  reloadKey,
  onRequestUpload,
  openFolderId,
}: Props) {
  const navigate = useNavigate()
  const [trail, setTrail] = useState<FolderResponse[]>([])
  const [folders, setFolders] = useState<FolderResponse[]>([])
  const [files, setFiles] = useState<FileResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [moveOpen, setMoveOpen] = useState(false)
  const [renameOpen, setRenameOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

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

  // Deep-navigate when asked from outside (e.g. opening a favorited folder).
  useEffect(() => {
    if (openFolderId == null) return
    let cancelled = false
    getFolderPath(openFolderId)
      .then((path) => {
        if (!cancelled) setTrail(path)
      })
      .catch(() => {
        /* fall back to staying where we are */
      })
    return () => {
      cancelled = true
    }
  }, [openFolderId])

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  // Reset selection whenever the listing changes underfoot.
  useEffect(() => {
    clearSelection()
  }, [currentId, clearSelection])

  function toggleSelect(key: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectionMode = selected.size > 0

  const selectedFolders = useMemo(
    () => folders.filter((f) => selected.has(keyOf('d', f.id))),
    [folders, selected],
  )
  const selectedFiles = useMemo(
    () => files.filter((f) => selected.has(keyOf('f', f.id))),
    [files, selected],
  )
  const selectedCount = selectedFolders.length + selectedFiles.length

  function openFolder(folder: FolderResponse) {
    setTrail((t) => [...t, folder])
  }

  function jumpTo(index: number) {
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

  async function toggleFavorite(
    kind: 'd' | 'f',
    id: number,
    current: boolean,
  ) {
    try {
      if (kind === 'd') await favoriteFolder(id, !current)
      else await favoriteFile(id, !current)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update favorite.')
    }
  }

  async function runBulk(fn: () => Promise<unknown>, onDone?: () => void) {
    setActionLoading(true)
    setActionError(null)
    try {
      await fn()
      clearSelection()
      onDone?.()
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed.')
    } finally {
      setActionLoading(false)
    }
  }

  function onMoveConfirm(targetFolderId: number | null) {
    runBulk(
      () =>
        Promise.all([
          ...selectedFolders.map((f) => moveFolder(f.id, targetFolderId)),
          ...selectedFiles.map((f) => moveFile(f.id, targetFolderId)),
        ]),
      () => setMoveOpen(false),
    )
  }

  function onRenameConfirm(name: string) {
    const folder = selectedFolders[0]
    const file = selectedFiles[0]
    if (!folder && !file) return
    runBulk(
      () =>
        folder ? renameFolder(folder.id, name) : renameFile(file!.id, name),
      () => setRenameOpen(false),
    )
  }

  function onDeleteConfirm() {
    runBulk(
      () =>
        Promise.all([
          ...selectedFolders.map((f) => deleteFolder(f.id)),
          ...selectedFiles.map((f) => deleteFile(f.id)),
        ]),
      () => setConfirmOpen(false),
    )
  }

  function onFavoriteSelected() {
    runBulk(() =>
      Promise.all([
        ...selectedFolders.map((f) => favoriteFolder(f.id, true)),
        ...selectedFiles.map((f) => favoriteFile(f.id, true)),
      ]),
    )
  }

  const isEmpty = !loading && !error && folders.length === 0 && files.length === 0
  const renameSubject = selectedFolders[0] ?? selectedFiles[0]

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
            <span
              key={folder.id}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
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

      {selectionMode && (
        <div className="fb__toolbar" role="toolbar" aria-label="Selection actions">
          <span className="fb__toolbar-count">{selectedCount} selected</span>
          <div className="fb__toolbar-actions">
            <button className="fb__taction" onClick={() => setMoveOpen(true)}>
              <ArrowRight size={13} /> Move
            </button>
            {selectedCount === 1 && (
              <button
                className="fb__taction"
                onClick={() => setRenameOpen(true)}
              >
                <More size={13} /> Rename
              </button>
            )}
            <button className="fb__taction" onClick={onFavoriteSelected}>
              <Star size={13} /> Favorite
            </button>
            <button
              className="fb__taction fb__taction--danger"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash size={13} /> Delete
            </button>
            <button
              className="fb__taction"
              onClick={clearSelection}
              aria-label="Clear selection"
            >
              <X size={13} /> Clear
            </button>
          </div>
        </div>
      )}

      {error && <div className="fb__state fb__error">{error}</div>}

      {loading ? (
        <div className="fb__state">Loading…</div>
      ) : isEmpty ? (
        <div className="fb__state">
          <div style={{ marginBottom: 8 }}>
            <Cloud size={24} />
          </div>
          This folder is empty. Create a folder or upload a file to get started.
        </div>
      ) : (
        <ul className="fb__grid">
          {folders.map((folder) => {
            const k = keyOf('d', folder.id)
            const sel = selected.has(k)
            return (
              <li key={k}>
                <div className={`fb__item ${sel ? 'is-selected' : ''}`}>
                  <button
                    className={`fb__check ${sel ? 'is-on' : ''}`}
                    onClick={() => toggleSelect(k)}
                    aria-label={sel ? 'Deselect' : 'Select'}
                  >
                    {sel && <Check size={12} />}
                  </button>
                  <button
                    className="fb__hit"
                    onClick={() =>
                      selectionMode ? toggleSelect(k) : openFolder(folder)
                    }
                  >
                    <span className="fb__icon">
                      <Folder size={18} />
                    </span>
                    <span className="fb__body">
                      <span className="fb__name" title={folder.name}>
                        {folder.name}
                      </span>
                      <span className="fb__meta">Folder</span>
                    </span>
                  </button>
                  <button
                    className={`fb__star ${folder.favorite ? 'is-on' : ''}`}
                    onClick={() => toggleFavorite('d', folder.id, folder.favorite)}
                    aria-label={folder.favorite ? 'Unfavorite' : 'Favorite'}
                  >
                    {folder.favorite ? (
                      <StarFilled size={14} />
                    ) : (
                      <Star size={14} />
                    )}
                  </button>
                </div>
              </li>
            )
          })}
          {files.map((file) => {
            const k = keyOf('f', file.id)
            const sel = selected.has(k)
            return (
              <li key={k}>
                <div
                  className={`fb__item fb__item--file ${sel ? 'is-selected' : ''}`}
                >
                  <button
                    className={`fb__check ${sel ? 'is-on' : ''}`}
                    onClick={() => toggleSelect(k)}
                    aria-label={sel ? 'Deselect' : 'Select'}
                  >
                    {sel && <Check size={12} />}
                  </button>
                  <button
                    className="fb__hit"
                    onClick={() =>
                      selectionMode
                        ? toggleSelect(k)
                        : navigate(`/file/${file.id}`, {
                            state: { folderId: currentId },
                          })
                    }
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
                  <button
                    className={`fb__star ${file.favorite ? 'is-on' : ''}`}
                    onClick={() => toggleFavorite('f', file.id, file.favorite)}
                    aria-label={file.favorite ? 'Unfavorite' : 'Favorite'}
                  >
                    {file.favorite ? <StarFilled size={14} /> : <Star size={14} />}
                  </button>
                </div>
              </li>
            )
          })}
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
              <div
                style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={saving}
                  disabled={!newName.trim()}
                >
                  Create
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MoveModal
        open={moveOpen}
        excludedFolderIds={selectedFolders.map((f) => f.id)}
        loading={actionLoading}
        error={actionError}
        onConfirm={onMoveConfirm}
        onCancel={() => {
          setMoveOpen(false)
          setActionError(null)
        }}
      />

      <RenameModal
        open={renameOpen}
        currentName={renameSubject?.name ?? ''}
        kind={selectedFolders[0] ? 'folder' : 'file'}
        loading={actionLoading}
        error={actionError}
        onSubmit={onRenameConfirm}
        onCancel={() => {
          setRenameOpen(false)
          setActionError(null)
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        title={`Delete ${selectedCount} item${selectedCount === 1 ? '' : 's'}?`}
        message={
          selectedFolders.length
            ? 'Folders are deleted with everything inside them. This cannot be undone.'
            : 'This cannot be undone.'
        }
        loading={actionLoading}
        onConfirm={onDeleteConfirm}
        onCancel={() => {
          setConfirmOpen(false)
          setActionError(null)
        }}
      />
    </div>
  )
}

export default FolderBrowser
