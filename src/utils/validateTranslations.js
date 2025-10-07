#!/usr/bin/env node

/**
 * Translation validation CLI tool
 * Usage: node src/utils/validateTranslations.js [options]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Translation validation CLI class
 */
class TranslationValidationCLI {
  constructor() {
    this.translationsDir = path.resolve(__dirname, '../translations')
    this.supportedLocales = ['en', 'ne']
    this.validationResults = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: 0,
        validFiles: 0,
        filesWithErrors: 0,
        filesWithWarnings: 0,
        totalErrors: 0,
        totalWarnings: 0
      },
      locales: {},
      recommendations: []
    }
  }

  /**
   * Run validation with command line arguments
   */
  async run() {
    const args = process.argv.slice(2)
    const options = this.parseArguments(args)

    console.log('🔍 Starting translation validation...\n')

    try {
      if (options.file) {
        await this.validateSingleFile(options.file)
      } else if (options.locale) {
        await this.validateLocale(options.locale)
      } else {
        await this.validateAllTranslations()
      }

      this.printResults(options)
      
      if (options.output) {
        this.saveResults(options.output)
      }

      // Exit with error code if validation failed
      const hasErrors = this.validationResults.summary.filesWithErrors > 0
      process.exit(hasErrors ? 1 : 0)

    } catch (error) {
      console.error('❌ Validation failed:', error.message)
      process.exit(1)
    }
  }

  /**
   * Parse command line arguments
   * @param {Array<string>} args - Command line arguments
   * @returns {Object} Parsed options
   */
  parseArguments(args) {
    const options = {
      verbose: false,
      output: null,
      file: null,
      locale: null,
      format: 'console'
    }

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      
      switch (arg) {
        case '--verbose':
        case '-v':
          options.verbose = true
          break
        case '--output':
        case '-o':
          options.output = args[++i]
          break
        case '--file':
        case '-f':
          options.file = args[++i]
          break
        case '--locale':
        case '-l':
          options.locale = args[++i]
          break
        case '--format':
          options.format = args[++i]
          break
        case '--help':
        case '-h':
          this.printHelp()
          process.exit(0)
          break
        default:
          if (arg.startsWith('-')) {
            console.warn(`Unknown option: ${arg}`)
          }
      }
    }

    return options
  }

  /**
   * Print help information
   */
  printHelp() {
    console.log(`
Translation Validation Tool

Usage: node src/utils/validateTranslations.js [options]

Options:
  -v, --verbose          Show detailed validation information
  -o, --output <file>    Save results to JSON file
  -f, --file <path>      Validate specific translation file
  -l, --locale <code>    Validate specific locale (en, ne)
  --format <type>        Output format (console, json, junit)
  -h, --help             Show this help message

Examples:
  node src/utils/validateTranslations.js
  node src/utils/validateTranslations.js --verbose
  node src/utils/validateTranslations.js --locale en
  node src/utils/validateTranslations.js --file public/translations/en/pages/login.json
  node src/utils/validateTranslations.js --output validation-report.json
`)
  }

  /**
   * Validate all translations
   */
  async validateAllTranslations() {
    for (const locale of this.supportedLocales) {
      await this.validateLocale(locale)
    }

    this.generateRecommendations()
  }

  /**
   * Validate translations for a specific locale
   * @param {string} locale - Locale code
   */
  async validateLocale(locale) {
    if (!this.supportedLocales.includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`)
    }

    console.log(`📁 Validating ${locale} translations...`)

    this.validationResults.locales[locale] = {
      files: {},
      summary: {
        totalFiles: 0,
        validFiles: 0,
        filesWithErrors: 0,
        filesWithWarnings: 0
      }
    }

    const localeDir = path.join(this.translationsDir, locale)
    
    // Validate common.json
    await this.validateFileIfExists(path.join(localeDir, 'common.json'), locale, 'common')

    // Validate page translations
    const pagesDir = path.join(localeDir, 'pages')
    if (fs.existsSync(pagesDir)) {
      const pageFiles = fs.readdirSync(pagesDir).filter(file => file.endsWith('.json'))
      
      for (const file of pageFiles) {
        const pageName = file.replace('.json', '')
        await this.validateFileIfExists(path.join(pagesDir, file), locale, `page-${pageName}`)
      }
    }

    // Validate component translations
    const componentsDir = path.join(localeDir, 'components')
    if (fs.existsSync(componentsDir)) {
      const componentFiles = fs.readdirSync(componentsDir).filter(file => file.endsWith('.json'))
      
      for (const file of componentFiles) {
        const componentName = file.replace('.json', '')
        await this.validateFileIfExists(path.join(componentsDir, file), locale, `component-${componentName}`)
      }
    }
  }

  /**
   * Validate a single file
   * @param {string} filePath - Path to the file
   */
  async validateSingleFile(filePath) {
    const fullPath = path.resolve(filePath)
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`)
    }

    // Extract locale and context from path
    const pathParts = fullPath.split(path.sep)
    const locale = pathParts[pathParts.length - 3] || 'unknown'
    const fileName = path.basename(fullPath, '.json')
    const context = pathParts[pathParts.length - 2] === 'pages' ? `page-${fileName}` : fileName

    console.log(`📄 Validating file: ${filePath}`)

    this.validationResults.locales[locale] = {
      files: {},
      summary: {
        totalFiles: 0,
        validFiles: 0,
        filesWithErrors: 0,
        filesWithWarnings: 0
      }
    }

    await this.validateFileIfExists(fullPath, locale, context)
  }

  /**
   * Validate a file if it exists
   * @param {string} filePath - Path to the file
   * @param {string} locale - Locale code
   * @param {string} context - Validation context
   */
  async validateFileIfExists(filePath, locale, context) {
    if (!fs.existsSync(filePath)) {
      return
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const translations = JSON.parse(content)
      
      const validationResult = this.validateTranslationObject(translations, context)
      
      // Update results
      const fileReport = {
        path: filePath,
        context,
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
        missingKeys: validationResult.missingKeys || [],
        emptyValues: validationResult.emptyValues || [],
        structureIssues: validationResult.structureIssues || [],
        errorCount: validationResult.errors.length,
        warningCount: validationResult.warnings.length,
        structureScore: validationResult.structureScore || 0
      }

      this.validationResults.locales[locale].files[context] = fileReport
      this.validationResults.locales[locale].summary.totalFiles++
      this.validationResults.summary.totalFiles++

      if (validationResult.isValid) {
        this.validationResults.locales[locale].summary.validFiles++
        this.validationResults.summary.validFiles++
        console.log(`  ✅ ${context} - Valid`)
      } else {
        this.validationResults.locales[locale].summary.filesWithErrors++
        this.validationResults.summary.filesWithErrors++
        console.log(`  ❌ ${context} - ${validationResult.errors.length} errors`)
      }

      if (validationResult.warnings.length > 0) {
        this.validationResults.locales[locale].summary.filesWithWarnings++
        this.validationResults.summary.filesWithWarnings++
        console.log(`  ⚠️  ${context} - ${validationResult.warnings.length} warnings`)
      }

      this.validationResults.summary.totalErrors += validationResult.errors.length
      this.validationResults.summary.totalWarnings += validationResult.warnings.length

    } catch (error) {
      const errorReport = {
        path: filePath,
        context,
        isValid: false,
        error: error.message,
        errorCount: 1,
        warningCount: 0
      }

      this.validationResults.locales[locale].files[context] = errorReport
      this.validationResults.locales[locale].summary.totalFiles++
      this.validationResults.locales[locale].summary.filesWithErrors++
      this.validationResults.summary.totalFiles++
      this.validationResults.summary.filesWithErrors++
      this.validationResults.summary.totalErrors++

      console.log(`  ❌ ${context} - Parse error: ${error.message}`)
    }
  }

  /**
   * Validate translation object
   * @param {Object} translations - Translation object
   * @param {string} context - Validation context
   * @returns {Object} Validation result
   */
  validateTranslationObject(translations, context) {
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      missingKeys: [],
      emptyValues: [],
      structureIssues: [],
      structureScore: 0
    }

    // Basic structure validation
    if (!translations || typeof translations !== 'object') {
      result.isValid = false
      result.errors.push(`Invalid translations object: expected object, got ${typeof translations}`)
      return result
    }

    // Validate meta information
    this.validateMeta(translations.meta, context, result)

    // Validate structure based on context
    this.validateStructure(translations, context, result)

    // Validate content
    this.validateContent(translations, context, result, '')

    // Validate interpolation syntax
    this.validateInterpolation(translations, context, result, '')

    result.isValid = result.errors.length === 0

    return result
  }

  /**
   * Validate meta information
   * @param {Object} meta - Meta object
   * @param {string} context - Context
   * @param {Object} result - Result object to update
   */
  validateMeta(meta, context, result) {
    if (!meta) {
      result.warnings.push('Missing meta information')
      return
    }

    const requiredFields = ['version', 'lastUpdated']
    for (const field of requiredFields) {
      if (!meta[field]) {
        result.warnings.push(`Missing required meta field: ${field}`)
      }
    }

    // Validate version format
    if (meta.version && !/^\d+\.\d+\.\d+$/.test(meta.version)) {
      result.warnings.push(`Invalid version format: ${meta.version}`)
    }

    // Validate date format
    if (meta.lastUpdated && isNaN(Date.parse(meta.lastUpdated))) {
      result.warnings.push(`Invalid lastUpdated format: ${meta.lastUpdated}`)
    }
  }

  /**
   * Validate structure
   * @param {Object} translations - Translation object
   * @param {string} context - Context
   * @param {Object} result - Result object to update
   */
  validateStructure(translations, context, result) {
    // Define expected structures
    const expectedStructures = {
      'page-login': ['title', 'form'],
      'page-register': ['title', 'form'],
      'page-dashboard': ['title'],
      'common': ['loading', 'error', 'success']
    }

    const expected = expectedStructures[context]
    if (expected) {
      let score = 0
      for (const key of expected) {
        if (translations[key]) {
          score += 1
        } else {
          result.missingKeys.push(key)
        }
      }
      result.structureScore = Math.round((score / expected.length) * 100)
    } else {
      result.structureScore = 100 // Default score for unknown contexts
    }

    // Check for title in page translations
    if (context.startsWith('page-') && !translations.title) {
      result.missingKeys.push('title')
    }
  }

  /**
   * Validate content recursively
   * @param {Object} obj - Object to validate
   * @param {string} context - Context
   * @param {Object} result - Result object to update
   * @param {string} path - Current path
   */
  validateContent(obj, context, result, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key

      if (currentPath === 'meta') continue

      if (typeof value === 'object' && value !== null) {
        this.validateContent(value, context, result, currentPath)
      } else if (typeof value === 'string') {
        // Check for empty values
        if (value.trim() === '') {
          result.emptyValues.push(currentPath)
        }

        // Check for placeholder text
        const placeholderPatterns = [
          /^(TODO|FIXME|TBD|PLACEHOLDER)/i,
          /^Lorem ipsum/i,
          /^\[.*\]$/
        ]

        for (const pattern of placeholderPatterns) {
          if (pattern.test(value)) {
            result.warnings.push(`Placeholder text at ${currentPath}: "${value}"`)
            break
          }
        }

        // Check for HTML tags
        if (/<[^>]+>/.test(value)) {
          result.warnings.push(`HTML tags detected at ${currentPath}`)
        }

        // Check for very long translations
        if (value.length > 500) {
          result.warnings.push(`Very long translation at ${currentPath} (${value.length} chars)`)
        }
      } else if (value !== null && value !== undefined) {
        result.structureIssues.push(`Non-string value at ${currentPath}: ${typeof value}`)
      }
    }
  }

  /**
   * Validate interpolation syntax
   * @param {Object} obj - Object to validate
   * @param {string} context - Context
   * @param {Object} result - Result object to update
   * @param {string} path - Current path
   */
  validateInterpolation(obj, context, result, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key

      if (currentPath === 'meta') continue

      if (typeof value === 'object' && value !== null) {
        this.validateInterpolation(value, context, result, currentPath)
      } else if (typeof value === 'string') {
        // Check interpolation syntax
        const interpolationMatches = value.match(/\{\{[^}]*\}\}/g)
        if (interpolationMatches) {
          for (const match of interpolationMatches) {
            const varName = match.slice(2, -2).trim()
            if (!varName) {
              result.errors.push(`Empty interpolation placeholder at ${currentPath}`)
            } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
              result.errors.push(`Invalid interpolation variable '${varName}' at ${currentPath}`)
            }
          }
        }

        // Check for unmatched braces
        const openBraces = (value.match(/\{\{/g) || []).length
        const closeBraces = (value.match(/\}\}/g) || []).length
        if (openBraces !== closeBraces) {
          result.errors.push(`Unmatched interpolation braces at ${currentPath}`)
        }
      }
    }
  }

  /**
   * Generate recommendations based on validation results
   */
  generateRecommendations() {
    const { summary, locales } = this.validationResults

    // High error rate recommendation
    const errorRate = summary.totalFiles > 0 ? (summary.filesWithErrors / summary.totalFiles) * 100 : 0
    if (errorRate > 50) {
      this.validationResults.recommendations.push({
        type: 'high_error_rate',
        severity: 'high',
        message: `${errorRate.toFixed(1)}% of translation files have errors`,
        action: 'Review and fix translation file structure and content issues'
      })
    }

    // Missing files between locales
    const localeKeys = Object.keys(locales)
    if (localeKeys.length > 1) {
      const [firstLocale, ...otherLocales] = localeKeys
      const firstLocaleFiles = Object.keys(locales[firstLocale].files)

      for (const otherLocale of otherLocales) {
        const otherLocaleFiles = Object.keys(locales[otherLocale].files)
        const missingFiles = firstLocaleFiles.filter(file => !otherLocaleFiles.includes(file))

        if (missingFiles.length > 0) {
          this.validationResults.recommendations.push({
            type: 'missing_files',
            severity: 'medium',
            message: `${otherLocale} locale is missing ${missingFiles.length} translation files`,
            action: `Create missing translation files: ${missingFiles.join(', ')}`
          })
        }
      }
    }

    // Empty values recommendation
    let totalEmptyValues = 0
    for (const locale of Object.values(locales)) {
      for (const file of Object.values(locale.files)) {
        if (file.emptyValues) {
          totalEmptyValues += file.emptyValues.length
        }
      }
    }

    if (totalEmptyValues > 0) {
      this.validationResults.recommendations.push({
        type: 'empty_values',
        severity: totalEmptyValues > 10 ? 'medium' : 'low',
        message: `${totalEmptyValues} empty translation values found`,
        action: 'Fill in empty translation values or remove unused keys'
      })
    }
  }

  /**
   * Print validation results
   * @param {Object} options - CLI options
   */
  printResults(options) {
    const { summary, locales, recommendations } = this.validationResults

    console.log('\n📊 Validation Summary:')
    console.log(`  Total files: ${summary.totalFiles}`)
    console.log(`  Valid files: ${summary.validFiles}`)
    console.log(`  Files with errors: ${summary.filesWithErrors}`)
    console.log(`  Files with warnings: ${summary.filesWithWarnings}`)
    console.log(`  Total errors: ${summary.totalErrors}`)
    console.log(`  Total warnings: ${summary.totalWarnings}`)

    if (options.verbose) {
      console.log('\n📁 Locale Details:')
      for (const [locale, data] of Object.entries(locales)) {
        console.log(`\n  ${locale.toUpperCase()}:`)
        console.log(`    Files: ${data.summary.totalFiles}`)
        console.log(`    Valid: ${data.summary.validFiles}`)
        console.log(`    Errors: ${data.summary.filesWithErrors}`)
        console.log(`    Warnings: ${data.summary.filesWithWarnings}`)

        for (const [context, file] of Object.entries(data.files)) {
          if (file.errorCount > 0 || file.warningCount > 0) {
            console.log(`    📄 ${context}:`)
            if (file.errors) {
              file.errors.forEach(error => console.log(`      ❌ ${error}`))
            }
            if (file.warnings) {
              file.warnings.forEach(warning => console.log(`      ⚠️  ${warning}`))
            }
          }
        }
      }
    }

    if (recommendations.length > 0) {
      console.log('\n💡 Recommendations:')
      recommendations.forEach((rec, index) => {
        const icon = rec.severity === 'high' ? '🔴' : rec.severity === 'medium' ? '🟡' : '🟢'
        console.log(`  ${icon} ${rec.message}`)
        console.log(`     Action: ${rec.action}`)
      })
    }

    const status = summary.filesWithErrors === 0 ? '✅ PASSED' : '❌ FAILED'
    console.log(`\n${status}`)
  }

  /**
   * Save results to file
   * @param {string} outputPath - Output file path
   */
  saveResults(outputPath) {
    try {
      fs.writeFileSync(outputPath, JSON.stringify(this.validationResults, null, 2))
      console.log(`\n💾 Results saved to: ${outputPath}`)
    } catch (error) {
      console.error(`Failed to save results: ${error.message}`)
    }
  }
}

// Run CLI if this file is executed directly
if (process.argv[1] && process.argv[1].endsWith('validateTranslations.js')) {
  const cli = new TranslationValidationCLI()
  cli.run().catch(error => {
    console.error('CLI execution failed:', error)
    process.exit(1)
  })
}

export default TranslationValidationCLI