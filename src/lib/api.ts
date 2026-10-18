import { clearSession, currentToken, SESSION_EXPIRED_EVENT } from '../auth/session'
import type {
  AuctionDetails, AuctionRequest, AuctionStatus, AuctionSummary, AuthResponse,
  Bid, MyBid, PagedResult, PlaceBidResponse, User,
} from './types'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:5080').replace(/\/$/, '')

// Error de la API con el "code" estable de ProblemDetails (p. ej. "BidTooLow").
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors?: Record<string, string[]>

  constructor(status: number, code: string, message: string, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

interface ProblemDetails {
  title?: string
  detail?: string
  code?: string
  errors?: Record<string, string[]>
}

async function request<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (init.body !== undefined) headers['Content-Type'] = 'application/json'
  const token = currentToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let response: Response
  try {
    response = await fetch(API_URL + path, {
      method: init.method ?? 'GET',
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    throw new ApiError(0, 'NetworkError', 'No se pudo conectar con el servidor.')
  }

  if (response.status === 204) return undefined as T

  const isJson = response.headers.get('content-type')?.includes('json') ?? false
  const data: unknown = isJson ? await response.json() : null

  if (!response.ok) {
    // Token vencido o inválido: se cierra la sesión y se avisa a la app.
    if (response.status === 401 && token) {
      clearSession()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    const problem = (data ?? {}) as ProblemDetails
    const fieldMessages = problem.errors ? Object.values(problem.errors).flat().join(' ') : ''
    throw new ApiError(
      response.status,
      problem.code ?? `Http${response.status}`,
      fieldMessages || problem.detail || problem.title || 'Ocurrió un error.',
      problem.errors,
    )
  }

  return data as T
}

export interface AuctionListQuery {
  status?: AuctionStatus | ''
  search?: string
  page?: number
  pageSize?: number
}

export const api = {
  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } }),
  register: (email: string, displayName: string, password: string) =>
    request<AuthResponse>('/api/auth/register', { method: 'POST', body: { email, displayName, password } }),
  me: () => request<User>('/api/auth/me'),

  listAuctions: ({ status, search, page = 1, pageSize = 24 }: AuctionListQuery = {}) => {
    const q = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (status) q.set('status', status)
    if (search?.trim()) q.set('search', search.trim())
    return request<PagedResult<AuctionSummary>>(`/api/auctions?${q}`)
  },
  getAuction: (id: number) => request<AuctionDetails>(`/api/auctions/${id}`),
  createAuction: (body: AuctionRequest) => request<AuctionDetails>('/api/auctions', { method: 'POST', body }),
  cancelAuction: (id: number) => request<void>(`/api/auctions/${id}/cancel`, { method: 'POST' }),

  getBids: (id: number, page = 1, pageSize = 50) =>
    request<PagedResult<Bid>>(`/api/auctions/${id}/bids?page=${page}&pageSize=${pageSize}`),
  // Solo se manda el monto: el usuario sale del JWT y el precio vigente lo decide el servidor.
  placeBid: (id: number, amount: number) =>
    request<PlaceBidResponse>(`/api/auctions/${id}/bids`, { method: 'POST', body: { amount } }),
  myBids: () => request<MyBid[]>('/api/me/bids'),
}
