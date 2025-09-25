import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageProvider, useLanguage } from '../../contexts/LanguageContext'
import i18nService from '../../services/i18nService'

// Mock i18nService
jest.mock('../../services/i18nService', () => ({
  getLocale: jest.fn(() => 'en'),
  setLocale: jest.fn(),
  subscribeToLocaleChanges: jest.fn(() => jest.fn()), // Returns unsubscribe function
  t: jest.fn((key) => key),
  tPage: jest.fn((pageName, key) => `${pageName}.${key}`),
  autoLoadPageTranslations: jest.fn(() => Promise.resolve({})),
  formatDate: jest.fn((date) => date.toString()),
  formatNumber: jest.fn((number) => number.toString()),
  formatCurrency: jest.fn((amount) => `$${amount}`),
  getAvailableLocales: jest.fn(() => ['en', 'ne']),
  getLocaleDisplayName: jest.fn((locale) => locale === 'en' ? 'English' : 'नेपाली'),
  isRTL: jest.fn(() => false),
  clearCache: jest.fn(),
  isInitialized: false,
  init: jest.fn()
}))

// Test component that uses the language context
const TestComponent = ({ pageName }) => {
  const {
    locale,
    isLoading,
    error,
    setLocale,
    t,
    tPage,
    loadPageTranslations,
    availableLocales,
    getLocaleDisplayName
  } = useLanguage()

  const handleLocaleChange = async () => {
    await setLocale('ne')
  }

  const handleLoadPage = async () => {
    if (pageName) {
      await loadPageTranslations(pageName)
    }
  }

  return (
    <div>
      <div data-testid="locale">{locale}</div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="translation">{t('test.key')}</div>
      <div data-testid="available-locales">{availableLocales.join(',')}</div>
      <div data-testid="display-name">{getLocaleDisplayName(locale)}</div>
      <button onClick={handleLocaleChange} data-testid="change-locale">
        Change Locale
      </button>
      <button onClick={handleLoadPage} data-testid="load-page">
        Load Page
      </button>
    </div>
  )
}

describe('LanguageContext', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('LanguageProvider', () => {
    it('should provide language context to child components', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )

      expect(screen.getByTestId('locale')).toHaveTextContent('en')
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading')
      expect(screen.getByTestId('error')).toHaveTextContent('no-error')
      expect(screen.getByTestId('translation')).toHaveTextContent('test.key')
      expect(screen.getByTestId('available-locales')).toHaveTextContent('en,ne')
      expect(screen.getByTestId('display-name')).toHaveTextContent('English')
    })

    it('should initialize i18nService on mount', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )

      expect(i18nService.init).toHaveBeenCalled()
      expect(i18nService.subscribeToLocaleChanges).toHaveBeenCalled()
    })

    it('should handle locale changes with loading state', async () => {
      const user = userEvent.setup()
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )

      const changeButton = screen.getByTestId('change-locale')
      
      await act(async () => {
        await user.click(changeButton)
      })

      expect(i18nService.setLocale).toHaveBeenCalledWith('ne')
    })

    it('should handle page translation loading', async () => {
      const user = userEvent.setup()
      
      render(
        <LanguageProvider>
          <TestComponent pageName="dashboard" />
        </LanguageProvider>
      )

      const loadButton = screen.getByTestId('load-page')
      
      await act(async () => {
        await user.click(loadButton)
      })

      expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledWith('dashboard')
    })

    it('should handle errors gracefully', async () => {
      const user = userEvent.setup()
      i18nService.setLocale.mockRejectedValueOnce(new Error('Network error'))
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )

      const changeButton = screen.getByTestId('change-locale')
      
      await act(async () => {
        await user.click(changeButton)
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error')
      })
    })

    it('should clear errors on successful locale change', async () => {
      const user = userEvent.setup()
      
      // First, cause an error
      i18nService.setLocale.mockRejectedValueOnce(new Error('Network error'))
      
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )

      const changeButton = screen.getByTestId('change-locale')
      
      // Trigger error
      await act(async () => {
        await user.click(changeButton)
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Network error')
      })

      // Now succeed
      i18nService.setLocale.mockResolvedValueOnce()
      
      await act(async () => {
        await user.click(changeButton)
      })

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('no-error')
      })
    })
  })

  describe('useLanguage hook', () => {
    it('should throw error when used outside LanguageProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error
      console.error = jest.fn()

      expect(() => {
        render(<TestComponent />)
      }).toThrow('useLanguage must be used within a LanguageProvider')

      console.error = originalError
    })

    it('should provide all required context values', () => {
      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )

      // Verify all expected elements are rendered
      expect(screen.getByTestId('locale')).toBeInTheDocument()
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.getByTestId('error')).toBeInTheDocument()
      expect(screen.getByTestId('translation')).toBeInTheDocument()
      expect(screen.getByTestId('available-locales')).toBeInTheDocument()
      expect(screen.getByTestId('display-name')).toBeInTheDocument()
    })
  })

  describe('Translation functions', () => {
    it('should handle translation errors gracefully', () => {
      i18nService.t.mockImplementationOnce(() => {
        throw new Error('Translation error')
      })

      render(
        <LanguageProvider>
          <TestComponent />
        </LanguageProvider>
      )

      // Should fallback to key when translation fails
      expect(screen.getByTestId('translation')).toHaveTextContent('test.key')
    })

    it('should cache page translations', async () => {
      const user = userEvent.setup()
      
      render(
        <LanguageProvider>
          <TestComponent pageName="dashboard" />
        </LanguageProvider>
      )

      const loadButton = screen.getByTestId('load-page')
      
      // Load page translations twice
      await act(async () => {
        await user.click(loadButton)
      })
      
      await act(async () => {
        await user.click(loadButton)
      })

      // Should only call autoLoadPageTranslations once due to caching
      expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledTimes(1)
    })
  })

  describe('Formatting functions', () => {
    const FormattingTestComponent = () => {
      const { formatDate, formatNumber, formatCurrency } = useLanguage()

      return (
        <div>
          <div data-testid="formatted-date">{formatDate(new Date('2024-01-01'))}</div>
          <div data-testid="formatted-number">{formatNumber(1234.56)}</div>
          <div data-testid="formatted-currency">{formatCurrency(99.99)}</div>
        </div>
      )
    }

    it('should provide formatting functions', () => {
      render(
        <LanguageProvider>
          <FormattingTestComponent />
        </LanguageProvider>
      )

      expect(screen.getByTestId('formatted-date')).toBeInTheDocument()
      expect(screen.getByTestId('formatted-number')).toBeInTheDocument()
      expect(screen.getByTestId('formatted-currency')).toBeInTheDocument()
    })
  })

  describe('Cache management', () => {
    const CacheTestComponent = () => {
      const { clearCache } = useLanguage()

      const handleClearCache = () => {
        clearCache('dashboard')
      }

      return (
        <button onClick={handleClearCache} data-testid="clear-cache">
          Clear Cache
        </button>
      )
    }

    it('should provide cache clearing functionality', async () => {
      const user = userEvent.setup()
      
      render(
        <LanguageProvider>
          <CacheTestComponent />
        </LanguageProvider>
      )

      const clearButton = screen.getByTestId('clear-cache')
      
      await act(async () => {
        await user.click(clearButton)
      })

      expect(i18nService.clearCache).toHaveBeenCalledWith('dashboard')
    })
  })
})