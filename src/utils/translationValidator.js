/**
 * Translation validation utilities for development and build-time validation
 */

import i18nService from '../services/i18nService.js'

/**
 * Validate translation file structure during development
 * @param {string} filePath - Path to the translation file
 * @param {Object} translations - Translation object to validate
 * @returns {Object} Validation result
 */
export function validateTranslationFile(filePath, translations) {
  const pathParts = filePath.split('/')
  const locale = pathParts[pathParts.length - 3] // Extract locale from path
  const fileName = pathParts[pathParts.length - 1].replace('.json', '')
  const context = `${locale}-${fileName}`
  
  return i18nService.validateTranslations(translations, context)
}

/**
 * Validate all translation files in a directory
 * @param {string} translationsDir - Path to translations directory
 * @returns {Promise<Object>} Comprehensive validation report
 */
export async function validateAllTranslationFiles(translationsDir = '/src/translations') {
  const report = {
    timestamp: new Date().toISOString(),
    directory: translationsDir,
    locales: {},
    summary: {
      totalFiles: 0,
      validFiles: 0,
      filesWithErrors: 0,
      filesWithWarnings: 0,
      totalErrors: 0,
      totalWarnings: 0
    },
    recommendations: []
  }
  
  try {
    // Get list of locales
    const locales = ['en', 'ne'] // Could be dynamic in the future
    
    for (const locale of locales) {
      report.locales[locale] = {
        files: {},
        summary: {
          totalFiles: 0,
          validFiles: 0,
          filesWithErrors: 0,
          filesWithWarnings: 0
        }
      }
      
      // Validate common translations
      await validateFileIfExists(`${translationsDir}/${locale}/common.json`, locale, 'common', report)
      
      // Validate page translations
      const pageFiles = [
        'login', 'register', 'dashboard', 'applications', 'interviews',
        'jobs', 'workflow', 'drafts', 'team-members', 'audit-log',
        'agency-settings', 'member-login'
      ]
      
      for (const pageFile of pageFiles) {
        await validateFileIfExists(`${translationsDir}/${locale}/pages/${pageFile}.json`, locale, `page-${pageFile}`, report)
      }
      
      // Validate component translations (if any exist)
      const componentFiles = ['navigation', 'forms', 'modals']
      for (const componentFile of componentFiles) {
        await validateFileIfExists(`${translationsDir}/${locale}/components/${componentFile}.json`, locale, `component-${componentFile}`, report)
      }
    }
    
    // Generate recommendations
    report.recommendations = generateValidationRecommendations(report)
    
  } catch (error) {
    console.error('Error during translation validation:', error)
    report.error = error.message
  }
  
  return report
}

/**
 * Validate a translation file if it exists
 * @param {string} filePath - Path to the file
 * @param {string} locale - Locale code
 * @param {string} context - Validation context
 * @param {Object} report - Report object to update
 */
async function validateFileIfExists(filePath, locale, context, report) {
  try {
    const response = await fetch(filePath)
    if (!response.ok) {
      // File doesn't exist, skip validation
      return
    }
    
    const translations = await response.json()
    const validationResult = i18nService.validateTranslations(translations, context)
    
    // Update report
    const fileReport = {
      path: filePath,
      context,
      isValid: validationResult.isValid,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      missingKeys: validationResult.missingKeys,
      emptyValues: validationResult.emptyValues,
      structureIssues: validationResult.structureIssues,
      errorCount: validationResult.errors.length,
      warningCount: validationResult.warnings.length
    }
    
    report.locales[locale].files[context] = fileReport
    report.locales[locale].summary.totalFiles++
    report.summary.totalFiles++
    
    if (validationResult.isValid) {
      report.locales[locale].summary.validFiles++
      report.summary.validFiles++
    } else {
      report.locales[locale].summary.filesWithErrors++
      report.summary.filesWithErrors++
    }
    
    if (validationResult.warnings.length > 0) {
      report.locales[locale].summary.filesWithWarnings++
      report.summary.filesWithWarnings++
    }
    
    report.summary.totalErrors += validationResult.errors.length
    report.summary.totalWarnings += validationResult.warnings.length
    
  } catch (error) {
    console.error(`Error validating ${filePath}:`, error)
    
    // Add error to report
    const errorReport = {
      path: filePath,
      context,
      isValid: false,
      error: error.message,
      errorCount: 1,
      warningCount: 0
    }
    
    report.locales[locale].files[context] = errorReport
    report.locales[locale].summary.totalFiles++
    report.locales[locale].summary.filesWithErrors++
    report.summary.totalFiles++
    report.summary.filesWithErrors++
    report.summary.totalErrors++
  }
}

/**
 * Generate validation recommendations based on report
 * @param {Object} report - Validation report
 * @returns {Array} Array of recommendations
 */
