import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../auth/AuthContext'
import {
  applyBidPlaced, applyBidToList, applyFinished, applyStatusChanged, prependBid,
} from '../lib/auctionState'
import { formatMoney } from '../lib/format'
import { queryKeys } from '../lib/queryKeys'
import type {
  AuctionDetails, AuctionFinishedEvent, AuctionStatusChangedEvent, AuctionSummary, Bid,
  BidPlacedEvent, BidRejectedEvent, PagedResult, ViewersChangedEvent,
} from '../lib/types'
import { isConnected, useRealtime } from './RealtimeContext'

/**
 * Suscribe la pantalla de una subasta a su grupo de SignalR.
 * Los eventos NO van a un estado aparte: se aplican directo a la caché de React Query, así la
 * misma fuente alimenta lo que vino por REST y lo que llega en vivo.
 */
export function useAuctionRoom(auctionId: number) {
  const { connection, generation } = useRealtime()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [viewers, setViewers] = useState<number | null>(null)
  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  useEffect(() => {
    if (!isConnected(connection) || !Number.isFinite(auctionId)) return
    let active = true
    const key = queryKeys.auction(auctionId)

    const onBidPlaced = (e: BidPlacedEvent) => {
      if (e.auctionId !== auctionId) return
      const before = queryClient.getQueryData<AuctionDetails>(key)
      queryClient.setQueryData<AuctionDetails>(key, (a) => (a ? applyBidPlaced(a, e) : a))
      queryClient.setQueryData<PagedResult<Bid>>(queryKeys.bids(auctionId), (p) => (p ? prependBid(p, e) : p))

      const me = userRef.current?.id
      if (before && before.highestBidderId === me && e.bidderId !== me && e.bidCount > before.bidCount)
        toast.warning(`${e.bidderName} superó tu oferta: ${formatMoney(e.amount)}`)
    }
    const onRejected = (e: BidRejectedEvent) => e.auctionId === auctionId && toast.error(e.message)
    const onStatus = (e: AuctionStatusChangedEvent) => {
      queryClient.setQueryData<AuctionDetails>(key, (a) => (a ? applyStatusChanged(a, e) : a))
      if (e.auctionId === auctionId && e.status === 'Active') toast.info('¡La subasta comenzó!')
    }
    const onFinished = (e: AuctionFinishedEvent) =>
      queryClient.setQueryData<AuctionDetails>(key, (a) => (a ? applyFinished(a, e) : a))
    const onViewers = (e: ViewersChangedEvent) => e.auctionId === auctionId && setViewers(e.viewers)

    connection.on('BidPlaced', onBidPlaced)
    connection.on('BidRejected', onRejected)
    connection.on('AuctionStatusChanged', onStatus)
    connection.on('AuctionFinished', onFinished)
    connection.on('ViewersChanged', onViewers)

    // Unirse (o volver a unirse tras reconectar). JoinAuction devuelve el estado actual:
    // resincroniza todo lo que pudo pasar mientras no había conexión.
    connection.invoke<AuctionDetails>('JoinAuction', auctionId)
      .then((snapshot) => {
        if (!active) return
        queryClient.setQueryData(key, snapshot)
        void queryClient.invalidateQueries({ queryKey: queryKeys.bids(auctionId) })
      })
      .catch(() => { /* subasta inexistente: la página ya muestra el error del GET */ })

    return () => {
      active = false
      connection.off('BidPlaced', onBidPlaced)
      connection.off('BidRejected', onRejected)
      connection.off('AuctionStatusChanged', onStatus)
      connection.off('AuctionFinished', onFinished)
      connection.off('ViewersChanged', onViewers)
      if (isConnected(connection)) void connection.invoke('LeaveAuction', auctionId).catch(() => undefined)
    }
  }, [connection, generation, auctionId, queryClient])

  return { viewers }
}

/** Catálogo en vivo: grupo "lobby" con los cambios de todas las subastas. */
export function useLobby() {
  const { connection, generation } = useRealtime()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isConnected(connection)) return

    const onBidPlaced = (e: BidPlacedEvent) =>
      queryClient.setQueriesData<PagedResult<AuctionSummary>>({ queryKey: queryKeys.auctions() },
        (page) => (page ? applyBidToList(page, e) : page))
    const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.auctions() })
    const onFinished = (e: AuctionFinishedEvent) => {
      if (e.winnerName) toast(`Subasta #${e.auctionId} cerrada: ganó ${e.winnerName} con ${formatMoney(e.finalPrice ?? 0)}`)
      refresh()
    }

    connection.on('BidPlaced', onBidPlaced)
    connection.on('AuctionStatusChanged', refresh)
    connection.on('AuctionFinished', onFinished)
    void connection.invoke('JoinLobby').then(refresh).catch(() => undefined)

    return () => {
      connection.off('BidPlaced', onBidPlaced)
      connection.off('AuctionStatusChanged', refresh)
      connection.off('AuctionFinished', onFinished)
      if (isConnected(connection)) void connection.invoke('LeaveLobby').catch(() => undefined)
    }
  }, [connection, generation, queryClient])
}
