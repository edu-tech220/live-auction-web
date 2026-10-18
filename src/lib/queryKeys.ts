import type { AuctionListQuery } from './api'

// Claves de React Query en un solo lugar: la invalidación por prefijo depende de que coincidan.
export const queryKeys = {
  auctions: () => ['auctions'] as const,
  auctionList: (q: AuctionListQuery) => ['auctions', q] as const,
  auction: (id: number) => ['auction', id] as const,
  bids: (id: number) => ['auction', id, 'bids'] as const,
  myBids: () => ['me', 'bids'] as const,
}
