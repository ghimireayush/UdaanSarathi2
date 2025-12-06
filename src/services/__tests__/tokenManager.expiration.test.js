/**
 * Tests for TokenManager expiration monitoring methods
 */
import tokenManager, { STORAGE_KEYS } from '../tokenManager';

describe('TokenManager Expiration Monitoring', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getTimeUntilExpiration', () => {
    test('returns time until expiration in milliseconds', () => {
      const futureTime = Date.now() + 3600000; // 1 hour from now
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, futureTime.toString());
      
      const timeUntil = tokenManager.getTimeUntilExpiration();
      
      expect(timeUntil).toBeGreaterThan(3590000); // ~59.8 minutes
      expect(timeUntil).toBeLessThanOrEqual(3600000); // 60 minutes
    });

    test('returns 0 when token is expired', () => {
      const pastTime = Date.now() - 1000; // 1 second ago
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, pastTime.toString());
      
      const timeUntil = tokenManager.getTimeUntilExpiration();
      
      expect(timeUntil).toBe(0);
    });

    test('returns null when no expiration is set', () => {
      const timeUntil = tokenManager.getTimeUntilExpiration();
      
      expect(timeUntil).toBeNull();
    });

    test('returns null for invalid expiration data', () => {
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, 'invalid');
      
      const timeUntil = tokenManager.getTimeUntilExpiration();
      
      expect(timeUntil).toBeNull();
    });
  });

  describe('shouldShowExpirationWarning', () => {
    test('returns true when token expires within 10 minutes', () => {
      const expiration = Date.now() + (9 * 60 * 1000); // 9 minutes from now
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiration.toString());
      
      expect(tokenManager.shouldShowExpirationWarning()).toBe(true);
    });

    test('returns true when token expires in exactly 10 minutes', () => {
      const expiration = Date.now() + (10 * 60 * 1000); // 10 minutes from now
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiration.toString());
      
      expect(tokenManager.shouldShowExpirationWarning()).toBe(true);
    });

    test('returns false when token expires in more than 10 minutes', () => {
      const expiration = Date.now() + (11 * 60 * 1000); // 11 minutes from now
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiration.toString());
      
      expect(tokenManager.shouldShowExpirationWarning()).toBe(false);
    });

    test('returns false when token is already expired', () => {
      const expiration = Date.now() - 1000; // 1 second ago
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiration.toString());
      
      expect(tokenManager.shouldShowExpirationWarning()).toBe(false);
    });

    test('returns false when no expiration is set (backward compatibility)', () => {
      expect(tokenManager.shouldShowExpirationWarning()).toBe(false);
    });

    test('returns false for invalid expiration data (backward compatibility)', () => {
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, 'not-a-number');
      
      expect(tokenManager.shouldShowExpirationWarning()).toBe(false);
    });
  });

  describe('expiration warning window', () => {
    test('warning window is 10 minutes', () => {
      // Test at 10 minutes - should show warning
      const tenMinutes = Date.now() + (10 * 60 * 1000);
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, tenMinutes.toString());
      expect(tokenManager.shouldShowExpirationWarning()).toBe(true);
      
      // Test at 10 minutes + 1 second - should not show warning
      const justOver = Date.now() + (10 * 60 * 1000) + 1000;
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, justOver.toString());
      expect(tokenManager.shouldShowExpirationWarning()).toBe(false);
    });

    test('warning shown throughout the 10-minute window', () => {
      // Test at various points within the 10-minute window
      const testPoints = [1, 3, 5, 7, 9]; // minutes
      
      testPoints.forEach(minutes => {
        const expiration = Date.now() + (minutes * 60 * 1000);
        localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiration.toString());
        
        expect(tokenManager.shouldShowExpirationWarning()).toBe(true);
      });
    });
  });

  describe('integration with existing methods', () => {
    test('getTimeUntilExpiration works with setToken', () => {
      const expiresIn = 3600000; // 1 hour
      tokenManager.setToken('test-token', expiresIn);
      
      const timeUntil = tokenManager.getTimeUntilExpiration();
      
      expect(timeUntil).toBeGreaterThan(3590000);
      expect(timeUntil).toBeLessThanOrEqual(3600000);
    });

    test('shouldShowExpirationWarning works with setToken', () => {
      // Set token to expire in 5 minutes
      const expiresIn = 5 * 60 * 1000;
      tokenManager.setToken('test-token', expiresIn);
      
      expect(tokenManager.shouldShowExpirationWarning()).toBe(true);
    });

    test('clearToken clears expiration data', () => {
      tokenManager.setToken('test-token', 3600000);
      expect(tokenManager.getTimeUntilExpiration()).not.toBeNull();
      
      tokenManager.clearToken();
      
      expect(tokenManager.getTimeUntilExpiration()).toBeNull();
      expect(tokenManager.shouldShowExpirationWarning()).toBe(false);
    });
  });
});
