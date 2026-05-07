import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Check } from './Icon'
import './Button.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'oauth'
type Size = 'sm' | 'md' | 'lg'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  leading?: ReactNode
  trailing?: ReactNode
  loading?: boolean
  success?: boolean
  block?: boolean
}

function Button({
  variant = 'primary',
  size = 'md',
  leading,
  trailing,
  loading,
  success,
  block,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  const showCheck = !!success
  const showSpinner = !!loading && !showCheck
  const showLeading = !showSpinner && !showCheck && !!leading
  const showTrailing = !showSpinner && !showCheck && !!trailing

  return (
    <button
      className={`btn btn--${variant} btn--${size} ${block ? 'btn--block' : ''} ${showSpinner ? 'btn--loading' : ''} ${showCheck ? 'btn--success' : ''} ${className}`}
      disabled={disabled || showSpinner}
      {...rest}
    >
      {variant === 'primary' && <span className="btn__sheen" aria-hidden />}
      {showCheck && (
        <span className="btn__icon btn__icon--check" aria-hidden>
          <Check size={16} />
        </span>
      )}
      {showSpinner && <span className="btn__spinner" aria-hidden />}
      {showLeading && <span className="btn__icon">{leading}</span>}
      <span className="btn__label">{children}</span>
      {showTrailing && <span className="btn__icon btn__icon--trailing">{trailing}</span>}
    </button>
  )
}

export default Button
