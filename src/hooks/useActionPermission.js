/**
 * Hook to check action permissions based on user role
 * 
 * Fetches permissions from backend on first load (single source of truth)
 * Falls back to local config if backend unavailable
 * 
 * Usage:
 * const { canPerform, getErrorMessage, isLoading } = useActionPermission()
 * 
 * if (canPerform('SHORTLIST_CANDIDATE')) {
 *   // Show button
 * }
 */

import { useEffect, useState } from 'react'
import { canPerformAction, ACTION_PERMISSIONS } from '../config/actionPermissions'

export const useActionPermission = () => {
  const [allowedActions, setAllowedActions] = useState([])
  const [userRole, setUserRole] = useState('guest')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [token, setToken] = useState(null)

  // Extract token and role from localStorage (or context if available)
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')
      
      if (storedToken) {
        setToken(storedToken)
      }
      
      if (storedUser) {
        const user = JSON.parse(storedUser)
        setUserRole(user.role || 'guest')
      }
    } catch (err) {
      console.warn('Failed to read auth from localStorage', err)
    }
  }, [])

  // Fetch permissions from backend
  useEffect(() => {
    const fetchPermissions = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // Fetch from backend (SINGLE SOURCE OF TRUTH)
        const response = await fetch('/api/auth/permissions/my-role', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch permissions: ${response.status}`)
        }

        const data = await response.json()
        
        if (data.actions && Array.isArray(data.actions)) {
          setAllowedActions(data.actions)
        }
        
        if (data.role) {
          setUserRole(data.role)
        }
      } catch (err) {
        console.warn('Failed to fetch permissions from backend, using fallback', err)
        setError(err.message)
        
        // FALLBACK: Use local config if backend unavailable
        // Map local action permissions to backend action names
        const fallbackActions = Object.entries(ACTION_PERMISSIONS)
          .filter(([_, action]) => action.roles && action.roles.includes(userRole))
          .map(([key, action]) => {
            // Convert action key to backend format
            // SHORTLIST_CANDIDATE -> shortlist
            return action.auditAction || key.toLowerCase()
          })
        
        setAllowedActions(fallbackActions)
      } finally {
        setIsLoading(false)
      }
    }

    if (token) {
      fetchPermissions()
    }
  }, [token, userRole])

  /**
   * Check if user can perform action
   * Converts action key to backend format for comparison
   * @param {string} actionKey - Action key (e.g., 'SHORTLIST_CANDIDATE')
   * @returns {boolean} True if user can perform action
   */
  const canPerform = (actionKey) => {
    // Get action details from local config
    const actionDetails = ACTION_PERMISSIONS[actionKey]
    
    if (!actionDetails) {
      console.warn(`Action not found: ${actionKey}`)
      return false
    }

    // Use auditAction from config if available, otherwise convert key
    const backendActionName = actionDetails.auditAction || 
      actionKey.toLowerCase().replace(/_/g, '_')

    // Check if action is in fetched allowed actions
    return allowedActions.includes(backendActionName)
  }

  /**
   * Get error message for denied action
   * @param {string} actionKey - Action key
   * @returns {string} Error message
   */
  const getErrorMessage = (actionKey) => {
    return `You do not have permission to perform this action (${actionKey})`
  }

  /**
   * Check permission and show error if denied
   * @param {string} actionKey - Action key
   * @param {Function} onDenied - Callback if permission denied
   * @returns {boolean} True if allowed
   */
  const checkAndNotify = (actionKey, onDenied = null) => {
    if (!canPerform(actionKey)) {
      if (onDenied) {
        onDenied(getErrorMessage(actionKey))
      }
      return false
    }
    return true
  }

  return {
    canPerform,
    getErrorMessage,
    checkAndNotify,
    userRole,
    allowedActions,
    isLoading,
    error,
  }
}

export default useActionPermission
