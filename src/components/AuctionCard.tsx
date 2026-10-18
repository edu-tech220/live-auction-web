import { Gavel } from 'lucide-react'
import { Link } from 'react-router'
import { formatDate, formatMoney } from '../lib/format'
import type { AuctionSummary } from '../lib/types'
import { FALLBACK_IMAGE } from '../lib/images'
import { Countdown, StatusBadge } from './ui'

export function AuctionCard({ auction }: { auction: AuctionSummary }) {
  const live = auction.status === 'Active' || auction.status === 'Scheduled'

  return (
    <Link
      to={`/auctions/${auction.id}`}
      className="card group flex animate-rise flex-col overflow-hidden transition hover:-translate-y-1 hover:border-slate-600 hover:shadow-2xl hover:shadow-black/40"
      aria-label={auction.title}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        <img
          src={auction.imageUrl || FALLBACK_IMAGE}
          onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE }}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3"><StatusBadge status={auction.status} solid /></div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 font-bold leading-snug">{auction.title}</h3>
        <div className="mt-auto flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted">{auction.bidCount > 0 ? 'Oferta actual' : 'Precio inicial'}</p>
            {/* key = precio: React vuelve a montar el nodo y la animación se repite en cada cambio */}
            <p key={auction.currentPrice} className="tabular animate-flash text-xl font-extrabold tracking-tight" data-testid="card-price">
              {formatMoney(auction.currentPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-wider text-muted">
              {auction.status === 'Scheduled' ? 'Empieza en' : live ? 'Termina en' : 'Terminó'}
            </p>
            {live
              ? <Countdown target={auction.status === 'Scheduled' ? auction.startsAt : auction.endsAt} />
              : <span className="text-sm font-semibold">{formatDate(auction.endsAt)}</span>}
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted" data-testid="card-bids">
          <Gavel className="size-3.5" /> {auction.bidCount} {auction.bidCount === 1 ? 'oferta' : 'ofertas'}
        </p>
      </div>
    </Link>
  )
}
