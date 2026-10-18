import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { api } from '../lib/api'
import type { User } from '../lib/types'
import { clearSession, readSession, SESSION_EXPIRED_EVENT, writeSession, type Session } from './session'

interface AuthState {
  user: User | null
  token: string | null
  isAdmin: boolean
  login: (email: string, password: string) => Promise<User>
  register: (email: string, displayName: string, password: string) => Promise<User>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession())

  const logout = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])

  useEffect(() => {
    // La API respondió 401 (token vencido): cerrar sesión en toda la app.
    const onExpired = () => {
      setSession(null)
      toast.error('Tu sesión expiró. Inicia sesión de nuevo.')
    }
    // Otra pestaña inició o cerró sesión.
    const onStorage = () => setSession(readSession())

    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    window.addEventListener('storage', onStorage)

    // Cerrar sesión automáticamente cuando el token llegue a su expiración.
    const timer = session
      ? window.setTimeout(onExpired, Math.max(0, new Date(session.expiresAt).getTime() - Date.now()))
      : undefined

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
      window.removeEventListener('storage', onStorage)
      window.clearTimeout(timer)
    }
  }, [session])

  const login = useCallback(async (email: string, password: string) => {
    const s = writeSession(await api.login(email, password))
    setSession(s)
    return s.user
  }, [])

  const register = useCallback(async (email: string, displayName: string, password: string) => {
    const s = writeSession(await api.register(email, displayName, password))
    setSession(s)
    return s.user
  }, [])

  const value = useMemo<AuthState>(() => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAdmin: session?.user.role === 'Admin',
    login,
    register,
    logout,
  }), [session, login, register, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- hook junto a su proveedor
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return ctx
}
