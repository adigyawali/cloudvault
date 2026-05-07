import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import './AuthLayout.css'

function AuthLayout() {
  const location = useLocation()

  useEffect(() => {
    document.body.dataset.surface = 'auth'
    return () => {
      delete document.body.dataset.surface
    }
  }, [])

  return (
    <div className="auth">
      <aside className="auth__visual" aria-hidden>
        <div className="auth__visual-top">
          <Link to="/login">
            <Logo />
          </Link>
        </div>

        <div className="auth__stage">
          <div className="auth__orb auth__orb--a" />
          <div className="auth__orb auth__orb--b" />
          <div className="auth__orb auth__orb--c" />

          <div className="auth__vault">
            <div className="auth__card-stack auth__card-stack--3" />
            <div className="auth__card-stack auth__card-stack--2" />
            <div className="auth__card-stack auth__card-stack--1">
              <div className="auth__card-row" style={{ width: '70%' }} />
              <div className="auth__card-row" style={{ width: '46%' }} />
              <div className="auth__card-grid">
                <span /><span /><span />
                <span /><span /><span />
              </div>
            </div>
          </div>

          <svg className="auth__lines" viewBox="0 0 600 600" preserveAspectRatio="none">
            <defs>
              <linearGradient id="auth-line" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="rgba(124,92,255,0.45)" />
                <stop offset="1" stopColor="rgba(76,201,240,0)" />
              </linearGradient>
            </defs>
            <circle cx="300" cy="300" r="180" fill="none" stroke="url(#auth-line)" strokeWidth="1" />
            <circle cx="300" cy="300" r="240" fill="none" stroke="rgba(255,255,255,0.04)" strokeDasharray="2 6" />
          </svg>
        </div>

        <div className="auth__visual-bottom">
          <span className="auth__visual-meta">v1.0 · Encrypted at rest</span>
        </div>
      </aside>

      <main className="auth__main">
        <div className="auth__theme">
          <ThemeToggle />
        </div>

        <div className="auth__main-inner">
          <div className="auth__head-mobile">
            <Logo size="sm" />
          </div>

          <div className="auth__slot" key={location.pathname}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export default AuthLayout
