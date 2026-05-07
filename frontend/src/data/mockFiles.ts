export type FileKind =
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'doc'
  | 'archive'
  | 'other'

export type CloudFile = {
  id: string
  name: string
  kind: FileKind
  size: number // bytes; folders use 0
  modified: string // ISO date
  starred?: boolean
  shared?: boolean
  itemCount?: number // folders only
  preview?: string // CSS gradient placeholder
}

export const mockFiles: CloudFile[] = [
  {
    id: '1',
    name: 'Brand Identity 2026',
    kind: 'folder',
    size: 0,
    modified: '2026-04-28T10:00:00Z',
    starred: true,
    shared: true,
    itemCount: 38,
  },
  {
    id: '2',
    name: 'Quarterly Review',
    kind: 'folder',
    size: 0,
    modified: '2026-04-22T15:21:00Z',
    itemCount: 12,
  },
  {
    id: '3',
    name: 'Product Launch.key',
    kind: 'doc',
    size: 18_400_000,
    modified: '2026-04-30T09:14:00Z',
    starred: true,
    shared: true,
  },
  {
    id: '4',
    name: 'Hero — final.png',
    kind: 'image',
    size: 4_290_000,
    modified: '2026-04-29T22:01:00Z',
    preview: 'linear-gradient(135deg, #7c5cff 0%, #4cc9f0 100%)',
  },
  {
    id: '5',
    name: 'Showreel-2026.mp4',
    kind: 'video',
    size: 482_000_000,
    modified: '2026-04-26T11:45:00Z',
    preview: 'linear-gradient(135deg, #f472b6 0%, #7c5cff 100%)',
  },
  {
    id: '6',
    name: 'Investor Memo.pdf',
    kind: 'pdf',
    size: 2_100_000,
    modified: '2026-04-30T18:33:00Z',
    starred: true,
  },
  {
    id: '7',
    name: 'Onboarding Flow.fig',
    kind: 'doc',
    size: 12_800_000,
    modified: '2026-04-25T08:12:00Z',
    shared: true,
  },
  {
    id: '8',
    name: 'Late-night-mix.wav',
    kind: 'audio',
    size: 56_400_000,
    modified: '2026-04-21T01:09:00Z',
  },
  {
    id: '9',
    name: 'Field photo set',
    kind: 'image',
    size: 38_900_000,
    modified: '2026-04-19T17:50:00Z',
    preview: 'linear-gradient(135deg, #34d399 0%, #4cc9f0 100%)',
  },
  {
    id: '10',
    name: 'Q1 Financials.xlsx',
    kind: 'doc',
    size: 1_240_000,
    modified: '2026-04-15T13:20:00Z',
  },
  {
    id: '11',
    name: 'Archive 2025.zip',
    kind: 'archive',
    size: 1_840_000_000,
    modified: '2026-03-30T09:00:00Z',
  },
  {
    id: '12',
    name: 'Press kit',
    kind: 'folder',
    size: 0,
    modified: '2026-04-10T12:00:00Z',
    itemCount: 7,
  },
]

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const value = bytes / Math.pow(1024, i)
  return `${value < 10 && i > 0 ? value.toFixed(1) : Math.round(value)} ${units[i]}`
}

export function formatRelative(iso: string, now = new Date()): string {
  const d = new Date(iso)
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86_400 * 7) return `${Math.floor(diff / 86_400)}d ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
