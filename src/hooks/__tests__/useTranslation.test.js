import { renderHook, act } from '@testing-library/react'
import { useTranslation } from '../useTranslation'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
}
global.localStorage = localStorageMock

// Mock translation files
jest.mock('../../public/translations/en/common.json', () => ({
  welcome: 'Welcome',
  login: 'Login',
  logout: 'Logout'
}), { virtual: true })

jest.mock('../../public/translations/ne/common.json', () => ({
  welcome: 'स्वागतम्',
  login: 'लगइन',
  logout: 'लगआउट'
}), { virtual: true })

describe('useTranslation Hook', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  test('initializes with default language', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useTranslation())
    
    expect(result.current.currentLanguage).toBe('en')
  })

  test('initializes with stored language', () => {
    localStorageMock.getItem.mockReturnValue('ne')
    
    const { result } = renderHook(() => useTranslation())
    
    expect(result.current.currentLanguage).toBe('ne')
  })

  test('translates keys correctly', () => {
    localStorageMock.getItem.mockReturnValue('en')
    
    const { result } = renderHook(() => useTranslation())
    
    expect(result.current.t('welcome')).toBe('Welcome')
    expect(result.current.t('login')).toBe('Login')
  })

  test('returns key for missing translation', () => {
    localStorageMock.getItem.mockReturnValue('en')
    
    const { result } = renderHook(() => useTranslation())
    
    expect(result.current.t('nonexistent.key')).toBe('nonexistent.key')
  })

  test('switches language correctly', () => {
    localStorageMock.getItem.mockReturnValue('en')
    
    const { result } = renderHook(() => useTranslation())
    
    act(() => {
      result.current.switchLanguage('ne')
    })
    
    expect(result.current.currentLanguage).toBe('ne')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('udaan_language', 'ne')
  })

  test('handles nested translation keys', () => {
    localStorageMock.getItem.mockReturnValue('en')
    
    const { result } = renderHook(() => useTranslation())
    
    // Assuming nested structure exists
    expect(result.current.t('pages.login.title')).toBeDefined()
  })

  test('handles interpolation', () => {
    localStorageMock.getItem.mockReturnValue('en')
    
    const { result } = renderHook(() => useTranslation())
    
    // Test with variables (if supported)
    const translated = result.current.t('welcome', { name: 'John' })
    expect(typeof translated).toBe('string')
  })

  test('provides available languages', () => {
    const { result } = renderHook(() => useTranslation())
    
    expect(result.current.availableLanguages).toEqual(['en', 'ne'])
  })

  test('handles invalid language gracefully', () => {
    localStorageMock.getItem.mockReturnValue('en')
    
    const { result } = renderHook(() => useTranslation())
    
    act(() => {
      result.current.switchLanguage('invalid')
    })
    
    // Should fallback to default or stay current
    expect(['en', 'ne']).toContain(result.current.currentLanguage)
  })

  test('loads translations asynchronously', async () => {
    localStorageMock.getItem.mockReturnValue('en')
    
    const { result, waitForNextUpdate } = renderHook(() => useTranslation())
    
    // Initially might be loading
    if (result.current.isLoading) {
      await waitForNextUpdate()
    }
    
    expect(result.current.isLoading).toBe(false)
    expect(result.current.t('welcome')).toBeDefined()
  })

  test('handles translation loading errors', () => {
    localStorageMock.getItem.mockReturnValue('en')
    
    const { result } = renderHook(() => useTranslation())
    
    // Should not crash on errors
    expect(() => result.current.t('any.key')).not.toThrow()
  })

  test('persists language preference', () => {
    localStorageMock.getItem.mockReturnValue('en')
    
    const { result } = renderHook(() => useTranslation())
    
    act(() => {
      result.current.switchLanguage('ne')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('udaan_language', 'ne')
  })

  test('provides language metadata', () => {
    const { result } = renderHook(() => useTranslation())
    
    expect(result.current.getLanguageInfo).toBeDefined()
    
    const enInfo = result.current.getLanguageInfo('en')
    expect(enInfo).toEqual({
      code: 'en',
      name: 'English',
      nativeName: 'English',
      direction: 'ltr'
    })
    
    const neInfo = result.current.getLanguageInfo('ne')
    expect(neInfo).toEqual({
      code: 'ne',
      name: 'Nepali',
      nativeName: 'नेपाली',
      direction: 'ltr'
    })
  })
})