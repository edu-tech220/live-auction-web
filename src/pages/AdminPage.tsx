import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Ban, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { Skeleton, StatusBadge } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { formatDateTime, formatMoney } from '../lib/format'
import { queryKeys } from '../lib/queryKeys'

// datetime-local no tiene zona horaria: se muestra en hora local y se envía en ISO (UTC).
const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)

const emptyForm = () => ({
  title: '', description: '', imageUrl: '', startingPrice: '', minIncrement: '',
  startsAt: toLocalInput(new Date(Date.now() + 60_000)),
  endsAt: toLocalInput(new Date(Date.now() + 31 * 60_000)),
})

export function AdminPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const listQuery = { pageSize: 50 }
  const { data, isPending } = useQuery({ queryKey: queryKeys.auctionList(listQuery), queryFn: () => api.listAuctions(listQuery) })

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.auctions() })

  const create = useMutation({
    mutationFn: () => api.createAuction({
      title: form.title.trim(),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      startingPrice: Number(form.startingPrice),
      minIncrement: Number(form.minIncrement),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
    }),
    onSuccess: (a) => { toast.success(`Subasta #${a.id} creada.`); setForm(emptyForm()); void refresh() },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'No se pudo crear.'),
  })

  const cancel = useMutation({
    mutationFn: (id: number) => api.cancelAuction(id),
    onSuccess: () => { toast.success('Subasta cancelada.'); void refresh() },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'No se pudo cancelar.'),
  })

  const set = (field: keyof ReturnType<typeof emptyForm>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const submit = (e: FormEvent) => { e.preventDefault(); create.mutate() }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black tracking-tight">Administrar subastas</h1>

      <form onSubmit={submit} className="card grid gap-4 p-6 md:grid-cols-2">
        <h2 className="text-lg font-bold md:col-span-2">Nueva subasta</h2>
        <div className="md:col-span-2"><label className="label" htmlFor="title">Título</label><input id="title" className="input" value={form.title} onChange={set('title')} maxLength={120} required /></div>
        <div className="md:col-span-2"><label className="label" htmlFor="description">Descripción</label><textarea id="description" className="input min-h-20" value={form.description} onChange={set('description')} maxLength={2000} /></div>
        <div className="md:col-span-2"><label className="label" htmlFor="imageUrl">URL de imagen (opcional)</label><input id="imageUrl" type="url" className="input" value={form.imageUrl} onChange={set('imageUrl')} /></div>
        <div><label className="label" htmlFor="startingPrice">Precio inicial</label><input id="startingPrice" type="number" min="0.01" step="0.01" className="input" value={form.startingPrice} onChange={set('startingPrice')} required /></div>
        <div><label className="label" htmlFor="minIncrement">Incremento mínimo</label><input id="minIncrement" type="number" min="0.01" step="0.01" className="input" value={form.minIncrement} onChange={set('minIncrement')} required /></div>
        <div><label className="label" htmlFor="startsAt">Inicio</label><input id="startsAt" type="datetime-local" className="input" value={form.startsAt} onChange={set('startsAt')} required /></div>
        <div><label className="label" htmlFor="endsAt">Fin</label><input id="endsAt" type="datetime-local" className="input" value={form.endsAt} onChange={set('endsAt')} required /></div>
        <div className="md:col-span-2"><button className="btn btn-gold" disabled={create.isPending}><Plus className="size-4" /> Crear subasta</button></div>
      </form>

      <div className="card overflow-x-auto">
        {isPending ? <Skeleton className="h-48" /> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-muted">
              <tr className="border-b border-line"><th className="p-4">#</th><th className="p-4">Título</th><th className="p-4">Estado</th><th className="p-4">Precio</th><th className="p-4">Ofertas</th><th className="p-4">Fin</th><th className="p-4" /></tr>
            </thead>
            <tbody>
              {data?.items.map((a) => (
                <tr key={a.id} className="border-b border-line/60 last:border-0">
                  <td className="p-4 text-muted">{a.id}</td>
                  <td className="p-4"><Link to={`/auctions/${a.id}`} className="font-semibold hover:text-gold">{a.title}</Link></td>
                  <td className="p-4"><StatusBadge status={a.status} /></td>
                  <td className="tabular p-4">{formatMoney(a.currentPrice)}</td>
                  <td className="p-4">{a.bidCount}</td>
                  <td className="p-4 text-muted">{formatDateTime(a.endsAt)}</td>
                  <td className="p-4 text-right">
                    {(a.status === 'Active' || a.status === 'Scheduled') && (
                      <button
                        className="btn border-danger/30 bg-danger/10 px-3 py-1.5 text-xs text-danger"
                        onClick={() => window.confirm('¿Cancelar esta subasta? Nadie podrá ganarla.') && cancel.mutate(a.id)}
                      >
                        <Ban className="size-3.5" /> Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
