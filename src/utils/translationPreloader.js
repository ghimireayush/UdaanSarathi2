import i18nService from '../services/i18nService'

/**
 * Translation preloader utility for intelligent preloading
 */
class TranslationPreloader {
  constructor() {
    this.navigationHistory = []
    this.preloadRules = new Map()
    this.isEnabled = true
    
    // Default preload rules based on common navigation patterns
    this.setupDefaultRules()
  }

  /**
   * Setup default preloading rules
   */
  setupDefaultRules() {
    // Authentication flow
    this.addPreloadRule('login', ['dashboard', 'register'])
    this.addPreloadRule('register', ['login', 'dashboard'])
    this.addPreloadRule('member-login', ['dashboard', 'login'])
    
    // Main application flow
    this.addPreloadRule('dashboard', ['jobs', 'applications', 'interviews'])
    this.addPreloadRule('jobs', ['applications', 'interviews', 'workflow'])
    this.addPreloadRule('applications', ['interviews', 'jobs'])
    this.addPreloadRule('interviews', ['applications', 'jobs'])
    
    // Management pages
    this.addPreloadRule('workflow', ['drafts', 'team-members'])
    this.addPreloadRule('drafts', ['workflow', 'jobs'])
    this.addPreloadRule('team-members', ['audit-log', 'agency-settings'])
    this.addPreloadRule('audit-log', ['team-members', 'agency-settings'])
    this.addPreloadRule('agency-settings', ['team-members', 'audit-log'])
  }

  /**
   * Add a preload rule for a page
   * @param {string} fromPage - Source page
   * @param {Array<string>} toPages - Pages to preload when on source page
   */
  addPreloadRule(fromPage, toPages) {
    this.preloadRules.set(fromPage, toPages)
  }

  /**
   * Remove a preload rule
   * @param {string} fromPage - Source page to remove rule for
   */
  removePreloadRule(fromPage) {
    this.preloadRules.delete(fromPage)
  }

  /**
   * Track page navigation for intelligent preloading
   * @param {string} pageName - Name of the page being navigated to
   */
  trackNavigation(pageName) {
    if (!this.isEnabled || !pageName) return

    // Add to navigation history
    this.navigationHistory.push({
      page: pageName,
      timestamp: Date.now()
    })

    // Keep only last 10 navigations
    if (this.navigationHistory.length > 10) {
      this.navigationHistory = this.navigationHistory.slice(-10)
    }

    // Trigger preloading based on rules
    this.preloadForPage(pageName)
  }

  /**
   * Preload translations based on rules for a specific page
   * @param {string} pageName - Current page name
   */
  preloadForPage(pageName) {
    const pagesToPreload = this.preloadRules.get(pageName)
    
    if (pagesToPreload && pagesToPreload.length > 0) {
      // Preload in background with a small delay to not interfere with current page loading
      setTimeout(() => {
        i18nService.preloadPageTranslations(pagesToPreload, i18nService.getLocale(), true)
          .catch(error => {
            console.warn(`Failed to preload translations for ${pageName}:`, error)
          })
      }, 500)
    }
  }

  /**
   * Get intelligent preload suggestions based on navigation history
   * @param {string} currentPage - Current page name
   * @returns {Array<string>} Suggested pages to preload
   */
  getIntelligentSuggestions(currentPage) {
    const suggestions = new Set()
    
    // Add rule-based suggestions
    const ruleSuggestions = this.preloadRules.get(currentPage) || []
    ruleSuggestions.forEach(page => suggestions.add(page))
    
    // Add history-based suggestions
    const recentPages = this.navigationHistory
      .slice(-5) // Last 5 navigations
      .map(nav => nav.page)
      .filter(page => page !== currentPage)
    
    recentPages.forEach(page => suggestions.add(page))
    
    return Array.from(suggestions)
  }

  /**
   * Preload critical pages for the application
   */
  preloadCriticalPages() {
    const criticalPages = ['login', 'dashboard', 'register', 'member-login', 'navigation']
    
    setTimeout(() => {
      i18nService.preloadPageTranslations(criticalPages, i18nService.getLocale(), true)
        .catch(error => {
          console.warn('Failed to preload critical pages:', error)
        })
    }, 1000)
  }

  /**
   * Enable or disable the preloader
   * @param {boolean} enabled - Whether to enable preloading
   */
  setEnabled(enabled) {
    this.isEnabled = enabled
  }

  /**
   * Get preloader statistics
   * @returns {Object} Statistics about preloading
   */
  getStats() {
    return {
      enabled: this.isEnabled,
      navigationHistory: this.navigationHistory.length,
      preloadRules: this.preloadRules.size,
      recentPages: this.navigationHistory.slice(-5).map(nav => nav.page)
    }
  }

  /**
   * Clear navigation history
   */
  clearHistory() {
    this.navigationHistory = []
  }

  /**
   * Export preload rules for backup/restore
   * @returns {Object} Serializable preload rules
   */
  exportRules() {
    return Object.fromEntries(this.preloadRules)
  }

  /**
   * Import preload rules from backup
   * @param {Object} rules - Rules to import
   */
  importRules(rules) {
    this.preloadRules.clear()
    for (const [fromPage, toPages] of Object.entries(rules)) {
      this.preloadRules.set(fromPage, toPages)
    }
  }
}

// Create and export singleton instance
const translationPreloader = new TranslationPreloader()

// Auto-initialize critical page preloading
if (typeof window !== 'undefined') {
  // Preload critical pages after a short delay
  setTimeout(() => {
    translationPreloader.preloadCriticalPages()
  }, 2000)
}

export default translationPreloader