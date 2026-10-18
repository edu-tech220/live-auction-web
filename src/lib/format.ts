const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export const formatMoney = (value: number): string => money.format(value)

export const formatDateTime = (iso: string): string =>
  new Date(iso).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })

/**
 * Tiempo restante hasta `targetIso`, corregido con el desfase del reloj del servidor.
 * Es SOLO visual: si una subasta sigue abierta lo decide siempre el servidor.
 */
export function remaining(targetIso: string, offsetMs: number, nowMs: number = Date.now()): { ms: number; text: string } {
  const ms = Math.max(0, new Date(targetIso).getTime() - (nowMs + offsetMs))
  const totalSeconds = Math.floor(ms / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const pad = (n: number) => String(n).padStart(2, '0')
  const hh = pad(Math.floor((totalSeconds % 86_400) / 3600))
  const mm = pad(Math.floor((totalSeconds % 3600) / 60))
  const ss = pad(totalSeconds % 60)
  return { ms, text: days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}` }
}

export const initials = (name: string): string =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]!.toUpperCase()).join('')
