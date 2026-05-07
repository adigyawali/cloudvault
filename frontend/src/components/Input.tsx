import { forwardRef, useId, useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Eye, EyeOff } from './Icon'
import './Input.css'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  leading?: ReactNode
  trailing?: ReactNode
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, error, leading, trailing, type = 'text', id, className = '', ...rest },
  ref,
) {
  const reactId = useId()
  const inputId = id || reactId
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const realType = isPassword && show ? 'text' : type

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="field__label">
          {label}
        </label>
      )}
      <div className="field__shell">
        {leading && <span className="field__adorn field__adorn--leading">{leading}</span>}
        <input ref={ref} id={inputId} type={realType} className="field__input" {...rest} />
        {isPassword && (
          <button
            type="button"
            className="field__adorn field__adorn--trailing field__toggle"
            aria-label={show ? 'Hide password' : 'Show password'}
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
        {!isPassword && trailing && (
          <span className="field__adorn field__adorn--trailing">{trailing}</span>
        )}
      </div>
      {error ? (
        <span className="field__msg field__msg--error">{error}</span>
      ) : (
        hint && <span className="field__msg">{hint}</span>
      )}
    </div>
  )
})

export default Input
