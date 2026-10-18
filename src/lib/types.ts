// Contrato JSON de la API de Live Auction (https://github.com/edu-tech220/live-auction).
// El frontend es independiente: no comparte código con el backend, solo estos tipos.

export type AuctionStatus = 'Scheduled' | 'Active' | 'Finished' | 'Cancelled'
export type UserRole = 'Bidder' | 'Admin'

export interface User {
  id: number
  email: string
  displayName: string
  role: UserRole
}

export interface AuthResponse {
  accessToken: string
  expiresAt: string
  user: User
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}

export interface AuctionSummary {
  id: number
  title: string
  imageUrl: string | null
  status: AuctionStatus
  currentPrice: number
  bidCount: number
  startsAt: string
  endsAt: string
}

export interface AuctionDetails {
  id: number
  title: string
  description: string | null
  imageUrl: string | null
  status: AuctionStatus
  startingPrice: number
  minIncrement: number
  currentPrice: number
  minimumNextBid: number
  bidCount: number
  highestBidderId: number | null
  highestBidderName: string | null
  startsAt: string
  endsAt: string
  sellerId: number
  sellerName: string
  winnerId: number | null
  winnerName: string | null
  finalPrice: number | null
  closedAt: string | null
  /** Hora del servidor al responder: solo para corregir la cuenta regresiva visual. */
  serverTime: string
}

export interface Bid {
  id: number
  amount: number
  bidderId: number
  bidderName: string
  placedAt: string
}

export interface PlaceBidResponse {
  bid: Bid
  currentPrice: number
  minimumNextBid: number
  bidCount: number
}

export interface MyBid {
  bidId: number
  auctionId: number
  auctionTitle: string
  amount: number
  placedAt: string
  auctionStatus: AuctionStatus
  currentPrice: number
  isHighest: boolean
  isWinner: boolean
}

export interface AuctionRequest {
  title: string
  description: string | null
  imageUrl: string | null
  startingPrice: number
  minIncrement: number
  startsAt: string
  endsAt: string
}

// ---------------- Eventos de SignalR (/hubs/auctions) ----------------

export interface BidPlacedEvent {
  auctionId: number
  bidId: number
  amount: number
  bidderId: number
  bidderName: string
  placedAt: string
  /** Funciona como número de secuencia: permite descartar eventos viejos o desordenados. */
  bidCount: number
  minimumNextBid: number
}

export interface BidRejectedEvent {
  auctionId: number
  amount: number
  code: string
  message: string
}

export interface AuctionStatusChangedEvent {
  auctionId: number
  status: AuctionStatus
  changedAt: string
}

export interface AuctionFinishedEvent {
  auctionId: number
  status: AuctionStatus
  winnerId: number | null
  winnerName: string | null
  finalPrice: number | null
  bidCount: number
  closedAt: string
}

export interface ViewersChangedEvent {
  auctionId: number
  viewers: number
}

export interface BidOutcome {
  accepted: boolean
  code: string | null
  message: string | null
  currentPrice: number | null
  minimumNextBid: number | null
}
