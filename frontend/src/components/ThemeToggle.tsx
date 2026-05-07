import { Sun, Moon } from './Icon'
import { useTheme } from '../lib/theme'
import './ThemeToggle.css'

type Props = {
  className?: string
}

function ThemeToggle({ className = '' }: Props) {
  const { theme, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className={`theme-toggle ${className}`}
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <span className="theme-toggle__icon" data-key={isDark ? 'sun' : 'moon'} aria-hidden>
        {isDark ? <Sun size={15} /> : <Moon size={15} />}
      </span>
    </button>
  )
}

export default ThemeToggle
