import { useEffect, useState } from 'react'
import Sidebar from '../dashboard/Sidebar'
import Topbar from '../dashboard/Topbar'
import UploadModal from '../dashboard/UploadModal'
import FolderBrowser from '../dashboard/FolderBrowser'
import { Settings } from '../components/Icon'
import './Dashboard.css'

type Section = 'all' | 'settings'

function Dashboard() {
  const [section, setSection] = useState<Section>('all')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Folder the FolderBrowser is currently showing; uploads target it.
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

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
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
        <Topbar onUpload={() => setUploadOpen(true)} onMenu={() => setDrawerOpen(true)} />

        <div className="dash__content">
          {section === 'settings' ? (
            <SettingsPlaceholder />
          ) : (
            <FolderBrowser
              onFolderChange={setCurrentFolderId}
              reloadKey={reloadKey}
              onRequestUpload={() => setUploadOpen(true)}
            />
          )}
        </div>
      </div>

      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        folderId={currentFolderId}
        onUploaded={() => setReloadKey((k) => k + 1)}
      />
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
