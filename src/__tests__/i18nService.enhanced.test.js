import i18nService from '../services/i18nService'

describe('Enhanced i18nService', () => {
  beforeEach(() => {
    // Clear cache before each test
    i18nService.clearCache()
    i18nService.missingTranslations.clear()
  })

  describe('Translation validation', () => {
    test('should validate translation objects correctly', () => {
      const validTranslations = {
        meta: { version: '1.0.0' },
        title: 'Test Title',
        nested: { key: 'Test Value' }
      }
      
      const result = i18nService.validateTranslations(validTranslations, 'test')
      expect(result).toBe(true)
    })

    test('should detect invalid translation objects', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      const result = i18nService.validateTranslations(null, 'test')
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    test('should warn about empty translation values', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const translationsWithEmpty = {
        meta: { version: '1.0.0' },
        title: '',
        valid: 'Valid Value'
      }
      
      i18nService.validateTranslations(translationsWithEmpty, 'test')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Empty translation value at test.title')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Missing translation tracking', () => {
    test('should track missing translations', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      i18nService.trackMissingTranslation('test.key', 'en')
      
      const missing = i18nService.getMissingTranslations()
      expect(missing).toContain('en:test.key')
      
      consoleSpy.mockRestore()
    })

    test('should not duplicate missing translation entries', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      i18nService.trackMissingTranslation('test.key', 'en')
      i18nService.trackMissingTranslation('test.key', 'en')
      
      const missing = i18nService.getMissingTranslations()
      const duplicates = missing.filter(key => key === 'en:test.key')
      expect(duplicates).toHaveLength(1)
      
      consoleSpy.mockRestore()
    })
  })

  describe('Bulk translation', () => {
    test('should translate multiple keys at once', () => {
      const keys = ['common.loading', 'common.error', 'common.success']
      const result = i18nService.bulkTranslate(keys)
      
      expect(Object.keys(result)).toContain('common.loading')
      expect(Object.keys(result)).toContain('common.error')
      expect(Object.keys(result)).toContain('common.success')
      expect(result['common.loading']).toBe('Loading...')
    })

    test('should handle parameters in bulk translation', () => {
      const keys = ['applications.loaded']
      const params = { count: 5, time: 150 }
      const result = i18nService.bulkTranslate(keys, params)
      
      expect(result['applications.loaded']).toContain('5')
      expect(result['applications.loaded']).toContain('150')
    })
  })

  describe('Cache management', () => {
    test('should clear cache completely', () => {
      // Add something to cache
      i18nService.translationCache.set('test-key', { test: 'value' })
      
      i18nService.clearCache()
      
      expect(i18nService.translationCache.size).toBe(0)
    })

    test('should clear cache by pattern', () => {
      // Add multiple items to cache
      i18nService.translationCache.set('en-page-login', { test: 'value1' })
      i18nService.translationCache.set('en-component-form', { test: 'value2' })
      i18nService.translationCache.set('ne-page-login', { test: 'value3' })
      
      i18nService.clearCache('page')
      
      expect(i18nService.translationCache.has('en-component-form')).toBe(true)
      expect(i18nService.translationCache.has('en-page-login')).toBe(false)
      expect(i18nService.translationCache.has('ne-page-login')).toBe(false)
    })
  })

  describe('Page and component translation methods', () => {
    test('should handle missing page translations gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      // Mock page translations
      i18nService.pageTranslations.set('en', new Map())
      i18nService.pageTranslations.get('en').set('login', {
        title: 'Login Page'
      })
      
      const result = i18nService.tPage('login', 'nonexistent.key')
      expect(result).toBe('nonexistent.key') // Should fallback to key
      
      consoleSpy.mockRestore()
    })

    test('should return page-specific translations when available', () => {
      // Mock page translations
      i18nService.pageTranslations.set('en', new Map())
      i18nService.pageTranslations.get('en').set('login', {
        title: 'Login Page',
        form: {
          username: 'Username'
        }
      })
      
      const result = i18nService.tPage('login', 'form.username')
      expect(result).toBe('Username')
    })

    test('should handle component translations', () => {
      // Mock component translations
      i18nService.componentTranslations.set('en', new Map())
      i18nService.componentTranslations.get('en').set('form', {
        submit: 'Submit Form',
        cancel: 'Cancel Action'
      })
      
      const result = i18nService.tComponent('form', 'submit')
      expect(result).toBe('Submit Form')
    })
  })
})