import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Link, Route, Routes } from 'react-router'
import { Toaster } from 'sonner'
import { AuthProvider } from './auth/AuthContext'
import { Layout, RequireAuth } from './components/Layout'
import { EmptyState } from './components/ui'
import { ApiError } from './lib/api'
import { AdminPage } from './pages/AdminPage'
import { AuctionPage } from './pages/AuctionPage'
import { AuthPage } from './pages/AuthPage'
import { HomePage } from './pages/HomePage'
import { MyBidsPage } from './pages/MyBidsPage'
import { RealtimeProvider } from './realtime/RealtimeContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Lo "en vivo" llega por SignalR; no hace falta refetch agresivo.
      staleTime: 30_000,
      refetchOnWindowFocus: true,
      // No reintentar errores del cliente (404, 401...): solo fallas de red o del servidor.
      retry: (count, error) => count < 2 && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="auctions/:id" element={<AuctionPage />} />
                <Route path="login" element={<AuthPage mode="login" />} />
                <Route path="register" element={<AuthPage mode="register" />} />
                <Route path="me/bids" element={<RequireAuth><MyBidsPage /></RequireAuth>} />
                <Route path="admin" element={<RequireAuth admin><AdminPage /></RequireAuth>} />
                <Route path="*" element={<EmptyState icon="404" title="Página no encontrada"><Link to="/" className="text-gold">Volver al inicio</Link></EmptyState>} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster theme="dark" position="bottom-right" richColors closeButton />
        </RealtimeProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
