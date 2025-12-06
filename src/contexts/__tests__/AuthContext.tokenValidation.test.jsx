/**
 * Tests for AuthContext token validation integration
 */
import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import tokenManager from '../../services/tokenManager';
import authService from '../../services/authService';

// Mock dependencies
jest.mock('../../services/tokenManager');
jest.mock('../../services/authService');
jest.mock('../../api/config/httpClient.js', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  }
}));
jest.mock('../../services/index.js', () => ({
  auditService: {
    logLogin: jest.fn(),
    logLogout: jest.fn()
  }
}));

// Test component to access auth context
const TestComponent = ({ onRender }) => {
  const auth = useAuth();
  React.useEffect(() => {
    if (onRender) {
      onRender(auth);
    }
  }, [auth, onRender]);
  return null;
};

describe('AuthContext Token Validation', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    
    // Setup default mocks
    tokenManager.getToken.mockReturnValue(null);
    tokenManager.getUser.mockReturnValue(null);
    tokenManager.getPermissions.mockReturnValue([]);
    tokenManager.isTokenExpired.mockReturnValue(false);
    tokenManager.isTokenValid.mockReturnValue(false);
    tokenManager.getTokenExpiration.mockReturnValue(null);
    tokenManager.clearToken.mockImplementation(() => {});
    
    authService.logout = jest.fn();
    authService.getUserPermissions = jest.fn().mockReturnValue([]);
  });

  describe('initializeAuth', () => {
    test('restores valid session from storage', async () => {
      const mockUser = { id: 1, role: 'admin', name: 'Test User' };
      const mockExpiration = Date.now() + 3600000;
      const mockPermissions = ['read', 'write'];
      
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.getUser.mockReturnValue(mockUser);
      tokenManager.getPermissions.mockReturnValue(mockPermissions);
      tokenManager.isTokenExpired.mockReturnValue(false);
      tokenManager.getTokenExpiration.mockReturnValue(mockExpiration);
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isLoading).toBe(false);
      });
      
      expect(authContext.isAuthenticated).toBe(true);
      expect(authContext.user).toEqual(mockUser);
      expect(authContext.permissions).toEqual(mockPermissions);
      expect(authContext.tokenExpiration).toBe(mockExpiration);
      expect(authContext.isTokenValid).toBe(true);
    });

    test('clears auth when token is expired', async () => {
      const mockUser = { id: 1, role: 'admin', name: 'Test User' };
      
      tokenManager.getToken.mockReturnValue('expired-token');
      tokenManager.getUser.mockReturnValue(mockUser);
      tokenManager.isTokenExpired.mockReturnValue(true);
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isLoading).toBe(false);
      });
      
      expect(authContext.isAuthenticated).toBe(false);
      expect(authContext.user).toBeNull();
      expect(tokenManager.clearToken).toHaveBeenCalled();
    });

    test('clears auth when no token exists', async () => {
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
        expect(authContext.isLoading).toBe(false);
      });
      
      expect(authContext.isAuthenticated).toBe(false);
      expect(authContext.user).toBeNull();
    });
  });

  describe('validateSession', () => {
    test('returns true for valid session', async () => {
      tokenManager.isTokenValid.mockReturnValue(true);
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isLoading).toBe(false);
      });
      
      let result;
      await act(async () => {
        result = await authContext.validateSession();
      });
      
      expect(result).toBe(true);
      expect(authContext.isTokenValid).toBe(true);
    });

    test('returns false and logs out for invalid session', async () => {
      tokenManager.isTokenValid.mockReturnValue(false);
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isLoading).toBe(false);
      });
      
      let result;
      await act(async () => {
        result = await authContext.validateSession();
      });
      
      expect(result).toBe(false);
      expect(authContext.isAuthenticated).toBe(false);
      expect(tokenManager.clearToken).toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    test('clears all token data using TokenManager', async () => {
      const mockUser = { id: 1, role: 'admin', name: 'Test User' };
      
      tokenManager.getToken.mockReturnValue('valid-token');
      tokenManager.getUser.mockReturnValue(mockUser);
      tokenManager.isTokenExpired.mockReturnValue(false);
      tokenManager.getTokenExpiration.mockReturnValue(Date.now() + 3600000);
      
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
        await authContext.logout();
      });
      
      expect(tokenManager.clearToken).toHaveBeenCalled();
      expect(authContext.isAuthenticated).toBe(false);
      expect(authContext.user).toBeNull();
      expect(authContext.tokenExpiration).toBeNull();
      expect(authContext.isTokenValid).toBe(false);
    });
  });

  describe('login methods store token expiration', () => {
    test('loginVerify stores token with expiration', async () => {
      const mockResult = {
        user: { id: 1, role: 'admin', name: 'Test User' },
        token: 'new-token',
        permissions: ['read', 'write'],
        expiresIn: 7200000 // 2 hours
      };
      
      authService.loginVerifyWithBackend = jest.fn().mockResolvedValue(mockResult);
      tokenManager.setToken.mockImplementation(() => {});
      tokenManager.setUser.mockImplementation(() => {});
      tokenManager.setPermissions.mockImplementation(() => {});
      tokenManager.setLoginPortal.mockImplementation(() => {});
      tokenManager.getTokenExpiration.mockReturnValue(Date.now() + 7200000);
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isLoading).toBe(false);
      });
      
      await act(async () => {
        await authContext.loginVerify({ phone: '1234567890', otp: '123456' });
      });
      
      expect(tokenManager.setToken).toHaveBeenCalledWith('new-token', 7200000);
      expect(tokenManager.setUser).toHaveBeenCalledWith(mockResult.user);
      expect(tokenManager.setPermissions).toHaveBeenCalledWith(mockResult.permissions);
      expect(tokenManager.setLoginPortal).toHaveBeenCalledWith('admin');
      expect(authContext.isAuthenticated).toBe(true);
      expect(authContext.isTokenValid).toBe(true);
    });

    test('ownerLoginVerify stores token with expiration', async () => {
      const mockResult = {
        user: { id: 2, role: 'owner', name: 'Owner User' },
        token: 'owner-token',
        permissions: ['owner_read', 'owner_write'],
        expiresIn: 3600000,
        hasAgency: true
      };
      
      authService.loginVerifyOwnerWithBackend = jest.fn().mockResolvedValue(mockResult);
      tokenManager.setToken.mockImplementation(() => {});
      tokenManager.setUser.mockImplementation(() => {});
      tokenManager.setPermissions.mockImplementation(() => {});
      tokenManager.setLoginPortal.mockImplementation(() => {});
      tokenManager.getTokenExpiration.mockReturnValue(Date.now() + 3600000);
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isLoading).toBe(false);
      });
      
      await act(async () => {
        await authContext.ownerLoginVerify({ phone: '1234567890', otp: '123456' });
      });
      
      expect(tokenManager.setToken).toHaveBeenCalledWith('owner-token', 3600000);
      expect(tokenManager.setLoginPortal).toHaveBeenCalledWith('owner');
      expect(authContext.isAuthenticated).toBe(true);
    });

    test('memberLoginVerify stores token with expiration', async () => {
      const mockResult = {
        user: { id: 3, role: 'member', name: 'Member User' },
        token: 'member-token',
        permissions: ['member_read'],
        expiresIn: 1800000
      };
      
      authService.memberLoginVerifyWithBackend = jest.fn().mockResolvedValue(mockResult);
      tokenManager.setToken.mockImplementation(() => {});
      tokenManager.setUser.mockImplementation(() => {});
      tokenManager.setPermissions.mockImplementation(() => {});
      tokenManager.setLoginPortal.mockImplementation(() => {});
      tokenManager.getTokenExpiration.mockReturnValue(Date.now() + 1800000);
      
      let authContext;
      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent onRender={(auth) => { authContext = auth; }} />
          </AuthProvider>
        );
      });
      
      await waitFor(() => {
        expect(authContext.isLoading).toBe(false);
      });
      
      await act(async () => {
        await authContext.memberLoginVerify({ phone: '1234567890', otp: '123456' });
      });
      
      expect(tokenManager.setToken).toHaveBeenCalledWith('member-token', 1800000);
      expect(tokenManager.setLoginPortal).toHaveBeenCalledWith('member');
      expect(authContext.isAuthenticated).toBe(true);
    });
  });
});
