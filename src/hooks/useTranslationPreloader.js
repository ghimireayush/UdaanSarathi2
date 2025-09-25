import { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import translationPreloader from '../utils/translationPreloader'

/**
 * Hook for automatic translation preloading based on navigation
 * @param {Object} options - Configuration options
 * @returns {Object} Preloader functions and state
 */
export const useTranslationPreloader = (options = {}) => {
  const {
    enabled = true,
    trackNavigation = true,
    preloadOnMount = true
  } = options

  const location = useLocation()

  /**
   * Get page name from current location
   * @returns {string} Current page name
   */
  const getCurrentPageName = useCallback(() => {
    const pathname = location.pathname
    
    // Extract page name from path
    if (pathname === '/') return 'dashboard'
    if (pathname === '/login') return 'login'
    if (pathname === '/login/member') return 'member-login'
    if (pathname === '/register') return 'register'
    if (pathname === '/dashboard') return 'dashboard'
    if (pathname === '/jobs') return 'jobs'
    if (pathname === '/applications') return 'applications'
    if (pathname === '/interviews') return 'interviews'
    if (pathname === '/workflow') return 'workflow'
    if (pathname === '/drafts') return 'drafts'
    if (pathname === '/teammembers') return 'team-members'
    if (pathname === '/auditlog') return 'audit-log'
    if (pathname === '/agencysettings') return 'agency-settings'
    
    // Default fallback
    return pathname.split('/')[1] || 'unknown'
  }, [location.pathname])

  /**
   * Track current page navigation
   */
  const trackCurrentPage = useCallback(() => {
    if (enabled && trackNavigation) {
      const pageName = getCurrentPageName()
      translationPreloader.trackNavigation(pageName)
    }
  }, [enabled, trackNavigation, getCurrentPageName])

  /**
   * Manually preload specific pages
   * @param {Array<string>} pageNames - Pages to preload
   */
  const preloadPages = useCallback((pageNames) => {
    if (enabled && Array.isArray(pageNames)) {
      pageNames.forEach(pageName => {
        translationPreloader.preloadForPage(pageName)
      })
    }
  }, [enabled])

  /**
   * Get intelligent preload suggestions for current page
   * @returns {Array<string>} Suggested pages to preload
   */
  const getPreloadSuggestions = useCallback(() => {
    if (!enabled) return []
    
    const currentPage = getCurrentPageName()
    return translationPreloader.getIntelligentSuggestions(currentPage)
  }, [enabled, getCurrentPageName])

  /**
   * Enable or disable preloading
   * @param {boolean} isEnabled - Whether to enable preloading
   */
  const setPreloaderEnabled = useCallback((isEnabled) => {
    translationPreloader.setEnabled(isEnabled)
  }, [])

  /**
   * Get preloader statistics
   * @returns {Object} Preloader stats
   */
  const getPreloaderStats = useCallback(() => {
    return translationPreloader.getStats()
  }, [])

  // Track navigation when location changes
  useEffect(() => {
    trackCurrentPage()
  }, [location.pathname, trackCurrentPage])

  // Preload critical pages on mount
  useEffect(() => {
    if (enabled && preloadOnMount) {
      translationPreloader.preloadCriticalPages()
    }
  }, [enabled, preloadOnMount])

  return {
    // Current state
    currentPage: getCurrentPageName(),
    enabled,
    
    // Functions
    trackCurrentPage,
    preloadPages,
    getPreloadSuggestions,
    setPreloaderEnabled,
    getPreloaderStats,
    
    // Preloader instance (for advanced usage)
    preloader: translationPreloader
  }
}

export default useTranslationPreloader