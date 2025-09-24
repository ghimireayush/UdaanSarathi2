import React from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import logo from '../assets/logo.svg'

const ErrorPage = ({ 
  title = "Something went wrong",
  message = "We're sorry, but something unexpected happened. Please contact the UdaanSarathi Tech team for assistance.",
  showRetry = true,
  onRetry = null
}) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
          {/* UdaanSarathi Logo */}
          <div className="flex flex-col items-center mb-6">
            <img 
              src={logo} 
              alt="UdaanSarathi Logo" 
              className="w-24 h-24 object-contain mb-3 drop-shadow-lg"
            />
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
              UdaanSarathi
            </h2>
          </div>
          
          {/* Error Icon */}
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          
          {/* Error Title */}
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h1>
          
          {/* Error Message */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>
          
          {/* Contact Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
              Need help? Contact UdaanSarathi Tech Team
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              We're here to assist you with any technical issues
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {showRetry && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </button>
            )}
            
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage