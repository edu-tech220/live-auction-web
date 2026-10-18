import { Gavel, LayoutDashboard, LogOut, Receipt, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { initials } from '../lib/format'
import { useRealtime } from '../realtime/RealtimeContext'
import { ConnectionIndicator } from './ui'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
    isActive ? 'bg-surface-2 text-white' : 'text-muted hover:text-white'}`

export function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const { status } = useRealtime()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-canvas/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2.5 font-extrabold tracking-tight">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-gold to-gold-2 text-ink shadow-lg shadow-gold/30">
              <Zap className="size-5" fill="currentColor" />
            </span>
            <span className="hidden text-lg sm:inline">Live Auction</span>
          </Link>

          <nav className="ml-2 flex items-center gap-1">
            <NavLink to="/" end className={navClass}><Gavel className="size-4" /><span className="hidden md:inline">Subastas</span></NavLink>
            {user && <NavLink to="/me/bids" className={navClass}><Receipt className="size-4" /><span className="hidden md:inline">Mis pujas</span></NavLink>}
            {isAdmin && <NavLink to="/admin" className={navClass}><LayoutDashboard className="size-4" /><span className="hidden md:inline">Administrar</span></NavLink>}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <ConnectionIndicator status={status} />
            {user ? (
              <div className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-3 pr-1">
                <span className="hidden text-sm font-medium sm:inline">{user.displayName}</span>
                <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-bold">
                  {initials(user.displayName)}
                </span>
                <button onClick={logout} className="grid size-8 place-items-center rounded-full text-muted hover:bg-surface-2 hover:text-white" title="Cerrar sesión" aria-label="Cerrar sesión">
                  <LogOut className="size-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn btn-gold px-3 py-2">Iniciar sesión</Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted">
        Live Auction · React + SignalR ·{' '}
        <a className="underline hover:text-white" href="https://github.com/edu-tech220/live-auction" target="_blank" rel="noreferrer">API en GitHub</a>
      </footer>
    </div>
  )
}

/** Protege rutas: sin sesión => login (y regresa a donde estaba). */
export function RequireAuth({ admin = false, children }: { admin?: boolean; children: ReactNode }) {
  const { user, isAdmin } = useAuth()
  const location = useLocation()
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (admin && !isAdmin) return <Navigate to="/" replace />
  return children
}
