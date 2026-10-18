import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import type { AuctionDetails, AuctionSummary, User } from '../lib/types'
import { ResultBanner } from './AuctionParts'
import { AuctionCard } from './AuctionCard'
import { BidPanel } from './BidPanel'

const details: AuctionDetails = {
  id: 1, title: 'Reloj', description: null, imageUrl: null, status: 'Active',
  startingPrice: 100, minIncrement: 50, currentPrice: 1000, minimumNextBid: 1050, bidCount: 3,
  highestBidderId: 9, highestBidderName: 'Luis', startsAt: '2026-01-01T00:00:00Z', endsAt: '2099-01-01T00:00:00Z',
  sellerId: 1, sellerName: 'Admin', winnerId: null, winnerName: null, finalPrice: null, closedAt: null,
  serverTime: '2026-01-01T00:00:00Z',
}
const ana: User = { id: 7, email: 'ana@demo.local', displayName: 'Ana', role: 'Bidder' }

const renderPanel = (props: Partial<Parameters<typeof BidPanel>[0]> = {}) => {
  const onBid = vi.fn()
  render(
    <MemoryRouter>
      <BidPanel auction={details} user={ana} pending={false} closing={false} onBid={onBid} {...props} />
    </MemoryRouter>,
  )
  return onBid
}

describe('BidPanel', () => {
  it('sugiere montos a partir del mínimo que informó el servidor', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: '$1,050.00' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '$1,100.00' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '$1,150.00' })).toBeInTheDocument()
  })

  it('envía el monto elegido', async () => {
    const onBid = renderPanel()
    await userEvent.click(screen.getByRole('button', { name: '$1,100.00' }))
    await userEvent.click(screen.getByRole('button', { name: /pujar/i }))
    expect(onBid).toHaveBeenCalledWith(1100)
  })

  it('no bloquea montos bajos: la decisión es del servidor', async () => {
    const onBid = renderPanel()
    await userEvent.type(screen.getByLabelText('Monto de la oferta'), '10')
    await userEvent.click(screen.getByRole('button', { name: /pujar/i }))
    expect(onBid).toHaveBeenCalledWith(10)
  })

  it('sin sesión pide iniciar sesión', () => {
    renderPanel({ user: null })
    expect(screen.getByRole('link', { name: /inicia sesión para pujar/i })).toBeInTheDocument()
  })

  it('el vendedor no ve el formulario', () => {
    renderPanel({ user: { ...ana, id: details.sellerId } })
    expect(screen.queryByRole('form')).not.toBeInTheDocument()
    expect(screen.getByText(/eres el vendedor/i)).toBeInTheDocument()
  })

  it('al llegar la hora de fin deshabilita el botón y espera al servidor', () => {
    renderPanel({ closing: true })
    expect(screen.getByRole('button', { name: /cerrando/i })).toBeDisabled()
  })
})

describe('ResultBanner', () => {
  it('felicita al ganador', () => {
    render(<ResultBanner auction={{ ...details, status: 'Finished', winnerId: 7, winnerName: 'Ana', finalPrice: 1000 }} currentUserId={7} />)
    expect(screen.getByRole('status')).toHaveTextContent('¡Ganaste!')
  })

  it('muestra quién ganó a los demás', () => {
    render(<ResultBanner auction={{ ...details, status: 'Finished', winnerId: 9, winnerName: 'Luis', finalPrice: 1000 }} currentUserId={7} />)
    expect(screen.getByRole('status')).toHaveTextContent('Ganó Luis')
  })

  it('subasta sin ofertas termina sin ganador', () => {
    render(<ResultBanner auction={{ ...details, status: 'Finished', winnerId: null }} />)
    expect(screen.getByRole('status')).toHaveTextContent('Sin ganador')
  })
})

describe('AuctionCard', () => {
  it('muestra precio, ofertas y estado', () => {
    const summary: AuctionSummary = { id: 3, title: 'Guitarra', imageUrl: null, status: 'Active', currentPrice: 8000, bidCount: 1, startsAt: '2026-01-01T00:00:00Z', endsAt: '2099-01-01T00:00:00Z' }
    render(<MemoryRouter><AuctionCard auction={summary} /></MemoryRouter>)

    expect(screen.getByRole('link', { name: 'Guitarra' })).toHaveAttribute('href', '/auctions/3')
    expect(screen.getByTestId('card-price')).toHaveTextContent('$8,000.00')
    expect(screen.getByTestId('card-bids')).toHaveTextContent('1 oferta')
    expect(screen.getByText('En vivo')).toBeInTheDocument()
  })
})
