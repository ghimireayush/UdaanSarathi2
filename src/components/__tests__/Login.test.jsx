import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../Login'

// Mock the AuthContext
const mockLogin = jest.fn()
const mockUseAuth = {
  login: mockLogin,
  isLoading: false
}

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth
}))

describe('Login Component', () => {
  const mockOnSuccess = jest.fn()

  beforeEach(() => {
    mockLogin.mockClear()
    mockOnSuccess.mockClear()
    mockUseAuth.isLoading = false
  })

  test('renders login form elements', () => {
    render(<Login onSuccess={mockOnSuccess} />)
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your username or email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  test('shows demo accounts section', () => {
    render(<Login onSuccess={mockOnSuccess} />)
    
    expect(screen.getByText('Demo Accounts')).toBeInTheDocument()
    expect(screen.getByText('Administrator')).toBeInTheDocument()
    expect(screen.getByText('Recruiter')).toBeInTheDocument()
    expect(screen.getByText('Coordinator')).toBeInTheDocument()
  })

  test('handles form input', async () => {
    const user = userEvent.setup()
    render(<Login onSuccess={mockOnSuccess} />)
    
    const usernameInput = screen.getByPlaceholderText('Enter your username or email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    
    await user.type(usernameInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    expect(usernameInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  test('shows error for empty fields', async () => {
    const user = userEvent.setup()
    render(<Login onSuccess={mockOnSuccess} />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    await user.click(submitButton)
    
    expect(screen.getByText('Please enter both username and password')).toBeInTheDocument()
  })

  test('calls login on form submit', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValue({ success: true })
    
    render(<Login onSuccess={mockOnSuccess} />)
    
    const usernameInput = screen.getByPlaceholderText('Enter your username or email')
    const passwordInput = screen.getByPlaceholderText('Enter your password')
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    
    await user.type(usernameInput, 'admin@udaan.com')
    await user.type(passwordInput, 'admin123')
    await user.click(submitButton)
    
    expect(mockLogin).toHaveBeenCalledWith('admin@udaan.com', 'admin123')
  })

  test('shows loading state', () => {
    mockUseAuth.isLoading = true
    
    render(<Login onSuccess={mockOnSuccess} />)
    
    expect(screen.getByText('Signing In...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
  })
})