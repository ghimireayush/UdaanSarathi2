/**
 * Verification script for locale persistence fix
 * Run this in the browser console to verify the fix
 */

console.log('=== Locale Persistence Verification ===\n')

// Check if i18nService is available
if (typeof window.i18nService === 'undefined') {
  console.error('❌ i18nService not found in window object')
  console.log('This script should be run in the browser console after the app loads')
} else {
  const i18n = window.i18nService
  
  console.log('1. Current locale:', i18n.getLocale())
  console.log('2. Available locales:', i18n.getAvailableLocales())
  
  // Check storage
  console.log('\n3. Storage Information:')
  try {
    const storageInfo = i18n.getPreferenceStorageInfo()
    console.log('   localStorage:', storageInfo.localStorage)
    console.log('   sessionStorage:', storageInfo.sessionStorage)
    console.log('   inMemory:', storageInfo.inMemory)
  } catch (e) {
    console.log('   Could not retrieve storage info:', e.message)
  }
  
  // Check localStorage directly
  console.log('\n4. Direct localStorage check:')
  try {
    const stored = localStorage.getItem('udaan-sarathi-locale')
    if (stored) {
      console.log('   Raw value:', stored)
      console.log('   Parsed:', JSON.parse(stored))
    } else {
      console.log('   No preference stored')
    }
  } catch (e) {
    console.log('   Error:', e.message)
  }
  
  // Test locale change
  console.log('\n5. Testing locale change to Nepali...')
  i18n.setLocale('ne').then(() => {
    console.log('   ✓ Locale changed to:', i18n.getLocale())
    console.log('   ✓ Now refresh the page (Ctrl+R) and run this script again')
    console.log('   ✓ The locale should still be "ne" after refresh')
  }).catch(e => {
    console.error('   ❌ Failed to change locale:', e.message)
  })
}

console.log('\n=== End of Verification ===')
