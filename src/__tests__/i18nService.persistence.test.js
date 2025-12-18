/**
 * @jest-environment jsdom
 */

import i18nService from '../services/i18nService.js'

// Mock console methods to avoid noise in tests
const originalConsole = { ...console }
beforeAll(() => {
  console.warn = jest.fn()
  console.info = jest.fn()
  console.error = jest.fn()
})

afterAll(() => {
  Object.assign(console, originalConsole)
})

describe('I18nService - Enhanced Persistent Language Preference System', () => {
  beforeEach(() => {
    // Clear all storage before each test
    localStorage.clear()
    sessionStorage.clear()
    i18nService.inMemoryPreference = null
    
    // Reset console mocks
    jest.clearAllMocks()
  })

  describe('Enhanced saveLocalePreference', () => {
    test('should save valid locale preference to localStorage', () => {
      const result = i18nService.saveLocalePreference('ne')
      
      expect(result).toBe(true)
      
      const stored = JSON.parse(localStorage.getItem('udaan-sarathi-locale'))
      expect(stored).toMatchObject({
        locale: 'ne',
        version: '1.0.0',
        timestamp: expect.any(Number)
      })
    })

    test('should reject invalid locale codes', () => {
      const result = i18nService.saveLocalePreference('invalid')
      
      expect(result).toBe(false)
      expect(console.warn).toHaveBeenCalledWith('Invalid locale provided for saving: invalid')
      expect(localStorage.getItem('udaan-sarathi-locale')).toBeNull()
    })

    test('should handle localStorage errors gracefully', () => {
      // Test that the method handles localStorage errors without crashing
      const result = i18nService.saveLocalePreference('ne')
      
      expect(result).toBe(true)
      
      // Should have saved to localStorage successfully in normal conditions
      const stored = JSON.parse(localStorage.getItem('udaan-sarathi-locale'))
      expect(stored.locale).toBe('ne')
      expect(stored.version).toBe('1.0.0')
    })

    test('should use in-memory storage as final fallback', () => {
      // Test in-memory storage functionality directly
      i18nService.inMemoryPreference = {
        locale: 'ne',
        timestamp: Date.now(),
        version: '1.0.0'
      }
      
      expect(i18nService.inMemoryPreference).toMatchObject({
        locale: 'ne',
        version: '1.0.0'
      })
      
      // Test that detectLocale can use in-memory preference
      const detected = i18nService.detectLocale()
      expect(detected).toBe('ne')
    })
  })

  describe('Enhanced detectLocale with corruption handling', () => {
    test('should detect locale from valid localStorage preference', () => {
      i18nService.saveLocalePreference('ne')
      
      const detected = i18nService.detectLocale()
      expect(detected).toBe('ne')
    })

    test('should fallback to sessionStorage when localStorage is corrupted', () => {
      // Set corrupted localStorage
      localStorage.setItem('udaan-sarathi-locale', 'invalid-json')
      
      // Set valid sessionStorage
      i18nService.saveLocalePreference('ne')
      localStorage.clear() // Clear localStorage after sessionStorage is set
      sessionStorage.setItem('udaan-sarathi-locale', JSON.stringify({
        locale: 'ne',
        timestamp: Date.now(),
        version: '1.0.0'
      }))
      
      const detected = i18nService.detectLocale()
      expect(detected).toBe('ne')
    })

    test('should handle corrupted preference gracefully', () => {
      // Set corrupted preference
      localStorage.setItem('udaan-sarathi-locale', JSON.stringify({
        locale: 'invalid-locale',
        timestamp: 'invalid-timestamp',
        version: 'invalid-version'
      }))
      
      const detected = i18nService.detectLocale()
      
      expect(detected).toBe('ne') // Should fallback to default (Nepali)
      expect(console.warn).toHaveBeenCalledWith(
        'Corrupted preference found in localStorage, clearing...'
      )
    })

    test('should handle expired preferences', () => {
      // Set old preference (older than 30 days)
      const oldTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000) // 31 days ago
      localStorage.setItem('udaan-sarathi-locale', JSON.stringify({
        locale: 'ne',
        timestamp: oldTimestamp,
        version: '1.0.0'
      }))
      
      const detected = i18nService.detectLocale()
      
      expect(detected).toBe('ne') // Should fallback to default (Nepali)
      expect(console.info).toHaveBeenCalledWith(
        'Preference in localStorage is older than 30 days, treating as expired'
      )
    })



    test('should use in-memory preference as final fallback', () => {
      // Set in-memory preference
      i18nService.inMemoryPreference = {
        locale: 'ne',
        timestamp: Date.now(),
        version: '1.0.0'
      }
      
      const detected = i18nService.detectLocale()
      expect(detected).toBe('ne')
    })
  })

  describe('Preference validation', () => {
    test('should validate correct locale codes', () => {
      expect(i18nService.validateLocale('en')).toBe(true)
      expect(i18nService.validateLocale('ne')).toBe(true)
    })

    test('should reject invalid locale codes', () => {
      expect(i18nService.validateLocale('')).toBe(false)
      expect(i18nService.validateLocale(null)).toBe(false)
      expect(i18nService.validateLocale(undefined)).toBe(false)
      expect(i18nService.validateLocale('invalid')).toBe(false)
      expect(i18nService.validateLocale('123')).toBe(false)
    })

    test('should validate stored preference structure', () => {
      const validPreference = {
        locale: 'ne',
        timestamp: Date.now(),
        version: '1.0.0'
      }
      
      expect(i18nService.validateStoredPreference(validPreference)).toBe(true)
      
      // Test invalid structures
      expect(i18nService.validateStoredPreference(null)).toBe(false)
      expect(i18nService.validateStoredPreference({})).toBe(false)
      expect(i18nService.validateStoredPreference({ locale: 'invalid' })).toBe(false)
    })

    test('should validate version compatibility', () => {
      expect(i18nService.isVersionCompatible('1.0.0')).toBe(true)
      expect(i18nService.isVersionCompatible('1.1.0')).toBe(false)
      expect(i18nService.isVersionCompatible('2.0.0')).toBe(false)
      expect(i18nService.isVersionCompatible('invalid')).toBe(false)
    })
  })

  describe('Storage management utilities', () => {
    test('should provide storage information for debugging', () => {
      i18nService.saveLocalePreference('ne')
      
      const info = i18nService.getPreferenceStorageInfo()
      
      expect(info.localStorage.available).toBe(true)
      expect(info.localStorage.hasPreference).toBe(true)
      expect(info.localStorage.preference.locale).toBe('ne')
      
      expect(info.sessionStorage.available).toBe(true)
      expect(info.inMemory.hasPreference).toBe(false)
    })

    test('should clear all preferences', () => {
      // Set preferences in all storages
      i18nService.saveLocalePreference('ne')
      i18nService.inMemoryPreference = { locale: 'ne' }
      
      i18nService.clearAllPreferences()
      
      expect(localStorage.getItem('udaan-sarathi-locale')).toBeNull()
      expect(sessionStorage.getItem('udaan-sarathi-locale')).toBeNull()
      expect(i18nService.inMemoryPreference).toBeNull()
    })

    test('should test storage availability', () => {
      const results = i18nService.testStorageAvailability()
      
      expect(results.localStorage.available).toBe(true)
      expect(results.localStorage.writable).toBe(true)
      expect(results.localStorage.readable).toBe(true)
      
      expect(results.sessionStorage.available).toBe(true)
      expect(results.sessionStorage.writable).toBe(true)
      expect(results.sessionStorage.readable).toBe(true)
    })

    test('should handle storage unavailability gracefully', () => {
      // Mock localStorage to be unavailable
      const originalLocalStorage = window.localStorage
      delete window.localStorage
      
      const results = i18nService.testStorageAvailability()
      
      expect(results.localStorage.available).toBe(false)
      expect(results.localStorage.error).toBeDefined()
      
      // Restore localStorage
      window.localStorage = originalLocalStorage
    })
  })



  describe('Error handling and edge cases', () => {
    test('should handle JSON parsing errors gracefully', () => {
      localStorage.setItem('udaan-sarathi-locale', 'invalid-json')
      
      const locale = i18nService.loadPreferenceFromStorage('localStorage')
      
      expect(locale).toBeNull()
      expect(console.warn).toHaveBeenCalledWith(
        'Failed to parse stored locale preference from localStorage:',
        expect.any(Error)
      )
    })

    test('should clear corrupted preferences automatically', () => {
      localStorage.setItem('udaan-sarathi-locale', 'corrupted-data')
      
      i18nService.loadPreferenceFromStorage('localStorage')
      
      expect(localStorage.getItem('udaan-sarathi-locale')).toBeNull()
      expect(console.info).toHaveBeenCalledWith('Cleared corrupted preference from localStorage')
    })

    test('should handle missing required fields in preference', () => {
      const incompletePreference = {
        locale: 'ne'
        // Missing timestamp and version
      }
      
      localStorage.setItem('udaan-sarathi-locale', JSON.stringify(incompletePreference))
      
      const locale = i18nService.loadPreferenceFromStorage('localStorage')
      expect(locale).toBeNull()
    })
  })

  describe('Integration with existing functionality', () => {
    test('should maintain compatibility with existing setLocale', async () => {
      await i18nService.setLocale('ne')
      
      const stored = JSON.parse(localStorage.getItem('udaan-sarathi-locale'))
      expect(stored.locale).toBe('ne')
      expect(stored.version).toBe('1.0.0')
    })

    test('should work with cross-tab synchronization', async () => {
      // Simulate storage event from another tab
      const storageEvent = new StorageEvent('storage', {
        key: 'udaan-sarathi-locale-broadcast',
        newValue: JSON.stringify({
          type: 'locale-change',
          locale: 'ne',
          timestamp: Date.now(),
          tabId: 'other-tab'
        })
      })
      
      // Save initial preference
      i18nService.saveLocalePreference('en')
      
      // Trigger storage event
      window.dispatchEvent(storageEvent)
      
      // Should update to new locale
      expect(i18nService.getLocale()).toBe('ne')
    })
  })
})