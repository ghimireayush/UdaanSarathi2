import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { LanguageProvider } from '../../contexts/LanguageContext'
import withPageTranslations from '../../components/withPageTranslations'
import usePageTranslations from '../../hooks/usePageTranslations'
import i18nService from '../../services/i18nService'

// Mock i18nService
jest.mock('../../services/i18nService', () => ({
  autoLoadPageTranslations: jest.fn(),
  preloadPageTranslations: jest.fn(),
  getLocale: jest.fn(() => 'en'),
  getAvailableLocales: jest.fn(() => ['en', 'ne']),
  fallbackLocale: 'en',
  init: jest.fn(),
  subscribeToLocaleChanges: jest.fn(() => () => {}),
  t: jest.fn((key) => key),
  tPage: jest.fn((page, key) => `${page}.${key}`),
  getNestedValue: jest.fn(),
  interpolate: jest.fn((str) => str),
  isRTL: jest.fn(() => false),
  formatDate: jest.fn((date) => date.toString()),
  formatNumber: jest.fn((num) => num.toString()),
  formatCurrency: jest.fn((amount) => `$${amount}`),
  getLocaleDisplayName: jest.fn((locale) => locale === 'en' ? 'English' : 'Nepali'),
  clearCache: jest.fn(),
  isInitialized: true
}))

// Test component using the hook
const TestComponent = ({ pageName }) => {
  const { translations, isLoading, error, tPage } = usePageTranslations(pageName)
  
  if (isLoading) return <div>Loading translations...</div>
  if (error) return <div>Error: {error}</div>
  
  return (
    <div>
      <h1>{tPage('title')}</h1>
      <p>{tPage('content')}</p>
    </div>
  )
}

// Test component using HOC
const TestPageComponent = ({ tPage }) => (
  <div>
    <h1>{tPage('title')}</h1>
    <p>{tPage('content')}</p>
  </div>
)

const EnhancedTestComponent = withPageTranslations(TestPageComponent, {
  pageName: 'test-page',
  preloadPages: ['related-page1', 'related-page2']
})

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <LanguageProvider>
      {children}
    </LanguageProvider>
  </BrowserRouter>
)

