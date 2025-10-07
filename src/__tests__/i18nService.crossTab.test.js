/**
 * Cross-tab synchronization tests for i18nService
 */

import i18nService from '../services/i18nService'

// Mock localStorage and sessionStorage
const mockStorage = () => {
  let store = {}
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value
    }),
    removeItem: jest.fn((key) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
}

// Mock window and document
Object.defineProperty(window, 'localStorage', {
  value: mockStorage()
})

Object.defineProperty(window, 'sessionStorage', {
  value: mockStorage()
})

Object.defineProperty(document, 'documentElement', {
  value: {
    lang: 'en',
    dir: 'ltr'
  },
  writable: true
})

// Mock window events
const mockEventListeners = new Map()
window.addEventListener = jest.fn((event, callback) => {
  if (!mockEventListeners.has(event)) {
    mockEventListeners.set(event, [])
  }
  mockEventListeners.get(event).push(callback)
})

window.removeEventListener = jest.fn((event, callback) => {
  if (mockEventListeners.has(event)) {
    const callbacks = mockEventListeners.get(event)
    const index = callbacks.indexOf(callback)
    if (index > -1) {
      callbacks.splice(index, 1)
    }
  }
})

window.dispatchEvent = jest.fn()

// Mock fetch globally
global.fetch = jest.fn()

