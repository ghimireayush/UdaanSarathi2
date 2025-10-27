# Locale Reload Persistence Fix

## Problem
When the page was reloaded (Ctrl+R or F5) with Nepali language selected, the application would briefly show English content before switching to Nepali, or in some cases, remain in English despite the user's previous selection.

## Root Cause
The issue was caused by a race condition in the initialization sequence:

1. **Constructor initialized with default**: The `I18nService` constructor set `this.currentLocale = 'en'` as the default
2. **Late locale detection**: The `init()` method would detect the saved locale, but this happened AFTER:
   - The service instance was created
   - React components started rendering
   - The `LanguageContext` read the initial locale
3. **Timing gap**: There was a brief moment where components would render with English before the saved locale was detected and applied

## Solution
The fix implements **early locale detection** in the constructor, ensuring the correct locale is set BEFORE any components render:

### Changes Made

#### 1. Modified `i18nService.js` Constructor
```javascript
constructor() {
  // Initialize storage and persistence first
  this.storageKey = 'udaan-sarathi-locale'
  this.preferenceVersion = '1.1.0'
  this.inMemoryPreference = null
  this.fallbackLocale = 'en'
  
  // Detect locale BEFORE setting currentLocale (THE FIX)
  const detectedLocale = this.detectLocaleEarly()
  this.currentLocale = detectedLocale  // Now uses detected locale, not hardcoded 'en'
  
  // ... rest of initialization
}
```

#### 2. Added `detectLocaleEarly()` Method
A new simplified detection method that runs during construction:

```javascript
detectLocaleEarly() {
  try {
    // Try localStorage first
    const stored = localStorage.getItem(this.storageKey)
    if (stored) {
      const preference = JSON.parse(stored)
      if (preference && preference.locale && (preference.locale === 'en' || preference.locale === 'ne')) {
        return preference.locale
      }
    }
    
    // Try legacy format
    const legacyStored = localStorage.getItem('preferred-locale')
    if (legacyStored && (legacyStored === 'en' || legacyStored === 'ne')) {
      return legacyStored
    }
  } catch (error) {
    console.warn('Early locale detection failed:', error)
  }
  
  return 'en'  // Default fallback
}
```

#### 3. Updated `init()` Method
Modified to avoid overriding the locale that was already detected:

```javascript
init() {
  // ... setup code
  
  // Re-detect locale with full validation
  const detectedLocale = this.detectLocale()
  
  // Only update if different from what was set in constructor
  if (detectedLocale !== this.currentLocale) {
    this.setLocale(detectedLocale, false)
  } else {
    // Ensure document attributes are set
    document.documentElement.lang = this.currentLocale
    document.documentElement.dir = this.isRTL(this.currentLocale) ? 'rtl' : 'ltr'
  }
  
  // ... rest of initialization
}
```

#### 4. Updated `LanguageContext.jsx`
Modified to use lazy initialization and sync with service:

```javascript
export const LanguageProvider = ({ children }) => {
  // Get locale immediately from service (already detected in constructor)
  const [locale, setLocaleState] = useState(() => i18nService.getLocale())
  
  useEffect(() => {
    if (!i18nService.isInitialized) {
      i18nService.init()
    }
    
    // Ensure state is in sync after init
    const currentLocale = i18nService.getLocale()
    if (currentLocale !== locale) {
      setLocaleState(currentLocale)
    }
    
    // Subscribe to changes
    const unsubscribe = i18nService.subscribeToLocaleChanges((newLocale) => {
      setLocaleState(newLocale)
      setError(null)
    })

    return () => unsubscribe()
  }, [])
  
  // ... rest of provider
}
```

## Benefits

1. **Immediate Locale Detection**: Locale is detected in the constructor, before any rendering
2. **No Flash of Wrong Language**: Components render with the correct language from the start
3. **Persistent Across Reloads**: Language selection survives page reloads (Ctrl+R, F5, browser refresh)
4. **Backward Compatible**: Still supports legacy `preferred-locale` storage format
5. **Robust Fallback**: Gracefully handles storage errors and corrupted data

## Testing

### Manual Test Steps
1. Open the application
2. Switch language to Nepali using the language toggle
3. Reload the page (Ctrl+R or F5)
4. Verify that:
   - Page loads directly in Nepali
   - No flash of English content
   - All UI elements are in Nepali
5. Switch to English and repeat test

### Automated Test
Run the test file: `test-locale-reload-fix.html`

This test simulates the fix and allows you to:
- Set language to Nepali
- Reload the page
- Verify persistence works correctly

## Technical Details

### Initialization Sequence (Before Fix)
```
1. Constructor: currentLocale = 'en' (hardcoded)
2. React renders with 'en'
3. init() called
4. detectLocale() finds 'ne' in storage
5. setLocale('ne') called
6. React re-renders with 'ne'
❌ User sees English briefly
```

### Initialization Sequence (After Fix)
```
1. Constructor: detectLocaleEarly() finds 'ne' in storage
2. Constructor: currentLocale = 'ne' (from storage)
3. React renders with 'ne'
4. init() called
5. detectLocale() confirms 'ne'
6. No locale change needed
✅ User sees Nepali immediately
```

## Files Modified
- `src/services/i18nService.js` - Added early detection, updated constructor and init
- `src/contexts/LanguageContext.jsx` - Updated to use lazy initialization

## Files Created
- `test-locale-reload-fix.html` - Test page for verifying the fix
- `LOCALE_RELOAD_FIX.md` - This documentation

## Verification
To verify the fix is working:

1. Check browser console on page load - should see:
   ```
   i18nService initialized with locale: ne
   ```
   (if Nepali was previously selected)

2. Check localStorage in DevTools:
   ```javascript
   localStorage.getItem('udaan-sarathi-locale')
   // Should show: {"locale":"ne","timestamp":...}
   ```

3. No console warnings about locale changes during initialization

## Future Improvements
- Add unit tests for `detectLocaleEarly()`
- Add integration tests for reload persistence
- Consider adding a visual indicator during locale initialization
- Add telemetry to track locale detection success rate
