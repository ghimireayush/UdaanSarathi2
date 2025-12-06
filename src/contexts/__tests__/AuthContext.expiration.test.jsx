/**
 * Tests for AuthContext token expiration monitoring
 */
import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import tokenManager from '../../services/tokenManager';
import authErrorHandler from '../../utils/authErrorHandler';

// Mock dependencies
jest.mock('../../services/tokenManager');
jest.mock('../../utils/authErrorHandler');
jest.mock('../../api/config/httpClient.js', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn()
  }
}));
jest.mock('../../services/index.js', () => ({
  auditService: {
    logLogin: jest.fn(),
    logLogout: jest.fn()
  }
}));
jest.mock('../../services/authService.js');

// Test component
const TestComponent = ({ onRender }) => {
  const auth = useAuth();
  React.useEffect(() => {
    if (onRender) {
      onRender(auth);
    }
  }, [auth, onRender]);
  return null;
};

// Import authService to mock it
import authService from '../../services/authService';

describe('AuthContext Expiration Monitoring', () => {
  // Helper to setup authenticated user
  const setupAuthenticatedUser = () => {
    const mockUser = { id: 1, role: 'admin', name: 'Test User' };
    tokenManager.getToken.mockReturnValue('valid-token');
    tokenManager.getUser.mockReturnValue(mockUser);
    tokenManager.isTokenExpired.mockReturnValue(false);
    tokenManager.isTokenValid.mockReturnValue(true);
    tokenManager.getTokenExpiration.mockReturnValue(Date.now() + 3600000);
    tokenManager.getPermissions.mockReturnValue(['read', 'write']);
    return mockUser;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default mocks
    tokenManager.getToken.mockReturnValue(null);
    tokenManager.getUser.mockReturnValue(null);
    tokenManager.getPermissions.mockReturnValue([]);
    tokenManager.isTokenExpired.mockReturnValue(false);
    tokenManager.isTokenValid.mockReturnValue(false);
    tokenManager.getTokenExpiration.mockReturnValue(null);
    tokenManager.getTimeUntilExpiration.mockReturnValue(null);
    tokenManager.shouldShowExpirationWarning.mockReturnValue(false);
    tokenManager.clearToken.mockImplementation(() => {});
    
    authErrorHandler.showAuthErrorNotification = jest.fn();
    
    // Mock authService methods
    authService.logout = jest.fn();
    authService.getUserPermissions = jest.fn().mockReturnValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('checkTokenExpiration', () => {
    test('logs out when token is expired', async () => {
      setupAuthenticatedUser();
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isAuthenticated).toBe(true);
      });
      
      // Simulate token expiration
      tokenManager.isTokenExpired.mockReturnValue(true);
      
      await act(async () => {
        await authContext.checkTokenExpiration();
      });
      
      expect(authErrorHandler.showAuthErrorNotification).toHaveBeenCalledWith(
        expect.stringContaining('session has expired'),
        expect.any(Object)
      );
      expect(authContext.isAuthenticated).toBe(false);
    });

    test('shows warning when token is within warning window', async () => {
      setupAuthenticatedUser();
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isAuthenticated).toBe(true);
      });
      
      // Simulate warning window
      tokenManager.shouldShowExpirationWarning.mockReturnValue(true);
      tokenManager.getTimeUntilExpiration.mockReturnValue(5 * 60 * 1000); // 5 minutes
      
      await act(async () => {
        await authContext.checkTokenExpiration();
      });
      
      expect(authErrorHandler.showAuthErrorNotification).toHaveBeenCalledWith(
        expect.stringContaining('5 minutes'),
        expect.objectContaining({ type: 'warning' })
      );
      expect(authContext.isAuthenticated).toBe(true); // Still authenticated
    });

    test('updates token expiration state', async () => {
      setupAuthenticatedUser();
      const newExpiration = Date.now() + 1800000; // 30 minutes
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isAuthenticated).toBe(true);
      });
      
      // Update expiration
      tokenManager.getTokenExpiration.mockReturnValue(newExpiration);
      
      await act(async () => {
        await authContext.checkTokenExpiration();
      });
      
      expect(authContext.tokenExpiration).toBe(newExpiration);
    });

    test('handles errors gracefully', async () => {
      setupAuthenticatedUser();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      tokenManager.isTokenExpired.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isAuthenticated).toBe(true);
      });
      
      await act(async () => {
        await authContext.checkTokenExpiration();
      });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error checking token expiration'),
        expect.any(Error)
      );
      expect(authContext.isAuthenticated).toBe(true); // Should not logout on error
      
      consoleSpy.mockRestore();
    });
  });

  describe('periodic expiration checking', () => {
    test('checks expiration every 30 seconds when authenticated', async () => {
      setupAuthenticatedUser();
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isAuthenticated).toBe(true);
      });
      
      // Fast-forward 30 seconds
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });
      
      // Should have called getTokenExpiration at least once from periodic check
      expect(tokenManager.getTokenExpiration).toHaveBeenCalled();
    });

    test('does not check expiration when not authenticated', async () => {
      tokenManager.getToken.mockReturnValue(null);
      tokenManager.getUser.mockReturnValue(null);
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isAuthenticated).toBe(false);
      });
      
      const callCountBefore = tokenManager.isTokenExpired.mock.calls.length;
      
      // Fast-forward 30 seconds
      await act(async () => {
        jest.advanceTimersByTime(30000);
      });
      
      const callCountAfter = tokenManager.isTokenExpired.mock.calls.length;
      
      // Should not have made additional calls
      expect(callCountAfter).toBe(callCountBefore);
    });

    test('cleans up interval on unmount', async () => {
      setupAuthenticatedUser();
      
      const { unmount } = await act(async () => {
        return render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );
      });
      
      await act(async () => {
        unmount();
      });
      
      const callCountBefore = tokenManager.getTokenExpiration.mock.calls.length;
      
      // Fast-forward time after unmount
      await act(async () => {
        jest.advanceTimersByTime(60000);
      });
      
      const callCountAfter = tokenManager.getTokenExpiration.mock.calls.length;
      
      // Should not have made additional calls after unmount
      expect(callCountAfter).toBe(callCountBefore);
    });
  });

  describe('warning message formatting', () => {
    test('shows singular "minute" for 1 minute remaining', async () => {
      setupAuthenticatedUser();
      
      tokenManager.shouldShowExpirationWarning.mockReturnValue(true);
      tokenManager.getTimeUntilExpiration.mockReturnValue(60000); // 1 minute
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isAuthenticated).toBe(true);
      });
      
      await act(async () => {
        await authContext.checkTokenExpiration();
      });
      
      expect(authErrorHandler.showAuthErrorNotification).toHaveBeenCalledWith(
        expect.stringContaining('1 minute'),
        expect.any(Object)
      );
      expect(authErrorHandler.showAuthErrorNotification).toHaveBeenCalledWith(
        expect.not.stringContaining('minutes'),
        expect.any(Object)
      );
    });

    test('shows plural "minutes" for multiple minutes remaining', async () => {
      setupAuthenticatedUser();
      
      tokenManager.shouldShowExpirationWarning.mockReturnValue(true);
      tokenManager.getTimeUntilExpiration.mockReturnValue(5 * 60 * 1000); // 5 minutes
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isAuthenticated).toBe(true);
      });
      
      await act(async () => {
        await authContext.checkTokenExpiration();
      });
      
      expect(authErrorHandler.showAuthErrorNotification).toHaveBeenCalledWith(
        expect.stringContaining('5 minutes'),
        expect.any(Object)
      );
    });
  });
});
