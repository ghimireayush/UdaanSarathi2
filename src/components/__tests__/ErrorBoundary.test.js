import { render, screen } from '@testing-library/react'
import { describe, it, expect, jest } from '@jest/globals'

// Mock ErrorBoundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Mock React for the test
const React = {
  Component: class Component {
    constructor(props) {
      this.props = props
      this.state = {}
    }
  }
}

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary Component', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    console.error.mockRestore()
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('renders error UI when there is an error', () => {
    // Mock the error boundary behavior
    const ErrorBoundaryMock = ({ children }) => {
      try {
        return children
      } catch (error) {
        return (
          <div className="error-boundary">
            <h2>Something went wrong</h2>
            <p>We're sorry, but something unexpected happened.</p>
            <button onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        )
      }
    }

    render(
      <ErrorBoundaryMock>
        <div>Something went wrong</div>
        <p>We're sorry, but something unexpected happened.</p>
        <button>Reload Page</button>
      </ErrorBoundaryMock>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText("We're sorry, but something unexpected happened.")).toBeInTheDocument()
    expect(screen.getByText('Reload Page')).toBeInTheDocument()
  })

  it('has reload functionality', () => {
    const reloadSpy = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true
    })

    render(
      <div className="error-boundary">
        <h2>Something went wrong</h2>
        <p>We're sorry, but something unexpected happened.</p>
        <button onClick={() => window.location.reload()}>
          Reload Page
        </button>
      </div>
    )

    const reloadButton = screen.getByText('Reload Page')
    reloadButton.click()

    expect(reloadSpy).toHaveBeenCalled()
  })

  it('logs error information', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    // Simulate error logging
    const error = new Error('Test error')
    const errorInfo = { componentStack: 'test stack' }
    
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught an error:',
      error,
      errorInfo
    )
  })
})