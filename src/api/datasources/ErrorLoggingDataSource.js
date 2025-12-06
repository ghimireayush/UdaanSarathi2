import httpClient from '../config/httpClient.js'

/**
 * Error Logging Data Source
 * Handles all API calls related to error logging and monitoring
 */
class ErrorLoggingDataSource {
  /**
   * Log error to remote server
   * @param {Object} errorData - Error information
   * @param {string} errorData.error - Error name
   * @param {string} errorData.message - Error message
   * @param {string} errorData.stack - Error stack trace
   * @param {string} errorData.componentStack - Component stack trace
   * @param {string} errorData.url - URL where error occurred
   * @param {string} errorData.userAgent - User agent string
   * @param {string} errorData.timestamp - Error timestamp
   * @returns {Promise<Object>} Logging response
   */
  async logError(errorData) {
    // Use a different base URL for error logging service
    const errorLoggingUrl = process.env.VITE_ERROR_LOGGING_URL || 'http://localhost:3001'
    
    return fetch(`${errorLoggingUrl}/log-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(errorData)
    }).then(res => res.json())
  }
}

export default new ErrorLoggingDataSource()
