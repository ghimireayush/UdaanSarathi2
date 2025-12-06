/**
 * TokenManager Service
 * Centralizes all token-related operations including storage, validation, and portal management
 */

// Constants for localStorage keys
export const STORAGE_KEYS = {
  TOKEN: 'udaan_token',
  TOKEN_EXPIRES_AT: 'udaan_token_expires_at',
  USER: 'udaan_user',
  PERMISSIONS: 'udaan_permissions',
  USER_TYPE: 'udaan_user_type',
  LOGIN_PORTAL: 'login_portal',
  AGENCY_ID: 'udaan_agency_id',
  SESSION_START: 'session_start'
};

// Token refresh window: 5 minutes before expiration
export const TOKEN_REFRESH_WINDOW_MS = 5 * 60 * 1000;

// Default token expiration: 24 hours
export const DEFAULT_TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000;

/**
 * TokenManager class handles all token operations
 */
class TokenManager {
  /**
   * Get the current bearer token from localStorage
   * @returns {string | null} The bearer token or null if not found
   */
  getToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      console.error('Error reading token from localStorage:', error);
      return null;
    }
  }

  /**
   * Store a bearer token with expiration timestamp
   * @param {string} token - The bearer token to store
   * @param {number} expiresIn - Time until expiration in milliseconds
   */
  setToken(token, expiresIn = DEFAULT_TOKEN_EXPIRATION_MS) {
    try {
      const expirationTimestamp = Date.now() + expiresIn;
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expirationTimestamp.toString());
      
      // Set session start if not already set
      if (!localStorage.getItem(STORAGE_KEYS.SESSION_START)) {
        localStorage.setItem(STORAGE_KEYS.SESSION_START, Date.now().toString());
      }
    } catch (error) {
      console.error('Error storing token in localStorage:', error);
      throw error;
    }
  }

  /**
   * Clear the token and all authentication data from localStorage
   */
  clearToken() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing token from localStorage:', error);
      throw error;
    }
  }

  /**
   * Check if a valid token exists and is not expired
   * @returns {boolean} True if token is valid and not expired
   */
  isTokenValid() {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    return !this.isTokenExpired();
  }

  /**
   * Check if the current token is expired
   * @returns {boolean} True if token is expired, false if valid or no expiration data (backward compatibility)
   */
  isTokenExpired() {
    try {
      const expirationStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      
      // If no expiration data exists, assume token is valid (backward compatibility)
      // This handles tokens stored before expiration tracking was implemented
      if (!expirationStr) {
        return false;
      }
      
      const expiration = parseInt(expirationStr, 10);
      if (isNaN(expiration)) {
        // Invalid expiration format, assume valid for backward compatibility
        return false;
      }
      
      return Date.now() >= expiration;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      // On error, assume valid to avoid breaking existing sessions
      return false;
    }
  }

  /**
   * Get the token expiration timestamp
   * @returns {number | null} Unix timestamp in milliseconds or null if not found
   */
  getTokenExpiration() {
    try {
      const expirationStr = localStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
      if (!expirationStr) {
        return null;
      }
      
      const expiration = parseInt(expirationStr, 10);
      return isNaN(expiration) ? null : expiration;
    } catch (error) {
      console.error('Error getting token expiration:', error);
      return null;
    }
  }

  /**
   * Check if token should be refreshed (within refresh window)
   * @returns {boolean} True if token should be refreshed
   */
  shouldRefreshToken() {
    const expiration = this.getTokenExpiration();
    if (!expiration) {
      return false;
    }
    
    const timeUntilExpiration = expiration - Date.now();
    return timeUntilExpiration > 0 && timeUntilExpiration <= TOKEN_REFRESH_WINDOW_MS;
  }

  /**
   * Get time until token expiration in milliseconds
   * @returns {number | null} Time until expiration in ms, or null if no expiration
   */
  getTimeUntilExpiration() {
    const expiration = this.getTokenExpiration();
    if (!expiration) {
      return null;
    }
    
    const timeUntil = expiration - Date.now();
    return timeUntil > 0 ? timeUntil : 0;
  }

  /**
   * Check if expiration warning should be shown
   * Warning shown when token is within 10 minutes of expiration
   * @returns {boolean} True if warning should be shown
   */
  shouldShowExpirationWarning() {
    const timeUntil = this.getTimeUntilExpiration();
    if (timeUntil === null) {
      return false;
    }
    
    const WARNING_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
    return timeUntil > 0 && timeUntil <= WARNING_WINDOW_MS;
  }

  /**
   * Get the login portal identifier
   * @returns {string} The portal identifier ('owner', 'member', 'admin', or 'member' as default)
   */
  getLoginPortal() {
    try {
      const portal = localStorage.getItem(STORAGE_KEYS.LOGIN_PORTAL);
      return portal || 'member'; // Default to member portal
    } catch (error) {
      console.error('Error reading login portal from localStorage:', error);
      return 'member';
    }
  }

  /**
   * Set the login portal identifier
   * @param {string} portal - The portal identifier ('owner', 'member', or 'admin')
   */
  setLoginPortal(portal) {
    try {
      if (!['owner', 'member', 'admin'].includes(portal)) {
        console.warn(`Invalid portal identifier: ${portal}. Defaulting to 'member'.`);
        portal = 'member';
      }
      localStorage.setItem(STORAGE_KEYS.LOGIN_PORTAL, portal);
    } catch (error) {
      console.error('Error storing login portal in localStorage:', error);
      throw error;
    }
  }

  /**
   * Store user data in localStorage
   * @param {Object} user - User object to store
   */
  setUser(user) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user data:', error);
      throw error;
    }
  }

  /**
   * Get user data from localStorage
   * @returns {Object | null} User object or null if not found
   */
  getUser() {
    try {
      const userStr = localStorage.getItem(STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error reading user data:', error);
      return null;
    }
  }

  /**
   * Store permissions in localStorage
   * @param {Array<string>} permissions - Array of permission strings
   */
  setPermissions(permissions) {
    try {
      localStorage.setItem(STORAGE_KEYS.PERMISSIONS, JSON.stringify(permissions));
    } catch (error) {
      console.error('Error storing permissions:', error);
      throw error;
    }
  }

  /**
   * Get permissions from localStorage
   * @returns {Array<string>} Array of permission strings
   */
  getPermissions() {
    try {
      const permissionsStr = localStorage.getItem(STORAGE_KEYS.PERMISSIONS);
      return permissionsStr ? JSON.parse(permissionsStr) : [];
    } catch (error) {
      console.error('Error reading permissions:', error);
      return [];
    }
  }

  /**
   * Store user type in localStorage
   * @param {string} userType - User type ('owner', 'member', 'admin')
   */
  setUserType(userType) {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_TYPE, userType);
    } catch (error) {
      console.error('Error storing user type:', error);
      throw error;
    }
  }

  /**
   * Get user type from localStorage
   * @returns {string | null} User type or null if not found
   */
  getUserType() {
    try {
      return localStorage.getItem(STORAGE_KEYS.USER_TYPE);
    } catch (error) {
      console.error('Error reading user type:', error);
      return null;
    }
  }

  /**
   * Store agency ID in localStorage
   * @param {string} agencyId - Agency ID
   */
  setAgencyId(agencyId) {
    try {
      localStorage.setItem(STORAGE_KEYS.AGENCY_ID, agencyId);
    } catch (error) {
      console.error('Error storing agency ID:', error);
      throw error;
    }
  }

  /**
   * Get agency ID from localStorage
   * @returns {string | null} Agency ID or null if not found
   */
  getAgencyId() {
    try {
      return localStorage.getItem(STORAGE_KEYS.AGENCY_ID);
    } catch (error) {
      console.error('Error reading agency ID:', error);
      return null;
    }
  }

  /**
   * Get session start timestamp
   * @returns {number | null} Session start timestamp or null if not found
   */
  getSessionStart() {
    try {
      const sessionStartStr = localStorage.getItem(STORAGE_KEYS.SESSION_START);
      if (!sessionStartStr) {
        return null;
      }
      const sessionStart = parseInt(sessionStartStr, 10);
      return isNaN(sessionStart) ? null : sessionStart;
    } catch (error) {
      console.error('Error reading session start:', error);
      return null;
    }
  }
}

// Export singleton instance
const tokenManager = new TokenManager();
export default tokenManager;
