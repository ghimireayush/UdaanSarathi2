import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import i18nService from '../services/i18nService'

// Create the Language Context
const LanguageContext = createContext(null)

/**
 * Language Provider Component
 * Provides language state and translation functions to all child components
 * 
 * TRANSLATION LOADING FLOW:
 * 1. LanguageProvider initializes i18nService
 * 2. i18nService loads hardcoded English translations (fallback)
 * 3. Components call useLanguage({ pageName: 'login', autoLoad: true })
 * 4. Hook calls loadPageTranslations('login')
 * 5. i18nService makes HTTP request to public/translations/ne/pages/login.json
 * 6. Translations are cached and used for rendering
 * 
 * KEY POINT: The app fetches translations from public/translations/ at runtime!
 * - src/translations/ is for source control only
 * - public/translations/ is what the browser actually uses
 * - Always keep them in sync!
 */
export const LanguageProvider = ({ children }) => {
  // Get the current locale from i18nService immediately (it's already detected in constructor)
  const [locale, setLocaleState] = useState(() => i18nService.getLocale())
  const [isLoading, setIsLoading] = useState(false)
  const [pageTranslations, setPageTranslations] = useState(new Map())
  const [error, setError] = useState(null)

  // Initialize i18n service on mount
  useEffect(() => {
    if (!i18nService.isInitialized) {
      i18nService.init()
    }
    
    // Ensure state is in sync with service after init
    const currentLocale = i18nService.getLocale()
    if (currentLocale !== locale) {
      setLocaleState(currentLocale)
    }
    
    // Subscribe to locale changes from i18nService
    const unsubscribe = i18nService.subscribeToLocaleChanges((newLocale) => {
      setLocaleState(newLocale)
      setError(null) // Clear any previous errors on successful locale change
    })

    return () => {
      unsubscribe()
    }
  }, [])

  // Clear page translations cache when locale changes (keep only current locale)
  useEffect(() => {
    setPageTranslations(prev => {
      const newMap = new Map()
      // Keep only translations for the current locale
      for (const [key, value] of prev.entries()) {
        if (key.startsWith(`${locale}-`)) {
          newMap.set(key, value)
        }
      }
      return newMap
    })
  }, [locale])

  /**
   * Change locale with loading state management
   * @param {string} newLocale - New locale to set
   */
  const setLocale = useCallback(async (newLocale) => {
    if (newLocale === locale) return

    setIsLoading(true)
    setError(null)

    try {
      await i18nService.setLocale(newLocale)
      // State will be updated via the subscription callback
    } catch (error) {
      console.error('Failed to change locale:', error)
      setError(error.message || 'Failed to change language')
    } finally {
      setIsLoading(false)
    }
  }, [locale])

  /**
   * Translation function with fallback handling
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  const t = useCallback((key, params = {}) => {
    try {
      return i18nService.t(key, params)
    } catch (error) {
      console.error('Translation error:', error)
      return key // Return key as fallback
    }
  }, [locale])

  /**
   * Page-specific translation function (synchronous)
   * @param {string} pageName - Name of the page
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  const tPage = useCallback((pageName, key, params = {}) => {
    try {
      return i18nService.tPage(pageName, key, params)
    } catch (error) {
      console.error('Page translation error:', error)
      // Fallback to regular translation
      return t(key, params)
    }
  }, [locale, t])

  /**
   * Load page translations manually
   * @param {string} pageName - Name of the page to load translations for
   * @param {Object} options - Loading options
   */
  const loadPageTranslations = useCallback(async (pageName, options = {}) => {
    const { 
      useCache = true, 
      preloadFallback = true,
      background = false 
    } = options
    
    const cacheKey = `${locale}-${pageName}`
    
    if (useCache && pageTranslations.has(cacheKey)) {
      return pageTranslations.get(cacheKey)
    }

    const loadingPromise = async () => {
      try {
        setIsLoading(true)
        const translations = await i18nService.loadPageTranslations(pageName, locale)
        setPageTranslations(prev => new Map(prev).set(cacheKey, translations))
        
        // Preload fallback locale in background if requested
        if (preloadFallback && locale !== i18nService.fallbackLocale) {
          setTimeout(() => {
            i18nService.loadPageTranslations(pageName, i18nService.fallbackLocale)
              .catch(err => console.warn(`Failed to preload fallback for ${pageName}:`, err))
          }, 100)
        }
        
        return translations
      } catch (error) {
        console.error(`Failed to load page translations for ${pageName}:`, error)
        setError(`Failed to load translations for ${pageName}`)
        return {}
      } finally {
        setIsLoading(false)
      }
    }

    if (background) {
      // Run in background without blocking
      setTimeout(() => {
        loadingPromise().catch(err => {
          console.warn(`Background loading failed for ${pageName}:`, err)
        })
      }, 0)
      return Promise.resolve({})
    }

    return loadingPromise()
  }, [locale, pageTranslations])

  /**
   * Preload multiple pages for better performance
   * @param {Array<string>} pageNames - Array of page names to preload
   * @param {Object} options - Preloading options
   */
  const preloadPages = useCallback(async (pageNames, options = {}) => {
    const { background = true } = options
    
    if (background) {
      // Preload in background
      setTimeout(() => {
        pageNames.forEach(pageName => {
          i18nService.loadPageTranslations(pageName, locale)
            .catch(err => console.warn(`Failed to preload ${pageName}:`, err))
        })
      }, 0)
      return Promise.resolve({ background: true })
    }
    
    // Load each page individually since preloadPageTranslations doesn't exist
    const results = await Promise.allSettled(
      pageNames.map(pageName => i18nService.loadPageTranslations(pageName, locale))
    )
    return results
  }, [locale])

  /**
   * Format date according to current locale
   * @param {Date|string} date - Date to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted date
   */
  const formatDate = useCallback((date, options = {}) => {
    return i18nService.formatDate(date, options)
  }, [locale])

  /**
   * Format number according to current locale
   * @param {number} number - Number to format
   * @param {Object} options - Formatting options
   * @returns {string} Formatted number
   */
  const formatNumber = useCallback((number, options = {}) => {
    return i18nService.formatNumber(number, options)
  }, [locale])

  /**
   * Format currency according to current locale
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency code
   * @returns {string} Formatted currency
   */
  const formatCurrency = useCallback((amount, currency) => {
    return i18nService.formatCurrency(amount, currency)
  }, [locale])

  /**
   * Get available locales
   * @returns {Array<string>} Array of available locale codes
   */
  const availableLocales = i18nService.getAvailableLocales()

  /**
   * Get display name for a locale
   * @param {string} localeCode - Locale code
   * @returns {string} Display name
   */
  const getLocaleDisplayName = useCallback((localeCode) => {
    return i18nService.getLocaleDisplayName(localeCode)
  }, [])

  /**
   * Check if current locale is RTL
   * @returns {boolean} True if RTL
   */
  const isRTL = i18nService.isRTL(locale)

  /**
   * Clear translation cache
   * @param {string} pattern - Optional pattern to match cache keys
   */
  const clearCache = useCallback((pattern) => {
    i18nService.clearCache(pattern)
    if (pattern) {
      // Clear matching page translations from local cache
      const newPageTranslations = new Map()
      for (const [key, value] of pageTranslations.entries()) {
        if (!key.includes(pattern)) {
          newPageTranslations.set(key, value)
        }
      }
      setPageTranslations(newPageTranslations)
    } else {
      setPageTranslations(new Map())
    }
  }, [pageTranslations])

  // Context value
  const contextValue = {
    // Core state
    locale,
    isLoading,
    error,
    
    // Locale management
    setLocale,
    availableLocales,
    getLocaleDisplayName,
    isRTL,
    
    // Translation functions
    t,
    tPage,
    loadPageTranslations,
    preloadPages,
    
    // Formatting functions
    formatDate,
    formatNumber,
    formatCurrency,
    
    // Utility functions
    clearCache
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

/**
 * Custom hook to use the Language Context
 * @returns {Object} Language context value
 */
export const useLanguage = () => {
  const context = useContext(LanguageContext)
  
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  
  return context
}

export default LanguageContext