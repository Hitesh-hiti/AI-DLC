/**
 * Tests: components/search/SearchResults.tsx
 * Covers: loading state, empty state, flight card rendering,
 *         available/sold-out display, Select button, onSelectFlight callback
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SearchResults } from './SearchResults'
import type { FlightOffer } from '../../api/types/search'

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const baseFlight: FlightOffer = {
  offerId: 'offer-001',
  airline: 'British Airways',
  flightNumber: 'BA 112',
  aircraft: 'Boeing 777',
  origin: 'LHR',
  destination: 'JFK',
  departureTime: new Date(Date.now() + 86400000 * 7).toISOString(),
  arrivalTime: new Date(Date.now() + 86400000 * 7 + 28800000).toISOString(),
  duration: 'PT7H30M',
  stops: 0,
  cabinClass: 'ECONOMY',
  price: { amount: 450, currency: 'USD' },
  availability: 8,
  isSoldOut: false,
  metadata: { gdsSupplierId: 'amadeus-001', lastUpdated: new Date().toISOString() },
}

const soldOutFlight: FlightOffer = {
  ...baseFlight,
  offerId: 'offer-002',
  airline: 'United Airlines',
  flightNumber: 'UA 908',
  availability: 0,
  isSoldOut: true,
}

const stopFlight: FlightOffer = {
  ...baseFlight,
  offerId: 'offer-003',
  stops: 2,
  stopDetails: [{ airport: 'BOS', duration: 'PT1H' }, { airport: 'IAD', duration: 'PT45M' }],
}

// ─── Loading state ────────────────────────────────────────────────────────────
describe('SearchResults — loading', () => {
  it('shows loading message when isLoading=true', () => {
    render(<SearchResults results={[]} onSelectFlight={vi.fn()} isLoading />)
    expect(screen.getByText(/searching for flights/i)).toBeInTheDocument()
  })
  it('does not show results while loading', () => {
    render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} isLoading />)
    expect(screen.queryByText('British Airways')).not.toBeInTheDocument()
  })
})

// ─── Empty state ──────────────────────────────────────────────────────────────
describe('SearchResults — empty', () => {
  it('shows no-flights message when results is empty array', () => {
    render(<SearchResults results={[]} onSelectFlight={vi.fn()} />)
    expect(screen.getByText(/no flights found/i)).toBeInTheDocument()
  })
})

// ─── Flight card rendering ────────────────────────────────────────────────────
describe('SearchResults — flight card', () => {
  it('renders the airline name', () => {
    render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    expect(screen.getByText('British Airways')).toBeInTheDocument()
  })

  it('renders the flight number', () => {
    render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    expect(screen.getByText(/BA 112/)).toBeInTheDocument()
  })

  it('renders origin airport code', () => {
    render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    expect(screen.getByText('LHR')).toBeInTheDocument()
  })

  it('renders destination airport code', () => {
    render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    expect(screen.getByText('JFK')).toBeInTheDocument()
  })

  it('renders cabin class badge', () => {
    render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    expect(screen.getByText('ECONOMY')).toBeInTheDocument()
  })

  it('renders number of results in heading', () => {
    render(<SearchResults results={[baseFlight, soldOutFlight]} onSelectFlight={vi.fn()} />)
    expect(screen.getByText(/2 Flights Found/i)).toBeInTheDocument()
  })

  it('renders singular "Flight Found" for 1 result', () => {
    render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    expect(screen.getByText(/1 Flight Found/i)).toBeInTheDocument()
  })

  it('renders stop count for multi-stop flight', () => {
    render(<SearchResults results={[stopFlight]} onSelectFlight={vi.fn()} />)
    expect(screen.getByText(/2 stops/i)).toBeInTheDocument()
  })
})

// ─── Availability ─────────────────────────────────────────────────────────────
describe('SearchResults — availability', () => {
  it('shows "Available" badge for available flight', () => {
    render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    expect(screen.getByText(/Available/)).toBeInTheDocument()
  })

  it('shows seat count for available flight', () => {
    render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    expect(screen.getByText(/8 seats/i)).toBeInTheDocument()
  })

  it('shows "Sold Out" badge for sold-out flight', () => {
    render(<SearchResults results={[soldOutFlight]} onSelectFlight={vi.fn()} />)
    expect(screen.getByText(/Sold Out/i)).toBeInTheDocument()
  })

  it('Select button is disabled for sold-out flight', () => {
    render(<SearchResults results={[soldOutFlight]} onSelectFlight={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /select/i })
    expect(btn).toBeDisabled()
  })

  it('Select button is enabled for available flight', () => {
    render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    const btn = screen.getByRole('button', { name: /select/i })
    expect(btn).toBeEnabled()
  })
})

// ─── onSelectFlight callback ──────────────────────────────────────────────────
describe('SearchResults — Select action', () => {
  it('calls onSelectFlight with the correct flight when Select is clicked', () => {
    const onSelect = vi.fn()
    render(<SearchResults results={[baseFlight]} onSelectFlight={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: /select/i }))
    expect(onSelect).toHaveBeenCalledOnce()
    expect(onSelect).toHaveBeenCalledWith(baseFlight)
  })

  it('does not call onSelectFlight when sold-out Select is clicked', () => {
    const onSelect = vi.fn()
    render(<SearchResults results={[soldOutFlight]} onSelectFlight={onSelect} />)
    const btn = screen.getByRole('button', { name: /select/i })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('calls correct flight when multiple results present', () => {
    const onSelect = vi.fn()
    render(<SearchResults results={[baseFlight, soldOutFlight]} onSelectFlight={onSelect} />)
    const buttons = screen.getAllByRole('button', { name: /select/i })
    // First button corresponds to baseFlight (enabled), second to soldOutFlight (disabled)
    fireEvent.click(buttons[0])
    expect(onSelect).toHaveBeenCalledWith(baseFlight)
  })
})
