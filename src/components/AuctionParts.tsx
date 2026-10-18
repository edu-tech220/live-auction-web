import { Ban, PartyPopper, Trophy } from 'lucide-react'
import { formatDateTime, formatMoney } from '../lib/format'
import type { AuctionDetails, Bid } from '../lib/types'

export function BidHistory({ bids, currentUserId }: { bids: Bid[]; currentUserId?: number }) {
  if (bids.length === 0)
    return <p className="rounded-xl bg-surface-2/60 p-4 text-center text-sm text-muted">Todavía no hay ofertas. ¡Sé el primero!</p>

  return (
    <ol className="max-h-[420px] space-y-2 overflow-auto pr-1" aria-label="Historial de ofertas">
      {bids.map((b, i) => (
        <li
          key={b.id}
          className={`flex animate-rise items-center justify-between gap-3 rounded-xl border p-3 ${
            i === 0 ? 'border-gold/40 bg-gold/10' : 'border-line bg-ink/40'}`}
        >
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {i === 0 && <Trophy className="mr-1.5 inline size-4 text-gold" />}
              {b.bidderName}
              {b.bidderId === currentUserId && <span className="ml-1 text-xs text-muted">(tú)</span>}
            </p>
            <p className="text-xs text-muted">{formatDateTime(b.placedAt)}</p>
          </div>
          <p className="tabular font-bold">{formatMoney(b.amount)}</p>
        </li>
      ))}
    </ol>
  )
}

export function ResultBanner({ auction, currentUserId }: { auction: AuctionDetails; currentUserId?: number }) {
  if (auction.status === 'Cancelled') {
    return (
      <div className="card flex items-center gap-3 border-danger/40 bg-danger/10 p-5 text-danger" role="status">
        <Ban className="size-6" /> <p className="font-bold">Subasta cancelada</p>
      </div>
    )
  }
  if (auction.status !== 'Finished') return null

  const iWon = auction.winnerId != null && auction.winnerId === currentUserId
  return (
    <div className="card animate-rise border-gold/40 bg-gradient-to-br from-gold/20 to-gold-2/5 p-6 text-center" role="status" data-testid="result">
      <p className="text-xs uppercase tracking-wider text-muted">Subasta finalizada</p>
      {auction.winnerId == null ? (
        <>
          <p className="mt-1 text-2xl font-extrabold">Sin ganador</p>
          <p className="text-sm text-muted">Nadie ofertó en esta subasta.</p>
        </>
      ) : (
        <>
          <p className="mt-1 flex items-center justify-center gap-2 text-2xl font-extrabold">
            {iWon ? <><PartyPopper className="size-6 text-gold" /> ¡Ganaste!</> : <>Ganó {auction.winnerName}</>}
          </p>
          <p className="tabular mt-1 text-4xl font-black tracking-tight">{formatMoney(auction.finalPrice ?? 0)}</p>
        </>
      )}
    </div>
  )
}
