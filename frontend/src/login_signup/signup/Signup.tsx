import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthCard from '../AuthCard'
import Input from '../../components/Input'
import Button from '../../components/Button'
import {
  Mail,
  Lock,
  Check,
  ArrowRight,
  User,
  GoogleGlyph,
} from '../../components/Icon'
import { signIn, signUp, MOCK_IDENTITY, type Provider } from '../../lib/auth'

type Strength = 0 | 1 | 2 | 3 | 4

function scorePassword(pw: string): Strength {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(4, score) as Strength
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Excellent']

function Signup() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState<Provider | null>(null)
  const [success, setSuccess] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const strength = useMemo(() => scorePassword(password), [password])
  const passwordError =
    confirm.length > 0 && confirm !== password ? "Passwords don't match" : undefined

  function finish(provider: Provider) {
    setSuccess(provider)
    setTimeout(() => navigate('/app', { replace: true }), 800)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (passwordError || !agree) return
    setError(null)
    setLoading('email')
    try {
      await signUp(name, email, password)
      finish('email')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account. Try again.')
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
      setError('Google sign-up failed. Try again.')
      setLoading(null)
    }
  }

  const busy = loading !== null || success !== null

  return (
    <AuthCard
      title="Create your account"
      subtitle="Set up your vault in under a minute."
      footer={
        <span>
          Already have an account? <Link to="/login">Sign in</Link>
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
          label="Full name"
          type="text"
          placeholder="Ada Lovelace"
          autoComplete="name"
          required
          leading={<User />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />

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
          placeholder="Create a strong password"
          autoComplete="new-password"
          required
          minLength={8}
          leading={<Lock />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={busy}
        />

        {password && (
          <div className="auth__strength">
            <div className="auth__strength-bar">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={i <= strength ? `is-on-${strength}` : ''} />
              ))}
            </div>
            <span className="auth__strength-label">{STRENGTH_LABELS[strength]}</span>
          </div>
        )}

        <Input
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          required
          leading={<Lock />}
          error={passwordError}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={busy}
        />

        <label className="auth__check auth__check--terms">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            required
          />
          <span className="auth__check-box"><Check size={11} /></span>
          <span>I agree to the <a href="#terms">Terms</a> and <a href="#privacy">Privacy Policy</a></span>
        </label>

        <Button
          type="submit"
          size="lg"
          block
          loading={loading === 'email'}
          success={success === 'email'}
          disabled={!agree || !!passwordError || (busy && loading !== 'email' && success !== 'email')}
          trailing={success === 'email' ? undefined : <ArrowRight />}
        >
          {success === 'email' ? 'Account created' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  )
}

export default Signup
