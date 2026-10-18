import { describe, expect, it } from 'vitest'
import { applyBidPlaced, applyBidToList, applyFinished, applyStatusChanged, prependBid, serverOffset } from './auctionState'
import type { AuctionDetails, AuctionSummary, Bid, BidPlacedEvent, PagedResult } from './types'

const auction: AuctionDetails = {
  id: 1, title: 'Reloj', description: null, imageUrl: null, status: 'Active',
  startingPrice: 100, minIncrement: 10, currentPrice: 100, minimumNextBid: 110, bidCount: 1,
  highestBidderId: 2, highestBidderName: 'Ana', startsAt: '2026-01-01T00:00:00Z', endsAt: '2026-01-01T01:00:00Z',
  sellerId: 1, sellerName: 'Admin', winnerId: null, winnerName: null, finalPrice: null, closedAt: null,
  serverTime: '2026-01-01T00:30:00Z',
}

const bid = (overrides: Partial<BidPlacedEvent> = {}): BidPlacedEvent => ({
  auctionId: 1, bidId: 50, amount: 110, bidderId: 3, bidderName: 'Luis',
  placedAt: '2026-01-01T00:31:00Z', bidCount: 2, minimumNextBid: 120, ...overrides,
})

describe('applyBidPlaced', () => {
  it('actualiza precio, mínimo, contador y líder', () => {
    const next = applyBidPlaced(auction, bid())
    expect(next).toMatchObject({ currentPrice: 110, minimumNextBid: 120, bidCount: 2, highestBidderId: 3, highestBidderName: 'Luis' })
  })

  it('ignora eventos viejos o duplicados (bidCount como secuencia)', () => {
    const newer = applyBidPlaced(auction, bid({ bidCount: 3, amount: 130 }))
    // Llega tarde el evento #2: no debe "bajar" el precio.
    expect(applyBidPlaced(newer, bid({ bidCount: 2, amount: 110 }))).toBe(newer)
    expect(applyBidPlaced(newer, bid({ bidCount: 3, amount: 130 }))).toBe(newer)
  })

  it('ignora eventos de otra subasta', () => {
    expect(applyBidPlaced(auction, bid({ auctionId: 99 }))).toBe(auction)
  })
})

describe('prependBid', () => {
  const page: PagedResult<Bid> = { items: [{ id: 10, amount: 100, bidderId: 2, bidderName: 'Ana', placedAt: '' }], page: 1, pageSize: 50, totalCount: 1, totalPages: 1 }

  it('agrega la nueva puja al inicio', () => {
    const next = prependBid(page, bid())
    expect(next.items.map((b) => b.id)).toEqual([50, 10])
    expect(next.totalCount).toBe(2)
  })

  it('no duplica si la puja ya estaba (p. ej. llegó por REST y por SignalR)', () => {
    const once = prependBid(page, bid())
    expect(prependBid(once, bid())).toBe(once)
  })
})

describe('estado y cierre', () => {
  it('aplica el resultado final', () => {
    const done = applyFinished(auction, {
      auctionId: 1, status: 'Finished', winnerId: 2, winnerName: 'Ana', finalPrice: 100, bidCount: 1, closedAt: '2026-01-01T01:00:00Z',
    })
    expect(done).toMatchObject({ status: 'Finished', winnerId: 2, winnerName: 'Ana', finalPrice: 100 })
  })

  it('un cambio de estado tardío no "revive" una subasta finalizada', () => {
    const finished = { ...auction, status: 'Finished' as const }
    expect(applyStatusChanged(finished, { auctionId: 1, status: 'Active', changedAt: '' })).toBe(finished)
  })
})

describe('applyBidToList', () => {
  const summary: AuctionSummary = { id: 1, title: 'Reloj', imageUrl: null, status: 'Scheduled', currentPrice: 100, bidCount: 0, startsAt: '', endsAt: '' }
  const page: PagedResult<AuctionSummary> = { items: [summary, { ...summary, id: 2 }], page: 1, pageSize: 24, totalCount: 2, totalPages: 1 }

  it('actualiza solo la tarjeta de esa subasta', () => {
    const next = applyBidToList(page, bid({ bidCount: 1 }))
    expect(next.items[0]).toMatchObject({ currentPrice: 110, bidCount: 1, status: 'Active' })
    expect(next.items[1]).toBe(page.items[1])
  })

  it('devuelve la misma página si el evento no aplica (evita renders)', () => {
    expect(applyBidToList(page, bid({ auctionId: 99 }))).toBe(page)
  })
})

it('serverOffset calcula el desfase del reloj', () => {
  expect(serverOffset('2026-01-01T00:00:10Z', Date.parse('2026-01-01T00:00:00Z'))).toBe(10_000)
})
