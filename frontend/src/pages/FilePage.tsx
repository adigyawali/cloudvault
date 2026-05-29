import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { getFile, fetchFileBlob, type FileResponse } from '../lib/api'
import { formatBytes } from '../lib/format'
import { ArrowLeft, Download, FileIcon } from '../components/Icon'
import './FilePage.css'

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

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function FilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const fromFolderId =
    (location.state as { folderId?: number | null } | null)?.folderId ?? null

  const fileId = Number(id)

  const [file, setFile] = useState<FileResponse | null>(null)
  const [objectUrl, setObjectUrl] = useState<string | null>(null)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    document.body.dataset.surface = 'app'
    return () => {
      delete document.body.dataset.surface
    }
  }, [])

  useEffect(() => {
    if (!Number.isFinite(fileId)) {
      setError('Invalid file reference.')
      setLoading(false)
      return
    }
    let cancelled = false
    let createdUrl: string | null = null
    setLoading(true)
    setError(null)
    setObjectUrl(null)
    setTextContent(null)

    ;(async () => {
      try {
        const meta = await getFile(fileId)
        if (cancelled) return
        setFile(meta)

        if (detectKind(meta) === 'unsupported') return

        const blob = await fetchFileBlob(meta.id)
        if (cancelled) return
        if (detectKind(meta) === 'text') {
          setTextContent(await blob.text())
        } else {
          createdUrl = URL.createObjectURL(blob)
          setObjectUrl(createdUrl)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Could not load this file.',
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
      if (createdUrl) URL.revokeObjectURL(createdUrl)
    }
  }, [fileId])

  function goBack() {
    navigate('/app', { state: { openFolderId: fromFolderId } })
  }

  async function onDownload() {
    if (!file) return
    try {
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

  const kind = file ? detectKind(file) : 'unsupported'

  function renderPreview() {
    if (loading) {
      return (
        <div className="filepage__state">
          <span className="filepage__spinner" aria-hidden />
          <span>Loading file…</span>
        </div>
      )
    }
    if (error) {
      return (
        <div className="filepage__state">
          <span className="filepage__state-icon">
            <FileIcon size={26} />
          </span>
          <h3>Couldn’t open this file</h3>
          <p>{error}</p>
          <button className="filepage__btn" onClick={goBack}>
            Go back
          </button>
        </div>
      )
    }
    if (!file) return null
    if (kind === 'image' && objectUrl) {
      return <img className="filepage__img" src={objectUrl} alt={file.name} />
    }
    if (kind === 'pdf' && objectUrl) {
      return (
        <iframe className="filepage__frame" src={objectUrl} title={file.name} />
      )
    }
    if (kind === 'text' && textContent !== null) {
      return <pre className="filepage__text">{textContent}</pre>
    }
    return (
      <div className="filepage__state">
        <span className="filepage__state-icon">
          <FileIcon size={26} />
        </span>
        <h3>Preview not available</h3>
        <p>This file type can’t be previewed in the browser. You can still download it.</p>
        <button className="filepage__btn" onClick={onDownload}>
          <Download size={15} />
          Download
        </button>
      </div>
    )
  }

  return (
    <div className="filepage">
      <header className="filepage__bar">
        <button className="filepage__back" onClick={goBack}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div className="filepage__title">
          <span className="filepage__title-icon">
            <FileIcon size={15} />
          </span>
          <span className="filepage__title-name" title={file?.name}>
            {file?.name ?? 'File'}
          </span>
        </div>

        <button
          className="filepage__btn"
          onClick={onDownload}
          disabled={!file}
        >
          <Download size={15} />
          <span>Download</span>
        </button>
      </header>

      {file && (
        <div className="filepage__meta">
          <span>
            <strong>Type</strong> {file.type || 'Unknown'}
          </span>
          <span>
            <strong>Size</strong> {formatBytes(file.size)}
          </span>
          <span>
            <strong>Uploaded</strong> {formatDate(file.uploadDate)}
          </span>
        </div>
      )}

      <main className="filepage__stage">{renderPreview()}</main>
    </div>
  )
}

export default FilePage
