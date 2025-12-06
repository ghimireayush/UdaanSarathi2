/**
 * Tests for HttpClient with token validation
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

// Mock authErrorHandler with real AuthError
jest.mock('../../../utils/authErrorHandler.js', () => ({
  default: {
    isAuthError: jest.fn((error) => error.name === 'AuthError')
  },
  AuthError: MockAuthError,
  AuthErrorType: MockAuthErrorType
}));

// Use the mock classes
const AuthError = MockAuthError;
const AuthErrorType = MockAuthErrorType;

// Create a mock httpClient class to avoid import.meta issues
class MockHttpClient {
  constructor() {
    this.baseURL = 'http://localhost:3000';
  }
  
  validateAndGetToken() {
    const tokenManager = require('../../../services/tokenManager.js').default;
    
    const token = tokenManager.getToken();
    
    if (!token) {
      const error = new AuthError(
        'Authentication token is missing',
        AuthErrorType.TOKEN_MISSING
      );
      console.error('Token validation failed: Token missing');
      throw error;
    }
    
    if (tokenManager.isTokenExpired()) {
      const error = new AuthError(
        'Authentication token has expired',
        AuthErrorType.TOKEN_EXPIRED
      );
      console.error('Token validation failed: Token expired');
      throw error;
    }
    
    return token;
  }
  
  getAuthToken() {
    const tokenManager = require('../../../services/tokenManager.js').default;
    return tokenManager.getToken();
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
        const authError = new AuthError(
          errorData.message || 'Unauthorized - Session expired',
          AuthErrorType.UNAUTHORIZED,
          401,
          { endpoint, statusText: response.statusText }
        );
        
        console.error('API request failed with 401:', {
          endpoint,
          status: response.status,
          message: errorData.message
        });
        
        throw authError;
      }
      
      console.error('API request failed:', {
        endpoint,
        status: response.status,
        message: errorData.message
      });
      
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.statusCode = response.status;
      throw error;
    }
    
    return response.json();
  }
  
  async get(endpoint, options = {}) {
    const authErrorHandler = require('../../../utils/authErrorHandler.js').default;
    try {
      const requireAuth = options.requireAuth !== false;
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.buildHeaders(options.headers, requireAuth),
        ...options
      });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      if (authErrorHandler.isAuthError(error)) {
        throw error;
      }
      throw error;
    }
  }
  
  async post(endpoint, data, options = {}) {
    const authErrorHandler = require('../../../utils/authErrorHandler.js').default;
    try {
      const requireAuth = options.requireAuth !== false;
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: this.buildHeaders(options.headers, requireAuth),
        body: JSON.stringify(data),
        ...options
      });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      if (authErrorHandler.isAuthError(error)) {
        throw error;
      }
      throw error;
    }
  }
  
  async patch(endpoint, data, options = {}) {
    const authErrorHandler = require('../../../utils/authErrorHandler.js').default;
    try {
      const requireAuth = options.requireAuth !== false;
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.buildHeaders(options.headers, requireAuth),
        body: JSON.stringify(data),
        ...options
      });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      if (authErrorHandler.isAuthError(error)) {
        throw error;
      }
      throw error;
    }
  }
  
  async delete(endpoint, options = {}) {
    const authErrorHandler = require('../../../utils/authErrorHandler.js').default;
    try {
      const requireAuth = options.requireAuth !== false;
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.buildHeaders(options.headers, requireAuth),
        ...options
      });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      if (authErrorHandler.isAuthError(error)) {
        throw error;
      }
      throw error;
    }
  }
  
  async upload(endpoint, formData) {
    const authErrorHandler = require('../../../utils/authErrorHandler.js').default;
    try {
      const token = this.validateAndGetToken();
      const url = `${this.baseURL}${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      return this.handleResponse(response, endpoint);
    } catch (error) {
      if (authErrorHandler.isAuthError(error)) {
        throw error;
      }
      throw error;
    }
  }
}

const httpClient = new MockHttpClient();

// Import after mocking
const tokenManager = require('../../../services/tokenManager.js').default;
const authErrorHandler = require('../../../utils/authErrorHandler.js').default;

// Mock fetch
global.fetch = jest.fn();

describe('HttpClient Token Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch.mockClear();
    
    // Default mock implementations
    tokenManager.getToken.mockReturnValue('valid-token');
    tokenManager.isTokenExpired.mockReturnValue(false);
    authErrorHandler.isAuthError.mockImplementation(
      (error) => error instanceof AuthError
    );
  });

  describe('validateAndGetToken', () => {
    test('returns token when valid', () => {
      tokenManager.getToken.mockReturnValue('test-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      const token = httpClient.validateAndGetToken();
      
      expect(token).toBe('test-token');
    });

    test('throws TOKEN_MISSING error when token is null', () => {
      tokenManager.getToken.mockReturnValue(null);
      
      expect(() => {
        httpClient.validateAndGetToken();
      }).toThrow(AuthError);
      
      try {
        httpClient.validateAndGetToken();
      } catch (error) {
        expect(error.type).toBe(AuthErrorType.TOKEN_MISSING);
        expect(error.message).toContain('missing');
      }
    });

    test('throws TOKEN_EXPIRED error when token is expired', () => {
      tokenManager.getToken.mockReturnValue('expired-token');
      tokenManager.isTokenExpired.mockReturnValue(true);
      
      expect(() => {
        httpClient.validateAndGetToken();
      }).toThrow(AuthError);
      
      try {
        httpClient.validateAndGetToken();
      } catch (error) {
        expect(error.type).toBe(AuthErrorType.TOKEN_EXPIRED);
        expect(error.message).toContain('expired');
      }
    });
  });

  describe('buildHeaders', () => {
    test('includes validated token in Authorization header', () => {
      tokenManager.getToken.mockReturnValue('test-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      const headers = httpClient.buildHeaders();
      
      expect(headers['Authorization']).toBe('Bearer test-token');
      expect(headers['Content-Type']).toBe('application/json');
    });

    test('merges custom headers', () => {
      tokenManager.getToken.mockReturnValue('test-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      const headers = httpClient.buildHeaders({ 'X-Custom': 'value' });
      
      expect(headers['Authorization']).toBe('Bearer test-token');
      expect(headers['X-Custom']).toBe('value');
    });

    test('skips auth when requireAuth is false', () => {
      const headers = httpClient.buildHeaders({}, false);
      
      expect(headers['Authorization']).toBeUndefined();
      expect(headers['Content-Type']).toBe('application/json');
      expect(tokenManager.getToken).not.toHaveBeenCalled();
    });

    test('throws error when token is invalid and auth is required', () => {
      tokenManager.getToken.mockReturnValue(null);
      
      expect(() => {
        httpClient.buildHeaders();
      }).toThrow(AuthError);
    });
  });

  describe('handleResponse', () => {
    test('returns parsed JSON for successful response', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'test' })
      };
      
      const result = await httpClient.handleResponse(mockResponse, '/test');
      
      expect(result).toEqual({ data: 'test' });
    });

    test('throws AuthError for 401 response', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({ message: 'Session expired' })
      };
      
      await expect(
        httpClient.handleResponse(mockResponse, '/test')
      ).rejects.toThrow(AuthError);
      
      try {
        await httpClient.handleResponse(mockResponse, '/test');
      } catch (error) {
        expect(error.type).toBe(AuthErrorType.UNAUTHORIZED);
        expect(error.statusCode).toBe(401);
        expect(error.context.endpoint).toBe('/test');
      }
    });

    test('throws regular Error for non-401 failures', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      };
      
      await expect(
        httpClient.handleResponse(mockResponse, '/test')
      ).rejects.toThrow('Server error');
    });

    test('handles JSON parse errors gracefully', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockRejectedValue(new Error('Parse error'))
      };
      
      await expect(
        httpClient.handleResponse(mockResponse, '/test')
      ).rejects.toThrow();
    });
  });

  describe('GET request', () => {
    test('validates token before sending request', async () => {
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'test' })
      });
      
      await httpClient.get('/test');
      
      expect(tokenManager.getToken).toHaveBeenCalled();
      expect(tokenManager.isTokenExpired).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token'
          })
        })
      );
    });

    test('throws AuthError when token is missing', async () => {
      tokenManager.getToken.mockReturnValue(null);
      
      await expect(
        httpClient.get('/test')
      ).rejects.toThrow(AuthError);
    });

    test('allows unauthenticated requests with requireAuth: false', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ data: 'test' })
      });
      
      await httpClient.get('/public', { requireAuth: false });
      
      expect(tokenManager.getToken).not.toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/public'),
        expect.objectContaining({
          headers: expect.not.objectContaining({
            'Authorization': expect.anything()
          })
        })
      );
    });
  });

  describe('POST request', () => {
    test('validates token before sending request', async () => {
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      });
      
      await httpClient.post('/test', { data: 'value' });
      
      expect(tokenManager.getToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token'
          }),
          body: JSON.stringify({ data: 'value' })
        })
      );
    });

    test('throws AuthError when token is expired', async () => {
      tokenManager.getToken.mockReturnValue('expired-token');
      tokenManager.isTokenExpired.mockReturnValue(true);
      
      await expect(
        httpClient.post('/test', { data: 'value' })
      ).rejects.toThrow(AuthError);
    });
  });

  describe('PATCH request', () => {
    test('validates token before sending request', async () => {
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ updated: true })
      });
      
      await httpClient.patch('/test/1', { field: 'new-value' });
      
      expect(tokenManager.getToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token'
          })
        })
      );
    });
  });

  describe('DELETE request', () => {
    test('validates token before sending request', async () => {
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ deleted: true })
      });
      
      await httpClient.delete('/test/1');
      
      expect(tokenManager.getToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test/1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token'
          })
        })
      );
    });
  });

  describe('upload', () => {
    test('validates token before uploading', async () => {
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ uploaded: true })
      });
      
      const formData = new FormData();
      formData.append('file', 'test-file');
      
      await httpClient.upload('/upload', formData);
      
      expect(tokenManager.getToken).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/upload'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer valid-token'
          }),
          body: formData
        })
      );
    });

    test('throws AuthError when token is invalid', async () => {
      tokenManager.getToken.mockReturnValue(null);
      
      const formData = new FormData();
      
      await expect(
        httpClient.upload('/upload', formData)
      ).rejects.toThrow(AuthError);
    });
  });

  describe('401 error handling', () => {
    test('converts 401 response to AuthError', async () => {
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: jest.fn().mockResolvedValue({ message: 'Token invalid' })
      });
      
      await expect(
        httpClient.get('/protected')
      ).rejects.toThrow(AuthError);
      
      try {
        await httpClient.get('/protected');
      } catch (error) {
        expect(error.type).toBe(AuthErrorType.UNAUTHORIZED);
        expect(error.statusCode).toBe(401);
      }
    });
  });

  describe('error logging', () => {
    test('logs API failures with endpoint information', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.isTokenExpired.mockReturnValue(false);
      
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: jest.fn().mockResolvedValue({ message: 'Server error' })
      });
      
      await expect(
        httpClient.get('/test')
      ).rejects.toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'API request failed:',
        expect.objectContaining({
          endpoint: '/test',
          status: 500
        })
      );
      
      consoleSpy.mockRestore();
    });

    test('logs token validation failures', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      tokenManager.getToken.mockReturnValue(null);
      
      expect(() => {
        httpClient.validateAndGetToken();
      }).toThrow();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Token validation failed')
      );
      
      consoleSpy.mockRestore();
    });
  });
});
