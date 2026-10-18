import type {
  AuctionDetails, AuctionFinishedEvent, AuctionStatusChangedEvent, AuctionSummary,
  Bid, BidPlacedEvent, PagedResult,
} from './types'

// Funciones PURAS que aplican eventos de SignalR al estado en caché (React Query).
// Puras = fáciles de probar y sin efectos: reciben el estado anterior y devuelven el nuevo
// (o el mismo objeto si el evento no aplica, para que React no vuelva a renderizar).

/** Aplica una puja confirmada. Ignora eventos viejos o desordenados usando bidCount como secuencia. */
export function applyBidPlaced(auction: AuctionDetails, e: BidPlacedEvent): AuctionDetails {
  if (e.auctionId !== auction.id || e.bidCount <= auction.bidCount) return auction
  return {
    ...auction,
    status: 'Active',
    currentPrice: e.amount,
    bidCount: e.bidCount,
    minimumNextBid: e.minimumNextBid,
    highestBidderId: e.bidderId,
    highestBidderName: e.bidderName,
  }
}

/** Agrega la puja al historial (primero la más alta) sin duplicarla. */
export function prependBid(page: PagedResult<Bid>, e: BidPlacedEvent): PagedResult<Bid> {
  if (page.items.some((b) => b.id === e.bidId)) return page
  const bid: Bid = { id: e.bidId, amount: e.amount, bidderId: e.bidderId, bidderName: e.bidderName, placedAt: e.placedAt }
  return { ...page, items: [bid, ...page.items], totalCount: page.totalCount + 1 }
}

export function applyStatusChanged(auction: AuctionDetails, e: AuctionStatusChangedEvent): AuctionDetails {
  if (e.auctionId !== auction.id || auction.status === 'Finished' || auction.status === 'Cancelled') return auction
  return { ...auction, status: e.status }
}

export function applyFinished(auction: AuctionDetails, e: AuctionFinishedEvent): AuctionDetails {
  if (e.auctionId !== auction.id) return auction
  return {
    ...auction,
    status: e.status,
    winnerId: e.winnerId,
    winnerName: e.winnerName,
    finalPrice: e.finalPrice,
    closedAt: e.closedAt,
    bidCount: Math.max(auction.bidCount, e.bidCount),
  }
}

/** Actualiza la tarjeta de una subasta dentro de una página del catálogo. */
export function applyBidToList(page: PagedResult<AuctionSummary>, e: BidPlacedEvent): PagedResult<AuctionSummary> {
  let changed = false
  const items = page.items.map((a) => {
    if (a.id !== e.auctionId || e.bidCount <= a.bidCount) return a
    changed = true
    return { ...a, currentPrice: e.amount, bidCount: e.bidCount, status: 'Active' as const }
  })
  return changed ? { ...page, items } : page
}

/** Desfase entre el reloj del servidor y el del navegador (ms). */
export const serverOffset = (serverTimeIso: string, nowMs: number = Date.now()): number =>
  new Date(serverTimeIso).getTime() - nowMs
