import { useSyncExternalStore } from 'react'
import { apiLogin, apiRegister, setToken, clearToken, getToken } from './api'

const KEY = 'cv_auth_v1'
const EVT = 'cv:auth-change'

export type Provider = 'google' | 'email'

export type Session = {
  user: {
    name: string
    email: string
    provider: Provider
  }
  signedInAt: number
}

export type Identity = {
  name?: string
  email: string
}

// Cache the parsed session so getSession returns a stable reference
// across renders. useSyncExternalStore requires referentially-equal
// snapshots to avoid infinite re-render loops.
const SENTINEL = '\0'
let cachedRaw: string | null = SENTINEL as unknown as string | null
let cachedSession: Session | null = null

function readSession(): { raw: string | null; session: Session | null } {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return { raw: null, session: null }
  }
  if (raw === cachedRaw) return { raw, session: cachedSession }
  cachedRaw = raw
  try {
    cachedSession = raw ? (JSON.parse(raw) as Session) : null
  } catch {
    cachedSession = null
  }
  return { raw, session: cachedSession }
}

export function getSession(): Session | null {
  // A session is only valid if it's backed by a real JWT. This prevents a
  // stale/mock session from rendering the app with no token (which the
  // backend rejects with 403 on every /api call).
  const { session } = readSession()
  if (!session || !getToken()) return null
  return session
}

export function isAuthed(): boolean {
  return getSession() !== null
}

function persist(provider: Provider, name: string, email: string): Session {
  const session: Session = {
    user: { name, email, provider },
    signedInAt: Date.now(),
  }
  localStorage.setItem(KEY, JSON.stringify(session))
  window.dispatchEvent(new Event(EVT))
  return session
}

export async function signIn(
  provider: Provider,
  identity: Identity,
  password?: string,
): Promise<Session> {
  // Email auth goes through the backend so we get a real JWT for API calls.
  if (provider === 'email') {
    if (!password) throw new Error('Password required')
    const { token } = await apiLogin(identity.email, password)
    setToken(token)
    const name = identity.name?.trim() || identity.email.split('@')[0]
    return persist('email', name, identity.email)
  }
  // Google has no backend OAuth yet, so it can't issue a JWT. Fail clearly
  // instead of creating a tokenless session that the backend would 403.
  throw new Error('Google sign-in isn’t available yet — use email for now.')
}

export async function signUp(
  name: string,
  email: string,
  password: string,
): Promise<Session> {
  const trimmed = name.trim()
  const [firstName, ...rest] = trimmed.split(/\s+/)
  const { token } = await apiRegister(firstName || '', rest.join(' '), email, password)
  setToken(token)
  return persist('email', trimmed || email.split('@')[0], email)
}

export function signOut(): void {
  localStorage.removeItem(KEY)
  clearToken()
  window.dispatchEvent(new Event(EVT))
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener(EVT, cb)
    window.removeEventListener('storage', cb)
  }
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession, () => null)
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
}

/** Mock identities a real OAuth provider would hand back. */
export const MOCK_IDENTITY: Record<Exclude<Provider, 'email'>, Identity> = {
  google: { name: 'Aditya', email: 'aditya@cloudvault.app' },
}

/** Mock password reset request — resolves like a real API call would. */
export async function requestPasswordReset(email: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 800))
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email')
  }
}
