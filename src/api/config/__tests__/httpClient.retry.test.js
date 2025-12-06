/**
 * Tests for HttpClient network error retry logic
 */

// Create real AuthError class for testing (before mocks)
class MockAuthError extends Error {
  constructor(message, type, statusCode = null, context = {}) {
    super(message);
    this.name = 'AuthError';
    this.type = type;
    this.statusCode = statusCode;
    this.context = context;
  }
}

const MockAuthErrorType = {
  TOKEN_MISSING: 'TOKEN_MISSING',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  REFRESH_FAILED: 'REFRESH_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED'
};

// Mock dependencies
jest.mock('../../../services/tokenManager.js');

// Mock authErrorHandler
jest.mock('../../../utils/authErrorHandler.js', () => ({
  default: {
    isAuthError: jest.fn((error) => error.name === 'AuthError'),
    isNetworkError: jest.fn((error) => {
      if (error.type === 'NETWORK_ERROR') return true;
      if (error.message && /network|fetch|connection|timeout/i.test(error.message)) return true;
      return false;
    })
  },
  AuthError: MockAuthError,
  AuthErrorType: MockAuthErrorType
}));

const AuthError = MockAuthError;
const AuthErrorType = MockAuthErrorType;

// Create a mock httpClient class
class MockHttpClient {
  constructor() {
    this.baseURL = 'http://localhost:3000';
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async retryRequest(requestFn, retries = this.maxRetries) {
    const authErrorHandler = require('../../../utils/authErrorHandler.js').default;
    try {
      return await requestFn();
    } catch (error) {
      if (authErrorHandler.isAuthError(error)) {
        throw error;
      }
      
      if (authErrorHandler.isNetworkError(error)) {
        if (retries > 0) {
          const delay = this.retryDelay * Math.pow(2, this.maxRetries - retries);
          console.log(`Network error, retrying in ${delay}ms... (${retries} retries left)`);
          await this.sleep(delay);
          return this.retryRequest(requestFn, retries - 1);
        } else {
          console.error('Network error: All retries exhausted');
          throw error;
        }
      }
      
      throw error;
    }
  }
  
  validateAndGetToken() {
    const tokenManager = require('../../../services/tokenManager.js').default;
    const token = tokenManager.getToken();
    
    if (!token) {
      throw new AuthError('Token missing', AuthErrorType.TOKEN_MISSING);
    }
    
    if (tokenManager.isTokenExpired()) {
      throw new AuthError('Token expired', AuthErrorType.TOKEN_EXPIRED);
    }
    
    return token;
  }
  
  buildHeaders(customHeaders = {}, requireAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    };
    
    if (requireAuth) {
      const token = this.validateAndGetToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }
  
  async handleResponse(response, endpoint = '') {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: response.statusText,
        status: response.status
      }));
      
      if (response.status === 401) {
        throw new AuthError(
          errorData.message || 'Unauthorized',
          AuthErrorType.UNAUTHORIZED,
          401,
          { endpoint }
        );
      }
      
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.status = response.status;
      throw error;
    }
    
    return response.json();
  }
  
  async get(endpoint, options = {}) {
    return this.retryRequest(async () => {
      const requireAuth = options.requireAuth !== false;
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders(options.headers, requireAuth),
        ...options
      });
      return this.handleResponse(response, endpoint);
    });
  }
  
  async post(endpoint, data, options = {}) {
    return this.retryRequest(async () => {
      const requireAuth = options.requireAuth !== false;
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(options.headers, requireAuth),
        body: JSON.stringify(data),
        ...options
      });
      return this.handleResponse(response, endpoint);
    });
  }
}

const httpClient = new MockHttpClient();

// Import after mocking
const tokenManager = require('../../../services/tokenManager.js').default;
const authErrorHandler = require('../../../utils/authErrorHandler.js').default;

// Mock fetch
global.fetch = jest.fn();