function generateValidationRecommendations(report) {
  const recommendations = []
  
  // Check overall error rate
  const errorRate = report.summary.totalFiles > 0 ? 
    (report.summary.filesWithErrors / report.summary.totalFiles) * 100 : 0
  
  if (errorRate > 50) {
    recommendations.push({
      type: 'high_error_rate',
      severity: 'high',
      message: `${errorRate.toFixed(1)}% of translation files have errors`,
      action: 'Review and fix translation file structure and content issues'
    })
  } else if (errorRate > 20) {
    recommendations.push({
      type: 'moderate_error_rate',
      severity: 'medium',
      message: `${errorRate.toFixed(1)}% of translation files have errors`,
      action: 'Consider implementing stricter validation in development workflow'
    })
  }
  
  // Check for missing files between locales
  const localeKeys = Object.keys(report.locales)
  if (localeKeys.length > 1) {
    const [firstLocale, ...otherLocales] = localeKeys
    const firstLocaleFiles = Object.keys(report.locales[firstLocale].files)
    
    for (const otherLocale of otherLocales) {
      const otherLocaleFiles = Object.keys(report.locales[otherLocale].files)
      const missingFiles = firstLocaleFiles.filter(file => !otherLocaleFiles.includes(file))
      
      if (missingFiles.length > 0) {
        recommendations.push({
          type: 'missing_files',
          severity: 'medium',
          message: `${otherLocale} locale is missing ${missingFiles.length} translation files`,
          action: `Create missing translation files: ${missingFiles.join(', ')}`,
          details: { locale: otherLocale, missingFiles }
        })
      }
    }
  }
  
  // Check for empty translations
  let totalEmptyValues = 0
  for (const locale of Object.values(report.locales)) {
    for (const file of Object.values(locale.files)) {
      if (file.emptyValues) {
        totalEmptyValues += file.emptyValues.length
      }
    }
  }
  
  if (totalEmptyValues > 0) {
    recommendations.push({
      type: 'empty_values',
      severity: totalEmptyValues > 10 ? 'medium' : 'low',
      message: `${totalEmptyValues} empty translation values found`,
      action: 'Fill in empty translation values or remove unused keys'
    })
  }
  
  return recommendations
}

/**
 * Compare translations between locales to find inconsistencies
 * @param {string} baseLocale - Base locale to compare against (usually 'en')
 * @param {Array<string>} compareLocales - Locales to compare
 * @returns {Object} Comparison report
 */
export async function compareTranslationsBetweenLocales(baseLocale = 'en', compareLocales = ['ne']) {
  const report = {
    timestamp: new Date().toISOString(),
    baseLocale,
    compareLocales,
    comparisons: {},
    summary: {
      totalKeys: 0,
      missingKeys: 0,
      extraKeys: 0,
      structureMismatches: 0
    }
  }
  
  try {
    // Load base locale translations
    const baseTranslations = await loadAllTranslationsForLocale(baseLocale)
    
    for (const compareLocale of compareLocales) {
      const compareTranslations = await loadAllTranslationsForLocale(compareLocale)
      
      const comparison = compareTranslationStructures(baseTranslations, compareTranslations, baseLocale, compareLocale)
      report.comparisons[compareLocale] = comparison
      
      // Update summary
      report.summary.totalKeys += comparison.totalKeys
      report.summary.missingKeys += comparison.missingKeys.length
      report.summary.extraKeys += comparison.extraKeys.length
      report.summary.structureMismatches += comparison.structureMismatches.length
    }
    
  } catch (error) {
    console.error('Error comparing translations:', error)
    report.error = error.message
  }
  
  return report
}

/**
 * Load all translations for a specific locale
 * @param {string} locale - Locale code
 * @returns {Object} All translations for the locale
 */
async function loadAllTranslationsForLocale(locale) {
  const translations = {}
  
  // Load common translations
  try {
    const commonResponse = await fetch(`/src/translations/${locale}/common.json`)
    if (commonResponse.ok) {
      translations.common = await commonResponse.json()
    }
  } catch (error) {
    console.warn(`Failed to load common translations for ${locale}:`, error)
  }
  
  // Load page translations
  const pageFiles = [
    'login', 'register', 'dashboard', 'applications', 'interviews',
    'jobs', 'workflow', 'drafts', 'team-members', 'audit-log',
    'agency-settings', 'member-login'
  ]
  
  translations.pages = {}
  for (const pageFile of pageFiles) {
    try {
      const pageResponse = await fetch(`/src/translations/${locale}/pages/${pageFile}.json`)
      if (pageResponse.ok) {
        translations.pages[pageFile] = await pageResponse.json()
      }
    } catch (error) {
      console.warn(`Failed to load ${pageFile} translations for ${locale}:`, error)
    }
  }
  
  return translations
}

/**
 * Compare translation structures between two locales
 * @param {Object} baseTranslations - Base locale translations
 * @param {Object} compareTranslations - Compare locale translations
 * @param {string} baseLocale - Base locale code
 * @param {string} compareLocale - Compare locale code
 * @returns {Object} Comparison result
 */
