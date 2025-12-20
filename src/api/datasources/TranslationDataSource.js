/**
 * Translation Data Source
 * Handles all translation file fetching from public folder
 * Fetches directly from static files, not through API
 */
class TranslationDataSource {
  constructor() {
    this.baseURL = '/translations'
  }

  /**
   * Fetch translation file directly from public folder
   * @param {string} path - Path to translation file relative to /translations
   * @returns {Promise<Object>} Translation data
   */
  async fetchTranslationFile(path) {
    try {
      const url = `${this.baseURL}${path}`
      console.log('[TranslationDataSource] Fetching from:', url)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[TranslationDataSource] Successfully loaded:', path)
      return data
    } catch (error) {
      console.error('[TranslationDataSource] Error loading translation file:', error)
      throw error
    }
  }

  /**
   * Get common translations for a locale
   * @param {string} locale - Locale code (e.g., 'en', 'ne')
   * @returns {Promise<Object>} Common translations
   */
  async getCommonTranslations(locale) {
    return this.fetchTranslationFile(`/${locale}/common.json`)
  }

  /**
   * Get page-specific translations
   * @param {string} locale - Locale code
   * @param {string} pageName - Page name
   * @returns {Promise<Object>} Page translations
   */
  async getPageTranslations(locale, pageName) {
    return this.fetchTranslationFile(`/${locale}/pages/${pageName}.json`)
  }

  /**
   * Get component-specific translations
   * @param {string} locale - Locale code
   * @param {string} componentName - Component name
   * @returns {Promise<Object>} Component translations
   */
  async getComponentTranslations(locale, componentName) {
    return this.fetchTranslationFile(`/${locale}/components/${componentName}.json`)
  }

  /**
   * Get generic translation file
   * @param {string} locale - Locale code
   * @param {string} file - File path relative to locale directory
   * @returns {Promise<Object>} Translation data
   */
  async getTranslationFile(locale, file) {
    return this.fetchTranslationFile(`/${locale}/${file}`)
  }
}

export default new TranslationDataSource()
