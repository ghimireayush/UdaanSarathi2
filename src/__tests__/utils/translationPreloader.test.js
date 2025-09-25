import translationPreloader from '../../utils/translationPreloader'
import i18nService from '../../services/i18nService'

// Mock i18nService
jest.mock('../../services/i18nService', () => ({
  preloadPageTranslations: jest.fn(),
  getLocale: jest.fn(() => 'en')
}))

describe('TranslationPreloader', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    translationPreloader.clearHistory()
    translationPreloader.setEnabled(true)
  })

  it('should track navigation history', () => {
    translationPreloader.trackNavigation('login')
    translationPreloader.trackNavigation('dashboard')
    
    const stats = translationPreloader.getStats()
    expect(stats.navigationHistory).toBe(2)
    expect(stats.recentPages).toEqual(['login', 'dashboard'])
  })

  it('should limit navigation history to 10 entries', () => {
    // Add 15 navigation entries
    for (let i = 0; i < 15; i++) {
      translationPreloader.trackNavigation(`page-${i}`)
    }
    
    const stats = translationPreloader.getStats()
    expect(stats.navigationHistory).toBe(10)
  })

  it('should preload based on rules', (done) => {
    // Mock the preload function to resolve immediately
    i18nService.preloadPageTranslations.mockResolvedValue({})
    
    translationPreloader.trackNavigation('login')
    
    // Wait for the setTimeout in preloadForPage
    setTimeout(() => {
      expect(i18nService.preloadPageTranslations).toHaveBeenCalledWith(
        ['dashboard', 'register'],
        'en',
        true
      )
      done()
    }, 600)
  })

  it('should add and remove preload rules', () => {
    translationPreloader.addPreloadRule('custom-page', ['page1', 'page2'])
    
    const stats = translationPreloader.getStats()
    expect(stats.preloadRules).toBeGreaterThan(0)
    
    translationPreloader.removePreloadRule('custom-page')
    
    const newStats = translationPreloader.getStats()
    expect(newStats.preloadRules).toBe(stats.preloadRules - 1)
  })

  it('should provide intelligent suggestions', () => {
    // Add some navigation history
    translationPreloader.trackNavigation('dashboard')
    translationPreloader.trackNavigation('jobs')
    translationPreloader.trackNavigation('applications')
    
    const suggestions = translationPreloader.getIntelligentSuggestions('login')
    
    // Should include rule-based suggestions
    expect(suggestions).toContain('dashboard')
    expect(suggestions).toContain('register')
    
    // Should include history-based suggestions
    expect(suggestions).toContain('jobs')
    expect(suggestions).toContain('applications')
  })

  it('should enable/disable preloading', (done) => {
    translationPreloader.setEnabled(false)
    
    let stats = translationPreloader.getStats()
    expect(stats.enabled).toBe(false)
    
    // Clear any previous calls
    i18nService.preloadPageTranslations.mockClear()
    
    translationPreloader.trackNavigation('login')
    
    // Should not preload when disabled
    setTimeout(() => {
      expect(i18nService.preloadPageTranslations).not.toHaveBeenCalled()
      
      translationPreloader.setEnabled(true)
      const newStats = translationPreloader.getStats()
      expect(newStats.enabled).toBe(true)
      done()
    }, 600)
  })

  it('should export and import rules', () => {
    const customRules = {
      'page1': ['page2', 'page3'],
      'page2': ['page1']
    }
    
    translationPreloader.importRules(customRules)
    const exportedRules = translationPreloader.exportRules()
    
    expect(exportedRules).toEqual(customRules)
  })

  it('should preload critical pages', (done) => {
    i18nService.preloadPageTranslations.mockResolvedValue({})
    
    translationPreloader.preloadCriticalPages()
    
    setTimeout(() => {
      expect(i18nService.preloadPageTranslations).toHaveBeenCalledWith(
        ['login', 'dashboard', 'register', 'member-login'],
        'en',
        true
      )
      done()
    }, 1100)
  })

  it('should handle preload errors gracefully', (done) => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
    i18nService.preloadPageTranslations.mockRejectedValue(new Error('Network error'))
    
    // Clear previous calls
    i18nService.preloadPageTranslations.mockClear()
    
    translationPreloader.trackNavigation('login')
    
    setTimeout(() => {
      // Check if preload was attempted
      expect(i18nService.preloadPageTranslations).toHaveBeenCalled()
      consoleSpy.mockRestore()
      done()
    }, 600)
  })

  it('should clear navigation history', () => {
    translationPreloader.trackNavigation('page1')
    translationPreloader.trackNavigation('page2')
    
    expect(translationPreloader.getStats().navigationHistory).toBe(2)
    
    translationPreloader.clearHistory()
    
    expect(translationPreloader.getStats().navigationHistory).toBe(0)
  })

  it('should not track navigation when disabled', () => {
    translationPreloader.setEnabled(false)
    translationPreloader.trackNavigation('login')
    
    expect(translationPreloader.getStats().navigationHistory).toBe(0)
  })

  it('should handle empty page names gracefully', () => {
    expect(() => {
      translationPreloader.trackNavigation('')
      translationPreloader.trackNavigation(null)
      translationPreloader.trackNavigation(undefined)
    }).not.toThrow()
    
    expect(translationPreloader.getStats().navigationHistory).toBe(0)
  })
})