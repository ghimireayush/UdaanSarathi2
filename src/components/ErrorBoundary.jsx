// Error Boundary Component for Better Error Handling
import { Component } from 'react'
import ErrorPage from '../pages/ErrorPage.jsx'
import ErrorLoggingDataSource from '../api/datasources/ErrorLoggingDataSource.js'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Log error to console
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // Send error to logging server
    this.logErrorToServer(error, errorInfo)
  }

  logErrorToServer = async (error, errorInfo) => {
    try {
      const errorPayload = {
        error: error.name || 'Error',
        message: error.message || 'Unknown error',
        stack: error.stack || '',
        componentStack: errorInfo?.componentStack || '',
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }

      await ErrorLoggingDataSource.logError(errorPayload)
    } catch (logError) {
      // Silently fail if logging server is not available
      console.warn('Failed to send error to logging server:', logError)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <ErrorPage 
            title="Something went wrong"
            message="We're sorry, but something unexpected happened. Please contact the UdaanSarathi Tech team for assistance."
            onRetry={this.handleRetry}
          />
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="fixed bottom-4 right-4 max-w-md">
              <details className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
                <summary className="text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 font-medium">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-3 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary