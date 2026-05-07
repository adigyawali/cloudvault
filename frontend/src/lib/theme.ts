import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'

const KEY = 'cv_theme_v1'
const EVT = 'cv:theme-change'

function detect(): Theme {
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* ignore */
  }
  return 'light'
}

function apply(theme: Theme) {
  if (typeof document === 'undefined') return
  if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  else document.documentElement.removeAttribute('data-theme')
}

export function getTheme(): Theme {
  return detect()
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* ignore */
  }
  apply(theme)
  window.dispatchEvent(new Event(EVT))
}

export function toggleTheme(): void {
  setTheme(getTheme() === 'dark' ? 'light' : 'dark')
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVT, cb)
    window.removeEventListener('storage', cb)
  }
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const theme = useSyncExternalStore(subscribe, detect, () => 'light' as Theme)
  return { theme, toggle: toggleTheme }
}
