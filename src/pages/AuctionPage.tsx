import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Crown, Eye, SearchX } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import { BidHistory, ResultBanner } from '../components/AuctionParts'
import { BidPanel } from '../components/BidPanel'
import { Countdown, EmptyState, Skeleton, StatusBadge } from '../components/ui'
import { FALLBACK_IMAGE } from '../lib/images'
import { useNow } from '../lib/useNow'
import { api, ApiError } from '../lib/api'
import { serverOffset } from '../lib/auctionState'
import { formatMoney, remaining } from '../lib/format'
import { queryKeys } from '../lib/queryKeys'
import type { BidOutcome } from '../lib/types'
import { useAuctionRoom } from '../realtime/hooks'
import { isConnected, useRealtime } from '../realtime/RealtimeContext'

export function AuctionPage() {
  const id = Number(useParams().id)
  const { user } = useAuth()
  const { connection } = useRealtime()
  const queryClient = useQueryClient()

  const auctionQuery = useQuery({ queryKey: queryKeys.auction(id), queryFn: () => api.getAuction(id), enabled: id > 0 })
  const bidsQuery = useQuery({ queryKey: queryKeys.bids(id), queryFn: () => api.getBids(id), enabled: id > 0 })
  const { viewers } = useAuctionRoom(id)

  const auction = auctionQuery.data
  // Desfase reloj servidor/navegador: se recalcula cada vez que llega una hora del servidor.
  const serverTime = auction?.serverTime
  const offsetMs = useMemo(() => (serverTime ? serverOffset(serverTime) : 0), [serverTime])
  const now = useNow()

  const bid = useMutation({
    mutationFn: async (amount: number) => {
      // Preferir el Hub (tiempo real). Si se rechaza, el servidor manda BidRejected SOLO a esta
      // conexión y el hook muestra el motivo. Respaldo: REST si no hay WebSocket.
      if (isConnected(connection)) {
        const outcome = await connection.invoke<BidOutcome>('PlaceBid', id, amount)
        return { amount, accepted: outcome.accepted, viaHub: true }
      }
      await api.placeBid(id, amount)
      return { amount, accepted: true, viaHub: false }
    },
    onSuccess: ({ amount, accepted, viaHub }) => {
      if (accepted) toast.success(`Oferta de ${formatMoney(amount)} registrada.`)
      if (!viaHub) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.auction(id) })
      }
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'No se pudo enviar la oferta.'),
  })

  if (!(id > 0)) return <EmptyState icon={<SearchX />} title="Subasta inválida" />
  if (auctionQuery.isError)
    return <EmptyState icon={<SearchX />} title="No encontramos esta subasta">{auctionQuery.error.message}</EmptyState>
  if (!auction)
    return (
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="aspect-[4/3]" /><Skeleton className="h-96" />
      </div>
    )

  const running = auction.status === 'Active' || auction.status === 'Scheduled'
  const target = auction.status === 'Scheduled' ? auction.startsAt : auction.endsAt
  // La cuenta llegó a cero: se deshabilita el botón y se ESPERA el cierre del servidor
  // (evento AuctionFinished). El navegador nunca declara un ganador por su cuenta.
  const closing = auction.status === 'Active' && remaining(auction.endsAt, offsetMs, now).ms === 0
  const leaderIsMe = auction.highestBidderId != null && auction.highestBidderId === user?.id

  return (
    <div className="space-y-6">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"><ArrowLeft className="size-4" /> Todas las subastas</Link>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-5">
          <div className="card relative aspect-[4/3] overflow-hidden">
            <img src={auction.imageUrl || FALLBACK_IMAGE} onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE }} alt={auction.title} className="absolute inset-0 size-full object-cover" />
          </div>
          <div className="card space-y-3 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={auction.status} />
              {viewers != null && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted" data-testid="viewers">
                  <Eye className="size-3.5" /> {viewers} {viewers === 1 ? 'persona viendo' : 'personas viendo'}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black tracking-tight">{auction.title}</h1>
            {auction.description && <p className="text-muted">{auction.description}</p>}
            <p className="text-sm text-muted">Vendedor: <span className="text-slate-200">{auction.sellerName}</span></p>
          </div>
        </section>

        <aside className="space-y-5">
          <ResultBanner auction={auction} currentUserId={user?.id} />

          <div className="card space-y-5 p-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted">{auction.bidCount > 0 ? 'Oferta actual' : 'Precio inicial'}</p>
              <p key={auction.currentPrice} className="tabular animate-flash text-5xl font-black tracking-tight" data-testid="price">
                {formatMoney(auction.currentPrice)}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-line bg-ink/40 p-3">
                <p className="text-xs text-muted">{auction.status === 'Scheduled' ? 'Empieza en' : 'Termina en'}</p>
                {running ? <Countdown target={target} offsetMs={offsetMs} className="text-base" /> : <p className="font-bold">—</p>}
              </div>
              <div className="rounded-xl border border-line bg-ink/40 p-3">
                <p className="text-xs text-muted">Ofertas</p>
                <p className="text-base font-bold" data-testid="bid-count">{auction.bidCount}</p>
              </div>
              <div className="rounded-xl border border-line bg-ink/40 p-3">
                <p className="text-xs text-muted">Incremento</p>
                <p className="text-base font-bold">{formatMoney(auction.minIncrement)}</p>
              </div>
            </div>

            {running && auction.highestBidderName && (
              <p className="flex items-center gap-2 rounded-xl bg-gold/10 px-4 py-3 font-semibold text-gold" data-testid="leader">
                <Crown className="size-4" /> {leaderIsMe ? '¡Vas ganando!' : `Mejor postor: ${auction.highestBidderName}`}
              </p>
            )}

            <BidPanel auction={auction} user={user} pending={bid.isPending} closing={closing} onBid={(amount) => bid.mutate(amount)} />
          </div>

          <div className="card p-6">
            <h2 className="mb-4 text-lg font-bold">Historial de ofertas</h2>
            {bidsQuery.data ? <BidHistory bids={bidsQuery.data.items} currentUserId={user?.id} /> : <Skeleton className="h-40" />}
          </div>
        </aside>
      </div>
    </div>
  )
}
