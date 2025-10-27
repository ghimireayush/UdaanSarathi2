/**
 * Verify translation files are valid and contain required keys
 */

import { readFileSync } from 'fs';

console.log('🔍 Verifying Translation Files...\n');

try {
  // Load English translations
  const enContent = readFileSync('public/translations/en/pages/owner-agencies.json', 'utf8');
  const enTranslations = JSON.parse(enContent);
  
  console.log('✅ English translation file is valid JSON');
  console.log('   filterButton:', enTranslations.filters?.filterButton);
  console.log('   status:', enTranslations.filters?.status);
  console.log();
  
  // Load Nepali translations
  const neContent = readFileSync('public/translations/ne/pages/owner-agencies.json', 'utf8');
  const neTranslations = JSON.parse(neContent);
  
  console.log('✅ Nepali translation file is valid JSON');
  console.log('   filterButton:', neTranslations.filters?.filterButton);
  console.log('   status:', neTranslations.filters?.status);
  console.log();
  
  // Verify both have the filterButton key
  if (enTranslations.filters?.filterButton && neTranslations.filters?.filterButton) {
    console.log('✅ Both files contain the filterButton translation');
    console.log();
    console.log('Translation Values:');
    console.log('  English: "' + enTranslations.filters.filterButton + '"');
    console.log('  Nepali:  "' + neTranslations.filters.filterButton + '"');
    console.log();
    console.log('🎉 All translations are valid and ready to use!');
    console.log();
    console.log('💡 If translations are not showing in the browser:');
    console.log('   1. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('   2. Hard reload the page (Ctrl+Shift+R or Ctrl+F5)');
    console.log('   3. Check browser console for any loading errors');
    console.log('   4. Verify the correct locale is selected');
  } else {
    console.log('❌ Missing filterButton translation in one or both files');
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error verifying translations:', error.message);
  process.exit(1);
}
