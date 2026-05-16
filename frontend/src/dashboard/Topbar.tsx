import { Upload, Menu, Plus } from '../components/Icon'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import './Topbar.css'

type Props = {
  onUpload: () => void
  onMenu: () => void
}

function Topbar({ onUpload, onMenu }: Props) {
  return (
    <header className="topbar">
      <button className="topbar__menu" onClick={onMenu} aria-label="Open navigation">
        <Menu size={18} />
      </button>

      <div className="topbar__brand">
        <Logo />
      </div>

      <div className="topbar__actions">
        <ThemeToggle className="topbar__icon-btn" />

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
