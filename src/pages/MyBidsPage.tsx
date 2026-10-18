import { useQuery } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState, Skeleton } from '../components/ui'
import { api } from '../lib/api'
import { formatDateTime, formatMoney } from '../lib/format'
import { queryKeys } from '../lib/queryKeys'
import type { MyBid } from '../lib/types'

function outcome(b: MyBid): { label: string; css: string } {
  if (b.auctionStatus === 'Finished') return b.isWinner ? { label: 'Ganaste', css: 'bg-gold/15 text-gold' } : { label: 'No ganaste', css: 'bg-slate-400/15 text-slate-300' }
  if (b.auctionStatus === 'Cancelled') return { label: 'Cancelada', css: 'bg-danger/15 text-danger' }
  return b.isHighest ? { label: 'Vas ganando', css: 'bg-live/15 text-live' } : { label: 'Superada', css: 'bg-danger/15 text-danger' }
}

export function MyBidsPage() {
  const { data, isPending } = useQuery({ queryKey: queryKeys.myBids(), queryFn: api.myBids, refetchInterval: 15_000 })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black tracking-tight">Mis pujas</h1>
      {isPending ? <Skeleton className="h-64" /> : !data?.length ? (
        <EmptyState icon={<Receipt />} title="Aún no has pujado">
          Entra a una <Link to="/" className="text-gold hover:underline">subasta en vivo</Link> y haz tu primera oferta.
        </EmptyState>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted">
              <tr className="border-b border-line">
                <th className="p-4">Subasta</th><th className="p-4">Mi oferta</th><th className="p-4">Precio actual</th><th className="p-4">Fecha</th><th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody>
              {data.map((b) => {
                const o = outcome(b)
                return (
                  <tr key={b.bidId} className="border-b border-line/60 last:border-0 hover:bg-surface-2/40">
                    <td className="p-4"><Link to={`/auctions/${b.auctionId}`} className="font-semibold hover:text-gold">{b.auctionTitle}</Link></td>
                    <td className="tabular p-4 font-bold">{formatMoney(b.amount)}</td>
                    <td className="tabular p-4">{formatMoney(b.currentPrice)}</td>
                    <td className="p-4 text-muted">{formatDateTime(b.placedAt)}</td>
                    <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${o.css}`}>{o.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
