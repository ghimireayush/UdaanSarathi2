import React, { createContext, useContext, useState, useEffect } from 'react'
import authService, { ROLES, PERMISSIONS } from '../services/authService.js'

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

  const login = async (username, password) => {
    try {
      setIsLoading(true)
      const result = await authService.login(username, password)
      
      setUser(result.user)
      setIsAuthenticated(true)
      setPermissions(result.permissions)
      
      return result
    } catch (error) {
      console.error('Login error:', error)
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

  const logout = () => {
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
    login,
    memberLogin,
    register,
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