import { useSyncExternalStore } from 'react'

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
  return readSession().session
}

export function isAuthed(): boolean {
  return getSession() !== null
}

export async function signIn(provider: Provider, identity: Identity): Promise<Session> {
  await new Promise((r) => setTimeout(r, 700))
  const name = identity.name?.trim() || identity.email.split('@')[0]
  const session: Session = {
    user: { name, email: identity.email, provider },
    signedInAt: Date.now(),
  }
  localStorage.setItem(KEY, JSON.stringify(session))
  window.dispatchEvent(new Event(EVT))
  return session
}

export function signOut(): void {
  localStorage.removeItem(KEY)
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
