import { useEffect, useMemo, useState } from 'react'
import Sidebar from '../dashboard/Sidebar'
import Topbar from '../dashboard/Topbar'
import FileGrid from '../dashboard/FileGrid'
import UploadModal from '../dashboard/UploadModal'
import {
  Grid,
  List,
  ChevronRight,
  HardDrive,
  Clock,
  Star,
  Users,
  Inbox,
  Trash,
  Settings,
  Sparkles,
} from '../components/Icon'
import { mockFiles, formatBytes } from '../data/mockFiles'
import type { CloudFile } from '../data/mockFiles'
import { useSession } from '../lib/auth'
import './Dashboard.css'

type View = 'grid' | 'list'
type Section = 'all' | 'recent' | 'starred' | 'shared' | 'inbox' | 'trash' | 'settings'

const SECTION_TITLES: Record<Section, { title: string; sub: string; icon: React.ReactNode }> = {
  all: { title: 'All Files', sub: 'Everything in your vault.', icon: <HardDrive /> },
  recent: { title: 'Recent', sub: 'Files touched in the last 7 days.', icon: <Clock /> },
  starred: { title: 'Starred', sub: 'Files you flagged for quick access.', icon: <Star /> },
  shared: { title: 'Shared', sub: 'Files with collaborators or shared links.', icon: <Users /> },
  inbox: { title: 'Inbox', sub: 'Files sent to you, ready to organize.', icon: <Inbox /> },
  trash: { title: 'Trash', sub: 'Deleted in the last 30 days. Restore anytime.', icon: <Trash /> },
  settings: { title: 'Settings', sub: 'Account, security, and preferences.', icon: <Settings /> },
}

function Dashboard() {
  const session = useSession()
  const [section, setSection] = useState<Section>('all')
  const [view, setView] = useState<View>('grid')
  const [query, setQuery] = useState('')
  const [files, setFiles] = useState<CloudFile[]>(mockFiles)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    document.body.dataset.surface = 'app'
    return () => {
      delete document.body.dataset.surface
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'u') {
        e.preventDefault()
        setUploadOpen(true)
      }
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const input = document.querySelector<HTMLInputElement>('.topbar__search input')
        input?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const visible = useMemo(() => {
    let list = files
    switch (section) {
      case 'recent':
        list = [...list]
          .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
          .slice(0, 8)
        break
      case 'starred':
        list = list.filter((f) => f.starred)
        break
      case 'shared':
        list = list.filter((f) => f.shared)
        break
      case 'inbox':
        list = list.filter((f) => f.shared && !f.starred).slice(0, 4)
        break
      case 'trash':
      case 'settings':
        list = []
        break
    }
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((f) => f.name.toLowerCase().includes(q))
    }
    return list
  }, [files, section, query])

  function toggleStar(id: string) {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, starred: !f.starred } : f)))
  }

  const heading = SECTION_TITLES[section]

  const stats = useMemo(() => {
    const folders = files.filter((f) => f.kind === 'folder').length
    const totalBytes = files.reduce((acc, f) => acc + f.size, 0)
    const starred = files.filter((f) => f.starred).length
    const shared = files.filter((f) => f.shared).length
    return { folders, totalBytes, starred, shared }
  }, [files])

  const firstName = session?.user.name?.split(' ')[0] || 'there'
  const showOverview = section === 'all' && !query

  return (
    <div className="dash">
      <Sidebar
        active={section}
        onSelect={(id) => setSection(id as Section)}
        onUpload={() => setUploadOpen(true)}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <div className="dash__main">
        <Topbar
          query={query}
          onQuery={setQuery}
          onUpload={() => setUploadOpen(true)}
          onMenu={() => setDrawerOpen(true)}
        />

        <div className="dash__content">
          {showOverview && (
            <section className="overview">
              <div className="overview__head">
                <div>
                  <span className="kicker">Your vault</span>
                  <h1 className="overview__title">
                    Welcome back, <span className="gradient-text">{firstName}</span>
                  </h1>
                </div>
                <div className="overview__pill">
                  <Sparkles size={13} />
                  <span>{files.length} items · {formatBytes(stats.totalBytes)}</span>
                </div>
              </div>

              <div className="overview__stats">
                <StatCard
                  label="Total files"
                  value={String(files.length)}
                  hint={`${stats.folders} folders`}
                  tint="violet"
                  icon={<HardDrive size={15} />}
                />
                <StatCard
                  label="Recently used"
                  value="8"
                  hint="this week"
                  tint="cyan"
                  icon={<Clock size={15} />}
                />
                <StatCard
                  label="Starred"
                  value={String(stats.starred)}
                  hint="flagged"
                  tint="amber"
                  icon={<Star size={15} />}
                />
                <StatCard
                  label="Shared"
                  value={String(stats.shared)}
                  hint="with collaborators"
                  tint="pink"
                  icon={<Users size={15} />}
                />
              </div>
            </section>
          )}

          <div className="crumbs">
            <span className="crumb">{heading.icon}</span>
            <span className="crumb-sep"><ChevronRight size={12} /></span>
            <span className="crumb crumb--active">{heading.title}</span>
            {query && (
              <>
                <span className="crumb-sep"><ChevronRight size={12} /></span>
                <span className="crumb">"{query}"</span>
              </>
            )}
          </div>

          <header className="dash__section-head">
            <div className="dash__section-text">
              <h2 className="dash__section-title">{heading.title}</h2>
              <p className="dash__section-sub">{heading.sub}</p>
            </div>

            <div className="dash__toolbar">
              <span className="dash__count">
                {visible.length} {visible.length === 1 ? 'item' : 'items'}
              </span>

              <div className="dash__view" role="tablist" aria-label="View mode">
                <button
                  role="tab"
                  aria-selected={view === 'grid'}
                  className={view === 'grid' ? 'is-active' : ''}
                  onClick={() => setView('grid')}
                  aria-label="Grid view"
                >
                  <Grid size={14} />
                </button>
                <button
                  role="tab"
                  aria-selected={view === 'list'}
                  className={view === 'list' ? 'is-active' : ''}
                  onClick={() => setView('list')}
                  aria-label="List view"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </header>

          {section === 'settings' ? (
            <SettingsPlaceholder />
          ) : (
            <FileGrid
              files={visible}
              view={view}
              onToggleStar={toggleStar}
              onOpenUpload={() => setUploadOpen(true)}
            />
          )}
        </div>
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  tint,
  icon,
}: {
  label: string
  value: string
  hint: string
  tint: 'violet' | 'cyan' | 'amber' | 'pink'
  icon: React.ReactNode
}) {
  return (
    <div className={`stat-card stat-card--${tint}`}>
      <span className="stat-card__icon">{icon}</span>
      <span className="stat-card__label">{label}</span>
      <span className="stat-card__value">{value}</span>
      <span className="stat-card__hint">{hint}</span>
    </div>
  )
}

function SettingsPlaceholder() {
  return (
    <div className="settings-placeholder">
      <div className="settings-placeholder__icon">
        <Settings size={22} />
      </div>
      <h3>Settings</h3>
      <p>Account, security, and preferences will live here.</p>
    </div>
  )
}

export default Dashboard
