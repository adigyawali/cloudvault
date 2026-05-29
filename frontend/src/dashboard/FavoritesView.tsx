import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  listFavoriteFolders,
  listFavoriteFiles,
  favoriteFolder,
  favoriteFile,
  type FolderResponse,
  type FileResponse,
} from '../lib/api'
import { formatBytes } from '../lib/format'
import { Folder, FileIcon, StarFilled, Star } from '../components/Icon'
import './FolderBrowser.css'

type Props = {
  // Opens a favorited folder back in the All Files browser.
  onOpenFolder: (folderId: number) => void
}

function FavoritesView({ onOpenFolder }: Props) {
  const [folders, setFolders] = useState<FolderResponse[]>([])
  const [files, setFiles] = useState<FileResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [d, f] = await Promise.all([
        listFavoriteFolders(),
        listFavoriteFiles(),
      ])
      setFolders(d)
      setFiles(f)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load favorites.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function unfavoriteFolder(id: number) {
    try {
      await favoriteFolder(id, false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update favorite.')
    }
  }

  async function unfavoriteFile(id: number) {
    try {
      await favoriteFile(id, false)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update favorite.')
    }
  }

  const empty = !loading && !error && folders.length === 0 && files.length === 0

  return (
    <div className="fb">
      <div className="fb__bar">
        <nav className="fb__crumbs">
          <span className="fb__crumb fb__crumb--active">
            <StarFilled size={14} />
            <span>Favorites</span>
          </span>
        </nav>
      </div>

      {error && <div className="fb__state fb__error">{error}</div>}

      {loading ? (
        <div className="fb__state">Loading…</div>
      ) : empty ? (
        <div className="fb__state">
          <div style={{ marginBottom: 8 }}>
            <Star size={24} />
          </div>
          No favorites yet. Star a file or folder to find it here.
        </div>
      ) : (
        <ul className="fb__grid">
          {folders.map((folder) => (
            <li key={`d-${folder.id}`}>
              <div className="fb__item">
                <button
                  className="fb__hit"
                  onClick={() => onOpenFolder(folder.id)}
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
                  className="fb__star is-on"
                  onClick={() => unfavoriteFolder(folder.id)}
                  aria-label="Unfavorite"
                >
                  <StarFilled size={14} />
                </button>
              </div>
            </li>
          ))}
          {files.map((file) => (
            <li key={`f-${file.id}`}>
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
                    <span className="fb__meta">{formatBytes(file.size)}</span>
                  </span>
                </button>
                <button
                  className="fb__star is-on"
                  onClick={() => unfavoriteFile(file.id)}
                  aria-label="Unfavorite"
                >
                  <StarFilled size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default FavoritesView
