/**
 * Tests: components/search/SearchResults.tsx
 * Covers: loading state, empty state, flight card rendering,
 *         available/sold-out display, Select button, onSelectFlight callback,
 *         tabbed sorting (By Price, By Departure, By Duration, By Airline)
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

// Additional flights for sorting tests
const cheapFlight: FlightOffer = {
  ...baseFlight,
  offerId: 'offer-cheap',
  airline: 'Ryanair',
  price: { amount: 200, currency: 'USD' },
  departureTime: new Date(Date.now() + 86400000 * 7 + 3600000).toISOString(),
}

const earlyFlight: FlightOffer = {
  ...baseFlight,
  offerId: 'offer-early',
  airline: 'Delta',
  price: { amount: 500, currency: 'USD' },
  departureTime: new Date(Date.now() + 86400000 * 7 - 7200000).toISOString(),
}

const shortFlight: FlightOffer = {
  ...baseFlight,
  offerId: 'offer-short',
  airline: 'American Airlines',
  price: { amount: 480, currency: 'USD' },
  duration: 'PT6H00M',
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

// ─── Tabbed Sorting — AC-EXP-01-01 ────────────────────────────────────────────
describe('SearchResults — Tabbed Comparison View', () => {
  it('renders all four sort tabs', () => {
    render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    expect(screen.getByTestId('tab-price')).toBeInTheDocument()
    expect(screen.getByTestId('tab-departure')).toBeInTheDocument()
    expect(screen.getByTestId('tab-duration')).toBeInTheDocument()
    expect(screen.getByTestId('tab-airline')).toBeInTheDocument()
  })

  it('has "By Price" tab active by default', () => {
    render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    const priceTab = screen.getByTestId('tab-price')
    expect(priceTab).toHaveClass('active')
    expect(priceTab).toHaveAttribute('aria-selected', 'true')
  })

  it('switches to "By Departure" tab when clicked', () => {
    render(<SearchResults results={[baseFlight, earlyFlight]} onSelectFlight={vi.fn()} />)
    const depTab = screen.getByTestId('tab-departure')
    fireEvent.click(depTab)
    expect(depTab).toHaveClass('active')
    expect(depTab).toHaveAttribute('aria-selected', 'true')
  })

  it('switches to "By Duration" tab when clicked', () => {
    render(<SearchResults results={[baseFlight, shortFlight]} onSelectFlight={vi.fn()} />)
    const durTab = screen.getByTestId('tab-duration')
    fireEvent.click(durTab)
    expect(durTab).toHaveClass('active')
    expect(durTab).toHaveAttribute('aria-selected', 'true')
  })

  it('switches to "By Airline" tab when clicked', () => {
    render(<SearchResults results={[baseFlight, cheapFlight]} onSelectFlight={vi.fn()} />)
    const airlineTab = screen.getByTestId('tab-airline')
    fireEvent.click(airlineTab)
    expect(airlineTab).toHaveClass('active')
    expect(airlineTab).toHaveAttribute('aria-selected', 'true')
  })

  it('sorts by price ascending (By Price tab)', () => {
    render(
      <SearchResults
        results={[baseFlight, cheapFlight, earlyFlight]}
        onSelectFlight={vi.fn()}
      />
    )
    // Default tab is "By Price", cheapest should appear first
    const airlineElements = screen.getAllByText(/British Airways|Ryanair|Delta/)
    // Ryanair (cheapFlight: $200) should appear before others
    expect(airlineElements[0].textContent).toContain('Ryanair')
  })

  it('sorts by departure time ascending (By Departure tab)', () => {
    render(
      <SearchResults
        results={[baseFlight, earlyFlight]}
        onSelectFlight={vi.fn()}
      />
    )
    const depTab = screen.getByTestId('tab-departure')
    fireEvent.click(depTab)
    // earlyFlight departs before baseFlight, so should appear first
    const airlineElements = screen.getAllByText(/British Airways|Delta/)
    expect(airlineElements[0].textContent).toContain('Delta')
  })

  it('sorts by duration ascending (By Duration tab)', () => {
    render(
      <SearchResults
        results={[baseFlight, shortFlight]}
        onSelectFlight={vi.fn()}
      />
    )
    const durTab = screen.getByTestId('tab-duration')
    fireEvent.click(durTab)
    // shortFlight (6h) is shorter than baseFlight (7.5h), so should appear first
    const airlineElements = screen.getAllByText(/British Airways|American Airlines/)
    expect(airlineElements[0].textContent).toContain('American Airlines')
  })

  it('sorts alphabetically by airline (By Airline tab)', () => {
    render(
      <SearchResults
        results={[baseFlight, cheapFlight, earlyFlight]}
        onSelectFlight={vi.fn()}
      />
    )
    const airlineTab = screen.getByTestId('tab-airline')
    fireEvent.click(airlineTab)
    // Should sort: British Airways < Delta < Ryanair
    const airlineElements = screen.getAllByText(/British Airways|Ryanair|Delta/)
    expect(airlineElements[0].textContent).toContain('British Airways')
    expect(airlineElements[1].textContent).toContain('Delta')
    expect(airlineElements[2].textContent).toContain('Ryanair')
  })

  it('has ARIA role="tablist" on tab container', () => {
    const { container } = render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    const tablist = container.querySelector('[role="tablist"]')
    expect(tablist).toBeInTheDocument()
    expect(tablist).toHaveAttribute('aria-label', 'Sort flight results')
  })

  it('has ARIA role="tabpanel" on results list', () => {
    const { container } = render(<SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />)
    const tabpanel = container.querySelector('[role="tabpanel"]')
    expect(tabpanel).toBeInTheDocument()
    expect(tabpanel).toHaveAttribute('id', 'search-results-list')
  })

  it('preserves tab selection when results change', () => {
    const { rerender } = render(
      <SearchResults results={[baseFlight]} onSelectFlight={vi.fn()} />
    )
    fireEvent.click(screen.getByTestId('tab-airline'))
    expect(screen.getByTestId('tab-airline')).toHaveClass('active')

    rerender(
      <SearchResults results={[baseFlight, cheapFlight]} onSelectFlight={vi.fn()} />
    )
    expect(screen.getByTestId('tab-airline')).toHaveClass('active')
  })
})
