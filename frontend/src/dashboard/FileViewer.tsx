import { useEffect, useState } from 'react'
import { fetchFileBlob, type FileResponse } from '../lib/api'
import { formatBytes } from '../lib/format'
import { FileIcon, Download, X } from '../components/Icon'
import './FileViewer.css'

type Props = {
  file: FileResponse | null
  onClose: () => void
}

type Kind = 'image' | 'pdf' | 'text' | 'unsupported'

const IMAGE_EXT = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'avif']
const TEXT_EXT = [
  'txt', 'md', 'markdown', 'json', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss',
  'html', 'xml', 'csv', 'yml', 'yaml', 'java', 'py', 'c', 'cpp', 'h', 'hpp',
  'sh', 'bash', 'sql', 'go', 'rs', 'rb', 'php', 'kt', 'toml', 'ini', 'env',
  'log', 'gradle', 'properties',
]

function detectKind(file: FileResponse): Kind {
  const type = (file.type || '').toLowerCase()
  const ext = file.name.includes('.')
    ? file.name.split('.').pop()!.toLowerCase()
    : ''

  if (type.startsWith('image/') || IMAGE_EXT.includes(ext)) return 'image'
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf'
  if (
    type.startsWith('text/') ||
    type === 'application/json' ||
    type === 'application/xml' ||
    type === 'application/javascript' ||
    TEXT_EXT.includes(ext)
  ) {
    return 'text'
  }
  return 'unsupported'
}

function FileViewer({ file, onClose }: Props) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const kind = file ? detectKind(file) : 'unsupported'

  useEffect(() => {
    if (!file) return
    let revoked = false
    let createdUrl: string | null = null
    setLoading(true)
    setError(null)
    setObjectUrl(null)
    setTextContent(null)

    // Unsupported types: skip the network fetch, just show metadata.
    if (detectKind(file) === 'unsupported') {
      setLoading(false)
      return
    }

    fetchFileBlob(file.id)
      .then(async (blob) => {
        if (revoked) return
        if (detectKind(file) === 'text') {
          setTextContent(await blob.text())
        } else {
          createdUrl = URL.createObjectURL(blob)
          setObjectUrl(createdUrl)
        }
      })
      .catch((err) => {
        if (!revoked) {
          setError(err instanceof Error ? err.message : 'Could not load this file.')
        }
      })
      .finally(() => {
        if (!revoked) setLoading(false)
      })

    return () => {
      revoked = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [file])

  useEffect(() => {
    if (!file) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [file, onClose])

  if (!file) return null

  async function onDownload() {
    if (!file) return
    try {
      // Reuse the in-memory blob when present; otherwise fetch it.
      let url = objectUrl
      let temp = false
      if (!url) {
        const blob = await fetchFileBlob(file.id)
        url = URL.createObjectURL(blob)
        temp = true
      }
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      if (temp) setTimeout(() => URL.revokeObjectURL(url!), 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed.')
    }
  }

  function renderBody() {
    if (loading) {
      return (
        <div className="fv__state">
          <span className="fv__spinner" aria-hidden />
          <span>Loading preview…</span>
        </div>
      )
    }
    if (error) {
      return (
        <div className="fv__state">
          <span className="fv__state-icon">
            <FileIcon size={22} />
          </span>
          <h4>Couldn’t load this file</h4>
          <p>{error}</p>
        </div>
      )
    }
    if (kind === 'image' && objectUrl) {
      return <img className="fv__img" src={objectUrl} alt={file!.name} />
    }
    if (kind === 'pdf' && objectUrl) {
      return <iframe className="fv__frame" src={objectUrl} title={file!.name} />
    }
    if (kind === 'text' && textContent !== null) {
      return <pre className="fv__text">{textContent}</pre>
    }
    // Unsupported (or nothing rendered): metadata + download.
    return (
      <div className="fv__state">
        <span className="fv__state-icon">
          <FileIcon size={22} />
        </span>
        <h4>Preview not available</h4>
        <p>This file type can’t be previewed in the browser.</p>
        <ul className="fv__meta">
          <li>
            <strong>Name:</strong> {file!.name}
          </li>
          <li>
            <strong>Type:</strong> {file!.type || 'Unknown'}
          </li>
          <li>
            <strong>Size:</strong> {formatBytes(file!.size)}
          </li>
        </ul>
      </div>
    )
  }

  return (
    <div
      className="modal__scrim"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`Viewing ${file.name}`}
    >
      <div className="fv">
        <header className="fv__head">
          <span className="fv__head-icon">
            <FileIcon size={16} />
          </span>
          <div className="fv__head-text">
            <span className="fv__name" title={file.name}>
              {file.name}
            </span>
            <span className="fv__sub">
              {file.type || 'Unknown type'} · {formatBytes(file.size)}
            </span>
          </div>
          <div className="fv__head-actions">
            <button className="fv__btn" onClick={onDownload}>
              <Download size={14} />
              Download
            </button>
            <button className="fv__close" onClick={onClose} aria-label="Close">
              <X size={16} />
            </button>
          </div>
        </header>
        <div className="fv__body">{renderBody()}</div>
      </div>
    </div>
  )
}

export default FileViewer
