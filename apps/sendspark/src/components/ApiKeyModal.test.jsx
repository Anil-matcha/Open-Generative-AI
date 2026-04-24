import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ApiKeyModal from '../components/ApiKeyModal.jsx'

describe('ApiKeyModal', () => {
  let mockOnSubmit
  let mockOnClose

  beforeEach(() => {
    cleanup()
    mockOnSubmit = vi.fn()
    mockOnClose = vi.fn()
  })

  it('renders modal with form elements', () => {
    render(<ApiKeyModal onSubmit={mockOnSubmit} onClose={mockOnClose} />)

    expect(screen.getByText('MuAPI Key Required')).toBeInTheDocument()
    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save key/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('calls onSubmit with API key when form is submitted', () => {
    render(<ApiKeyModal onSubmit={mockOnSubmit} onClose={mockOnClose} />)

    const input = screen.getByLabelText(/api key/i)
    const submitButton = screen.getByRole('button', { name: /save key/i })

    fireEvent.change(input, { target: { value: 'test-api-key-123' } })
    fireEvent.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith('test-api-key-123')
  })

  it('calls onClose when cancel button is clicked', () => {
    render(<ApiKeyModal onSubmit={mockOnSubmit} onClose={mockOnClose} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('prevents form submission with empty API key', () => {
    render(<ApiKeyModal onSubmit={mockOnSubmit} onClose={mockOnClose} />)

    // Ensure the input is empty
    const input = screen.getByLabelText(/api key/i)
    expect(input.value).toBe('')

    const submitButton = screen.getByRole('button', { name: /save key/i })
    fireEvent.click(submitButton)

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })
})