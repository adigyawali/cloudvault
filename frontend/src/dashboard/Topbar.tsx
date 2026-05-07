import { Search, Bell, Upload, Menu, Plus, Filter, Command } from '../components/Icon'
import ThemeToggle from '../components/ThemeToggle'
import './Topbar.css'

type Props = {
  query: string
  onQuery: (v: string) => void
  onUpload: () => void
  onMenu: () => void
}

function Topbar({ query, onQuery, onUpload, onMenu }: Props) {
  return (
    <header className="topbar">
      <button className="topbar__menu" onClick={onMenu} aria-label="Open navigation">
        <Menu size={18} />
      </button>

      <div className="topbar__search">
        <Search size={15} />
        <input
          type="search"
          placeholder="Search files, folders, people…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        <span className="topbar__kbd">
          <Command size={11} />K
        </span>
      </div>

      <div className="topbar__actions">
        <button className="topbar__icon-btn" aria-label="Filter">
          <Filter size={16} />
        </button>

        <ThemeToggle className="topbar__icon-btn" />

        <button className="topbar__icon-btn topbar__bell" aria-label="Notifications">
          <Bell size={16} />
          <span className="topbar__dot" aria-hidden />
        </button>

        <button className="topbar__upload" onClick={onUpload}>
          <Upload size={14} />
          <span>Upload</span>
        </button>

        <button className="topbar__fab" onClick={onUpload} aria-label="Upload">
          <Plus size={18} />
        </button>
      </div>
    </header>
  )
}

export default Topbar
