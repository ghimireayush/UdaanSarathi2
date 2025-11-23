import React, { createContext, useContext, useState, useEffect } from 'react'
import authService, { ROLES, PERMISSIONS } from '../services/authService.js'
import { auditService } from '../services/index.js'

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

  useEffect(() => {
    initializeAuth()
  }, [])

  const initializeAuth = async () => {
    try {
      // Check for stored authentication data
      const storedUser = localStorage.getItem('udaan_user')
      const storedToken = localStorage.getItem('udaan_token')
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser)
        
        // Validate that user data is complete
        if (userData && userData.id && userData.role) {
          // Validate token expiration if it exists
          const storedPermissions = localStorage.getItem('udaan_permissions')
          const permissions = storedPermissions ? JSON.parse(storedPermissions) : authService.getUserPermissions(userData.role)
          
          // Set authentication state
          setUser(userData)
          setIsAuthenticated(true)
          setPermissions(permissions)
          
          // Update authService state to match
          authService.currentUser = userData
          authService.isAuthenticated = true
        } else {
          // Invalid user data found, clear auth
          logout()
        }
      } else {
        // No stored auth data, ensure clean state
        logout()
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      logout()
    } finally {
      setIsLoading(false)
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
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      localStorage.setItem('login_portal', 'admin')
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
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      localStorage.setItem('login_portal', 'owner')
      return result
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
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      return result
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
    
    authService.logout()
    setUser(null)
    setIsAuthenticated(false)
    setPermissions([])
  }

  const hasPermission = (permission) => {
    return authService.hasPermission(permission)
  }

  const hasAnyPermission = (permissionList) => {
    return authService.hasAnyPermission(permissionList)
  }

  const hasAllPermissions = (permissionList) => {
    return authService.hasAllPermissions(permissionList)
  }

  const hasRole = (role) => {
    return authService.hasRole(role)
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

  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    permissions,
    
    // Actions
    login, // legacy mock admin login
    loginStart,
    loginVerify,
    ownerLogin,
    ownerLoginStart,
    ownerLoginVerify,
    memberLogin,
    register,
    registerOwnerWithBackend,
    verifyOwnerWithBackend,
    createCompany,
    logout,
    updateUser,
    
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