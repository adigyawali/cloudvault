import type { CloudFile, FileKind } from '../data/mockFiles'
import { formatBytes, formatRelative } from '../data/mockFiles'
import {
  Folder,
  Image,
  Video,
  Music,
  Pdf,
  FileIcon,
  Star,
  StarFilled,
  Users,
  More,
  Cloud,
} from '../components/Icon'
import './FileGrid.css'

type Props = {
  files: CloudFile[]
  view: 'grid' | 'list'
  onToggleStar: (id: string) => void
  onOpenUpload?: () => void
}

const KIND_META: Record<FileKind, { icon: React.FC<{ size?: number }>; tint: string; label: string }> = {
  folder: { icon: Folder, tint: 'tint-violet', label: 'Folder' },
  image: { icon: Image, tint: 'tint-cyan', label: 'Image' },
  video: { icon: Video, tint: 'tint-pink', label: 'Video' },
  audio: { icon: Music, tint: 'tint-amber', label: 'Audio' },
  pdf: { icon: Pdf, tint: 'tint-red', label: 'PDF' },
  doc: { icon: FileIcon, tint: 'tint-blue', label: 'Document' },
  archive: { icon: FileIcon, tint: 'tint-green', label: 'Archive' },
  other: { icon: FileIcon, tint: 'tint-slate', label: 'File' },
}

function FileGrid({ files, view, onToggleStar, onOpenUpload }: Props) {
  if (files.length === 0) {
    return (
      <div className="empty">
        <div className="empty__art" aria-hidden>
          <Cloud size={26} />
        </div>
        <h3>Nothing here yet</h3>
        <p>Upload a file or adjust your search to get started.</p>
        {onOpenUpload && (
          <button className="empty__cta" onClick={onOpenUpload}>
            Upload your first file
          </button>
        )}
      </div>
    )
  }

  return view === 'grid' ? (
    <ul className="file-grid">
      {files.map((file, i) => (
        <li key={file.id} className="file-card" style={{ animationDelay: `${i * 32}ms` }}>
          <FileCard file={file} onToggleStar={onToggleStar} />
        </li>
      ))}
    </ul>
  ) : (
    <FileList files={files} onToggleStar={onToggleStar} />
  )
}

function FileCard({
  file,
  onToggleStar,
}: {
  file: CloudFile
  onToggleStar: (id: string) => void
}) {
  const meta = KIND_META[file.kind]
  const Icon = meta.icon

  return (
    <article className="file-card__inner">
      <span className="file-card__halo" aria-hidden />

      <div className={`file-card__preview ${meta.tint}`}>
        {file.preview ? (
          <span
            className="file-card__preview-img"
            style={{ backgroundImage: file.preview }}
            aria-hidden
          />
        ) : (
          <span className="file-card__preview-icon" aria-hidden>
            <Icon size={24} />
          </span>
        )}

        <button
          className={`file-card__star ${file.starred ? 'is-on' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onToggleStar(file.id)
          }}
          aria-label={file.starred ? 'Unstar' : 'Star'}
        >
          {file.starred ? <StarFilled size={13} /> : <Star size={13} />}
        </button>

        {file.shared && (
          <span className="file-card__chip" title="Shared">
            <Users size={10} />
            <span>Shared</span>
          </span>
        )}
      </div>

      <div className="file-card__body">
        <div className="file-card__title-row">
          <span className="file-card__title" title={file.name}>{file.name}</span>
          <button className="file-card__more" aria-label="More actions" onClick={(e) => e.stopPropagation()}>
            <More size={14} />
          </button>
        </div>
        <div className="file-card__meta">
          <span>
            {file.kind === 'folder'
              ? `${file.itemCount ?? 0} items`
              : formatBytes(file.size)}
          </span>
          <span aria-hidden>·</span>
          <span>{formatRelative(file.modified)}</span>
        </div>
      </div>
    </article>
  )
}

function FileList({
  files,
  onToggleStar,
}: {
  files: CloudFile[]
  onToggleStar: (id: string) => void
}) {
  return (
    <div className="file-list">
      <div className="file-list__head">
        <span>Name</span>
        <span>Type</span>
        <span>Size</span>
        <span>Modified</span>
        <span aria-hidden />
      </div>
      <ul className="file-list__rows">
        {files.map((file, i) => {
          const meta = KIND_META[file.kind]
          const Icon = meta.icon
          return (
            <li
              key={file.id}
              className="file-list__row"
              style={{ animationDelay: `${i * 22}ms` }}
            >
              <span className="file-list__name">
                <span className={`file-list__icon ${meta.tint}`}>
                  <Icon size={15} />
                </span>
                <span className="file-list__title">{file.name}</span>
                {file.shared && (
                  <span className="file-list__chip">
                    <Users size={10} /> Shared
                  </span>
                )}
              </span>
              <span className="file-list__type">{meta.label}</span>
              <span className="file-list__cell">
                {file.kind === 'folder'
                  ? `${file.itemCount ?? 0} items`
                  : formatBytes(file.size)}
              </span>
              <span className="file-list__cell">{formatRelative(file.modified)}</span>
              <button
                className={`file-list__star ${file.starred ? 'is-on' : ''}`}
                onClick={() => onToggleStar(file.id)}
                aria-label={file.starred ? 'Unstar' : 'Star'}
              >
                {file.starred ? <StarFilled size={13} /> : <Star size={13} />}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default FileGrid
