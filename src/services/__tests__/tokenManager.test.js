/**
 * Basic tests for TokenManager service
 */
import tokenManager, { STORAGE_KEYS, TOKEN_REFRESH_WINDOW_MS, DEFAULT_TOKEN_EXPIRATION_MS } from '../tokenManager';

describe('TokenManager', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Token Storage and Retrieval', () => {
    test('setToken stores token and expiration', () => {
      const testToken = 'test-bearer-token-123';
      const expiresIn = 3600000; // 1 hour
      
      tokenManager.setToken(testToken, expiresIn);
      
      expect(localStorage.getItem(STORAGE_KEYS.TOKEN)).toBe(testToken);
      expect(localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT)).toBeTruthy();
      expect(localStorage.getItem(STORAGE_KEYS.SESSION_START)).toBeTruthy();
    });

    test('getToken retrieves stored token', () => {
      const testToken = 'test-bearer-token-456';
      localStorage.setItem(STORAGE_KEYS.TOKEN, testToken);
      
      expect(tokenManager.getToken()).toBe(testToken);
    });

    test('getToken returns null when no token exists', () => {
      expect(tokenManager.getToken()).toBeNull();
    });

    test('clearToken removes all authentication data', () => {
      // Set up some data
      localStorage.setItem(STORAGE_KEYS.TOKEN, 'token');
      localStorage.setItem(STORAGE_KEYS.USER, '{}');
      localStorage.setItem(STORAGE_KEYS.PERMISSIONS, '[]');
      localStorage.setItem(STORAGE_KEYS.LOGIN_PORTAL, 'member');
      
      tokenManager.clearToken();
      
      // Verify all keys are removed
      Object.values(STORAGE_KEYS).forEach(key => {
        expect(localStorage.getItem(key)).toBeNull();
      });
    });
  });

  describe('Token Validation', () => {
    test('isTokenValid returns true for valid non-expired token', () => {
      const testToken = 'valid-token';
      const futureExpiration = Date.now() + 3600000; // 1 hour from now
      
      localStorage.setItem(STORAGE_KEYS.TOKEN, testToken);
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, futureExpiration.toString());
      
      expect(tokenManager.isTokenValid()).toBe(true);
    });

    test('isTokenValid returns false when token is missing', () => {
      expect(tokenManager.isTokenValid()).toBe(false);
    });

    test('isTokenValid returns false when token is expired', () => {
      const testToken = 'expired-token';
      const pastExpiration = Date.now() - 1000; // 1 second ago
      
      localStorage.setItem(STORAGE_KEYS.TOKEN, testToken);
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, pastExpiration.toString());
      
      expect(tokenManager.isTokenValid()).toBe(false);
    });

    test('isTokenExpired returns true when expiration is in the past', () => {
      const pastExpiration = Date.now() - 1000;
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, pastExpiration.toString());
      
      expect(tokenManager.isTokenExpired()).toBe(true);
    });

    test('isTokenExpired returns false when expiration is in the future', () => {
      const futureExpiration = Date.now() + 3600000;
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, futureExpiration.toString());
      
      expect(tokenManager.isTokenExpired()).toBe(false);
    });

    test('isTokenExpired returns false when expiration data is missing (backward compatibility)', () => {
      expect(tokenManager.isTokenExpired()).toBe(false);
    });

    test('getTokenExpiration returns correct timestamp', () => {
      const expiration = Date.now() + 3600000;
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiration.toString());
      
      expect(tokenManager.getTokenExpiration()).toBe(expiration);
    });

    test('getTokenExpiration returns null when no expiration exists', () => {
      expect(tokenManager.getTokenExpiration()).toBeNull();
    });
  });

  describe('Token Refresh Logic', () => {
    test('shouldRefreshToken returns true when within refresh window', () => {
      const expiration = Date.now() + (TOKEN_REFRESH_WINDOW_MS - 60000); // 4 minutes from now
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiration.toString());
      
      expect(tokenManager.shouldRefreshToken()).toBe(true);
    });

    test('shouldRefreshToken returns false when outside refresh window', () => {
      const expiration = Date.now() + (TOKEN_REFRESH_WINDOW_MS + 60000); // 6 minutes from now
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiration.toString());
      
      expect(tokenManager.shouldRefreshToken()).toBe(false);
    });

    test('shouldRefreshToken returns false when token is expired', () => {
      const expiration = Date.now() - 1000; // Already expired
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiration.toString());
      
      expect(tokenManager.shouldRefreshToken()).toBe(false);
    });
  });

  describe('Portal Management', () => {
    test('setLoginPortal stores portal identifier', () => {
      tokenManager.setLoginPortal('owner');
      
      expect(localStorage.getItem(STORAGE_KEYS.LOGIN_PORTAL)).toBe('owner');
    });

    test('getLoginPortal retrieves stored portal', () => {
      localStorage.setItem(STORAGE_KEYS.LOGIN_PORTAL, 'admin');
      
      expect(tokenManager.getLoginPortal()).toBe('admin');
    });

    test('getLoginPortal returns default when no portal is stored', () => {
      expect(tokenManager.getLoginPortal()).toBe('member');
    });

    test('setLoginPortal validates portal identifier', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      tokenManager.setLoginPortal('invalid-portal');
      
      expect(localStorage.getItem(STORAGE_KEYS.LOGIN_PORTAL)).toBe('member');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('User Data Management', () => {
    test('setUser and getUser work correctly', () => {
      const user = { id: 1, name: 'Test User', email: 'test@example.com' };
      
      tokenManager.setUser(user);
      
      expect(tokenManager.getUser()).toEqual(user);
    });

    test('setPermissions and getPermissions work correctly', () => {
      const permissions = ['read', 'write', 'admin'];
      
      tokenManager.setPermissions(permissions);
      
      expect(tokenManager.getPermissions()).toEqual(permissions);
    });

    test('setUserType and getUserType work correctly', () => {
      tokenManager.setUserType('owner');
      
      expect(tokenManager.getUserType()).toBe('owner');
    });

    test('setAgencyId and getAgencyId work correctly', () => {
      const agencyId = 'agency-123';
      
      tokenManager.setAgencyId(agencyId);
      
      expect(tokenManager.getAgencyId()).toBe(agencyId);
    });
  });

  describe('Session Management', () => {
    test('setToken creates session start timestamp', () => {
      const beforeTime = Date.now();
      tokenManager.setToken('test-token', 3600000);
      const afterTime = Date.now();
      
      const sessionStart = tokenManager.getSessionStart();
      
      expect(sessionStart).toBeGreaterThanOrEqual(beforeTime);
      expect(sessionStart).toBeLessThanOrEqual(afterTime);
    });

    test('getSessionStart returns null when no session exists', () => {
      expect(tokenManager.getSessionStart()).toBeNull();
    });
  });
});
