/**
 * AuthErrorHandler Utility
 * Handles authentication errors consistently across the application
 */

import tokenManager from '../services/tokenManager';

// Error types enum
export const AuthErrorType = {
  TOKEN_MISSING: 'TOKEN_MISSING',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  REFRESH_FAILED: 'REFRESH_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED'
};

// Portal to login path mapping
export const PORTAL_LOGIN_PATHS = {
  admin: '/login',
  owner: '/owner/login',
  member: '/member/login',
  default: '/member/login'
};

// Debounce window for error notifications (5 seconds)
const ERROR_NOTIFICATION_DEBOUNCE_MS = 5000;

/**
 * Custom AuthError class
 */
export class AuthError extends Error {
  constructor(message, type, statusCode = null, context = {}) {
    super(message);
    this.name = 'AuthError';
    this.type = type;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = Date.now();
  }
}

/**
 * AuthErrorHandler class
 */
class AuthErrorHandler {
  constructor() {
    this.lastNotificationTime = 0;
    this.notificationCallbacks = [];
  }

  /**
   * Register a callback for error notifications
   * @param {Function} callback - Function to call when showing notifications
   */
  registerNotificationCallback(callback) {
    if (typeof callback === 'function') {
      this.notificationCallbacks.push(callback);
    }
  }

  /**
   * Clear all notification callbacks
   */
  clearNotificationCallbacks() {
    this.notificationCallbacks = [];
  }

  /**
   * Check if an error is an authentication error
   * @param {Error} error - The error to check
   * @returns {boolean} True if error is an AuthError
   */
  isAuthError(error) {
    if (!error) return false;
    
    // Check if it's an instance of AuthError
    if (error instanceof AuthError) {
      return true;
    }
    
    // Check if it has auth error properties
    if (error.type && Object.values(AuthErrorType).includes(error.type)) {
      return true;
    }
    
    // Check for 401 status code
    if (error.statusCode === 401 || error.status === 401) {
      return true;
    }
    
    // Check response status
    if (error.response && error.response.status === 401) {
      return true;
    }
    
    return false;
  }

  /**
   * Check if an error is a network error
   * @param {Error} error - The error to check
   * @returns {boolean} True if error is a network error
   */
  isNetworkError(error) {
    if (!error) return false;
    
    // Check if it's explicitly marked as network error
    if (error.type === AuthErrorType.NETWORK_ERROR) {
      return true;
    }
    
    // Check for network error indicators
    if (error.message) {
      const networkErrorPatterns = [
        /network/i,
        /fetch/i,
        /connection/i,
        /timeout/i,
        /ECONNREFUSED/i,
        /ETIMEDOUT/i,
        /Failed to fetch/i
      ];
      
      return networkErrorPatterns.some(pattern => pattern.test(error.message));
    }
    
    // Check for network error codes
    if (error.code) {
      const networkErrorCodes = [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ENOTFOUND',
        'ENETUNREACH',
        'ERR_NETWORK',
        'ERR_CONNECTION_REFUSED'
      ];
      
      return networkErrorCodes.includes(error.code);
    }
    
    return false;
  }

  /**
   * Get the redirect path based on portal
   * @param {string} portal - Portal identifier (optional, will use stored portal if not provided)
   * @returns {string} The login path for the portal
   */
  getRedirectPath(portal = null) {
    const targetPortal = portal || tokenManager.getLoginPortal();
    return PORTAL_LOGIN_PATHS[targetPortal] || PORTAL_LOGIN_PATHS.default;
  }

