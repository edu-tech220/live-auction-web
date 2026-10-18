import { LogIn, TrendingUp } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { formatMoney } from '../lib/format'
import type { AuctionDetails, User } from '../lib/types'

interface Props {
  auction: AuctionDetails
  user: User | null
  /** true mientras se envía una puja */
  pending: boolean
  /** true cuando la cuenta regresiva llegó a 0 y se espera el cierre del servidor */
  closing: boolean
  onBid: (amount: number) => void
}

// Panel de puja. NO valida reglas de negocio: muestra sugerencias basadas en el mínimo que
// informó el servidor y envía el monto. Quien acepta o rechaza es el servidor.
export function BidPanel({ auction, user, pending, closing, onBid }: Props) {
  const min = auction.minimumNextBid
  const [amount, setAmount] = useState<string>('')
  const value = amount === '' ? min : Number(amount)

  if (auction.status === 'Finished' || auction.status === 'Cancelled') return null

  if (!user) {
    return (
      <Link to="/login" state={{ from: `/auctions/${auction.id}` }} className="btn btn-gold w-full py-3">
        <LogIn className="size-4" /> Inicia sesión para pujar
      </Link>
    )
  }

  if (user.id === auction.sellerId) {
    return <p className="rounded-xl bg-surface-2 p-3 text-sm text-muted">Eres el vendedor de esta subasta: no puedes pujar.</p>
  }

  const quick = [min, min + auction.minIncrement, min + auction.minIncrement * 2]

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!(value > 0)) return
    onBid(Math.round(value * 100) / 100)
    setAmount('')
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-3" aria-label="Pujar">
      <div className="grid grid-cols-3 gap-2">
        {quick.map((q) => (
          <button key={q} type="button" className="btn px-2 py-2 text-xs" onClick={() => setAmount(q.toFixed(2))}>
            {formatMoney(q)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-line bg-ink/60 p-1.5 pl-4 focus-within:border-gold">
        <span className="text-muted">$</span>
        <input
          type="number"
          inputMode="decimal"
          step="0.01"
          aria-label="Monto de la oferta"
          className="tabular min-w-0 flex-1 bg-transparent text-lg font-bold outline-none"
          placeholder={min.toFixed(2)}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="submit" className="btn btn-gold px-5" disabled={pending || closing}>
          <TrendingUp className="size-4" /> {closing ? 'Cerrando…' : pending ? 'Enviando…' : 'Pujar'}
        </button>
      </div>

      <p className="text-xs text-muted">Oferta mínima: <b className="text-slate-200">{formatMoney(min)}</b></p>
    </form>
  )
}
