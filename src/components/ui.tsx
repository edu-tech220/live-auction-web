import type { ReactNode } from 'react'
import { remaining } from '../lib/format'
import { useNow } from '../lib/useNow'
import type { AuctionStatus } from '../lib/types'
import type { ConnectionStatus } from '../realtime/RealtimeContext'

// Texto y fondo separados: sobre una foto ("solid") el fondo debe ser oscuro y opaco para leerse.
const STATUS: Record<AuctionStatus, { label: string; text: string; bg: string; dot?: boolean }> = {
  Active: { label: 'En vivo', text: 'text-live', bg: 'bg-live/15', dot: true },
  Scheduled: { label: 'Próximamente', text: 'text-info', bg: 'bg-info/15' },
  Finished: { label: 'Finalizada', text: 'text-slate-200', bg: 'bg-slate-400/15' },
  Cancelled: { label: 'Cancelada', text: 'text-danger', bg: 'bg-danger/15' },
}

export function StatusBadge({ status, solid = false }: { status: AuctionStatus; solid?: boolean }) {
  const s = STATUS[status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${s.text} ${solid ? 'bg-ink/85 shadow-lg backdrop-blur' : s.bg}`}>
      {s.dot && <span className="size-1.5 animate-pulse-dot rounded-full bg-live" />}
      {s.label}
    </span>
  )
}

export function Countdown({ target, offsetMs = 0, className = '' }: { target: string; offsetMs?: number; className?: string }) {
  const now = useNow()
  const { ms, text } = remaining(target, offsetMs, now)
  const urgent = ms > 0 && ms < 60_000
  return <span className={`tabular font-bold ${urgent ? 'text-danger' : ''} ${className}`}>{text}</span>
}

const CONNECTION: Record<ConnectionStatus, { label: string; dot: string }> = {
  online: { label: 'En vivo', dot: 'bg-live shadow-[0_0_0_4px_rgb(52_211_153/0.15)]' },
  connecting: { label: 'Conectando…', dot: 'bg-gold animate-pulse-dot' },
  reconnecting: { label: 'Reconectando…', dot: 'bg-gold animate-pulse-dot' },
  offline: { label: 'Sin conexión', dot: 'bg-danger' },
}

export function ConnectionIndicator({ status }: { status: ConnectionStatus }) {
  const c = CONNECTION[status]
  return (
    <span className="inline-flex items-center gap-2 text-xs text-muted" data-testid="connection" data-status={status} title="Conexión en tiempo real">
      <span className={`size-2 rounded-full ${c.dot}`} />
      <span className="hidden sm:inline">{c.label}</span>
    </span>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-surface-2/70 ${className}`} />
}

export function EmptyState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
      <div className="grid size-14 place-items-center rounded-2xl bg-gold/10 text-gold">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {children && <div className="max-w-md text-sm text-muted">{children}</div>}
    </div>
  )
}
