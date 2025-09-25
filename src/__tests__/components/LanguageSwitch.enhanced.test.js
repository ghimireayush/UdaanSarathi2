/**
 * Enhanced LanguageSwitch Component Tests
 * Tests the integration with global language context and accessibility features
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('Enhanced LanguageSwitch Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Global Context Integration', () => {
    test('renders with global language context', () => {
      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      expect(screen.getByRole('button')).toBeInTheDocument()
      expect(screen.getByText('English')).toBeInTheDocument()
    })

    test('uses useLanguage hook instead of useI18n', () => {
      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      // Should not throw error about missing LanguageProvider
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    test('shows loading state during language change', async () => {
      const user = userEvent.setup()
      
      // Mock setLocale to simulate async operation
      i18nService.setLocale.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )

      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      // Open dropdown
      await user.click(screen.getByRole('button'))
      
      // Click on Nepali option
      const nepaliOption = screen.getByText('नेपाली')
      await user.click(nepaliOption)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/loading/i)).toBeInTheDocument()
      })
    })

    test('disables button during loading', async () => {
      const user = userEvent.setup()
      
      i18nService.setLocale.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      )

      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      
      // Open dropdown and select option
      await user.click(button)
      await user.click(screen.getByText('नेपाली'))

      // Button should be disabled during loading
      await waitFor(() => {
        expect(button).toBeDisabled()
      })
    })
  })

  describe('Accessibility Features', () => {
    test('has proper ARIA attributes', () => {
      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      
      expect(button).toHaveAttribute('aria-expanded', 'false')
      expect(button).toHaveAttribute('aria-haspopup', 'listbox')
      expect(button).toHaveAttribute('aria-label')
    })

    test('updates aria-expanded when dropdown opens', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      
      await user.click(button)
      
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    test('dropdown has proper listbox role', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      await user.click(screen.getByRole('button'))
      
      expect(screen.getByRole('listbox')).toBeInTheDocument()
    })

    test('options have proper option role and aria-selected', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      await user.click(screen.getByRole('button'))
      
      const options = screen.getAllByRole('option')
      expect(options).toHaveLength(2)
      
      // Current locale should be selected
      const englishOption = options.find(option => 
        option.textContent.includes('English')
      )
      expect(englishOption).toHaveAttribute('aria-selected', 'true')
    })
  })

  describe('Keyboard Navigation', () => {
    test('opens dropdown with Enter key', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      button.focus()
      
      await user.keyboard('{Enter}')
      
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    test('opens dropdown with Space key', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      button.focus()
      
      await user.keyboard(' ')
      
      expect(button).toHaveAttribute('aria-expanded', 'true')
    })

    test('closes dropdown with Escape key', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      
      // Open dropdown
      await user.click(button)
      expect(button).toHaveAttribute('aria-expanded', 'true')
      
      // Close with Escape
      await user.keyboard('{Escape}')
      
      expect(button).toHaveAttribute('aria-expanded', 'false')
    })
  })

  describe('Enhanced Props', () => {
    test('calls onLanguageChange callback when language changes', async () => {
      const user = userEvent.setup()
      const onLanguageChange = jest.fn()
      
      render(
        <TestWrapper>
          <LanguageSwitch onLanguageChange={onLanguageChange} />
        </TestWrapper>
      )

      // Open dropdown and select Nepali
      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('नेपाली'))

      await waitFor(() => {
        expect(onLanguageChange).toHaveBeenCalledWith('ne')
      })
    })

    test('maintains backward compatibility with existing props', () => {
      render(
        <TestWrapper>
          <LanguageSwitch 
            variant="primary"
            size="lg"
            showLabel={false}
            position="top-left"
            className="custom-class"
          />
        </TestWrapper>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
      
      // Should not show label when showLabel is false
      expect(screen.queryByText('English')).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('handles language change errors gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      // Mock setLocale to reject
      i18nService.setLocale.mockRejectedValueOnce(new Error('Network error'))
      
      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      // Try to change language
      await user.click(screen.getByRole('button'))
      await user.click(screen.getByText('नेपाली'))

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to change language:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Visual Enhancements', () => {
    test('shows Check icon for selected language', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <LanguageSwitch />
        </TestWrapper>
      )

      await user.click(screen.getByRole('button'))
      
      // Should have Check icon for current language (English)
      const englishOption = screen.getByText('English').closest('button')
      expect(englishOption.querySelector('svg')).toBeInTheDocument()
    })

    test('applies proper styling variants', () => {
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
  })
})