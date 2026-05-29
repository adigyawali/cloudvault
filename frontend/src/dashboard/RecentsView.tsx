import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listRecentFiles,
  favoriteFile,
  type FileResponse,
} from '../lib/api'
import { formatBytes } from '../lib/format'
import { FileIcon, Clock, Star, StarFilled } from '../components/Icon'
import './FolderBrowser.css'

function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = (Date.now() - then) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86_400 * 7) return `${Math.floor(diff / 86_400)}d ago`
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function RecentsView() {
  const [files, setFiles] = useState<FileResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setFiles(await listRecentFiles(50))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load recents.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function toggleFavorite(file: FileResponse) {
    try {
      await favoriteFile(file.id, !file.favorite)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update favorite.')
    }
  }

  const empty = !loading && !error && files.length === 0

  return (
    <div className="fb">
      <div className="fb__bar">
        <nav className="fb__crumbs">
          <span className="fb__crumb fb__crumb--active">
            <Clock size={14} />
            <span>Recents</span>
          </span>
        </nav>
      </div>

      {error && <div className="fb__state fb__error">{error}</div>}

      {loading ? (
        <div className="fb__state">Loading…</div>
      ) : empty ? (
        <div className="fb__state">
          <div style={{ marginBottom: 8 }}>
            <Clock size={24} />
          </div>
          Nothing recent yet. Uploaded and opened files show up here.
        </div>
      ) : (
        <ul className="fb__grid">
          {files.map((file) => (
            <li key={file.id}>
              <div className="fb__item fb__item--file">
                <button
                  className="fb__hit"
                  onClick={() =>
                    navigate(`/file/${file.id}`, {
                      state: { folderId: file.folderId ?? null },
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
                    <span className="fb__meta">
                      {formatBytes(file.size)} ·{' '}
                      {relativeTime(file.lastAccessedAt ?? file.uploadDate)}
                    </span>
                  </span>
                </button>
                <button
                  className={`fb__star ${file.favorite ? 'is-on' : ''}`}
                  onClick={() => toggleFavorite(file)}
                  aria-label={file.favorite ? 'Unfavorite' : 'Favorite'}
                >
                  {file.favorite ? <StarFilled size={14} /> : <Star size={14} />}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default RecentsView
