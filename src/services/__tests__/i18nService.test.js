import i18nService from '../i18nService'

// Mock fetch for translation files
global.fetch = jest.fn()

describe('i18nService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful fetch responses
    fetch.mockImplementation((url) => {
      if (url.includes('/translations/en/common.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            navigation: {
              dashboard: 'Dashboard',
              jobs: 'Jobs'
            },
            items: {
              dashboard: 'Dashboard',
              jobs: 'Jobs'
            }
          })
        })
      }
      if (url.includes('/translations/ne/common.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            navigation: {
              dashboard: 'ड्यासबोर्ड',
              jobs: 'कामहरू'
            },
            items: {
              dashboard: 'ड्यासबोर्ड',
              jobs: 'कामहरू'
            }
          })
        })
      }
      return Promise.reject(new Error('Not found'))
    })
  })

  test('should initialize with default locale', () => {
    expect(i18nService.getCurrentLocale()).toBe('en')
  })

  test('should translate keys correctly', async () => {
    await i18nService.loadTranslations('en')
    
    const translation = i18nService.t('navigation.dashboard')
    expect(translation).toBe('Dashboard')
  })

  test('should return key for missing translations', () => {
    const translation = i18nService.t('nonexistent.key')
    expect(translation).toBe('nonexistent.key')
  })

  test('should switch locales', async () => {
    await i18nService.setLocale('ne')
    expect(i18nService.getCurrentLocale()).toBe('ne')
  })

  test('should handle nested translation keys', async () => {
    await i18nService.loadTranslations('en')
    
    const translation = i18nService.t('navigation.dashboard')
    expect(translation).toBe('Dashboard')
  })

  test('should handle page-specific translations', async () => {
    await i18nService.loadTranslations('en')
    
    // Test page-specific translation method
    const pageTranslation = i18nService.tPage('navigation.items.dashboard')
    expect(typeof pageTranslation).toBe('string')
  })

  test('should preload critical translations', async () => {
    const result = await i18nService.preloadCriticalTranslations()
    expect(result).toBeDefined()
  })

  test('should handle translation loading errors gracefully', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))
    
    // Should not throw error
    await expect(i18nService.loadTranslations('invalid')).resolves.not.toThrow()
  })

  test('should provide available locales', () => {
    const locales = i18nService.getAvailableLocales()
    expect(locales).toContain('en')
    expect(locales).toContain('ne')
  })

  test('should validate locale codes', () => {
    expect(i18nService.isValidLocale('en')).toBe(true)
    expect(i18nService.isValidLocale('ne')).toBe(true)
    expect(i18nService.isValidLocale('invalid')).toBe(false)
  })
})