/**
 * Demo script to verify cross-tab synchronization functionality
 * This can be run in the browser console to test the implementation
 */

import i18nService from '../services/i18nService'

// Demo function to test cross-tab synchronization
function demoCrossTabSync() {
  console.log('=== i18nService Cross-Tab Synchronization Demo ===')
  
  // Initialize the service
  i18nService.init()
  console.log('✓ Service initialized')
  console.log('Current locale:', i18nService.getLocale())
  
  // Subscribe to locale changes
  const unsubscribe = i18nService.subscribeToLocaleChanges((newLocale, previousLocale) => {
    console.log(`🔄 Locale changed from ${previousLocale} to ${newLocale}`)
  })
  
  // Test locale switching
  console.log('\n--- Testing Locale Switching ---')
  i18nService.setLocale('ne').then(() => {
    console.log('✓ Switched to Nepali')
    console.log('Current locale:', i18nService.getLocale())
    console.log('Document language:', document.documentElement.lang)
    
    // Switch back to English
    return i18nService.setLocale('en')
  }).then(() => {
    console.log('✓ Switched back to English')
    console.log('Current locale:', i18nService.getLocale())
    console.log('Document language:', document.documentElement.lang)
  })
  
  // Test storage persistence
  console.log('\n--- Testing Storage Persistence ---')
  const storedPreference = localStorage.getItem('udaan-sarathi-locale')
  if (storedPreference) {
    const preference = JSON.parse(storedPreference)
    console.log('✓ Locale preference stored:', preference)
  }
  
  // Test translation functionality
  console.log('\n--- Testing Translation Functions ---')
  console.log('Common translation (loading):', i18nService.t('common.loading'))
  console.log('Auth translation (login):', i18nService.t('auth.login'))
  
  // Test cross-tab broadcasting
  console.log('\n--- Testing Cross-Tab Broadcasting ---')
  console.log('To test cross-tab sync:')
  console.log('1. Open this page in another tab')
  console.log('2. Run: i18nService.setLocale("ne") in one tab')
  console.log('3. Check if the other tab automatically updates')
  
  // Cleanup
  setTimeout(() => {
    unsubscribe()
    console.log('✓ Unsubscribed from locale changes')
  }, 5000)
  
  return {
    service: i18nService,
    unsubscribe,
    testLocaleChange: (locale) => i18nService.setLocale(locale),
    getCurrentLocale: () => i18nService.getLocale(),
    getStoredPreference: () => {
      const stored = localStorage.getItem('udaan-sarathi-locale')
      return stored ? JSON.parse(stored) : null
    }
  }
}

// Export for use in browser console
window.demoCrossTabSync = demoCrossTabSync

export default demoCrossTabSync