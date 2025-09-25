/**
 * Translation Error Handler Utility
 * Provides comprehensive error handling for translation system failures
 */

class TranslationErrorHandler {
  constructor() {
    this.errorQueue = []
    this.maxQueueSize = 100
    this.retryAttempts = new Map()
    this.maxRetries = 3
    this.retryDelay = 1000 // Base delay in milliseconds
  }

  /**
   * Handle translation loading errors with retry mechanism
   * @param {Error} error - The original error
   * @param {string} pageName - Name of the page
   * @param {string} locale - Locale that failed
   * @param {Function} retryFunction - Function to retry loading
   * @returns {Promise<Object>} Fallback translations or retry result
   */
  async handleLoadingError(error, pageName, locale, retryFunction) {
    const errorKey = `${pageName}-${locale}`
    const currentAttempts = this.retryAttempts.get(errorKey) || 0

    // Log the error
    this.logError('LOADING_FAILED', {
      pageName,
      locale,
      error: error.message,
      attempt: currentAttempts + 1
    })

    // If we haven't exceeded max retries, try again
    if (currentAttempts < this.maxRetries) {
      this.retryAttempts.set(errorKey, currentAttempts + 1)
      
      // Exponential backoff
      const delay = this.retryDelay * Math.pow(2, currentAttempts)
      
      console.warn(`Retrying translation load for ${pageName} (${locale}) in ${delay}ms (attempt ${currentAttempts + 1}/${this.maxRetries})`)
      
      await this.delay(delay)
      
      try {
        const result = await retryFunction()
        // Reset retry count on success
        this.retryAttempts.delete(errorKey)
        return result
      } catch (retryError) {
        return this.handleLoadingError(retryError, pageName, locale, retryFunction)
      }
    }

    // All retries failed, return fallback
    console.error(`All retry attempts failed for ${pageName} (${locale}). Using fallback translations.`)
    this.retryAttempts.delete(errorKey)
    return this.createFallbackTranslations(pageName, locale, error)
  }

  /**
   * Handle translation validation errors
   * @param {Object} validationResult - Validation result from i18nService
   * @param {string} pageName - Name of the page
   * @param {string} locale - Locale being validated
   * @returns {Object} Processed validation result with user-friendly messages
   */
  handleValidationError(validationResult, pageName, locale) {
    const processedResult = {
      ...validationResult,
      userFriendlyMessages: [],
      severity: 'warning'
    }

    // Convert technical errors to user-friendly messages
    if (validationResult.errors.length > 0) {
      processedResult.severity = 'error'
      processedResult.userFriendlyMessages.push(
        `Translation data for ${pageName} contains errors. Some text may not display correctly.`
      )
    }

    if (validationResult.missingKeys.length > 0) {
      processedResult.userFriendlyMessages.push(
        `Some translations are missing for ${pageName}. Default text will be shown where needed.`
      )
    }

    if (validationResult.emptyValues.length > 0) {
      processedResult.userFriendlyMessages.push(
        `Some translation values are empty for ${pageName}. Fallback text will be used.`
      )
    }

    // Log validation issues
    this.logError('VALIDATION_FAILED', {
      pageName,
      locale,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length,
      missingKeyCount: validationResult.missingKeys.length
    })

    return processedResult
  }

  /**
   * Handle network-related translation errors
   * @param {Error} error - Network error
   * @param {string} context - Context where error occurred
   * @returns {Object} Error handling result
   */
  handleNetworkError(error, context) {
    const isOffline = !navigator.onLine
    const isTimeout = error.name === 'TimeoutError' || error.message.includes('timeout')
    const isNetworkError = error.name === 'NetworkError' || !error.status

    let errorType = 'NETWORK_ERROR'
    let userMessage = 'Network error while loading translations. Please check your connection and try again.'

    if (isOffline) {
      errorType = 'OFFLINE_ERROR'
      userMessage = 'You appear to be offline. Translations will be loaded when connection is restored.'
    } else if (isTimeout) {
      errorType = 'TIMEOUT_ERROR'
      userMessage = 'Translation loading timed out. Please try again.'
    } else if (isNetworkError) {
      errorType = 'CONNECTION_ERROR'
      userMessage = 'Unable to connect to translation service. Please try again later.'
    }

    this.logError(errorType, {
      context,
      error: error.message,
      isOffline,
      isTimeout,
      status: error.status
    })

    return {
      type: errorType,
      message: userMessage,
      canRetry: !isOffline,
      shouldShowToUser: true
    }
  }

  /**
   * Create fallback translations when all else fails
   * @param {string} pageName - Name of the page
   * @param {string} locale - Locale that failed
   * @param {Error} originalError - Original error that caused the fallback
   * @returns {Object} Fallback translation object
   */
  createFallbackTranslations(pageName, locale, originalError) {
    const fallbackTranslations = {
      meta: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString().split('T')[0],
        page: pageName,
        fallback: true,
        originalError: originalError.message
      },
      title: this.generatePageTitle(pageName),
      loading: 'Loading...',
      error: 'Error loading content',
      retry: 'Retry',
      common: {
        loading: 'Loading...',
        error: 'Error',
        retry: 'Retry',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        view: 'View',
        back: 'Back',
        next: 'Next',
        previous: 'Previous'
      }
    }

