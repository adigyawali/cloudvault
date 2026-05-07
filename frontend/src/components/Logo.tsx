import './Logo.css'

type Props = {
  size?: 'sm' | 'md' | 'lg'
  monogram?: boolean
}

function Logo({ size = 'md', monogram = false }: Props) {
  return (
    <span className={`logo logo--${size}`} aria-label="CloudVault">
      <span className="logo__mark" aria-hidden="true">
        <svg viewBox="0 0 32 32" fill="none">
          <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#7c5cff" />
              <stop offset="0.55" stopColor="#4cc9f0" />
              <stop offset="1" stopColor="#ff6b9d" />
            </linearGradient>
          </defs>
          <rect x="1" y="1" width="30" height="30" rx="9" fill="url(#logo-grad)" />
          <path
            d="M9.5 14.2c0-2.6 2.1-4.7 4.7-4.7 2.2 0 4 1.4 4.5 3.4.4-.1.8-.2 1.2-.2 2.4 0 4.4 1.9 4.4 4.3s-2 4.3-4.4 4.3h-9.4a3.6 3.6 0 0 1-3.6-3.6c0-1.7 1.2-3.2 2.7-3.5h-.1Z"
            fill="rgba(255,255,255,0.96)"
          />
        </svg>
      </span>
      {!monogram && <span className="logo__word">CloudVault</span>}
    </span>
  )
}

export default Logo
