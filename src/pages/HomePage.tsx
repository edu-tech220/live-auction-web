import { useQuery } from '@tanstack/react-query'
import { Search, SearchX } from 'lucide-react'
import { useDeferredValue, useState } from 'react'
import { AuctionCard } from '../components/AuctionCard'
import { EmptyState, Skeleton } from '../components/ui'
import { api } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { AuctionStatus } from '../lib/types'
import { useLobby } from '../realtime/hooks'

const TABS: { label: string; status: AuctionStatus | '' }[] = [
  { label: 'En vivo', status: 'Active' },
  { label: 'Próximas', status: 'Scheduled' },
  { label: 'Finalizadas', status: 'Finished' },
  { label: 'Todas', status: '' },
]

export function HomePage() {
  const [status, setStatus] = useState<AuctionStatus | ''>('Active')
  const [search, setSearch] = useState('')
  // useDeferredValue: escribir no dispara una consulta por tecla con prioridad alta.
  const deferredSearch = useDeferredValue(search)
  const query = { status, search: deferredSearch }

  const { data, isPending, isError, error } = useQuery({
    queryKey: queryKeys.auctionList(query),
    queryFn: () => api.listAuctions(query),
    placeholderData: (prev) => prev,
  })

  useLobby() // precios y estados en vivo para las tarjetas

  return (
    <div className="space-y-8">
      <section className="pt-4">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          Puja en <span className="bg-gradient-to-r from-gold to-gold-2 bg-clip-text text-transparent">tiempo real</span>.
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Los precios cambian al instante para todos. El servidor valida cada oferta, resuelve las pujas simultáneas y decide cuándo termina cada subasta.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-2xl border border-line bg-surface p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.label}
              role="tab"
              aria-selected={status === t.status}
              onClick={() => setStatus(t.status)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${status === t.status ? 'bg-surface-2 text-white' : 'text-muted hover:text-white'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <label className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" type="search" placeholder="Buscar por título…" aria-label="Buscar" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
      </div>

      {isError ? (
        <EmptyState icon={<SearchX />} title="No se pudo cargar el catálogo">{error.message}</EmptyState>
      ) : isPending ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-80" />)}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState icon={<SearchX />} title="No hay subastas aquí">Prueba otra pestaña o cambia la búsqueda.</EmptyState>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.items.map((a) => <AuctionCard key={a.id} auction={a} />)}
        </div>
      )}
    </div>
  )
}
