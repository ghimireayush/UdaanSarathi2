import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider } from '../../contexts/LanguageContext'
import { useLanguage, usePageTranslations, useComponentTranslations } from '../../hooks/useLanguage'
import i18nService from '../../services/i18nService'

// Mock i18nService
jest.mock('../../services/i18nService', () => ({
  getLocale: jest.fn(() => 'en'),
  setLocale: jest.fn(),
  subscribeToLocaleChanges: jest.fn(() => jest.fn()),
  t: jest.fn((key) => key),
  tPage: jest.fn((pageName, key) => `${pageName}.${key}`),
  tComponent: jest.fn((componentName, key) => `${componentName}.${key}`),
  autoLoadPageTranslations: jest.fn(() => Promise.resolve({ title: 'Test Page' })),
  formatDate: jest.fn((date) => date.toString()),
  formatNumber: jest.fn((number) => number.toString()),
  formatCurrency: jest.fn((amount) => `$${amount}`),
  getAvailableLocales: jest.fn(() => ['en', 'ne']),
  getLocaleDisplayName: jest.fn((locale) => locale === 'en' ? 'English' : 'नेपाली'),
  isRTL: jest.fn(() => false),
  clearCache: jest.fn(),
  isInitialized: false,
  init: jest.fn(),
  default: {
    getLocale: jest.fn(() => 'en'),
    setLocale: jest.fn(),
    subscribeToLocaleChanges: jest.fn(() => jest.fn()),
    t: jest.fn((key) => key),
    tPage: jest.fn((pageName, key) => `${pageName}.${key}`),
    tComponent: jest.fn((componentName, key) => `${componentName}.${key}`),
    autoLoadPageTranslations: jest.fn(() => Promise.resolve({ title: 'Test Page' })),
    formatDate: jest.fn((date) => date.toString()),
    formatNumber: jest.fn((number) => number.toString()),
    formatCurrency: jest.fn((amount) => `$${amount}`),
    getAvailableLocales: jest.fn(() => ['en', 'ne']),
    getLocaleDisplayName: jest.fn((locale) => locale === 'en' ? 'English' : 'नेपाली'),
    isRTL: jest.fn(() => false),
    clearCache: jest.fn(),
    isInitialized: false,
    init: jest.fn()
  }
}))

