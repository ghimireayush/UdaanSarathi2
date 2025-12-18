#!/usr/bin/env node

/**
 * Script to reset locale preferences to Nepali default
 * Run this in browser console or as part of deployment
 */

// Clear both storage keys
localStorage.removeItem('preferred-locale');
localStorage.removeItem('udaan-sarathi-locale');
sessionStorage.removeItem('preferred-locale');
sessionStorage.removeItem('udaan-sarathi-locale');

console.log('✓ Locale preferences cleared');
console.log('✓ System will now default to Nepali (ne) on next load');
console.log('✓ Refresh the page to apply changes');
