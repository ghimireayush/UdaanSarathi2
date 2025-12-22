import tokenManager from '../../services/tokenManager.js'
import authErrorHandler, { AuthError, AuthErrorType } from '../../utils/authErrorHandler.js'

/**
 * Centralized HTTP client configuration
 * Handles base URL, authentication, and common request/response patterns
 */
class HttpClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
    this.maxRetries = 3
    this.retryDelay = 1000 // Initial delay in ms
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Retry a request with exponential backoff
   * @param {Function} requestFn - Function that makes the request
   * @param {number} retries - Number of retries remaining
   * @returns {Promise<any>} Response data
   */
  async retryRequest(requestFn, retries = this.maxRetries) {
    try {
      return await requestFn()
    } catch (error) {
      // Don't retry auth errors
      if (authErrorHandler.isAuthError(error)) {
        throw error
      }
      
      // Check if it's a network error
      if (authErrorHandler.isNetworkError(error)) {
        if (retries > 0) {
          const delay = this.retryDelay * Math.pow(2, this.maxRetries - retries)
          console.log(`Network error, retrying in ${delay}ms... (${retries} retries left)`)
          await this.sleep(delay)
          return this.retryRequest(requestFn, retries - 1)
        } else {
          console.error('Network error: All retries exhausted')
          throw error
        }
      }
      
      // For other errors, throw immediately
      throw error
    }
  }

  /**
   * Validate and get auth token
   * @returns {string} Valid auth token
   * @throws {AuthError} If token is missing or expired
   */
  validateAndGetToken() {
    const token = tokenManager.getToken()
    console.log('[httpClient] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NULL')
    
    if (!token) {
      const error = new AuthError(
        'Authentication token is missing. Please log in again.',
        AuthErrorType.TOKEN_MISSING
      )
      console.error('Token validation failed: Token missing')
      throw error
    }
    
    // Check if token is expired (either by localStorage tracking or JWT decode)
    if (tokenManager.isTokenExpired()) {
      const error = new AuthError(
        'Authentication token has expired. Please log in again.',
        AuthErrorType.TOKEN_EXPIRED
      )
      console.error('Token validation failed: Token expired')
      throw error
    }
    
    // Additional check: decode JWT and verify expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        throw new AuthError(
          'Authentication token has expired. Please log in again.',
          AuthErrorType.TOKEN_EXPIRED
        )
      }
    } catch (e) {
      // If it's already an AuthError, re-throw it
      if (e instanceof AuthError) {
        console.error('Token validation failed: JWT expired')
        throw e
      }
      // If JWT decode fails, continue (token might be valid but not JWT format)
      console.warn('Could not decode JWT token:', e.message)
    }
    
    return token
  }

  /**
   * Get auth token from localStorage (legacy method)
   * @returns {string|null}
   * @deprecated Use validateAndGetToken() instead
   */
  getAuthToken() {
    return tokenManager.getToken()
  }

  /**
   * Build request headers with validated token
   * @param {Object} customHeaders - Custom headers to merge
   * @param {boolean} requireAuth - Whether to require authentication (default: true)
   * @returns {Object} Headers object
   * @throws {AuthError} If authentication is required and token is invalid
   */
  buildHeaders(customHeaders = {}, requireAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    }
    
    if (requireAuth) {
      const token = this.validateAndGetToken()
      headers['Authorization'] = `Bearer ${token}`
      console.log('[httpClient] Authorization header set:', headers['Authorization'] ? 'YES' : 'NO')
    }
    
    // Merge custom headers AFTER auth to avoid overriding Authorization
    Object.assign(headers, customHeaders)
    
    console.log('[httpClient] Final headers:', Object.keys(headers))
    return headers
  }

  /**
   * Handle API response
   * @param {Response} response - Fetch response object
   * @param {string} endpoint - The endpoint that was called (for logging)
   * @returns {Promise<any>} Parsed JSON response
   * @throws {AuthError} If response is 401 Unauthorized
   * @throws {Error} If response is not ok
   */
  async handleResponse(response, endpoint = '') {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
        status: response.status
      }))
      
      // Handle 401 Unauthorized specifically
      if (response.status === 401) {
        const authError = new AuthError(
          errorData.message || 'Unauthorized - Session expired',
          AuthErrorType.UNAUTHORIZED,
          401,
          { endpoint, statusText: response.statusText }
        )
        
        // Log the API failure
        console.error('API request failed with 401:', {
          endpoint,
          status: response.status,
          message: errorData.message
        })
        
        throw authError
      }
      
      // Log other API failures
      console.error('API request failed:', {
        endpoint,
        status: response.status,
        message: errorData.message
      })
      
      const error = new Error(errorData.message || `HTTP ${response.status}`)
      error.status = response.status
      error.statusCode = response.status
      error.response = {
        status: response.status,
        data: errorData
      }
      throw error
    }
    
    return response.json()
  }

  /**
   * GET request with retry logic
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   * @throws {AuthError} If token validation fails or 401 response
   */
  async get(endpoint, options = {}) {
    return this.retryRequest(async () => {
      const requireAuth = options.requireAuth !== false
      const url = `${this.baseURL}${endpoint}`
      const { headers: customHeaders, ...fetchOptions } = options
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders(customHeaders, requireAuth),
        ...fetchOptions
      })
      return this.handleResponse(response, endpoint)
    })
  }

  /**
   * POST request with retry logic
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   * @throws {AuthError} If token validation fails or 401 response
   */
  async post(endpoint, data, options = {}) {
    return this.retryRequest(async () => {
      const requireAuth = options.requireAuth !== false
      const url = `${this.baseURL}${endpoint}`
      const { headers: customHeaders, ...fetchOptions } = options
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(customHeaders, requireAuth),
        body: JSON.stringify(data),
        ...fetchOptions
      })
      return this.handleResponse(response, endpoint)
    })
  }

  /**
   * PATCH request with retry logic
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body data
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   * @throws {AuthError} If token validation fails or 401 response
   */
  async patch(endpoint, data, options = {}) {
    return this.retryRequest(async () => {
      const requireAuth = options.requireAuth !== false
      const url = `${this.baseURL}${endpoint}`
      const { headers: customHeaders, ...fetchOptions } = options
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.buildHeaders(customHeaders, requireAuth),
        body: JSON.stringify(data),
        ...fetchOptions
      })
      return this.handleResponse(response, endpoint)
    })
  }

  /**
   * DELETE request with retry logic
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Fetch options
   * @returns {Promise<any>} Response data
   * @throws {AuthError} If token validation fails or 401 response
   */
  async delete(endpoint, options = {}) {
    return this.retryRequest(async () => {
      const requireAuth = options.requireAuth !== false
      const url = `${this.baseURL}${endpoint}`
      const { headers: customHeaders, ...fetchOptions } = options
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.buildHeaders(customHeaders, requireAuth),
        ...fetchOptions
      })
      return this.handleResponse(response, endpoint)
    })
  }

  /**
   * Upload file (multipart/form-data) with retry logic
   * @param {string} endpoint - API endpoint path
   * @param {FormData} formData - Form data with file
   * @returns {Promise<any>} Response data
   * @throws {AuthError} If token validation fails or 401 response
   */
  async upload(endpoint, formData) {
    return this.retryRequest(async () => {
      const token = this.validateAndGetToken()
      const url = `${this.baseURL}${endpoint}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type for FormData - browser sets it with boundary
        },
        body: formData
      })
      return this.handleResponse(response, endpoint)
    })
  }
}

export default new HttpClient()
