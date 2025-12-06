/**
 * Tests for AuthErrorHandler utility
 */
import authErrorHandler, { AuthError, AuthErrorType, PORTAL_LOGIN_PATHS } from '../authErrorHandler';
import tokenManager from '../../services/tokenManager';

// Mock tokenManager
jest.mock('../../services/tokenManager', () => ({
  getLoginPortal: jest.fn()
}));

describe('AuthErrorHandler', () => {
  beforeEach(() => {
    // Clear localStorage and reset mocks
    localStorage.clear();
    jest.clearAllMocks();
    authErrorHandler.resetDebounce();
    authErrorHandler.clearNotificationCallbacks();
  });

  describe('AuthError class', () => {
    test('creates AuthError with all properties', () => {
      const error = new AuthError(
        'Test error',
        AuthErrorType.TOKEN_EXPIRED,
        401,
        { userId: '123' }
      );

      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AuthError');
      expect(error.type).toBe(AuthErrorType.TOKEN_EXPIRED);
      expect(error.statusCode).toBe(401);
      expect(error.context).toEqual({ userId: '123' });
      expect(error.timestamp).toBeDefined();
    });

    test('creates AuthError with minimal properties', () => {
      const error = new AuthError('Simple error', AuthErrorType.TOKEN_MISSING);

      expect(error.message).toBe('Simple error');
      expect(error.type).toBe(AuthErrorType.TOKEN_MISSING);
      expect(error.statusCode).toBeNull();
      expect(error.context).toEqual({});
    });
  });

  describe('isAuthError', () => {
    test('returns true for AuthError instance', () => {
      const error = new AuthError('Test', AuthErrorType.TOKEN_EXPIRED);
      expect(authErrorHandler.isAuthError(error)).toBe(true);
    });

    test('returns true for error with auth error type', () => {
      const error = { type: AuthErrorType.UNAUTHORIZED };
      expect(authErrorHandler.isAuthError(error)).toBe(true);
    });

    test('returns true for error with 401 statusCode', () => {
      const error = { statusCode: 401, message: 'Unauthorized' };
      expect(authErrorHandler.isAuthError(error)).toBe(true);
    });

    test('returns true for error with 401 status', () => {
      const error = { status: 401, message: 'Unauthorized' };
      expect(authErrorHandler.isAuthError(error)).toBe(true);
    });

    test('returns true for error with 401 response status', () => {
      const error = { response: { status: 401 }, message: 'Unauthorized' };
      expect(authErrorHandler.isAuthError(error)).toBe(true);
    });

    test('returns false for non-auth error', () => {
      const error = new Error('Regular error');
      expect(authErrorHandler.isAuthError(error)).toBe(false);
    });

    test('returns false for null', () => {
      expect(authErrorHandler.isAuthError(null)).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    test('returns true for error with NETWORK_ERROR type', () => {
      const error = { type: AuthErrorType.NETWORK_ERROR };
      expect(authErrorHandler.isNetworkError(error)).toBe(true);
    });

    test('returns true for error with network message pattern', () => {
      const error = new Error('Network request failed');
      expect(authErrorHandler.isNetworkError(error)).toBe(true);
    });

    test('returns true for error with fetch message pattern', () => {
      const error = new Error('Failed to fetch');
      expect(authErrorHandler.isNetworkError(error)).toBe(true);
    });

    test('returns true for error with connection message pattern', () => {
      const error = new Error('Connection timeout');
      expect(authErrorHandler.isNetworkError(error)).toBe(true);
    });

    test('returns true for error with ECONNREFUSED code', () => {
      const error = { code: 'ECONNREFUSED', message: 'Connection refused' };
      expect(authErrorHandler.isNetworkError(error)).toBe(true);
    });

    test('returns true for error with ETIMEDOUT code', () => {
      const error = { code: 'ETIMEDOUT', message: 'Timeout' };
      expect(authErrorHandler.isNetworkError(error)).toBe(true);
    });

    test('returns false for auth error', () => {
      const error = new AuthError('Auth failed', AuthErrorType.TOKEN_EXPIRED);
      expect(authErrorHandler.isNetworkError(error)).toBe(false);
    });

    test('returns false for null', () => {
      expect(authErrorHandler.isNetworkError(null)).toBe(false);
    });
  });

  describe('getRedirectPath', () => {
    test('returns owner login path for owner portal', () => {
      tokenManager.getLoginPortal.mockReturnValue('owner');
      expect(authErrorHandler.getRedirectPath()).toBe('/owner/login');
    });

    test('returns admin login path for admin portal', () => {
      tokenManager.getLoginPortal.mockReturnValue('admin');
      expect(authErrorHandler.getRedirectPath()).toBe('/login');
    });

    test('returns member login path for member portal', () => {
      tokenManager.getLoginPortal.mockReturnValue('member');
      expect(authErrorHandler.getRedirectPath()).toBe('/member/login');
    });

    test('returns default path for unknown portal', () => {
      tokenManager.getLoginPortal.mockReturnValue('unknown');
      expect(authErrorHandler.getRedirectPath()).toBe('/member/login');
    });

    test('uses provided portal parameter', () => {
      expect(authErrorHandler.getRedirectPath('owner')).toBe('/owner/login');
      expect(tokenManager.getLoginPortal).not.toHaveBeenCalled();
    });
  });

  describe('getErrorMessage', () => {
    test('returns message for TOKEN_MISSING', () => {
      const error = new AuthError('Missing', AuthErrorType.TOKEN_MISSING);
      const result = authErrorHandler.getErrorMessage(error);

      expect(result.message).toContain('session has expired or is missing');
      expect(result.troubleshooting).toHaveLength(2);
      expect(result.troubleshooting[0]).toContain('log in again');
    });

    test('returns message for TOKEN_EXPIRED', () => {
      const error = new AuthError('Expired', AuthErrorType.TOKEN_EXPIRED);
      const result = authErrorHandler.getErrorMessage(error);

      expect(result.message).toContain('session has expired');
      expect(result.troubleshooting).toHaveLength(2);
    });

    test('returns message for NETWORK_ERROR', () => {
      const error = new AuthError('Network', AuthErrorType.NETWORK_ERROR);
      const result = authErrorHandler.getErrorMessage(error);

      expect(result.message).toContain('Network connection error');
      expect(result.troubleshooting).toHaveLength(3);
      expect(result.troubleshooting[0]).toContain('internet connection');
    });

    test('returns default message for unknown error type', () => {
      const error = { type: 'UNKNOWN' };
      const result = authErrorHandler.getErrorMessage(error);

      expect(result.message).toBeDefined();
      expect(result.troubleshooting).toBeDefined();
    });
  });

  describe('showAuthErrorNotification', () => {
    test('shows notification on first call', () => {
      const callback = jest.fn();
      authErrorHandler.registerNotificationCallback(callback);

      const result = authErrorHandler.showAuthErrorNotification('Test message');

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledWith('Test message', {});
    });

    test('debounces notifications within 5 seconds', () => {
      const callback = jest.fn();
      authErrorHandler.registerNotificationCallback(callback);

      authErrorHandler.showAuthErrorNotification('Message 1');
      const result = authErrorHandler.showAuthErrorNotification('Message 2');

      expect(result).toBe(false);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('allows notification after debounce window', () => {
      const callback = jest.fn();
      authErrorHandler.registerNotificationCallback(callback);

      authErrorHandler.showAuthErrorNotification('Message 1');
      
      // Manually advance time
      authErrorHandler.lastNotificationTime = Date.now() - 6000;
      
      const result = authErrorHandler.showAuthErrorNotification('Message 2');

      expect(result).toBe(true);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    test('calls multiple registered callbacks', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      authErrorHandler.registerNotificationCallback(callback1);
      authErrorHandler.registerNotificationCallback(callback2);

      authErrorHandler.showAuthErrorNotification('Test');

      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    test('handles callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });
      const goodCallback = jest.fn();
      
      authErrorHandler.registerNotificationCallback(errorCallback);
      authErrorHandler.registerNotificationCallback(goodCallback);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      authErrorHandler.showAuthErrorNotification('Test');

      expect(consoleSpy).toHaveBeenCalled();
      expect(goodCallback).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('handleAuthError', () => {
    test('handles AuthError instance', () => {
      const error = new AuthError('Test', AuthErrorType.TOKEN_EXPIRED);
      const result = authErrorHandler.handleAuthError(error);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.type).toBe(AuthErrorType.TOKEN_EXPIRED);
    });

    test('converts network error to AuthError', () => {
      const error = new Error('Network request failed');
      const result = authErrorHandler.handleAuthError(error);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.type).toBe(AuthErrorType.NETWORK_ERROR);
    });

    test('converts 401 error to AuthError', () => {
      const error = { statusCode: 401, message: 'Unauthorized' };
      const result = authErrorHandler.handleAuthError(error);

      expect(result).toBeInstanceOf(AuthError);
      expect(result.type).toBe(AuthErrorType.UNAUTHORIZED);
      expect(result.statusCode).toBe(401);
    });

    test('includes context in converted error', () => {
      const error = new Error('Test error');
      const context = { endpoint: '/api/test', userId: '123' };
      const result = authErrorHandler.handleAuthError(error, context);

      expect(result.context.endpoint).toBe('/api/test');
      expect(result.context.userId).toBe('123');
    });

    test('does not show notification for network errors', () => {
      const callback = jest.fn();
      authErrorHandler.registerNotificationCallback(callback);

      const error = new Error('Network failed');
      authErrorHandler.handleAuthError(error);

      expect(callback).not.toHaveBeenCalled();
    });

    test('shows notification for auth errors', () => {
      const callback = jest.fn();
      authErrorHandler.registerNotificationCallback(callback);

      const error = new AuthError('Expired', AuthErrorType.TOKEN_EXPIRED);
      authErrorHandler.handleAuthError(error);

      expect(callback).toHaveBeenCalled();
    });
  });

  describe('URL preservation', () => {
    test('preserveRedirectUrl stores current URL', () => {
      // Mock window.location
      delete window.location;
      window.location = { pathname: '/dashboard', search: '?tab=active' };

      authErrorHandler.preserveRedirectUrl();

      expect(localStorage.getItem('udaan_redirect_url')).toBe('/dashboard?tab=active');
    });

    test('preserveRedirectUrl stores provided URL', () => {
      authErrorHandler.preserveRedirectUrl('/custom/path');

      expect(localStorage.getItem('udaan_redirect_url')).toBe('/custom/path');
    });

    test('getAndClearRedirectUrl retrieves and removes URL', () => {
      localStorage.setItem('udaan_redirect_url', '/saved/path');

      const url = authErrorHandler.getAndClearRedirectUrl();

      expect(url).toBe('/saved/path');
      expect(localStorage.getItem('udaan_redirect_url')).toBeNull();
    });

    test('getAndClearRedirectUrl returns null when no URL stored', () => {
      const url = authErrorHandler.getAndClearRedirectUrl();

      expect(url).toBeNull();
    });
  });

  describe('notification callbacks', () => {
    test('registerNotificationCallback adds callback', () => {
      const callback = jest.fn();
      authErrorHandler.registerNotificationCallback(callback);

      authErrorHandler.showAuthErrorNotification('Test');

      expect(callback).toHaveBeenCalled();
    });

    test('clearNotificationCallbacks removes all callbacks', () => {
      const callback = jest.fn();
      authErrorHandler.registerNotificationCallback(callback);
      authErrorHandler.clearNotificationCallbacks();

      authErrorHandler.showAuthErrorNotification('Test');

      expect(callback).not.toHaveBeenCalled();
    });

    test('ignores non-function callbacks', () => {
      authErrorHandler.registerNotificationCallback('not a function');
      authErrorHandler.registerNotificationCallback(null);

      // Should not throw
      expect(() => {
        authErrorHandler.showAuthErrorNotification('Test');
      }).not.toThrow();
    });
  });
});
