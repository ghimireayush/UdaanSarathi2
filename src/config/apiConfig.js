/**
 * Centralized API Configuration
 * Single source of truth for all API endpoints
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dev.kaha.com.np/job-portal'

export const API_ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_LOGOUT: '/auth/logout',
  
  // Agencies
  AGENCIES_SEARCH: '/agencies/search',
  AGENCIES_SEARCH_CONFIG: '/agencies/search/config',
  
  // Applications
  APPLICATIONS: '/applications',
  
  // Workflows
  WORKFLOWS: '/workflows',
  
  // Analytics
  ANALYTICS: '/analytics',
}

/**
 * Build full API URL
 * @param {string} endpoint - API endpoint path
 * @returns {string} Full API URL
 */
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`
}
