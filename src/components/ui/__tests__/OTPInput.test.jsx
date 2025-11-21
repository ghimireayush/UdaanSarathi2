import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OTPInput from '../OTPInput'

describe('OTPInput Component', () => {
  const mockOnChange = jest.fn()
  const mockOnComplete = jest.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
    mockOnComplete.mockClear()
  })

  test('renders correct number of input fields', () => {
    render(<OTPInput length={6} onChange={mockOnChange} />)
    
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(6)
  })

  test('renders with custom length', () => {
    render(<OTPInput length={4} onChange={mockOnChange} />)
    
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(4)
  })

  test('handles single digit input', async () => {
    const user = userEvent.setup()
    render(<OTPInput length={4} onChange={mockOnChange} />)
    
    const inputs = screen.getAllByRole('textbox')
    await user.type(inputs[0], '1')
    
    expect(mockOnChange).toHaveBeenCalled()
  })

  test('displays error state correctly', () => {
    render(<OTPInput length={4} onChange={mockOnChange} error={true} />)
    
    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      expect(input.className).toContain('border-red')
    })
  })

  test('displays disabled state correctly', () => {
    render(<OTPInput length={4} onChange={mockOnChange} disabled={true} />)
    
    const inputs = screen.getAllByRole('textbox')
    inputs.forEach(input => {
      expect(input).toBeDisabled()
    })
  })

  test('displays value prop correctly', () => {
    render(<OTPInput length={4} onChange={mockOnChange} value="12" />)
    
    const inputs = screen.getAllByRole('textbox')
    expect(inputs[0]).toHaveValue('1')
    expect(inputs[1]).toHaveValue('2')
    expect(inputs[2]).toHaveValue('')
    expect(inputs[3]).toHaveValue('')
  })

  test('calls onComplete when all fields are filled', async () => {
    const user = userEvent.setup()
    render(<OTPInput length={2} onChange={mockOnChange} onComplete={mockOnComplete} />)
    
    const inputs = screen.getAllByRole('textbox')
    
    await user.type(inputs[0], '1')
    await user.type(inputs[1], '2')
    
    // onComplete should be called when all fields are filled
    expect(mockOnComplete).toHaveBeenCalled()
  })
})