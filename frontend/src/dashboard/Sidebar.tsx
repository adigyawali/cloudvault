import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import { HardDrive, Settings, Plus, LogOut, Star, Clock } from '../components/Icon'
import { useSession, signOut, initialsOf } from '../lib/auth'
import './Sidebar.css'

type Props = {
  active: string
  onSelect: (id: string) => void
  onUpload: () => void
  open: boolean
  onClose: () => void
}

const NAV = [
  { id: 'all', label: 'All Files', icon: <HardDrive /> },
  { id: 'favorites', label: 'Favorites', icon: <Star /> },
  { id: 'recents', label: 'Recents', icon: <Clock /> },
  { id: 'settings', label: 'Settings', icon: <Settings /> },
]

function Sidebar({ active, onSelect, onUpload, open, onClose }: Props) {
  const navigate = useNavigate()
  const session = useSession()

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
          {NAV.map((item) => (
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