function compareTranslationStructures(baseTranslations, compareTranslations, baseLocale, compareLocale) {
  const result = {
    baseLocale,
    compareLocale,
    totalKeys: 0,
    missingKeys: [],
    extraKeys: [],
    structureMismatches: [],
    emptyValues: []
  }
  
  // Compare common translations
  if (baseTranslations.common) {
    const commonComparison = compareObjectStructures(
      baseTranslations.common,
      compareTranslations.common || {},
      'common'
    )
    mergeComparisonResults(result, commonComparison)
  }
  
  // Compare page translations
  if (baseTranslations.pages) {
    for (const [pageName, basePageTranslations] of Object.entries(baseTranslations.pages)) {
      const comparePageTranslations = compareTranslations.pages?.[pageName] || {}
      const pageComparison = compareObjectStructures(
        basePageTranslations,
        comparePageTranslations,
        `pages.${pageName}`
      )
      mergeComparisonResults(result, pageComparison)
    }
  }
  
  return result
}

/**
 * Compare two translation objects recursively
 * @param {Object} baseObj - Base object
 * @param {Object} compareObj - Object to compare
 * @param {string} path - Current path in the object
 * @returns {Object} Comparison result
 */
function compareObjectStructures(baseObj, compareObj, path = '') {
  const result = {
    totalKeys: 0,
    missingKeys: [],
    extraKeys: [],
    structureMismatches: [],
    emptyValues: []
  }
  
  if (!baseObj || typeof baseObj !== 'object') {
    return result
  }
  
  // Check for missing keys in compare object
  for (const [key, value] of Object.entries(baseObj)) {
    const currentPath = path ? `${path}.${key}` : key
    result.totalKeys++
    
    if (key === 'meta') {
      continue // Skip meta comparison
    }
    
    if (!(key in compareObj)) {
      result.missingKeys.push(currentPath)
    } else if (typeof value === 'object' && value !== null) {
      if (typeof compareObj[key] !== 'object' || compareObj[key] === null) {
        result.structureMismatches.push({
          path: currentPath,
          baseType: 'object',
          compareType: typeof compareObj[key]
        })
      } else {
        // Recursively compare nested objects
        const nestedResult = compareObjectStructures(value, compareObj[key], currentPath)
        mergeComparisonResults(result, nestedResult)
      }
    } else if (typeof value === 'string') {
      if (typeof compareObj[key] !== 'string') {
        result.structureMismatches.push({
          path: currentPath,
          baseType: 'string',
          compareType: typeof compareObj[key]
        })
      } else if (compareObj[key].trim() === '') {
        result.emptyValues.push(currentPath)
      }
    }
  }
  
  // Check for extra keys in compare object
  if (compareObj && typeof compareObj === 'object') {
    for (const key of Object.keys(compareObj)) {
      if (key !== 'meta' && !(key in baseObj)) {
        const currentPath = path ? `${path}.${key}` : key
        result.extraKeys.push(currentPath)
      }
    }
  }
  
  return result
}

/**
 * Merge comparison results
 * @param {Object} target - Target result object
 * @param {Object} source - Source result object
 */
function mergeComparisonResults(target, source) {
  target.totalKeys += source.totalKeys
  target.missingKeys.push(...source.missingKeys)
  target.extraKeys.push(...source.extraKeys)
  target.structureMismatches.push(...source.structureMismatches)
  target.emptyValues.push(...source.emptyValues)
}

/**
 * Generate translation validation report for CI/CD
 * @returns {Promise<Object>} CI-friendly validation report
 */
export async function generateCIValidationReport() {
  const report = await validateAllTranslationFiles()
  
  // Convert to CI-friendly format
  const ciReport = {
    success: report.summary.filesWithErrors === 0,
    timestamp: report.timestamp,
    summary: {
      totalFiles: report.summary.totalFiles,
      validFiles: report.summary.validFiles,
      filesWithErrors: report.summary.filesWithErrors,
      filesWithWarnings: report.summary.filesWithWarnings,
      errorRate: report.summary.totalFiles > 0 ? 
        (report.summary.filesWithErrors / report.summary.totalFiles) * 100 : 0
    },
    errors: [],
    warnings: [],
    recommendations: report.recommendations
  }
  
  // Collect all errors and warnings
  for (const [locale, localeData] of Object.entries(report.locales)) {
    for (const [context, fileData] of Object.entries(localeData.files)) {
      if (fileData.errors) {
        ciReport.errors.push(...fileData.errors.map(error => ({
          locale,
          context,
          message: error
        })))
      }
      
      if (fileData.warnings) {
        ciReport.warnings.push(...fileData.warnings.map(warning => ({
          locale,
          context,
          message: warning
        })))
      }
    }
  }
  
  return ciReport
}

export default {
  validateTranslationFile,
  validateAllTranslationFiles,
  compareTranslationsBetweenLocales,
  generateCIValidationReport
}