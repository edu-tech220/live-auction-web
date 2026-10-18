import { afterEach, describe, expect, it, vi } from 'vitest'
import { readSession, SESSION_EXPIRED_EVENT, writeSession } from '../auth/session'
import { api, ApiError } from './api'

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': status >= 400 ? 'application/problem+json' : 'application/json' } })

const login = () => writeSession({
  accessToken: 'token-123',
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  user: { id: 7, email: 'ana@demo.local', displayName: 'Ana', role: 'Bidder' },
})

describe('api', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('envía el JWT y SOLO el monto al pujar', async () => {
    login()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(201, { bid: {}, currentPrice: 110, minimumNextBid: 120, bidCount: 1 }))
    vi.stubGlobal('fetch', fetchMock)

    await api.placeBid(5, 110)

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toMatch(/\/api\/auctions\/5\/bids$/)
    expect(init.headers.Authorization).toBe('Bearer token-123')
    expect(JSON.parse(init.body)).toEqual({ amount: 110 }) // ni usuario ni precio vigente
  })

  it('convierte ProblemDetails en ApiError con el code estable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse(409, { title: 'Conflicto', detail: 'La oferta mínima es 120.00.', code: 'BidTooLow' })))

    const error = await api.placeBid(5, 100).catch((e: unknown) => e)

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 409, code: 'BidTooLow', message: 'La oferta mínima es 120.00.' })
  })

  it('junta los errores de validación por campo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      jsonResponse(400, { title: 'Inválido', errors: { Password: ['Muy corta.'], Email: ['Correo inválido.'] } })))

    await expect(api.register('x', 'y', 'z')).rejects.toMatchObject({ status: 400, message: 'Muy corta. Correo inválido.' })
  })

  it('un 401 con sesión cierra la sesión y avisa a la app', async () => {
    login()
    const listener = vi.fn()
    window.addEventListener(SESSION_EXPIRED_EVENT, listener)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(401, { title: 'No autenticado' })))

    await expect(api.me()).rejects.toBeInstanceOf(ApiError)

    expect(readSession()).toBeNull()
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
  })

  it('error de red => ApiError NetworkError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(api.listAuctions()).rejects.toMatchObject({ status: 0, code: 'NetworkError' })
  })
})

describe('session', () => {
  it('descarta tokens vencidos', () => {
    writeSession({ accessToken: 't', expiresAt: '2020-01-01T00:00:00Z', user: { id: 1, email: '', displayName: 'X', role: 'Bidder' } })
    expect(readSession()).toBeNull()
  })
})
