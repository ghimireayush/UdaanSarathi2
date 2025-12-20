// Enhanced useLanguage hook with global context integration
import { useContext, useCallback, useEffect, useState } from 'react'
import LanguageContext from '../contexts/LanguageContext'

/**
 * Enhanced useLanguage hook that integrates with global language context
 * Provides comprehensive language management with loading states and error handling
 * 
 * USAGE EXAMPLE:
 * const { tPageSync, isLoading } = useLanguage({ pageName: 'login', autoLoad: true })
 * const label = tPageSync('form.phoneLabel')  // Gets from public/translations/
 * 
 * TRANSLATION LOADING:
 * When autoLoad: true, this hook automatically:
 * 1. Calls loadPageTranslations('login')
 * 2. Makes HTTP request to public/translations/ne/pages/login.json
 * 3. Caches translations in memory
 * 4. Makes them available via tPageSync()
 * 
 * @param {Object} options - Hook options
 * @param {string} options.pageName - Page name for automatic translation loading
 * @param {boolean} options.autoLoad - Whether to automatically load page translations
 * @returns {Object} Language utilities and state
 */
export const useLanguage = (options = {}) => {
  const context = useContext(LanguageContext)
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }

  const { pageName, autoLoad = false } = options
  const [pageLoaded, setPageLoaded] = useState(false)
  const [pageError, setPageError] = useState(null)

  // Destructure context for easier access
  const {
    locale,
    isLoading,
    error,
    setLocale,
    availableLocales,
    getLocaleDisplayName,
    isRTL,
    t,
    tPage,
    loadPageTranslations,
    formatDate,
    formatNumber,
    formatCurrency,
    clearCache
  } = context

  /**
   * Enhanced page translation function with automatic loading
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  const tPageEnhanced = useCallback(async (key, params = {}) => {
    if (!pageName) {
      console.warn('Page name not provided for tPage function')
      return t(key, params)
    }

    try {
      return await tPage(pageName, key, params)
    } catch (error) {
      console.error('Enhanced page translation error:', error)
      setPageError(error.message)
      return t(key, params)
    }
  }, [pageName, tPage, t])

  /**
   * Synchronous page translation function (for already loaded translations)
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  const tPageSync = useCallback((key, params = {}) => {
    if (!pageName) {
      return t(key, params)
    }

    try {
      // Get i18nService directly for synchronous access to page translations
      const i18nService = window.__i18nService || require('../services/i18nService').default
      if (i18nService && typeof i18nService.tPage === 'function') {
        return i18nService.tPage(pageName, key, params)
      }
      // Fallback to regular translation
      return t(key, params)
    } catch (error) {
      // Fallback to regular translation
      return t(key, params)
    }
  }, [pageName, t])

  /**
   * Load translations for the current page
   */
  const loadCurrentPageTranslations = useCallback(async () => {
    if (!pageName || pageLoaded) return

    try {
      setPageError(null)
      await loadPageTranslations(pageName)
      setPageLoaded(true)
    } catch (error) {
      console.error(`Failed to load translations for page ${pageName}:`, error)
      setPageError(error.message)
    }
  }, [pageName, pageLoaded, loadPageTranslations])

  /**
   * Reload page translations (useful for development or error recovery)
   */
  const reloadPageTranslations = useCallback(async () => {
    if (!pageName) return

    try {
      setPageError(null)
      setPageLoaded(false)
      
      // Clear cache for this page
      clearCache(pageName)
      
      // Reload translations
      await loadPageTranslations(pageName)
      setPageLoaded(true)
    } catch (error) {
      console.error(`Failed to reload translations for page ${pageName}:`, error)
      setPageError(error.message)
    }
  }, [pageName, loadPageTranslations, clearCache])

  // Auto-load page translations on mount or locale change
  useEffect(() => {
    if (autoLoad && pageName && !pageLoaded) {
      loadCurrentPageTranslations()
    }
  }, [autoLoad, pageName, pageLoaded, loadCurrentPageTranslations, locale])

  // Reset page loaded state when locale changes
  useEffect(() => {
    setPageLoaded(false)
    setPageError(null)
  }, [locale])

  /**
   * Get translation with automatic fallback chain
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for interpolation
   * @param {Object} options - Translation options
   * @returns {string} Translated text
   */
  const translate = useCallback((key, params = {}, options = {}) => {
    const { fallback, usePageTranslations = false } = options

    try {
      if (usePageTranslations && pageName) {
        return tPageSync(key, params)
      }
      
      const result = t(key, params)
      
      // If result is the same as key (meaning translation not found) and fallback is provided
      if (result === key && fallback) {
        return typeof fallback === 'function' ? fallback(key, params) : fallback
      }
      
      return result
    } catch (error) {
      console.error('Translation error:', error)
      return fallback || key
    }
  }, [t, tPageSync, pageName])

  /**
   * Bulk translate multiple keys for performance
   * @param {Array<string>} keys - Array of translation keys
   * @param {Object} params - Parameters for interpolation
   * @returns {Object} Object with keys and their translations
   */
  const bulkTranslate = useCallback((keys, params = {}) => {
    const result = {}
    
    for (const key of keys) {
      result[key] = translate(key, params)
    }
    
    return result
  }, [translate])

  /**
   * Check if a translation key exists
   * @param {string} key - Translation key to check
   * @returns {boolean} True if translation exists
   */
  const hasTranslation = useCallback((key) => {
    try {
      const result = t(key)
      return result !== key // If result equals key, translation doesn't exist
    } catch (error) {
      return false
    }
  }, [t])

  return {
    // Core state
    locale,
    isLoading,
    error,
    pageError,
    pageLoaded,
    
    // Locale management
    setLocale,
    availableLocales,
    getLocaleDisplayName,
    isRTL,
    
    // Translation functions
    t,
    tPage: tPageEnhanced,
    tPageSync,
    translate,
    bulkTranslate,
    hasTranslation,
    
    // Page translation management
    loadPageTranslations: loadCurrentPageTranslations,
    reloadPageTranslations,
    
    // Formatting functions
    formatDate,
    formatNumber,
    formatCurrency,
    
    // Utility functions
    clearCache
  }
}

/**
 * Hook for page-specific translations with automatic loading
 * @param {string} pageName - Name of the page
 * @returns {Object} Page-specific language utilities
 */
export const usePageTranslations = (pageName) => {
  return useLanguage({ 
    pageName, 
    autoLoad: true 
  })
}

/**
 * Hook for component-specific translations
 * @param {string} componentName - Name of the component
 * @returns {Object} Component-specific language utilities
 */
export const useComponentTranslations = (componentName) => {
  const { t, locale, isLoading } = useLanguage()
  
  /**
   * Component-specific translation function
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  const tComponent = useCallback((key, params = {}) => {
    try {
      // Import i18nService dynamically to avoid circular dependencies
      const i18nService = window.__i18nService || require('../services/i18nService').default
      if (i18nService && typeof i18nService.tComponent === 'function') {
        return i18nService.tComponent(componentName, key, params)
      }
      // Fallback to prefixed key format
      return t(`${componentName}.${key}`, params)
    } catch (error) {
      console.error('Component translation error:', error)
      return t(key, params)
    }
  }, [componentName, t, locale])

  return {
    t,
    tComponent,
    locale,
    isLoading
  }
}

export default useLanguage