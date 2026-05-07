import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import AuthCard from '../AuthCard'
import Input from '../../components/Input'
import Button from '../../components/Button'
import { Mail, ArrowRight, ArrowLeft } from '../../components/Icon'
import { requestPasswordReset } from '../../lib/auth'
import './forgot.css'

const RESEND_SECONDS = 30

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function send() {
    setError(null)
    setLoading(true)
    try {
      await requestPasswordReset(email)
      setSent(true)
      setCooldown(RESEND_SECONDS)
    } catch {
      setError("That doesn't look like a valid email.")
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email) return
    void send()
  }

  function onResend() {
    if (cooldown > 0 || loading) return
    void send()
  }

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        subtitle={
          <>We sent a reset link to <strong className="forgot__email">{email}</strong>. The link expires in 15 minutes.</>
        }
        footer={
          <Link to="/login" className="forgot__back">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        }
      >
        <div className="forgot__success">
          <SuccessCheck />
          <p className="forgot__success-hint">
            Didn't get the email? Check your spam folder, or resend.
          </p>
          <Button
            variant="secondary"
            size="md"
            block
            onClick={onResend}
            loading={loading}
            disabled={cooldown > 0 || loading}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend email'}
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <Link to="/login" className="forgot__back">
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      }
    >
      {error && <div className="auth__error" role="alert">{error}</div>}

      <form className="auth__form" onSubmit={onSubmit}>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          autoFocus
          leading={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />

        <Button
          type="submit"
          size="lg"
          block
          loading={loading}
          disabled={!email || loading}
          trailing={<ArrowRight />}
        >
          Send reset link
        </Button>
      </form>
    </AuthCard>
  )
}

function SuccessCheck() {
  return (
    <span className="success-check" aria-hidden>
      <svg viewBox="0 0 64 64" fill="none">
        <defs>
          <linearGradient id="check-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#6c4dff" />
            <stop offset="0.55" stopColor="#2db8e8" />
            <stop offset="1" stopColor="#ec5887" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="28"
          stroke="url(#check-grad)"
          strokeWidth="2"
          className="success-check__ring"
        />
        <path
          d="M20 33l8 8 16-18"
          stroke="url(#check-grad)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="success-check__tick"
        />
      </svg>
    </span>
  )
}

export default ForgotPassword
