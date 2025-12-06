import React, { createContext, useContext, useState, useEffect } from 'react'
import authService, { ROLES, PERMISSIONS } from '../services/authService.js'
import { auditService } from '../services/index.js'
import tokenManager from '../services/tokenManager.js'
import authErrorHandler from '../utils/authErrorHandler.js'

const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permissions, setPermissions] = useState([])
  const [tokenExpiration, setTokenExpiration] = useState(null)
  const [isTokenValid, setIsTokenValid] = useState(false)

  useEffect(() => {
    initializeAuth()
  }, [])

  // Periodic token expiration checking (every 30 seconds)
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const checkInterval = setInterval(() => {
      checkTokenExpiration()
    }, 30000) // Check every 30 seconds

    return () => clearInterval(checkInterval)
  }, [isAuthenticated])

  const initializeAuth = async () => {
    try {
      // Check for stored authentication data using TokenManager
      const storedToken = tokenManager.getToken()
      const storedUser = tokenManager.getUser()
      
      if (storedUser && storedToken) {
        // Validate token expiration
        if (tokenManager.isTokenExpired()) {
          // Token is expired, clear auth and redirect
          console.log('Token expired during initialization, clearing auth')
          await logout()
          return
        }
        
        // Validate that user data is complete
        if (storedUser.id && storedUser.role) {
          // Get token expiration
          const expiration = tokenManager.getTokenExpiration()
          const storedPermissions = tokenManager.getPermissions()
          const permissions = storedPermissions.length > 0 
            ? storedPermissions 
            : authService.getUserPermissions(storedUser.role)
          
          // Set authentication state
          setUser(storedUser)
          setIsAuthenticated(true)
          setPermissions(permissions)
          setTokenExpiration(expiration)
          setIsTokenValid(true)
          
          // Update authService state to match
          authService.currentUser = storedUser
          authService.isAuthenticated = true
        } else {
          // Invalid user data found, clear auth
          await logout()
        }
      } else {
        // No stored auth data, ensure clean state
        await logout()
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      await logout()
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Validate current session
   * @returns {Promise<boolean>} True if session is valid
   */
  const validateSession = async () => {
    try {
      const isValid = tokenManager.isTokenValid()
      setIsTokenValid(isValid)
      
      if (!isValid) {
        console.log('Session validation failed, clearing auth')
        await logout()
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error validating session:', error)
      await logout()
      return false
    }
  }

  /**
   * Check token expiration and handle warnings/logout
   * Called periodically to monitor token status
   */
  const checkTokenExpiration = async () => {
    try {
      // Check if token is expired
      if (tokenManager.isTokenExpired()) {
        console.log('Token expired during session, logging out')
        authErrorHandler.showAuthErrorNotification(
          'Your session has expired. Please log in again.',
          { type: 'warning' }
        )
        await logout()
        return
      }

      // Check if warning should be shown
      if (tokenManager.shouldShowExpirationWarning()) {
        const timeUntil = tokenManager.getTimeUntilExpiration()
        const minutesLeft = Math.ceil(timeUntil / 60000)
        
        authErrorHandler.showAuthErrorNotification(
          `Your session will expire in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}. Please save your work.`,
          { type: 'warning', duration: 5000 }
        )
      }

      // Update token expiration state
      const expiration = tokenManager.getTokenExpiration()
      setTokenExpiration(expiration)
      setIsTokenValid(tokenManager.isTokenValid())
    } catch (error) {
      console.error('Error checking token expiration:', error)
    }
  }

  const loginStart = async ({ phone }) => {
    try {
      setIsLoading(true)
      const result = await authService.loginStartWithBackend({ phone })
      return result
    } catch (error) {
      console.error('Login start (backend) error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const loginVerify = async ({ phone, otp }) => {
    try {
      setIsLoading(true)
      const result = await authService.loginVerifyWithBackend({ phone, otp })
      
      // Store token with expiration using TokenManager
      const expiresIn = result.expiresIn || (24 * 60 * 60 * 1000) // Default 24 hours
      tokenManager.setToken(result.token, expiresIn)
      tokenManager.setUser(result.user)
      tokenManager.setPermissions(result.permissions)
      tokenManager.setLoginPortal('admin')
      
      const expiration = tokenManager.getTokenExpiration()
      
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      setTokenExpiration(expiration)
      setIsTokenValid(true)
      
      return result
    } catch (error) {
      console.error('Login verify (backend) error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const registerOwnerWithBackend = async ({ fullName, phone }) => {
    try {
      setIsLoading(true)
      const result = await authService.registerOwnerWithBackend({ fullName, phone })
      return result
    } catch (error) {
      console.error('Owner registration (backend) error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const ownerLoginStart = async ({ phone }) => {
    try {
      setIsLoading(true)
      const result = await authService.loginStartOwnerWithBackend({ phone })
      return result
    } catch (error) {
      console.error('Owner login start (backend) error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const ownerLoginVerify = async ({ phone, otp }) => {
    try {
      setIsLoading(true)
      const result = await authService.loginVerifyOwnerWithBackend({ phone, otp })
      
      // Store token with expiration using TokenManager
      const expiresIn = result.expiresIn || (24 * 60 * 60 * 1000) // Default 24 hours
      tokenManager.setToken(result.token, expiresIn)
      tokenManager.setUser(result.user)
      tokenManager.setPermissions(result.permissions)
      tokenManager.setLoginPortal('owner')
      
      const expiration = tokenManager.getTokenExpiration()
      
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      setTokenExpiration(expiration)
      setIsTokenValid(true)
      
      return {
        ...result,
        hasAgency: result.hasAgency
      }
    } catch (error) {
      console.error('Owner login verify (backend) error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const verifyOwnerWithBackend = async ({ phone, otp }) => {
    try {
      setIsLoading(true)
      const result = await authService.verifyOwnerWithBackend({ phone, otp })
      
      // Store token with expiration using TokenManager
      const expiresIn = result.expiresIn || (24 * 60 * 60 * 1000) // Default 24 hours
      tokenManager.setToken(result.token, expiresIn)
      tokenManager.setUser(result.user)
      tokenManager.setPermissions(result.permissions)
      tokenManager.setLoginPortal('owner')
      
      const expiration = tokenManager.getTokenExpiration()
      
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      setTokenExpiration(expiration)
      setIsTokenValid(true)
      
      return {
        ...result,
        hasAgency: result.hasAgency
      }
    } catch (error) {
      console.error('Owner verification (backend) error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username, password) => {
    try {
      setIsLoading(true)
      const result = await authService.login(username, password)
      
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      
      // Store login portal for logout redirect
      localStorage.setItem('login_portal', 'admin')
      
      // Log successful login
      try {
        await auditService.logLogin({
          user: result.user,
          ip_address: '127.0.0.1', // In production, get real IP
          user_agent: navigator.userAgent,
          session_id: `session_${Date.now()}`
        })
      } catch (auditError) {
        console.warn('Failed to log login event:', auditError)
      }
      
      return result
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const ownerLogin = async (email, password) => {
    try {
      setIsLoading(true)
      const result = await authService.ownerLogin(email, password)
      
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      
      // Store login portal for logout redirect
      localStorage.setItem('login_portal', 'owner')
      
      // Log successful owner login
      try {
        await auditService.logLogin({
          user: result.user,
          ip_address: '127.0.0.1', // In production, get real IP
          user_agent: navigator.userAgent,
          session_id: `session_${Date.now()}`,
          portal: 'owner'
        })
      } catch (auditError) {
        console.warn('Failed to log owner login event:', auditError)
      }
      
      return result
    } catch (error) {
      console.error('Owner login error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const memberLogin = async (username, password, invitationToken = null) => {
    try {
      setIsLoading(true)
      const result = await authService.memberLogin(username, password, invitationToken)
      
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      
      // Store login portal for logout redirect
      localStorage.setItem('login_portal', 'member')
      
      // Log successful member login
      if (result.success) {
        try {
          await auditService.logLogin({
            user: result.user,
            ip_address: '127.0.0.1', // In production, get real IP
            user_agent: navigator.userAgent,
            session_id: `session_${Date.now()}`
          })
        } catch (auditError) {
          console.warn('Failed to log member login event:', auditError)
        }
      }
      
      return result
    } catch (error) {
      console.error('Member login error:', error)
      return { success: false, error: error.message || 'Login failed' }
    } finally {
      setIsLoading(false)
    }
  }

  const memberLoginWithBackend = async ({ phone, password }) => {
    try {
      setIsLoading(true)
      const result = await authService.memberLoginWithBackend({ phone, password })
      
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      
      // Store login portal for logout redirect
      localStorage.setItem('login_portal', 'member')
      
      return result
    } catch (error) {
      console.error('Member login (backend) error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const memberLoginStart = async ({ phone }) => {
    try {
      setIsLoading(true)
      const result = await authService.memberLoginStartWithBackend({ phone })
      return result
    } catch (error) {
      console.error('Member login start (backend) error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const memberLoginVerify = async ({ phone, otp }) => {
    try {
      setIsLoading(true)
      const result = await authService.memberLoginVerifyWithBackend({ phone, otp })
      
      // Store token with expiration using TokenManager
      const expiresIn = result.expiresIn || (24 * 60 * 60 * 1000) // Default 24 hours
      tokenManager.setToken(result.token, expiresIn)
      tokenManager.setUser(result.user)
      tokenManager.setPermissions(result.permissions)
      tokenManager.setLoginPortal('member')
      
      const expiration = tokenManager.getTokenExpiration()
      
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      setTokenExpiration(expiration)
      setIsTokenValid(true)
      
      return result
    } catch (error) {
      console.error('Member login verify (backend) error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData) => {
    try {
      setIsLoading(true)
      const result = await authService.register(userData)
      
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      
      return result
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const createCompany = async (companyData) => {
    try {
      setIsLoading(true)
      const result = await authService.createCompany(companyData)
      
      // Update user with company information
      const updatedUser = authService.getCurrentUser()
      setUser(updatedUser)
      
      return result
    } catch (error) {
      console.error('Company creation error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    // Log logout before clearing user data
    if (user) {
      try {
        await auditService.logLogout({
          user: user,
          ip_address: '127.0.0.1', // In production, get real IP
          user_agent: navigator.userAgent,
          session_id: `session_${Date.now()}`
        })
      } catch (auditError) {
        console.warn('Failed to log logout event:', auditError)
      }
    }
    
    // Clear all authentication data using TokenManager
    tokenManager.clearToken()
    authService.logout()
    
    setUser(null)
    setIsAuthenticated(false)
    setPermissions([])
    setTokenExpiration(null)
    setIsTokenValid(false)
  }

  const hasPermission = (permission) => {
    // Use current user from state instead of authService to ensure fresh data
    if (!user) return false
    const userRole = user.specificRole || user.role
    const userPermissions = authService.getUserPermissions(userRole)
    return userPermissions.includes(permission)
  }

  const hasAnyPermission = (permissionList) => {
    // Use current user from state instead of authService to ensure fresh data
    return permissionList.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissionList) => {
    // Use current user from state instead of authService to ensure fresh data
    return permissionList.every(permission => hasPermission(permission))
  }

  const hasRole = (role) => {
    // Use current user from state instead of authService to ensure fresh data
    if (!user) return false
    const userRole = user.specificRole || user.role
    return userRole === role
  }

  const isAdmin = () => {
    return authService.isAdmin()
  }

  const isRecipient = () => {
    return authService.isRecipient()
  }

  const isCoordinator = () => {
    return authService.isCoordinator()
  }

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData }
    setUser(updatedUser)
    localStorage.setItem('udaan_user', JSON.stringify(updatedUser))
  }

  /**
   * Update user role (for dev tools only)
   * @param {string} newRole - New role to assign
   */
  const updateUserRole = (newRole) => {
    const updatedUser = {
      ...user,
      role: newRole,
      specificRole: newRole,
    }
    setUser(updatedUser)
    localStorage.setItem('udaan_user', JSON.stringify(updatedUser))
    
    // Update permissions for new role
    const newPermissions = authService.getUserPermissions(newRole)
    setPermissions(newPermissions)
    localStorage.setItem('udaan_permissions', JSON.stringify(newPermissions))
    
    // Update authService state
    authService.currentUser = updatedUser
  }

  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    permissions,
    tokenExpiration,
    isTokenValid,
    
    // Actions
    login, // legacy mock admin login
    loginStart,
    loginVerify,
    ownerLogin,
    ownerLoginStart,
    ownerLoginVerify,
    memberLogin,
    memberLoginWithBackend,
    memberLoginStart,
    memberLoginVerify,
    register,
    registerOwnerWithBackend,
    verifyOwnerWithBackend,
    createCompany,
    logout,
    updateUser,
    updateUserRole, // Dev tools only
    validateSession,
    checkTokenExpiration,
    
    // Permission checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isRecipient,
    isCoordinator,
    
    // Constants
    ROLES,
    PERMISSIONS
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext