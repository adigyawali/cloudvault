import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import {
  HardDrive,
  Clock,
  Star,
  Users,
  Trash,
  Settings,
  Plus,
  Sparkles,
  Inbox,
  LogOut,
} from '../components/Icon'
import { useSession, signOut, initialsOf } from '../lib/auth'
import './Sidebar.css'

type Props = {
  active: string
  onSelect: (id: string) => void
  onUpload: () => void
  open: boolean
  onClose: () => void
}

const NAV_PRIMARY = [
  { id: 'all', label: 'All Files', icon: <HardDrive /> },
  { id: 'recent', label: 'Recent', icon: <Clock /> },
  { id: 'starred', label: 'Starred', icon: <Star /> },
  { id: 'shared', label: 'Shared', icon: <Users /> },
  { id: 'inbox', label: 'Inbox', icon: <Inbox /> },
]

const NAV_SECONDARY = [
  { id: 'trash', label: 'Trash', icon: <Trash /> },
]

const STORAGE_USED_GB = 6.4
const STORAGE_TOTAL_GB = 15

function Sidebar({ active, onSelect, onUpload, open, onClose }: Props) {
  const navigate = useNavigate()
  const session = useSession()
  const pct = Math.round((STORAGE_USED_GB / STORAGE_TOTAL_GB) * 100)

  const handleSelect = (id: string) => {
    onSelect(id)
    onClose()
  }

  const handleSignOut = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div
        className={`sidebar__scrim ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-hidden
      />

      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <header className="sidebar__head">
          <Logo />
        </header>

        <button className="sidebar__upload" onClick={onUpload}>
          <span className="sidebar__upload-icon">
            <Plus size={15} />
          </span>
          <span className="sidebar__upload-label">New upload</span>
          <span className="sidebar__kbd">⌘U</span>
        </button>

        <nav className="sidebar__nav" aria-label="Library">
          <span className="sidebar__group">Library</span>
          {NAV_PRIMARY.map((item) => (
            <button
              key={item.id}
              className={`sidebar__link ${active === item.id ? 'is-active' : ''}`}
              onClick={() => handleSelect(item.id)}
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              <span className="sidebar__link-label">{item.label}</span>
              {item.id === 'starred' && <span className="sidebar__count">12</span>}
              {item.id === 'shared' && <span className="sidebar__count">5</span>}
              {item.id === 'inbox' && <span className="sidebar__dot-new" />}
            </button>
          ))}

          <span className="sidebar__group sidebar__group--spaced">System</span>
          {NAV_SECONDARY.map((item) => (
            <button
              key={item.id}
              className={`sidebar__link ${active === item.id ? 'is-active' : ''}`}
              onClick={() => handleSelect(item.id)}
            >
              <span className="sidebar__link-icon">{item.icon}</span>
              <span className="sidebar__link-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar__storage">
          <div className="sidebar__storage-head">
            <span className="sidebar__storage-title">
              <Sparkles size={13} />
              Storage
            </span>
            <span className="sidebar__storage-pct">{pct}%</span>
          </div>
          <div className="sidebar__bar">
            <span style={{ width: `${pct}%` }} />
          </div>
          <p className="sidebar__storage-meta">
            <strong>{STORAGE_USED_GB} GB</strong> of {STORAGE_TOTAL_GB} GB used
          </p>
          <button className="sidebar__upgrade">Upgrade</button>
        </div>

        <div className="sidebar__account">
          <div className="sidebar__avatar">
            <span>{session ? initialsOf(session.user.name) : 'CV'}</span>
          </div>
          <div className="sidebar__account-meta">
            <span className="sidebar__account-name">{session?.user.name || 'Guest'}</span>
            <span className="sidebar__account-email">{session?.user.email || '—'}</span>
          </div>
          <button
            className="sidebar__icon-btn"
            onClick={() => handleSelect('settings')}
            aria-label="Settings"
            title="Settings"
          >
            <Settings size={15} />
          </button>
          <button
            className="sidebar__icon-btn"
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