describe('useLanguage hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Basic functionality', () => {
    const TestComponent = () => {
      const {
        locale,
        isLoading,
        error,
        setLocale,
        t,
        translate,
        bulkTranslate,
        hasTranslation
      } = useLanguage()

      const handleLocaleChange = async () => {
        await setLocale('ne')
      }

      const testBulkTranslate = () => {
        const translations = bulkTranslate(['key1', 'key2', 'key3'])
        return Object.keys(translations).join(',')
      }

      return (
        <div>
          <div data-testid="locale">{locale}</div>
          <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
          <div data-testid="error">{error || 'no-error'}</div>
          <div data-testid="translation">{t('test.key')}</div>
          <div data-testid="enhanced-translation">{translate('test.key', {}, { fallback: 'fallback-text' })}</div>
          <div data-testid="bulk-translations">{testBulkTranslate()}</div>
          <div data-testid="has-translation">{hasTranslation('test.key') ? 'exists' : 'not-exists'}</div>
          <button onClick={handleLocaleChange} data-testid="change-locale">
            Change Locale
          </button>
        </div>
      )
    }

    it('should provide enhanced translation functionality', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )

      expect(screen.getByTestId('locale')).toHaveTextContent('en')
      expect(screen.getByTestId('translation')).toHaveTextContent('test.key')
      expect(screen.getByTestId('enhanced-translation')).toHaveTextContent('fallback-text') // Uses fallback when translation equals key
      expect(screen.getByTestId('bulk-translations')).toHaveTextContent('key1,key2,key3')
      expect(screen.getByTestId('has-translation')).toHaveTextContent('not-exists')
    })

    it('should handle fallback translations', () => {
      i18nService.t.mockImplementation((key) => key) // Return key when translation not found

      const FallbackTestComponent = () => {
        const { translate } = useLanguage()
        return (
          <div data-testid="fallback-translation">
            {translate('missing.key', {}, { fallback: 'fallback-text' })}
          </div>
        )
      }

      render(
        <LanguageProvider>
          <FallbackTestComponent />
        </LanguageProvider>
      )

      expect(screen.getByTestId('fallback-translation')).toHaveTextContent('fallback-text')
    })
  })

  describe('Page-specific functionality', () => {
    const PageTestComponent = () => {
      const {
        tPageSync,
        loadPageTranslations,
        reloadPageTranslations,
        pageLoaded,
        pageError
      } = useLanguage({ pageName: 'dashboard', autoLoad: true })

      const handleReload = async () => {
        await reloadPageTranslations()
      }

      return (
        <div>
          <div data-testid="page-translation">{tPageSync('title')}</div>
          <div data-testid="page-loaded">{pageLoaded ? 'loaded' : 'not-loaded'}</div>
          <div data-testid="page-error">{pageError || 'no-error'}</div>
          <button onClick={handleReload} data-testid="reload-page">
            Reload Page
          </button>
        </div>
      )
    }

    it('should handle page-specific translations with auto-loading', async () => {
      render(
        <LanguageProvider>
          <PageTestComponent />
        </LanguageProvider>
      )

      await waitFor(() => {
        expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledWith('dashboard')
      })

      expect(screen.getByTestId('page-translation')).toHaveTextContent('title') // Falls back to regular translation
    })

    it('should handle page translation reloading', async () => {
      const user = userEvent.setup()
      
      render(
        <LanguageProvider>
          <PageTestComponent />
        </LanguageProvider>
      )

      const reloadButton = screen.getByTestId('reload-page')
      
      await act(async () => {
        await user.click(reloadButton)
      })

      expect(i18nService.clearCache).toHaveBeenCalledWith('dashboard')
      expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledWith('dashboard')
    })
  })

  describe('usePageTranslations hook', () => {
    const PageTranslationsTestComponent = () => {
      const { tPageSync, pageLoaded, loadPageTranslations } = usePageTranslations('dashboard')

      return (
        <div>
          <div data-testid="page-title">{tPageSync('title')}</div>
          <div data-testid="page-loaded">{pageLoaded ? 'loaded' : 'not-loaded'}</div>
        </div>
      )
    }

    it('should automatically load page translations', async () => {
      render(
        <LanguageProvider>
          <PageTranslationsTestComponent />
        </LanguageProvider>
      )

      await waitFor(() => {
        expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledWith('dashboard')
      })

      expect(screen.getByTestId('page-title')).toHaveTextContent('title') // Falls back to regular translation
    })
  })

  describe('useComponentTranslations hook', () => {
    const ComponentTranslationsTestComponent = () => {
      const { t, tComponent, locale } = useComponentTranslations('LanguageSwitch')

      return (
        <div>
          <div data-testid="component-translation">{tComponent('label')}</div>
          <div data-testid="regular-translation">{t('common.loading')}</div>
          <div data-testid="component-locale">{locale}</div>
        </div>
      )
    }

    it('should provide component-specific translations', () => {
      render(
        <LanguageProvider>
          <ComponentTranslationsTestComponent />
        </LanguageProvider>
      )

      expect(screen.getByTestId('component-translation')).toHaveTextContent('label') // Falls back to regular translation
      expect(screen.getByTestId('regular-translation')).toHaveTextContent('common.loading')
      expect(screen.getByTestId('component-locale')).toHaveTextContent('en')
    })
  })

  describe('Error handling', () => {
    const ErrorTestComponent = () => {
      const { translate, tPageSync } = useLanguage({ pageName: 'dashboard' })

      return (
        <div>
          <div data-testid="error-translation">
            {translate('error.key', {}, { fallback: 'error-fallback' })}
          </div>
          <div data-testid="page-error-translation">{tPageSync('error.key')}</div>
        </div>
      )
    }

    it('should handle translation errors gracefully', () => {
      i18nService.t.mockImplementation(() => {
        throw new Error('Translation error')
      })

      render(
        <LanguageProvider>
          <ErrorTestComponent />
        </LanguageProvider>
      )

      expect(screen.getByTestId('error-translation')).toHaveTextContent('error-fallback')
    })

    it('should handle page translation errors', () => {
      i18nService.tPage.mockImplementation(() => {
        throw new Error('Page translation error')
      })

      render(
        <LanguageProvider>
          <ErrorTestComponent />
        </LanguageProvider>
      )

      // Should fallback to regular translation
      expect(screen.getByTestId('page-error-translation')).toHaveTextContent('error.key')
    })
  })

  describe('Locale change effects', () => {
    const LocaleChangeTestComponent = () => {
      const { locale, setLocale, pageLoaded, pageError } = useLanguage({ 
        pageName: 'dashboard', 
        autoLoad: true 
      })

      const handleLocaleChange = async () => {
        await setLocale('ne')
      }

      return (
        <div>
          <div data-testid="locale">{locale}</div>
          <div data-testid="page-loaded">{pageLoaded ? 'loaded' : 'not-loaded'}</div>
          <div data-testid="page-error">{pageError || 'no-error'}</div>
          <button onClick={handleLocaleChange} data-testid="change-locale">
            Change Locale
          </button>
        </div>
      )
    }

    it('should reset page state when locale changes', async () => {
      const user = userEvent.setup()
      let mockCallback
      
      // Mock the subscription to capture the callback
      i18nService.subscribeToLocaleChanges.mockImplementation((callback) => {
        mockCallback = callback
        return jest.fn() // Return unsubscribe function
      })
      
      render(
        <LanguageProvider>
          <LocaleChangeTestComponent />
        </LanguageProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('page-loaded')).toHaveTextContent('loaded')
      })

      // Simulate locale change by calling the callback directly
      await act(async () => {
        // Simulate the locale change callback being triggered
        if (mockCallback) {
          mockCallback('ne', 'en')
        }
      })

      // Page state should reset
      expect(screen.getByTestId('page-loaded')).toHaveTextContent('not-loaded')
      expect(screen.getByTestId('page-error')).toHaveTextContent('no-error')
    })
  })
})