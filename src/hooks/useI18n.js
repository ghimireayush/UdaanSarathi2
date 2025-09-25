// React hook for internationalization (backward compatibility)
import { useContext } from 'react'
import LanguageContext from '../contexts/LanguageContext'
import i18nService from '../services/i18nService'

/**
 * Custom hook for internationalization (backward compatibility)
 * This hook now uses the global LanguageContext when available,
 * but falls back to direct i18nService usage for backward compatibility
 * @returns {Object} i18n utilities and state
 */
export const useI18n = () => {
  const context = useContext(LanguageContext)
  
  // If context is available, use it (new global context system)
  if (context) {
    return {
      locale: context.locale,
      setLocale: context.setLocale,
      t: context.t,
      formatDate: context.formatDate,
      formatNumber: context.formatNumber,
      formatCurrency: context.formatCurrency,
      isLoading: context.isLoading,
      availableLocales: context.availableLocales,
      getLocaleDisplayName: context.getLocaleDisplayName,
      isRTL: context.isRTL
    }
  }

  // Fallback to direct i18nService usage (legacy behavior)
  console.warn('useI18n: LanguageProvider not found. Consider wrapping your app with LanguageProvider for better performance and features.')
  
  return {
    locale: i18nService.getLocale(),
    setLocale: async (newLocale) => {
      await i18nService.setLocale(newLocale)
    },
    t: (key, params = {}) => i18nService.t(key, params),
    formatDate: (date, options = {}) => i18nService.formatDate(date, options),
    formatNumber: (number, options = {}) => i18nService.formatNumber(number, options),
    formatCurrency: (amount, currency) => i18nService.formatCurrency(amount, currency),
    isLoading: false, // No loading state in legacy mode
    availableLocales: i18nService.getAvailableLocales(),
    getLocaleDisplayName: (locale) => i18nService.getLocaleDisplayName(locale),
    isRTL: i18nService.isRTL(i18nService.getLocale())
  }
}

export default useI18n