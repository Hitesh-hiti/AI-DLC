/**
 * Tests: components/common/Alert.tsx
 * Covers: render variants, title/message, dismiss behaviour, accessibility role
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Alert } from './Alert'

describe('Alert', () => {
  // ── Rendering ─────────────────────────────────────────────────────────────
  it('renders a message', () => {
    render(<Alert message="Something went wrong" />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('renders with a title', () => {
    render(<Alert title="Error" message="Bad request" />)
    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('Bad request')).toBeInTheDocument()
  })

  it('has role="alert" for accessibility', () => {
    render(<Alert message="Accessible alert" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  // ── Variants ──────────────────────────────────────────────────────────────
  it.each(['info', 'success', 'warning', 'error'] as const)(
    'applies alert-%s CSS class for variant %s',
    (variant) => {
      render(<Alert variant={variant} message="msg" />)
      expect(screen.getByRole('alert')).toHaveClass(`alert-${variant}`)
    }
  )

  it('defaults to info variant when no variant prop given', () => {
    render(<Alert message="default" />)
    expect(screen.getByRole('alert')).toHaveClass('alert-info')
  })

  // ── Dismiss ───────────────────────────────────────────────────────────────
  it('shows dismiss button when dismissible=true', () => {
    render(<Alert message="close me" dismissible />)
    expect(screen.getByLabelText('Dismiss alert')).toBeInTheDocument()
  })

  it('does not show dismiss button by default', () => {
    render(<Alert message="no dismiss" />)
    expect(screen.queryByLabelText('Dismiss alert')).not.toBeInTheDocument()
  })

  it('hides alert when dismiss button is clicked', () => {
    render(<Alert message="visible" dismissible />)
    fireEvent.click(screen.getByLabelText('Dismiss alert'))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('calls onDismiss callback when dismissed', () => {
    const onDismiss = vi.fn()
    render(<Alert message="cb test" dismissible onDismiss={onDismiss} />)
    fireEvent.click(screen.getByLabelText('Dismiss alert'))
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  // ── JSX message ───────────────────────────────────────────────────────────
  it('renders JSX as message', () => {
    render(<Alert message={<span data-testid="jsx-msg">Custom JSX</span>} />)
    expect(screen.getByTestId('jsx-msg')).toBeInTheDocument()
  })
})
