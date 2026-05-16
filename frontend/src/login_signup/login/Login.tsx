import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthCard from '../AuthCard'
import Input from '../../components/Input'
import Button from '../../components/Button'
import {
  Mail,
  Lock,
  Check,
  ArrowRight,
  GoogleGlyph,
} from '../../components/Icon'
import { signIn, MOCK_IDENTITY, type Provider } from '../../lib/auth'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/app'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState<Provider | null>(null)
  const [success, setSuccess] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  function finish(provider: Provider) {
    setSuccess(provider)
    setTimeout(() => navigate(from, { replace: true }), 700)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!email || !password) return
    setError(null)
    setLoading('email')
    try {
      await signIn('email', { email }, password)
      finish('email')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign you in. Try again.')
      setLoading(null)
    }
  }

  async function onGoogle() {
    setError(null)
    setLoading('google')
    try {
      await signIn('google', MOCK_IDENTITY.google)
      finish('google')
    } catch {
      setError('Google sign-in failed. Try again.')
      setLoading(null)
    }
  }

  const busy = loading !== null || success !== null

  return (
    <AuthCard
      title="Welcome"
      subtitle="Sign in to continue to your vault."
      footer={
        <span>
          Don't have an account? <Link to="/signup">Create one</Link>
        </span>
      }
    >
      <div className="auth__social">
        <Button
          variant="oauth"
          size="lg"
          block
          onClick={onGoogle}
          loading={loading === 'google'}
          success={success === 'google'}
          disabled={busy && loading !== 'google' && success !== 'google'}
          leading={<GoogleGlyph size={18} />}
        >
          Continue with Google
        </Button>
      </div>

      <div className="auth__divider">or with email</div>

      {error && <div className="auth__error" role="alert">{error}</div>}

      <form className="auth__form" onSubmit={onSubmit}>
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          leading={<Mail />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
        />

        <Input
          label="Password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
          required
          minLength={6}
          leading={<Lock />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />

        <div className="auth__row">
          <label className="auth__check">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span className="auth__check-box"><Check size={11} /></span>
            <span>Remember me</span>
          </label>
          <Link to="/forgot" className="auth__forgot">Forgot password?</Link>
        </div>

        <Button
          type="submit"
          size="lg"
          block
          loading={loading === 'email'}
          success={success === 'email'}
          disabled={busy && loading !== 'email' && success !== 'email'}
          trailing={success === 'email' ? undefined : <ArrowRight />}
        >
          {success === 'email' ? 'Welcome back' : 'Sign in'}
        </Button>
      </form>
    </AuthCard>
  )
}

export default Login
