import { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import i18nService from '../services/i18nService'

/**
 * Custom hook for automatic page translation loading
 * @param {string} pageName - Name of the page to load translations for
 * @param {Object} options - Configuration options
 * @returns {Object} Translation state and functions
 */
export const usePageTranslations = (pageName, options = {}) => {
  const {
    preload = true,
    fallbackToCommon = true,
    retryOnError = true,
    maxRetries = 3
  } = options

  const { locale, t } = useLanguage()
  const [translations, setTranslations] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  /**
   * Load translations for the current page
   */
  const loadTranslations = useCallback(async (retryAttempt = 0) => {
    if (!pageName) {
      console.warn('Page name is required for loading translations')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const pageTranslations = await i18nService.autoLoadPageTranslations(pageName)
      setTranslations(pageTranslations)
      setRetryCount(0) // Reset retry count on success
    } catch (err) {
      console.error(`Failed to load translations for ${pageName}:`, err)
      setError(err.message || 'Failed to load translations')
      
      // Retry logic
      if (retryOnError && retryAttempt < maxRetries) {
        const nextRetry = retryAttempt + 1
        setRetryCount(nextRetry)
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, retryAttempt) * 1000
        
        setTimeout(() => {
          loadTranslations(nextRetry)
        }, delay)
      }
    } finally {
      setIsLoading(false)
    }
  }, [pageName, retryOnError, maxRetries])

  /**
   * Get translation for a key with page context
   * @param {string} key - Translation key
   * @param {Object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  const tPage = useCallback((key, params = {}) => {
    // Try page-specific translation first
    const pageValue = i18nService.getNestedValue(translations, key)
    if (pageValue) {
      return i18nService.interpolate(pageValue, params)
    }

    // Fallback to common translations if enabled
    if (fallbackToCommon) {
      return t(key, params)
    }

    // Return key if no translation found
    console.warn(`Translation missing for key: ${key} in page: ${pageName}`)
    return key
  }, [translations, pageName, fallbackToCommon, t])

  /**
   * Check if a translation key exists
   * @param {string} key - Translation key to check
   * @returns {boolean} True if key exists
   */
  const hasTranslation = useCallback((key) => {
    return !!i18nService.getNestedValue(translations, key)
  }, [translations])

  /**
   * Get all translations for debugging
   * @returns {Object} All page translations
   */
  const getAllTranslations = useCallback(() => {
    return translations
  }, [translations])

  /**
   * Manually retry loading translations
   */
  const retry = useCallback(() => {
    loadTranslations(0)
  }, [loadTranslations])

  // Load translations when page name or locale changes
  useEffect(() => {
    if (pageName) {
      loadTranslations()
    }
  }, [pageName, locale, loadTranslations])

  // Preload translations for other locales in background
  useEffect(() => {
    if (preload && pageName && !isLoading && !error) {
      const availableLocales = i18nService.getAvailableLocales()
      const otherLocales = availableLocales.filter(loc => loc !== locale)
      
      // Preload in background after a short delay
      setTimeout(() => {
        i18nService.preloadPageTranslations([pageName], otherLocales[0], true)
      }, 1000)
    }
  }, [pageName, locale, preload, isLoading, error])

  return {
    // Translation data
    translations,
    
    // Loading state
    isLoading,
    error,
    retryCount,
    
    // Translation functions
    tPage,
    hasTranslation,
    getAllTranslations,
    
    // Control functions
    retry,
    loadTranslations: () => loadTranslations(0)
  }
}

export default usePageTranslations