describe('i18nService Cross-Tab Synchronization', () => {
  beforeEach(() => {
    // Reset service state
    i18nService.isInitialized = false
    i18nService.currentLocale = 'en'
    i18nService.localeChangeCallbacks.clear()
    
    // Clear mocks
    jest.clearAllMocks()
    global.fetch.mockClear()
    window.localStorage.clear()
    window.sessionStorage.clear()
    mockEventListeners.clear()
  })

  describe('Initialization', () => {
    test('should setup cross-tab synchronization on init', () => {
      i18nService.init()
      
      expect(window.addEventListener).toHaveBeenCalledWith('storage', i18nService.handleStorageChange)
      expect(window.addEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
      expect(i18nService.isInitialized).toBe(true)
    })

    test('should not initialize twice', () => {
      i18nService.init()
      const firstCallCount = window.addEventListener.mock.calls.length
      
      i18nService.init()
      
      expect(window.addEventListener.mock.calls.length).toBe(firstCallCount)
    })

    test('should detect and set locale from localStorage', () => {
      const preference = {
        locale: 'ne',
        timestamp: Date.now(),
        version: '1.0.0'
      }
      window.localStorage.setItem('udaan-sarathi-locale', JSON.stringify(preference))
      
      i18nService.init()
      
      expect(i18nService.getLocale()).toBe('ne')
      expect(document.documentElement.lang).toBe('ne')
    })
  })

  describe('Locale Change Broadcasting', () => {
    beforeEach(() => {
      i18nService.init()
    })

    test('should broadcast locale change to other tabs', async () => {
      await i18nService.setLocale('ne')
      
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'udaan-sarathi-locale-broadcast',
        expect.stringContaining('"locale":"ne"')
      )
    })

    test('should include tab ID in broadcast to prevent loops', async () => {
      await i18nService.setLocale('ne')
      
      const broadcastCall = window.localStorage.setItem.mock.calls.find(
        call => call[0] === 'udaan-sarathi-locale-broadcast'
      )
      
      expect(broadcastCall).toBeDefined()
      const broadcastData = JSON.parse(broadcastCall[1])
      expect(broadcastData.tabId).toBeDefined()
      expect(broadcastData.type).toBe('locale-change')
    })

    test('should not broadcast when broadcast parameter is false', async () => {
      await i18nService.setLocale('ne', false)
      
      const broadcastCall = window.localStorage.setItem.mock.calls.find(
        call => call[0] === 'udaan-sarathi-locale-broadcast'
      )
      
      expect(broadcastCall).toBeUndefined()
    })
  })

  describe('Storage Event Handling', () => {
    beforeEach(() => {
      i18nService.init()
    })

    test('should handle storage change events from other tabs', () => {
      const otherTabId = 'tab-other-123'
      const changeEvent = {
        type: 'locale-change',
        locale: 'ne',
        previousLocale: 'en',
        timestamp: Date.now(),
        tabId: otherTabId
      }
      
      const storageEvent = {
        key: 'udaan-sarathi-locale-broadcast',
        newValue: JSON.stringify(changeEvent),
        oldValue: null
      }
      
      i18nService.handleStorageChange(storageEvent)
      
      expect(i18nService.getLocale()).toBe('ne')
      expect(document.documentElement.lang).toBe('ne')
    })

    test('should ignore storage events from same tab', () => {
      const sameTabId = i18nService.getTabId()
      const changeEvent = {
        type: 'locale-change',
        locale: 'ne',
        previousLocale: 'en',
        timestamp: Date.now(),
        tabId: sameTabId
      }
      
      const storageEvent = {
        key: 'udaan-sarathi-locale-broadcast',
        newValue: JSON.stringify(changeEvent),
        oldValue: null
      }
      
      const originalLocale = i18nService.getLocale()
      i18nService.handleStorageChange(storageEvent)
      
      expect(i18nService.getLocale()).toBe(originalLocale)
    })

    test('should ignore non-broadcast storage events', () => {
      const storageEvent = {
        key: 'other-key',
        newValue: 'some-value',
        oldValue: null
      }
      
      const originalLocale = i18nService.getLocale()
      i18nService.handleStorageChange(storageEvent)
      
      expect(i18nService.getLocale()).toBe(originalLocale)
    })

    test('should handle malformed storage events gracefully', () => {
      const storageEvent = {
        key: 'udaan-sarathi-locale-broadcast',
        newValue: 'invalid-json',
        oldValue: null
      }
      
      const originalLocale = i18nService.getLocale()
      
      expect(() => {
        i18nService.handleStorageChange(storageEvent)
      }).not.toThrow()
      
      expect(i18nService.getLocale()).toBe(originalLocale)
    })
  })

  describe('Subscription System', () => {
    beforeEach(() => {
      i18nService.init()
    })

    test('should allow subscribing to locale changes', () => {
      const callback = jest.fn()
      const unsubscribe = i18nService.subscribeToLocaleChanges(callback)
      
      expect(typeof unsubscribe).toBe('function')
      expect(i18nService.localeChangeCallbacks.has(callback)).toBe(true)
    })

    test('should call subscribers on locale change', async () => {
      const callback1 = jest.fn()
      const callback2 = jest.fn()
      
      i18nService.subscribeToLocaleChanges(callback1)
      i18nService.subscribeToLocaleChanges(callback2)
      
      await i18nService.setLocale('ne')
      
      expect(callback1).toHaveBeenCalledWith('ne', 'en')
      expect(callback2).toHaveBeenCalledWith('ne', 'en')
    })

    test('should allow unsubscribing via returned function', async () => {
      const callback = jest.fn()
      const unsubscribe = i18nService.subscribeToLocaleChanges(callback)
      
      unsubscribe()
      
      await i18nService.setLocale('ne')
      
      expect(callback).not.toHaveBeenCalled()
    })

    test('should allow unsubscribing via method', async () => {
      const callback = jest.fn()
      i18nService.subscribeToLocaleChanges(callback)
      i18nService.unsubscribeFromLocaleChanges(callback)
      
      await i18nService.setLocale('ne')
      
      expect(callback).not.toHaveBeenCalled()
    })

    test('should handle callback errors gracefully', async () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error')
      })
      const normalCallback = jest.fn()
      
      i18nService.subscribeToLocaleChanges(errorCallback)
      i18nService.subscribeToLocaleChanges(normalCallback)
      
      await i18nService.setLocale('ne')
      
      expect(errorCallback).toHaveBeenCalled()
      expect(normalCallback).toHaveBeenCalled()
    })

    test('should throw error for non-function callbacks', () => {
      expect(() => {
        i18nService.subscribeToLocaleChanges('not-a-function')
      }).toThrow('Callback must be a function')
    })
  })

  describe('Locale Persistence', () => {
    test('should save locale preference with metadata', async () => {
      i18nService.init()
      
      await i18nService.setLocale('ne')
      
      const savedPreference = window.localStorage.getItem('udaan-sarathi-locale')
      expect(savedPreference).toBeDefined()
      
      const preference = JSON.parse(savedPreference)
      expect(preference.locale).toBe('ne')
      expect(preference.timestamp).toBeDefined()
      expect(preference.version).toBe('1.0.0')
    })

    test('should fallback to sessionStorage when localStorage fails', () => {
      // Mock localStorage to throw error
      window.localStorage.setItem.mockImplementation(() => {
        throw new Error('localStorage error')
      })
      
      i18nService.saveLocalePreference('ne')
      
      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'udaan-sarathi-locale',
        expect.stringContaining('"locale":"ne"')
      )
    })

    test('should detect locale from sessionStorage when localStorage unavailable', () => {
      const preference = {
        locale: 'ne',
        timestamp: Date.now(),
        version: '1.0.0'
      }
      
      // Mock localStorage to return null
      window.localStorage.getItem.mockReturnValue(null)
      window.sessionStorage.setItem('udaan-sarathi-locale', JSON.stringify(preference))
      
      const detectedLocale = i18nService.detectLocale()
      
      expect(detectedLocale).toBe('ne')
    })
  })

  describe('Tab ID Generation', () => {
    test('should generate unique tab ID', () => {
      const tabId1 = i18nService.getTabId()
      const tabId2 = i18nService.getTabId()
      
      expect(tabId1).toBe(tabId2) // Same instance should return same ID
      expect(tabId1).toMatch(/^tab-\d+-[a-z0-9]+$/)
    })
  })

  describe('Cleanup', () => {
    test('should remove event listeners on cleanup', () => {
      i18nService.init()
      i18nService.cleanup()
      
      expect(window.removeEventListener).toHaveBeenCalledWith('storage', i18nService.handleStorageChange)
    })

    test('should clear callbacks on cleanup', () => {
      const callback = jest.fn()
      i18nService.subscribeToLocaleChanges(callback)
      
      expect(i18nService.localeChangeCallbacks.size).toBe(1)
      
      i18nService.cleanup()
      
      expect(i18nService.localeChangeCallbacks.size).toBe(0)
    })
  })

  describe('Auto-loading Page Translations', () => {
    test('should auto-load page translations', async () => {
      // Mock fetch for translation files
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            title: 'Test Page',
            content: 'Test content'
          })
        })
      )
      
      i18nService.init()
      
      const translations = await i18nService.autoLoadPageTranslations('test-page')
      
      expect(translations).toEqual({
        title: 'Test Page',
        content: 'Test content'
      })
      
      expect(fetch).toHaveBeenCalledWith('/translations/en/pages/test-page.json')
    })

    test('should handle missing page name gracefully', async () => {
      i18nService.init()
      
      const translations = await i18nService.autoLoadPageTranslations()
      
      expect(translations).toEqual({})
    })

    test('should preload fallback locale when different from current', async () => {
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ title: 'Test' })
        })
      )
      
      i18nService.init()
      await i18nService.setLocale('ne')
      
      await i18nService.autoLoadPageTranslations('test-page')
      
      // Wait a bit for the background preloading to start
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Should load both ne and en (fallback)
      expect(fetch).toHaveBeenCalledWith('/translations/ne/pages/test-page.json')
      expect(fetch).toHaveBeenCalledWith('/translations/en/pages/test-page.json')
    })
  })

  describe('Critical Translation Preloading', () => {
    test('should preload critical translations', async () => {
      // Clear any previous calls
      global.fetch.mockClear()
      
      global.fetch = jest.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ title: 'Test' })
        })
      )
      
      // Don't call init() here as it will trigger preloading automatically
      await i18nService.preloadCriticalTranslations(['login', 'dashboard', 'navigation'])
      
      expect(fetch).toHaveBeenCalledWith('/translations/en/pages/login.json')
      expect(fetch).toHaveBeenCalledWith('/translations/en/pages/dashboard.json')
      expect(fetch).toHaveBeenCalledWith('/translations/en/pages/navigation.json')
    })
  })
})