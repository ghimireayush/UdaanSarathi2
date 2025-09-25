import { renderHook, act, waitFor } from '@testing-library/react'
import { usePageTranslations } from '../../hooks/usePageTranslations'
import { LanguageProvider } from '../../contexts/LanguageContext'
import i18nService from '../../services/i18nService'

// Mock i18nService
jest.mock('../../services/i18nService', () => ({
  autoLoadPageTranslations: jest.fn(),
  getNestedValue: jest.fn(),
  interpolate: jest.fn(),
  getAvailableLocales: jest.fn(() => ['en', 'ne']),
  preloadPageTranslations: jest.fn(),
  getLocale: jest.fn(() => 'en'),
  init: jest.fn(),
  subscribeToLocaleChanges: jest.fn(() => () => {}),
  t: jest.fn((key) => key),
  tPage: jest.fn((page, key) => `${page}.${key}`),
  isRTL: jest.fn(() => false),
  formatDate: jest.fn((date) => date.toString()),
  formatNumber: jest.fn((num) => num.toString()),
  formatCurrency: jest.fn((amount) => `$${amount}`),
  getLocaleDisplayName: jest.fn((locale) => locale === 'en' ? 'English' : 'Nepali'),
  clearCache: jest.fn(),
  isInitialized: true,
  fallbackLocale: 'en'
}))

// Mock useLanguage hook
jest.mock('../../contexts/LanguageContext', () => ({
  ...jest.requireActual('../../contexts/LanguageContext'),
  useLanguage: () => ({
    locale: 'en',
    t: jest.fn((key) => key)
  })
}))

describe('usePageTranslations', () => {
  const wrapper = ({ children }) => (
    <LanguageProvider>{children}</LanguageProvider>
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should load translations on mount', async () => {
    const mockTranslations = {
      title: 'Test Page',
      content: 'Test content'
    }

    i18nService.autoLoadPageTranslations.mockResolvedValue(mockTranslations)

    const { result } = renderHook(
      () => usePageTranslations('test-page'),
      { wrapper }
    )

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledWith('test-page')
    expect(result.current.translations).toEqual(mockTranslations)
    expect(result.current.error).toBeNull()
  })

  it('should handle loading errors with retry', async () => {
    const error = new Error('Failed to load translations')
    i18nService.autoLoadPageTranslations
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ title: 'Retry Success' })

    const { result } = renderHook(
      () => usePageTranslations('test-page', { retryOnError: true, maxRetries: 1 }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    // Wait for retry
    await waitFor(() => {
      expect(result.current.error).toBeNull()
    }, { timeout: 3000 })

    expect(i18nService.autoLoadPageTranslations).toHaveBeenCalledTimes(2)
    expect(result.current.translations).toEqual({ title: 'Retry Success' })
  })

  it('should provide tPage function with fallback', () => {
    const mockTranslations = {
      sections: {
        header: {
          title: 'Page Title'
        }
      }
    }

    i18nService.autoLoadPageTranslations.mockResolvedValue(mockTranslations)
    i18nService.getNestedValue.mockImplementation((obj, key) => {
      if (key === 'sections.header.title') return 'Page Title'
      return null
    })
    i18nService.interpolate.mockImplementation((str) => str)

    const { result } = renderHook(
      () => usePageTranslations('test-page'),
      { wrapper }
    )

    act(() => {
      result.current.translations = mockTranslations
    })

    const translation = result.current.tPage('sections.header.title')
    expect(translation).toBe('Page Title')
  })

  it('should check if translation exists', () => {
    const mockTranslations = {
      title: 'Test Title'
    }

    i18nService.getNestedValue.mockImplementation((obj, key) => {
      return key === 'title' ? 'Test Title' : null
    })

    const { result } = renderHook(
      () => usePageTranslations('test-page'),
      { wrapper }
    )

    act(() => {
      result.current.translations = mockTranslations
    })

    expect(result.current.hasTranslation('title')).toBe(true)
    expect(result.current.hasTranslation('nonexistent')).toBe(false)
  })

  it('should allow manual retry', async () => {
    const error = new Error('Network error')
    i18nService.autoLoadPageTranslations
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce({ title: 'Manual Retry Success' })

    const { result } = renderHook(
      () => usePageTranslations('test-page', { retryOnError: false }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    act(() => {
      result.current.retry()
    })

    await waitFor(() => {
      expect(result.current.error).toBeNull()
    })

    expect(result.current.translations).toEqual({ title: 'Manual Retry Success' })
  })

  it('should preload other locales in background', async () => {
    const mockTranslations = { title: 'Test' }
    i18nService.autoLoadPageTranslations.mockResolvedValue(mockTranslations)

    renderHook(
      () => usePageTranslations('test-page', { preload: true }),
      { wrapper }
    )

    await waitFor(() => {
      expect(i18nService.autoLoadPageTranslations).toHaveBeenCalled()
    })

    // Wait for preload timeout
    await new Promise(resolve => setTimeout(resolve, 1100))

    expect(i18nService.preloadPageTranslations).toHaveBeenCalledWith(
      ['test-page'],
      'ne',
      true
    )
  })

  it('should return all translations for debugging', async () => {
    const mockTranslations = {
      title: 'Debug Test',
      sections: { header: 'Header' }
    }

    i18nService.autoLoadPageTranslations.mockResolvedValue(mockTranslations)

    const { result } = renderHook(
      () => usePageTranslations('test-page'),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.getAllTranslations()).toEqual(mockTranslations)
  })

  it('should handle empty page name gracefully', () => {
    const { result } = renderHook(
      () => usePageTranslations(''),
      { wrapper }
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.translations).toEqual({})
  })
})