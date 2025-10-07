/**
 * Development tools for translation validation and debugging
 * These tools are only available in development mode
 */

import i18nService from '../services/i18nService.js'
import { validateAllTranslationFiles, compareTranslationsBetweenLocales } from './translationValidator.js'

/**
 * Translation development tools class
 */
class TranslationDevTools {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'development'
    this.logPrefix = '[Translation DevTools]'
    this.missingTranslationLog = new Map()
    this.validationCache = new Map()
    this.performanceMetrics = {
      validationTime: 0,
      lastValidation: null,
      totalValidations: 0
    }
  }

  /**
   * Initialize development tools
   */
  init() {
    if (!this.isEnabled) {
      return
    }

    // Add global methods for browser console access
    if (typeof window !== 'undefined') {
      window.translationDevTools = {
        validateAll: () => this.validateAllTranslations(),
        compareLocales: (base = 'en', compare = ['ne']) => this.compareLocales(base, compare),
        showMissingTranslations: () => this.showMissingTranslations(),
        clearMissingLog: () => this.clearMissingTranslationLog(),
        validateFile: (filePath) => this.validateSingleFile(filePath),
        generateReport: () => this.generateDevelopmentReport(),
        testFallbacks: () => this.testFallbackMechanisms(),
        checkStructure: () => this.checkTranslationStructure()
      }
      
      console.log(`${this.logPrefix} Development tools initialized. Use window.translationDevTools for debugging.`)
    }

    // Set up automatic validation on translation changes
    this.setupAutomaticValidation()
    
    // Log missing translations in real-time
    this.setupMissingTranslationTracking()
  }

  /**
   * Set up automatic validation when translations are loaded
   */
  setupAutomaticValidation() {
    if (!this.isEnabled) return

    // Override i18nService methods to add validation
    const originalLoadPageTranslations = i18nService.loadPageTranslations.bind(i18nService)
    
    i18nService.loadPageTranslations = async (pageName, locale) => {
      const result = await originalLoadPageTranslations(pageName, locale)
      
      // Validate loaded translations
      this.validateLoadedTranslations(result, `page-${pageName}`, locale)
      
      return result
    }
  }

  /**
   * Set up missing translation tracking
   */
  setupMissingTranslationTracking() {
    if (!this.isEnabled) return

    // Override the t function to track missing translations
    const originalT = i18nService.t.bind(i18nService)
    
    i18nService.t = (key, params = {}) => {
      const result = originalT(key, params)
      
      // Check if this is a fallback result
      if (this.isFallbackResult(result, key)) {
        this.logMissingTranslation(key, i18nService.getLocale())
      }
      
      return result
    }
  }

  /**
   * Check if a translation result is a fallback
   * @param {string} result - Translation result
   * @param {string} key - Original translation key
   * @returns {boolean} True if this is a fallback result
   */
  isFallbackResult(result, key) {
    // Check if result matches the generated fallback pattern
    const expectedFallback = this.generateExpectedFallback(key)
    return result === expectedFallback || result === key || result === '[Invalid Key]'
  }

  /**
   * Generate expected fallback for a key
   * @param {string} key - Translation key
   * @returns {string} Expected fallback
   */
  generateExpectedFallback(key) {
    const parts = key.split('.')
    const lastPart = parts[parts.length - 1]
    
    return lastPart
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
      .trim() || key
  }

  /**
   * Log missing translation
   * @param {string} key - Missing translation key
   * @param {string} locale - Current locale
   */
  logMissingTranslation(key, locale) {
    const logKey = `${locale}-${key}`
    
    if (!this.missingTranslationLog.has(logKey)) {
      this.missingTranslationLog.set(logKey, {
        key,
        locale,
        firstSeen: new Date(),
        count: 1,
        contexts: new Set()
      })
      
      console.warn(`${this.logPrefix} Missing translation: ${key} (${locale})`)
    } else {
      const entry = this.missingTranslationLog.get(logKey)
      entry.count++
      entry.lastSeen = new Date()
    }
  }

  /**
   * Validate loaded translations
   * @param {Object} translations - Loaded translations
   * @param {string} context - Validation context
   * @param {string} locale - Locale code
   */
  validateLoadedTranslations(translations, context, locale) {
    if (!translations || typeof translations !== 'object') {
      console.error(`${this.logPrefix} Invalid translations loaded for ${context} (${locale})`)
      return
    }

    const validationResult = i18nService.validateTranslations(translations, context)
    
    if (!validationResult.isValid) {
      console.group(`${this.logPrefix} Validation issues in ${context} (${locale})`)
      
      if (validationResult.errors.length > 0) {
        console.error('Errors:', validationResult.errors)
      }
      
      if (validationResult.warnings.length > 0) {
        console.warn('Warnings:', validationResult.warnings)
      }
      
      console.groupEnd()
    }
  }

  /**
   * Validate all translations
   * @returns {Promise<Object>} Validation report
   */
  async validateAllTranslations() {
    if (!this.isEnabled) {
      console.warn(`${this.logPrefix} Development tools are disabled in production`)
      return null
    }

    console.log(`${this.logPrefix} Starting comprehensive translation validation...`)
    const startTime = performance.now()
    
    try {
      const report = await validateAllTranslationFiles()
      const endTime = performance.now()
      
      this.performanceMetrics.validationTime = endTime - startTime
      this.performanceMetrics.lastValidation = new Date()
      this.performanceMetrics.totalValidations++
      
      console.group(`${this.logPrefix} Validation Complete (${(endTime - startTime).toFixed(2)}ms)`)
      console.log('Summary:', report.summary)
      
      if (report.summary.filesWithErrors > 0) {
        console.error(`Found errors in ${report.summary.filesWithErrors} files`)
      }
      
      if (report.summary.filesWithWarnings > 0) {
        console.warn(`Found warnings in ${report.summary.filesWithWarnings} files`)
      }
      
      if (report.recommendations.length > 0) {
        console.log('Recommendations:', report.recommendations)
      }
      
      console.groupEnd()
      
      return report
    } catch (error) {
      console.error(`${this.logPrefix} Validation failed:`, error)
      return { error: error.message }
    }
  }

  /**
   * Compare translations between locales
   * @param {string} baseLocale - Base locale
   * @param {Array<string>} compareLocales - Locales to compare
   * @returns {Promise<Object>} Comparison report
   */
  async compareLocales(baseLocale = 'en', compareLocales = ['ne']) {
    if (!this.isEnabled) {
      console.warn(`${this.logPrefix} Development tools are disabled in production`)
      return null
    }

    console.log(`${this.logPrefix} Comparing translations: ${baseLocale} vs ${compareLocales.join(', ')}`)
    
    try {
      const report = await compareTranslationsBetweenLocales(baseLocale, compareLocales)
      
      console.group(`${this.logPrefix} Locale Comparison Results`)
      
      for (const [locale, comparison] of Object.entries(report.comparisons)) {
        console.group(`${baseLocale} vs ${locale}`)
        console.log(`Total keys: ${comparison.totalKeys}`)
        console.log(`Missing keys: ${comparison.missingKeys.length}`)
        console.log(`Extra keys: ${comparison.extraKeys.length}`)
        console.log(`Structure mismatches: ${comparison.structureMismatches.length}`)
        
        if (comparison.missingKeys.length > 0) {
          console.warn('Missing keys:', comparison.missingKeys)
        }
        
        if (comparison.extraKeys.length > 0) {
          console.info('Extra keys:', comparison.extraKeys)
        }
        
        console.groupEnd()
      }
      
      console.groupEnd()
      
      return report
    } catch (error) {
      console.error(`${this.logPrefix} Locale comparison failed:`, error)
      return { error: error.message }
    }
  }

  /**
   * Show missing translations log
   */
  showMissingTranslations() {
    if (!this.isEnabled) {
      console.warn(`${this.logPrefix} Development tools are disabled in production`)
      return
    }

    if (this.missingTranslationLog.size === 0) {
      console.log(`${this.logPrefix} No missing translations detected`)
      return
    }

    console.group(`${this.logPrefix} Missing Translations (${this.missingTranslationLog.size} unique)`)
    
    const sortedEntries = Array.from(this.missingTranslationLog.entries())
      .sort(([, a], [, b]) => b.count - a.count)
    
    for (const [logKey, entry] of sortedEntries) {
      console.log(`${entry.key} (${entry.locale}) - Used ${entry.count} times`)
    }
    
    console.groupEnd()
    
    return Array.from(this.missingTranslationLog.values())
  }

  /**
   * Clear missing translation log
   */
  clearMissingTranslationLog() {
    this.missingTranslationLog.clear()
    console.log(`${this.logPrefix} Missing translation log cleared`)
  }

  /**
   * Validate a single translation file
   * @param {string} filePath - Path to the translation file
   * @returns {Promise<Object>} Validation result
   */
  async validateSingleFile(filePath) {
    if (!this.isEnabled) {
      console.warn(`${this.logPrefix} Development tools are disabled in production`)
      return null
    }

    try {
      const response = await fetch(filePath)
      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.status}`)
      }
      
      const translations = await response.json()
      const result = i18nService.validateTranslations(translations, filePath)
      
      console.group(`${this.logPrefix} File Validation: ${filePath}`)
      console.log('Valid:', result.isValid)
      
      if (result.errors.length > 0) {
        console.error('Errors:', result.errors)
      }
      
      if (result.warnings.length > 0) {
        console.warn('Warnings:', result.warnings)
      }
      
      console.groupEnd()
      
      return result
    } catch (error) {
      console.error(`${this.logPrefix} File validation failed:`, error)
      return { error: error.message, isValid: false }
    }
  }

  /**
   * Generate comprehensive development report
   * @returns {Promise<Object>} Development report
   */
  async generateDevelopmentReport() {
    if (!this.isEnabled) {
      console.warn(`${this.logPrefix} Development tools are disabled in production`)
      return null
    }

    console.log(`${this.logPrefix} Generating comprehensive development report...`)
    
    const report = {
      timestamp: new Date().toISOString(),
      performance: { ...this.performanceMetrics },
      missingTranslations: this.showMissingTranslations(),
      validation: await this.validateAllTranslations(),
      comparison: await this.compareLocales(),
      structure: await this.checkTranslationStructure()
    }
    
    console.log(`${this.logPrefix} Development report generated`)
    return report
  }

  /**
   * Test fallback mechanisms
   * @returns {Object} Test results
   */
  testFallbackMechanisms() {
    if (!this.isEnabled) {
      console.warn(`${this.logPrefix} Development tools are disabled in production`)
      return null
    }

    console.log(`${this.logPrefix} Testing fallback mechanisms...`)
    
    const testKeys = [
      'nonexistent.key',
      'common.nonexistent',
      'pages.login.nonexistent',
      '',
      null,
      undefined
    ]
    
    const results = {}
    
    for (const key of testKeys) {
      try {
        const result = i18nService.t(key)
        results[key || 'null/undefined'] = {
          input: key,
          output: result,
          isFallback: this.isFallbackResult(result, key)
        }
      } catch (error) {
        results[key || 'null/undefined'] = {
          input: key,
          error: error.message
        }
      }
    }
    
    console.table(results)
    return results
  }

  /**
   * Check translation file structure consistency
   * @returns {Promise<Object>} Structure check results
   */
  async checkTranslationStructure() {
    if (!this.isEnabled) {
      console.warn(`${this.logPrefix} Development tools are disabled in production`)
      return null
    }

    console.log(`${this.logPrefix} Checking translation structure consistency...`)
    
    const structureReport = {
      timestamp: new Date().toISOString(),
      locales: {},
      issues: [],
      recommendations: []
    }
    
    const locales = ['en', 'ne']
    const expectedFiles = [
      'common.json',
      'pages/login.json',
      'pages/register.json',
      'pages/dashboard.json',
      'pages/applications.json',
      'pages/interviews.json',
      'pages/jobs.json',
      'pages/workflow.json',
      'pages/drafts.json',
      'pages/team-members.json',
      'pages/audit-log.json',
      'pages/agency-settings.json',
      'pages/member-login.json'
    ]
    
    for (const locale of locales) {
      structureReport.locales[locale] = {
        existingFiles: [],
        missingFiles: [],
        extraFiles: []
      }
      
      for (const file of expectedFiles) {
        try {
          const response = await fetch(`/translations/${locale}/${file}`)
          if (response.ok) {
            structureReport.locales[locale].existingFiles.push(file)
          } else {
            structureReport.locales[locale].missingFiles.push(file)
          }
        } catch (error) {
          structureReport.locales[locale].missingFiles.push(file)
        }
      }
    }
    
    // Generate recommendations
    for (const [locale, data] of Object.entries(structureReport.locales)) {
      if (data.missingFiles.length > 0) {
        structureReport.recommendations.push({
          type: 'missing_files',
          locale,
          message: `${locale} locale is missing ${data.missingFiles.length} files`,
          files: data.missingFiles
        })
      }
    }
    
    console.log(`${this.logPrefix} Structure check complete`)
    console.table(structureReport.locales)
    
    return structureReport
  }
}

// Create and export singleton instance
const translationDevTools = new TranslationDevTools()

export default translationDevTools