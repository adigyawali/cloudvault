import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

function AuthCard({ title, subtitle, children, footer }: Props) {
  return (
    <div className="auth__card">
      <header className="auth__head">
        <h1 className="auth__title">{title}</h1>
        {subtitle && <p className="auth__sub">{subtitle}</p>}
      </header>

      <div className="auth__body">{children}</div>

      {footer && <footer className="auth__foot">{footer}</footer>}
    </div>
  )
}

export default AuthCard
