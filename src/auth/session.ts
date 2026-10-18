import type { AuthResponse, User } from '../lib/types'

// Sesión persistida en localStorage.
// Compromiso conocido: un XSS podría leer el token. Mitigación: React escapa todo el texto que
// renderiza (nunca se usa dangerouslySetInnerHTML) y el token expira. Alternativa a futuro:
// cookie HttpOnly emitida por un BFF.

const KEY = 'live-auction.session'
export const SESSION_EXPIRED_EVENT = 'live-auction:session-expired'

export interface Session {
  token: string
  expiresAt: string
  user: User
}

export function readSession(now: Date = new Date()): Session | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as Session
    // Vencido: se descarta (el servidor lo rechazaría de todos modos).
    if (new Date(session.expiresAt) <= now) {
      localStorage.removeItem(KEY)
      return null
    }
    return session
  } catch {
    return null
  }
}

export function writeSession(auth: AuthResponse): Session {
  const session: Session = { token: auth.accessToken, expiresAt: auth.expiresAt, user: auth.user }
  localStorage.setItem(KEY, JSON.stringify(session))
  return session
}

export function clearSession(): void {
  localStorage.removeItem(KEY)
}

export const currentToken = (): string | null => readSession()?.token ?? null
