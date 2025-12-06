import httpClient from '../config/httpClient.js'

/**
 * Translation Data Source
 * Handles all API calls related to translations and i18n
 */
class TranslationDataSource {
  /**
   * Get common translations for a locale
   * @param {string} locale - Locale code (e.g., 'en', 'ne')
   * @returns {Promise<Object>} Common translations
   */
  async getCommonTranslations(locale) {
    return httpClient.get(`/translations/${locale}/common.json`)
  }

  /**
   * Get page-specific translations
   * @param {string} locale - Locale code
   * @param {string} pageName - Page name
   * @returns {Promise<Object>} Page translations
   */
  async getPageTranslations(locale, pageName) {
    return httpClient.get(`/translations/${locale}/pages/${pageName}.json`)
  }

  /**
   * Get component-specific translations
   * @param {string} locale - Locale code
   * @param {string} componentName - Component name
   * @returns {Promise<Object>} Component translations
   */
  async getComponentTranslations(locale, componentName) {
    return httpClient.get(`/translations/${locale}/components/${componentName}.json`)
  }

  /**
   * Get generic translation file
   * @param {string} locale - Locale code
   * @param {string} file - File path relative to locale directory
   * @returns {Promise<Object>} Translation data
   */
  async getTranslationFile(locale, file) {
    return httpClient.get(`/translations/${locale}/${file}`)
  }
}

export default new TranslationDataSource()