  /**
   * Get user-friendly error message with troubleshooting steps
   * @param {AuthError} error - The authentication error
   * @returns {Object} Object with message and troubleshooting steps
   */
  getErrorMessage(error) {
    const messages = {
      [AuthErrorType.TOKEN_MISSING]: {
        message: 'Your session has expired or is missing.',
        troubleshooting: [
          'Please log in again to continue.',
          'If this problem persists, try clearing your browser cache.'
        ]
      },
      [AuthErrorType.TOKEN_EXPIRED]: {
        message: 'Your session has expired.',
        troubleshooting: [
          'Please log in again to continue.',
          'Your work has been saved and you can resume after logging in.'
        ]
      },
      [AuthErrorType.TOKEN_INVALID]: {
        message: 'Your session is invalid.',
        troubleshooting: [
          'Please log in again to continue.',
          'If this problem persists, contact support.'
        ]
      },
      [AuthErrorType.REFRESH_FAILED]: {
        message: 'Unable to refresh your session.',
        troubleshooting: [
          'Please log in again to continue.',
          'Check your internet connection and try again.'
        ]
      },
      [AuthErrorType.NETWORK_ERROR]: {
        message: 'Network connection error.',
        troubleshooting: [
          'Check your internet connection.',
          'The system will automatically retry.',
          'If the problem persists, try refreshing the page.'
        ]
      },
      [AuthErrorType.UNAUTHORIZED]: {
        message: 'You are not authorized to access this resource.',
        troubleshooting: [
          'Please log in again to continue.',
          'If you believe you should have access, contact your administrator.'
        ]
      }
    };

    const errorType = error?.type || AuthErrorType.UNAUTHORIZED;
    return messages[errorType] || messages[AuthErrorType.UNAUTHORIZED];
  }

  /**
   * Show authentication error notification with debouncing
   * @param {string} message - The error message to display
   * @param {Object} options - Additional options for the notification
   * @returns {boolean} True if notification was shown, false if debounced
   */
  showAuthErrorNotification(message, options = {}) {
    const now = Date.now();
    
    // Check if we should debounce this notification
    if (now - this.lastNotificationTime < ERROR_NOTIFICATION_DEBOUNCE_MS) {
      return false;
    }
    
    this.lastNotificationTime = now;
    
    // Call all registered notification callbacks
    this.notificationCallbacks.forEach(callback => {
      try {
        callback(message, options);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
    
    return true;
  }

  /**
   * Handle authentication error
   * @param {Error} error - The error to handle
   * @param {Object} context - Additional context about the error
   * @returns {AuthError} Normalized AuthError object
   */
  handleAuthError(error, context = {}) {
    let authError;
    
    // Convert to AuthError if not already
    if (error instanceof AuthError) {
      authError = error;
    } else if (this.isNetworkError(error)) {
      authError = new AuthError(
        error.message || 'Network error occurred',
        AuthErrorType.NETWORK_ERROR,
        null,
        { ...context, originalError: error.message }
      );
    } else if (this.isAuthError(error)) {
      const statusCode = error.statusCode || error.status || error.response?.status;
      authError = new AuthError(
        error.message || 'Authentication error occurred',
        AuthErrorType.UNAUTHORIZED,
        statusCode,
        { ...context, originalError: error.message }
      );
    } else {
      // Unknown error type
      authError = new AuthError(
        error.message || 'An unexpected error occurred',
        AuthErrorType.TOKEN_INVALID,
        null,
        { ...context, originalError: error.message }
      );
    }
    
    // Get user-friendly message
    const errorInfo = this.getErrorMessage(authError);
    
    // Show notification (with debouncing)
    if (authError.type !== AuthErrorType.NETWORK_ERROR) {
      this.showAuthErrorNotification(errorInfo.message, {
        type: 'error',
        troubleshooting: errorInfo.troubleshooting
      });
    }
    
    return authError;
  }

  /**
   * Preserve current URL for post-authentication redirect
   * @param {string} url - URL to preserve (defaults to current location)
   */
  preserveRedirectUrl(url = null) {
    try {
      const redirectUrl = url || window.location.pathname + window.location.search;
      localStorage.setItem('udaan_redirect_url', redirectUrl);
    } catch (error) {
      console.error('Error preserving redirect URL:', error);
    }
  }

  /**
   * Get and clear preserved redirect URL
   * @returns {string | null} The preserved URL or null
   */
  getAndClearRedirectUrl() {
    try {
      const redirectUrl = localStorage.getItem('udaan_redirect_url');
      if (redirectUrl) {
        localStorage.removeItem('udaan_redirect_url');
      }
      return redirectUrl;
    } catch (error) {
      console.error('Error getting redirect URL:', error);
      return null;
    }
  }

  /**
   * Reset debounce timer (useful for testing)
   */
  resetDebounce() {
    this.lastNotificationTime = 0;
  }
}

// Export singleton instance
const authErrorHandler = new AuthErrorHandler();
export default authErrorHandler;
