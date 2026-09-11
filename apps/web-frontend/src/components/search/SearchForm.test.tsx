/**
 * Tests: components/search/SearchForm.tsx
 * Covers: field rendering, passenger +/- controls, cabin class options,
 *         clear form, validation errors, onSearch callback with correct payload
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchForm } from './SearchForm'

// Helper — fill a valid form and optionally submit
async function fillValidForm(overrides: Record<string, string> = {}) {
  const user = userEvent.setup()

  const futureDate = new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0]
  const returnDate = new Date(Date.now() + 86400000 * 17).toISOString().split('T')[0]

  const values = {
    origin: 'LHR',
    destination: 'JFK',
    departure: futureDate,
    return: returnDate,
    ...overrides,
  }

  const originInput = screen.getByLabelText(/origin/i)
  const destInput = screen.getByLabelText(/destination/i)
  const depInput = screen.getByLabelText(/departure/i)
  const retInput = screen.getByLabelText(/return/i)

  await user.clear(originInput)
  await user.type(originInput, values.origin)
  await user.clear(destInput)
  await user.type(destInput, values.destination)
  fireEvent.change(depInput, { target: { value: values.departure } })
  fireEvent.change(retInput, { target: { value: values.return } })
}

// ─── Rendering ────────────────────────────────────────────────────────────────
describe('SearchForm — rendering', () => {
  it('renders the Search Flights heading', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Search Flights' })).toBeInTheDocument()
  })

  it('renders Origin input', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    expect(screen.getByLabelText(/origin/i)).toBeInTheDocument()
  })

  it('renders Destination input', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    expect(screen.getByLabelText(/destination/i)).toBeInTheDocument()
  })

  it('renders Departure date input', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    expect(screen.getByLabelText(/departure/i)).toBeInTheDocument()
  })

  it('renders Return date input', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    expect(screen.getByLabelText(/return/i)).toBeInTheDocument()
  })

  it('renders Cabin Class dropdown', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    expect(screen.getByLabelText(/cabin class/i)).toBeInTheDocument()
  })

  it('renders all four cabin class options', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    const select = screen.getByLabelText(/cabin class/i) as HTMLSelectElement
    const options = Array.from(select.options).map((o) => o.value)
    expect(options).toContain('ECONOMY')
    expect(options).toContain('BUSINESS')
    expect(options).toContain('FIRST')
    expect(options).toContain('PREMIUM_ECONOMY')
  })

  it('renders Passengers label', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    expect(screen.getByText('Passengers')).toBeInTheDocument()
  })

  it('renders Search Flights submit button', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    expect(screen.getByRole('button', { name: /search flights/i })).toBeInTheDocument()
  })

  it('renders Clear Form button', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    expect(screen.getByRole('button', { name: /clear form/i })).toBeInTheDocument()
  })

  it('defaults passenger count to 1', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})

// ─── Passenger controls ───────────────────────────────────────────────────────
describe('SearchForm — passenger +/- controls', () => {
  it('increments passenger count on + click', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    fireEvent.click(screen.getByLabelText(/add passenger/i))
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('decrements passenger count on - click', async () => {
    render(<SearchForm onSearch={vi.fn()} />)
    // Go up to 2 then back to 1
    fireEvent.click(screen.getByLabelText(/add passenger/i))
    fireEvent.click(screen.getByLabelText(/remove passenger/i))
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('- button is disabled at 1 passenger', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    expect(screen.getByLabelText(/remove passenger/i)).toBeDisabled()
  })

  it('+ button is disabled at 9 passengers', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    const addBtn = screen.getByLabelText(/add passenger/i)
    for (let i = 0; i < 8; i++) fireEvent.click(addBtn)
    expect(addBtn).toBeDisabled()
  })

  it('cannot exceed 9 passengers', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    const addBtn = screen.getByLabelText(/add passenger/i)
    for (let i = 0; i < 15; i++) fireEvent.click(addBtn)
    expect(screen.getByText('9')).toBeInTheDocument()
  })
})

// ─── Clear Form ───────────────────────────────────────────────────────────────
describe('SearchForm — Clear Form', () => {
  it('clears origin input on Clear Form click', async () => {
    const user = userEvent.setup()
    render(<SearchForm onSearch={vi.fn()} />)
    await user.type(screen.getByLabelText(/origin/i), 'LHR')
    fireEvent.click(screen.getByRole('button', { name: /clear form/i }))
    expect((screen.getByLabelText(/origin/i) as HTMLInputElement).value).toBe('')
  })

  it('resets passenger count to 1 on Clear Form click', () => {
    render(<SearchForm onSearch={vi.fn()} />)
    fireEvent.click(screen.getByLabelText(/add passenger/i))
    fireEvent.click(screen.getByLabelText(/add passenger/i))
    fireEvent.click(screen.getByRole('button', { name: /clear form/i }))
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('resets cabin class to ECONOMY on Clear Form click', async () => {
    const user = userEvent.setup()
    render(<SearchForm onSearch={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText(/cabin class/i), 'BUSINESS')
    fireEvent.click(screen.getByRole('button', { name: /clear form/i }))
    expect((screen.getByLabelText(/cabin class/i) as HTMLSelectElement).value).toBe('ECONOMY')
  })
})

// ─── Validation errors ────────────────────────────────────────────────────────
describe('SearchForm — validation', () => {
  it('shows origin required error on empty submit', async () => {
    render(<SearchForm onSearch={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /search flights/i }))
    await waitFor(() => {
      expect(screen.getByText(/origin airport is required/i)).toBeInTheDocument()
    })
  })

  it('shows destination required error on empty submit', async () => {
    render(<SearchForm onSearch={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /search flights/i }))
    await waitFor(() => {
      expect(screen.getByText(/destination airport is required/i)).toBeInTheDocument()
    })
  })

  it('does not call onSearch when form is invalid', async () => {
    const onSearch = vi.fn()
    render(<SearchForm onSearch={onSearch} />)
    fireEvent.click(screen.getByRole('button', { name: /search flights/i }))
    await waitFor(() => {
      expect(onSearch).not.toHaveBeenCalled()
    })
  })

  it('shows IATA error for non-letter origin', async () => {
    const user = userEvent.setup()
    render(<SearchForm onSearch={vi.fn()} />)
    await user.type(screen.getByLabelText(/origin/i), '123')
    fireEvent.click(screen.getByRole('button', { name: /search flights/i }))
    await waitFor(() => {
      expect(screen.getByText(/valid origin airport/i)).toBeInTheDocument()
    })
  })
})

// ─── onSearch callback ────────────────────────────────────────────────────────
describe('SearchForm — onSearch callback', () => {
  it('calls onSearch with uppercased origin and destination', async () => {
    const onSearch = vi.fn()
    render(<SearchForm onSearch={onSearch} />)
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /search flights/i }))
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledOnce()
    })
    const req = onSearch.mock.calls[0][0]
    expect(req.origin).toBe('LHR')
    expect(req.destination).toBe('JFK')
  })

  it('calls onSearch with the selected cabin class', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchForm onSearch={onSearch} />)
    await fillValidForm()
    await user.selectOptions(screen.getByLabelText(/cabin class/i), 'BUSINESS')
    fireEvent.click(screen.getByRole('button', { name: /search flights/i }))
    await waitFor(() => expect(onSearch).toHaveBeenCalledOnce())
    expect(onSearch.mock.calls[0][0].cabinClass).toBe('BUSINESS')
  })

  it('calls onSearch with correct passenger count', async () => {
    const onSearch = vi.fn()
    render(<SearchForm onSearch={onSearch} />)
    await fillValidForm()
    fireEvent.click(screen.getByLabelText(/add passenger/i))
    fireEvent.click(screen.getByLabelText(/add passenger/i))
    fireEvent.click(screen.getByRole('button', { name: /search flights/i }))
    await waitFor(() => expect(onSearch).toHaveBeenCalledOnce())
    expect(onSearch.mock.calls[0][0].passengers).toBe(3)
  })

  it('calls onSearch with departureDate', async () => {
    const onSearch = vi.fn()
    render(<SearchForm onSearch={onSearch} />)
    await fillValidForm()
    fireEvent.click(screen.getByRole('button', { name: /search flights/i }))
    await waitFor(() => expect(onSearch).toHaveBeenCalledOnce())
    expect(onSearch.mock.calls[0][0].departureDate).toBeTruthy()
  })

  it('shows loading state when isLoading=true', () => {
    render(<SearchForm onSearch={vi.fn()} isLoading />)
    // Button renders a spinner + sr-only "Loading..." text; submit button must be disabled
    const submitBtn = screen.getByRole('button', { name: /loading/i })
    expect(submitBtn).toBeDisabled()
  })
})
