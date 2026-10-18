import {
  HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel,
} from '@microsoft/signalr'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { API_URL } from '../lib/api'

export type ConnectionStatus = 'connecting' | 'online' | 'reconnecting' | 'offline'

interface RealtimeState {
  connection: HubConnection | null
  status: ConnectionStatus
  /** Cambia cada vez que la conexión (re)queda lista: los hooks lo usan para volver a unirse a sus grupos. */
  generation: number
}

const RealtimeContext = createContext<RealtimeState>({ connection: null, status: 'offline', generation: 0 })

// Una sola conexión SignalR para toda la app.
// - El token se lee al negociar. Si el usuario inicia o cierra sesión, la conexión se recrea
//   para que el servidor vea la nueva identidad (Context.User en el Hub).
// - withAutomaticReconnect reintenta tras caídas; al reconectar el servidor ya NO recuerda los
//   grupos de la conexión anterior, por eso cada pantalla vuelve a unirse (ver "generation").
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [state, setState] = useState<RealtimeState>({ connection: null, status: 'connecting', generation: 0 })
  const tokenRef = useRef(token)
  // El ref se actualiza en un efecto (no durante el render) y ANTES del efecto de conexión.
  useEffect(() => { tokenRef.current = token }, [token])

  useEffect(() => {
    let disposed = false
    let retryTimer: number | undefined

    const connection = new HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/auctions`, { accessTokenFactory: () => tokenRef.current ?? '' })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(LogLevel.Warning)
      .build()

    const ready = () => !disposed && setState((s) => ({ connection, status: 'online', generation: s.generation + 1 }))
    connection.onreconnecting(() => !disposed && setState((s) => ({ ...s, status: 'reconnecting' })))
    connection.onreconnected(ready)
    connection.onclose(() => !disposed && setState((s) => ({ ...s, status: 'offline' })))

    const start = async () => {
      try {
        setState((s) => ({ ...s, connection, status: 'connecting' }))
        await connection.start()
        ready()
      } catch {
        if (disposed) return
        setState((s) => ({ ...s, status: 'offline' }))
        retryTimer = window.setTimeout(start, 5000) // el primer arranque no lo cubre withAutomaticReconnect
      }
    }
    // Arranque diferido un tick: en desarrollo, StrictMode monta y desmonta el efecto de
    // inmediato; así el montaje descartado nunca abre una conexión que luego se cancela.
    retryTimer = window.setTimeout(start, 0)

    return () => {
      disposed = true
      window.clearTimeout(retryTimer)
      void connection.stop()
    }
  }, [token])

  return <RealtimeContext.Provider value={state}>{children}</RealtimeContext.Provider>
}

// oxlint-disable-next-line react/only-export-components -- hook junto a su proveedor
export const useRealtime = () => useContext(RealtimeContext)

// oxlint-disable-next-line react/only-export-components -- hook junto a su proveedor
export const isConnected = (c: HubConnection | null): c is HubConnection =>
  c?.state === HubConnectionState.Connected