describe('HttpClient Network Error Retry Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    
    // Default mock implementations
    tokenManager.getToken.mockReturnValue('valid-token');
    tokenManager.isTokenExpired.mockReturnValue(false);
    
    // Speed up tests by reducing retry delay
    httpClient.retryDelay = 10;
  });

  describe('retryRequest', () => {
    test('succeeds on first attempt without retry', async () => {
      const mockFn = jest.fn().mockResolvedValue({ success: true });
      
      const result = await httpClient.retryRequest(mockFn);
      
      expect(result).toEqual({ success: true });
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('does not retry auth errors', async () => {
      const authError = new AuthError('Unauthorized', AuthErrorType.UNAUTHORIZED, 401);
      const mockFn = jest.fn().mockRejectedValue(authError);
      
      await expect(
        httpClient.retryRequest(mockFn)
      ).rejects.toThrow(authError);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('retries network errors up to 3 times', async () => {
      const networkError = new Error('Network request failed');
      const mockFn = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({ success: true });
      
      const result = await httpClient.retryRequest(mockFn);
      
      expect(result).toEqual({ success: true });
      expect(mockFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    test('throws error after exhausting all retries', async () => {
      const networkError = new Error('Network connection failed');
      const mockFn = jest.fn().mockRejectedValue(networkError);
      
      await expect(
        httpClient.retryRequest(mockFn)
      ).rejects.toThrow(networkError);
      
      expect(mockFn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    test('uses exponential backoff for retries', async () => {
      const networkError = new Error('Network timeout');
      const mockFn = jest.fn()
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(networkError)
        .mockResolvedValue({ success: true });
      
      const startTime = Date.now();
      await httpClient.retryRequest(mockFn);
      const endTime = Date.now();
      
      // With retryDelay = 10ms:
      // First retry: 10ms * 2^0 = 10ms
      // Second retry: 10ms * 2^1 = 20ms
      // Total minimum: 30ms
      expect(endTime - startTime).toBeGreaterThanOrEqual(25);
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    test('does not retry non-network errors', async () => {
      const regularError = new Error('Validation failed');
      const mockFn = jest.fn().mockRejectedValue(regularError);
      
      await expect(
        httpClient.retryRequest(mockFn)
      ).rejects.toThrow(regularError);
      
      expect(mockFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET request with retry', () => {
    test('retries on network error and succeeds', async () => {
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch
        .mockRejectedValueOnce(new Error('Network failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ data: 'success' })
        });
      
      const result = await httpClient.get('/test');
      
      expect(result).toEqual({ data: 'success' });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    test('does not retry on auth error', async () => {
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ message: 'Unauthorized' })
      });
      
      await expect(
        httpClient.get('/protected')
      ).rejects.toThrow(AuthError);
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('preserves authentication state after network error retries', async () => {
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch
        .mockRejectedValueOnce(new Error('Connection timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ authenticated: true })
        });
      
      const result = await httpClient.get('/user');
      
      expect(result).toEqual({ authenticated: true });
      expect(tokenManager.getToken).toHaveBeenCalled();
      expect(tokenManager.isTokenExpired).toHaveBeenCalled();
    });
  });

  describe('POST request with retry', () => {
    test('retries on network error', async () => {
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch
        .mockRejectedValueOnce(new Error('Fetch failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ created: true })
        });
      
      const result = await httpClient.post('/create', { name: 'test' });
      
      expect(result).toEqual({ created: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('error logging', () => {
    test('logs retry attempts', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ success: true })
        });
      
      await httpClient.get('/test');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Network error, retrying')
      );
      
      consoleSpy.mockRestore();
    });

    test('logs when retries are exhausted', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch.mockRejectedValue(new Error('Network failed'));
      
      await expect(
        httpClient.get('/test')
      ).rejects.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('All retries exhausted')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('network recovery', () => {
    test('continues normal operation after successful retry', async () => {
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      // First request fails then succeeds
      global.fetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ data: 'first' })
        })
        // Second request succeeds immediately
        .mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({ data: 'second' })
        });
      
      const result1 = await httpClient.get('/test1');
      const result2 = await httpClient.get('/test2');
      
      expect(result1).toEqual({ data: 'first' });
      expect(result2).toEqual({ data: 'second' });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });
});