    // Add page-specific fallbacks
    const pageSpecificFallbacks = this.getPageSpecificFallbacks(pageName)
    Object.assign(fallbackTranslations, pageSpecificFallbacks)

    this.logError('FALLBACK_USED', {
      pageName,
      locale,
      originalError: originalError.message
    })

    return fallbackTranslations
  }

  /**
   * Get page-specific fallback translations
   * @param {string} pageName - Name of the page
   * @returns {Object} Page-specific fallback translations
   */
  getPageSpecificFallbacks(pageName) {
    const fallbacks = {
      jobs: {
        subtitle: 'Manage job postings and applications',
        actions: { createJob: 'Create Job' },
        filters: { searchPlaceholder: 'Search jobs...' }
      },
      applications: {
        subtitle: 'Manage candidate applications',
        filters: { searchPlaceholder: 'Search applications...' }
      },
      interviews: {
        subtitle: 'Manage interview schedules',
        tabs: { scheduled: 'Scheduled', scheduleNew: 'Schedule New' }
      },
      drafts: {
        subtitle: 'Manage job drafts',
        actions: { createDraft: 'Create Draft' }
      },
      'audit-log': {
        subtitle: 'Track system activities',
        actions: { refresh: 'Refresh' }
      },
      'agency-settings': {
        subtitle: 'Manage agency settings',
        actions: { save: 'Save Changes' }
      }
    }

    return fallbacks[pageName] || {}
  }

  /**
   * Generate page title from page name
   * @param {string} pageName - Name of the page
   * @returns {string} Generated title
   */
  generatePageTitle(pageName) {
    const titleMap = {
      'jobs': 'Jobs',
      'applications': 'Applications',
      'interviews': 'Interviews',
      'drafts': 'Drafts',
      'audit-log': 'Audit Log',
      'agency-settings': 'Agency Settings'
    }

    return titleMap[pageName] || pageName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Log error to console and error queue
   * @param {string} errorType - Type of error
   * @param {Object} errorData - Error details
   */
  logError(errorType, errorData) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      type: errorType,
      data: errorData
    }

    // Add to error queue
    this.errorQueue.push(errorEntry)
    
    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }

    // Log to console
    console.error(`Translation Error [${errorType}]:`, errorData)

    // Store in session storage for debugging
    try {
      const existingErrors = JSON.parse(sessionStorage.getItem('translation_errors') || '[]')
      existingErrors.push(errorEntry)
      
      // Keep only last 50 errors
      if (existingErrors.length > 50) {
        existingErrors.splice(0, existingErrors.length - 50)
      }
      
      sessionStorage.setItem('translation_errors', JSON.stringify(existingErrors))
    } catch (e) {
      console.warn('Failed to store translation error in session storage:', e)
    }
  }

  /**
   * Get error statistics for monitoring
   * @returns {Object} Error statistics
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errorQueue.length,
      errorsByType: {},
      recentErrors: this.errorQueue.slice(-10),
      retryAttempts: this.retryAttempts.size
    }

    // Count errors by type
    this.errorQueue.forEach(error => {
      stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1
    })

    return stats
  }

  /**
   * Clear error queue and retry attempts
   */
  clearErrors() {
    this.errorQueue = []
    this.retryAttempts.clear()
    
    try {
      sessionStorage.removeItem('translation_errors')
    } catch (e) {
      console.warn('Failed to clear translation errors from session storage:', e)
    }
  }

  /**
   * Delay utility for retry mechanism
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise} Promise that resolves after delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Check if error is recoverable
   * @param {Error} error - Error to check
   * @returns {boolean} True if error is recoverable
   */
  isRecoverableError(error) {
    const recoverableErrors = [
      'NetworkError',
      'TimeoutError',
      'AbortError',
      'TypeError' // Often network-related
    ]

    return recoverableErrors.includes(error.name) || 
           error.message.includes('fetch') ||
           error.message.includes('network') ||
           error.message.includes('timeout')
  }

  /**
   * Create user notification for translation errors
   * @param {string} errorType - Type of error
   * @param {Object} context - Error context
   * @returns {Object} Notification object
   */
  createUserNotification(errorType, context) {
    const notifications = {
      'LOADING_FAILED': {
        type: 'warning',
        title: 'Translation Loading Issue',
        message: `Some text may appear in English while we load translations for ${context.pageName || 'this page'}.`,
        duration: 5000
      },
      'NETWORK_ERROR': {
        type: 'error',
        title: 'Connection Issue',
        message: 'Unable to load translations. Please check your internet connection.',
        duration: 8000,
        actions: [{ label: 'Retry', action: 'retry' }]
      },
      'VALIDATION_FAILED': {
        type: 'info',
        title: 'Translation Notice',
        message: 'Some translations may not display perfectly. We\'re working to fix this.',
        duration: 4000
      }
    }

    return notifications[errorType] || {
      type: 'warning',
      title: 'Translation Issue',
      message: 'Some content may not display correctly.',
      duration: 3000
    }
  }
}

// Create and export singleton instance
const translationErrorHandler = new TranslationErrorHandler()
export default translationErrorHandler