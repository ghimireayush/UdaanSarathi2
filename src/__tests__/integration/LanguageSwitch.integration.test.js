/**
 * LanguageSwitch Integration Test
 * Tests the integration between LanguageSwitch component and global language context
 */

import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import LanguageSwitch from '../../components/LanguageSwitch'
import { LanguageProvider } from '../../contexts/LanguageContext'
import i18nService from '../../services/i18nService'

// Mock i18nService
jest.mock('../../services/i18nService', () => ({
  init: jest.fn(),
  getLocale: jest.fn(() => 'en'),
  setLocale: jest.fn(() => Promise.resolve()),
  getAvailableLocales: jest.fn(() => ['en', 'ne']),
  getLocaleDisplayName: jest.fn((locale) => locale === 'en' ? 'English' : 'नेपाली'),
  t: jest.fn((key) => key),
  subscribeToLocaleChanges: jest.fn(() => () => {}),
  isInitialized: true,
  isRTL: jest.fn(() => false),
  formatDate: jest.fn(),
  formatNumber: jest.fn(),
  formatCurrency: jest.fn(),
  clearCache: jest.fn(),
  autoLoadPageTranslations: jest.fn(() => Promise.resolve({}))
}))

// Test wrapper with LanguageProvider
const TestWrapper = ({ children }) => (
  <LanguageProvider>
    {children}
  </LanguageProvider>
)

describe('LanguageSwitch Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('integrates successfully with LanguageProvider', () => {
    render(
      <TestWrapper>
        <LanguageSwitch />
      </TestWrapper>
    )

    // Should render without errors
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByText('English')).toBeInTheDocument()
  })

  test('uses global context for language state', () => {
    render(
      <TestWrapper>
        <LanguageSwitch />
      </TestWrapper>
    )

    // Should display current locale from context
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(i18nService.getLocale).toHaveBeenCalled()
  })

  test('calls setLocale from global context when language changes', async () => {
    render(
      <TestWrapper>
        <LanguageSwitch />
      </TestWrapper>
    )

    // Open dropdown
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })

    // Click on Nepali option
    const nepaliOption = screen.getByText('नेपाली')
    await act(async () => {
      fireEvent.click(nepaliOption)
    })

    // Should call setLocale from i18nService
    expect(i18nService.setLocale).toHaveBeenCalledWith('ne')
  })

  test('handles accessibility attributes correctly', () => {
    render(
      <TestWrapper>
        <LanguageSwitch />
      </TestWrapper>
    )

    const button = screen.getByRole('button')
    
    // Check ARIA attributes
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(button).toHaveAttribute('aria-haspopup', 'listbox')
    expect(button).toHaveAttribute('aria-label')
  })

  test('supports all component variants', () => {
    const { rerender } = render(
      <TestWrapper>
        <LanguageSwitch variant="primary" />
      </TestWrapper>
    )

    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-brand-navy')

    rerender(
      <TestWrapper>
        <LanguageSwitch variant="ghost" />
      </TestWrapper>
    )

    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-transparent')
  })

  test('supports callback prop for language changes', async () => {
    const onLanguageChange = jest.fn()
    
    render(
      <TestWrapper>
        <LanguageSwitch onLanguageChange={onLanguageChange} />
      </TestWrapper>
    )

    // Open dropdown and select language
    await act(async () => {
      fireEvent.click(screen.getByRole('button'))
    })

    const nepaliOption = screen.getByText('नेपाली')
    await act(async () => {
      fireEvent.click(nepaliOption)
    })

    // Should call the callback
    expect(onLanguageChange).toHaveBeenCalledWith('ne')
  })
})