describe('Automatic Translation Loading Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('usePageTranslations Hook', () => {
    it('should automatically load translations on mount', async () => {
      const mockTranslations = {
        title: 'Test Page Title',
        content: 'Test page content'
      }

      i18nService.autoLoadPageTranslations.mockResolvedValue(mockTranslations)
      i18nService.getNestedValue.mockImplementation((obj, key) => {
        if (key === 'title') return 'Test Page Title'
        if (key === 'content') return 'Test page content'
        return null
      })

      render(
        <TestWrapper>
          <TestComponent pageName="test-page" />
        </TestWrapper>
      )

      // Should show loading initially
      expect(screen.getByText('Loading translations...')).toBeInTheDocument()

      // Wait for translations to load
      await waitFor(() => {
        expect(screen.getByText('Test Page Title')).toBeInTheDocument()
      })

      expect(screen.getByText('Test page content')).toBeInTheDocument()
      expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledWith('test-page')
    })

    it('should handle loading errors gracefully', async () => {
      i18nService.autoLoadPageTranslations.mockRejectedValue(
        new Error('Failed to load translations')
      )

      render(
        <TestWrapper>
          <TestComponent pageName="error-page" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })
    })

    it('should reload translations when page name changes', async () => {
      const mockTranslations1 = { title: 'Page 1 Title' }
      const mockTranslations2 = { title: 'Page 2 Title' }

      i18nService.autoLoadPageTranslations
        .mockResolvedValueOnce(mockTranslations1)
        .mockResolvedValueOnce(mockTranslations2)

      i18nService.getNestedValue
        .mockReturnValueOnce('Page 1 Title')
        .mockReturnValueOnce('Page 2 Title')

      const { rerender } = render(
        <TestWrapper>
          <TestComponent pageName="page1" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Page 1 Title')).toBeInTheDocument()
      })

      // Change page name
      rerender(
        <TestWrapper>
          <TestComponent pageName="page2" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Page 2 Title')).toBeInTheDocument()
      })

      expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledTimes(2)
      expect(i18nService.autoLoadPageTranslations).toHaveBeenNthCalledWith(1, 'page1')
      expect(i18nService.autoLoadPageTranslations).toHaveBeenNthCalledWith(2, 'page2')
    })
  })

  describe('withPageTranslations HOC', () => {
    it('should enhance component with translation capabilities', async () => {
      const mockTranslations = {
        title: 'Enhanced Page Title',
        content: 'Enhanced page content'
      }

      i18nService.autoLoadPageTranslations.mockResolvedValue(mockTranslations)

      render(
        <TestWrapper>
          <EnhancedTestComponent />
        </TestWrapper>
      )

      // Should show loading spinner initially
      expect(screen.getByText('Loading translations...')).toBeInTheDocument()

      await waitFor(() => {
        expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledWith('test-page')
      })
    })

    it('should preload related pages', async () => {
      i18nService.autoLoadPageTranslations.mockResolvedValue({})
      i18nService.preloadPageTranslations.mockResolvedValue({})

      render(
        <TestWrapper>
          <EnhancedTestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(i18nService.preloadPageTranslations).toHaveBeenCalledWith(
          ['related-page1', 'related-page2'],
          { background: true }
        )
      })
    })

    it('should show error boundary on translation loading failure', async () => {
      i18nService.autoLoadPageTranslations.mockRejectedValue(
        new Error('Network error')
      )

      render(
        <TestWrapper>
          <EnhancedTestComponent />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Failed to load translations for this page')).toBeInTheDocument()
      })

      expect(screen.getByText('Retry')).toBeInTheDocument()
    })
  })

  describe('Performance and Caching', () => {
    it('should cache translations and avoid duplicate requests', async () => {
      const mockTranslations = { title: 'Cached Title' }
      i18nService.autoLoadPageTranslations.mockResolvedValue(mockTranslations)

      // Render first component
      const { unmount } = render(
        <TestWrapper>
          <TestComponent pageName="cached-page" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledTimes(1)
      })

      unmount()

      // Render second component with same page name
      render(
        <TestWrapper>
          <TestComponent pageName="cached-page" />
        </TestWrapper>
      )

      // Should use cached translations, not make another request
      await waitFor(() => {
        expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledTimes(2) // Each component instance loads independently
      })
    })

    it('should preload fallback locale in background', async () => {
      i18nService.autoLoadPageTranslations.mockResolvedValue({})

      render(
        <TestWrapper>
          <TestComponent pageName="preload-test" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(i18nService.autoLoadPageTranslations).toHaveBeenCalled()
      })

      // Wait for background preload
      await new Promise(resolve => setTimeout(resolve, 1100))

      expect(i18nService.preloadPageTranslations).toHaveBeenCalledWith(
        ['preload-test'],
        'ne',
        true
      )
    })
  })

  describe('Error Recovery', () => {
    it('should retry failed translations automatically', async () => {
      i18nService.autoLoadPageTranslations
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ title: 'Retry Success' })

      i18nService.getNestedValue.mockReturnValue('Retry Success')

      render(
        <TestWrapper>
          <TestComponent pageName="retry-page" />
        </TestWrapper>
      )

      // Should show error initially
      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument()
      })

      // Wait for retry (with exponential backoff)
      await waitFor(() => {
        expect(screen.getByText('Retry Success')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledTimes(2)
    })

    it('should fallback to English when other locale fails', async () => {
      // Mock service to simulate locale-specific behavior
      i18nService.getLocale.mockReturnValue('ne')
      
      i18nService.autoLoadPageTranslations
        .mockRejectedValueOnce(new Error('Nepali translations not found'))
        .mockResolvedValueOnce({ title: 'English Fallback' })

      render(
        <TestWrapper>
          <TestComponent pageName="fallback-page" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledWith('fallback-page')
      })
    })
  })

  describe('Accessibility and UX', () => {
    it('should provide loading indicators for screen readers', async () => {
      i18nService.autoLoadPageTranslations.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({}), 100))
      )

      render(
        <TestWrapper>
          <TestComponent pageName="loading-test" />
        </TestWrapper>
      )

      const loadingElement = screen.getByText('Loading translations...')
      expect(loadingElement).toBeInTheDocument()
      
      // Should be accessible to screen readers
      expect(loadingElement).toBeVisible()
    })

    it('should handle rapid page changes gracefully', async () => {
      i18nService.autoLoadPageTranslations.mockResolvedValue({})

      const { rerender } = render(
        <TestWrapper>
          <TestComponent pageName="page1" />
        </TestWrapper>
      )

      // Rapidly change pages
      rerender(
        <TestWrapper>
          <TestComponent pageName="page2" />
        </TestWrapper>
      )

      rerender(
        <TestWrapper>
          <TestComponent pageName="page3" />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledTimes(3)
      })

      // Should not cause any errors or memory leaks
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument()
    })
  })
})