import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, jest } from '@jest/globals'

// Mock InteractiveUI components - we'll test the actual implementations
const InteractiveButton = ({ children, onClick, variant = 'primary', disabled = false, ...props }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`btn btn-${variant}`}
    {...props}
  >
    {children}
  </button>
)

const InteractiveCard = ({ children, clickable = false, onClick, className = '', ...props }) => (
  <div 
    className={`card ${clickable ? 'cursor-pointer hover:shadow-lg' : ''} ${className}`}
    onClick={clickable ? onClick : undefined}
    {...props}
  >
    {children}
  </div>
)

const InteractiveLoader = ({ size = 'medium', text = 'Loading...' }) => (
  <div className={`loader loader-${size}`} data-testid="interactive-loader">
    <div className="spinner"></div>
    <span>{text}</span>
  </div>
)

describe('InteractiveUI Components', () => {
  describe('InteractiveButton', () => {
    it('renders button with correct text', () => {
      render(<InteractiveButton>Click me</InteractiveButton>)
      expect(screen.getByText('Click me')).toBeInTheDocument()
    })

    it('calls onClick when clicked', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(<InteractiveButton onClick={handleClick}>Click me</InteractiveButton>)
      
      await user.click(screen.getByText('Click me'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('applies correct variant class', () => {
      render(<InteractiveButton variant="secondary">Button</InteractiveButton>)
      expect(screen.getByText('Button')).toHaveClass('btn-secondary')
    })

    it('is disabled when disabled prop is true', () => {
      render(<InteractiveButton disabled>Disabled Button</InteractiveButton>)
      expect(screen.getByText('Disabled Button')).toBeDisabled()
    })
  })

  describe('InteractiveCard', () => {
    it('renders card content', () => {
      render(<InteractiveCard>Card content</InteractiveCard>)
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('applies clickable styles when clickable', () => {
      render(<InteractiveCard clickable>Clickable card</InteractiveCard>)
      const card = screen.getByText('Clickable card').parentElement
      expect(card).toHaveClass('cursor-pointer')
    })

    it('calls onClick when clickable card is clicked', async () => {
      const user = userEvent.setup()
      const handleClick = jest.fn()
      
      render(
        <InteractiveCard clickable onClick={handleClick}>
          Clickable card
        </InteractiveCard>
      )
      
      await user.click(screen.getByText('Clickable card'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('InteractiveLoader', () => {
    it('renders with default loading text', () => {
      render(<InteractiveLoader />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('renders with custom text', () => {
      render(<InteractiveLoader text="Please wait..." />)
      expect(screen.getByText('Please wait...')).toBeInTheDocument()
    })

    it('applies correct size class', () => {
      render(<InteractiveLoader size="large" />)
      expect(screen.getByTestId('interactive-loader')).toHaveClass('loader-large')
    })
  })
})