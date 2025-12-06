# LocalStorage Keys Reference

## Issue Fixed: License Number was NULL

**Problem**: The URL showed `/agencies/null/job-postings` because the wrong localStorage key was used.

**Root Cause**: Used `agency_license` instead of `udaan_agency_license`

## Correct LocalStorage Keys

The UdaanSarathi2 application uses the following localStorage keys:

### Authentication
```javascript
// Token
localStorage.getItem('udaan_token')  // ✅ CORRECT
localStorage.getItem('token')        // ❌ WRONG

// User data
localStorage.getItem('udaan_user')   // ✅ CORRECT
localStorage.getItem('user')         // ❌ WRONG

// Permissions
localStorage.getItem('udaan_permissions')  // ✅ CORRECT
```

### Agency Data
```javascript
// Agency license number
localStorage.getItem('udaan_agency_license')  // ✅ CORRECT
localStorage.getItem('agency_license')        // ❌ WRONG

// Login portal (admin or member)
localStorage.getItem('login_portal')  // ✅ CORRECT
```

## Where These Are Set

### Token & User (AuthContext.jsx)
```javascript
// On login
localStorage.setItem('udaan_token', token)
localStorage.setItem('udaan_user', JSON.stringify(user))
localStorage.setItem('udaan_permissions', JSON.stringify(permissions))
localStorage.setItem('login_portal', 'admin')
```

### Agency License (AgencyContext.jsx)
```javascript
// When agency data is fetched
if (data.license_number) {
  localStorage.setItem('udaan_agency_license', data.license_number)
}
```

## How to Check in Browser Console

```javascript
// Check all Udaan keys
console.log('Token:', localStorage.getItem('udaan_token'));
console.log('User:', localStorage.getItem('udaan_user'));
console.log('License:', localStorage.getItem('udaan_agency_license'));
console.log('Portal:', localStorage.getItem('login_portal'));

// Or see all localStorage
console.log(localStorage);
```

## Fixed in NewJobDraft.jsx

### Before (WRONG):
```javascript
const token = localStorage.getItem('token');
const licenseNumber = localStorage.getItem('agency_license');
```

### After (CORRECT):
```javascript
const token = localStorage.getItem('udaan_token');
const licenseNumber = localStorage.getItem('udaan_agency_license');

// Added validation
if (!licenseNumber) {
  setError('Agency license not found. Please ensure you have an agency set up.');
  return;
}
```

## When License is Available

The `udaan_agency_license` is set when:
1. User logs in successfully
2. AgencyContext fetches agency data
3. Agency has a `license_number` field

**Important**: If user is an owner without an agency, the license won't be set. The form now checks for this and shows an appropriate error message.

## Testing

### 1. Check if License Exists
```javascript
const license = localStorage.getItem('udaan_agency_license');
console.log('License:', license);

if (!license) {
  console.error('❌ License not found! User may not have an agency.');
} else {
  console.log('✅ License found:', license);
}
```

### 2. Check API URL
```javascript
const license = localStorage.getItem('udaan_agency_license');
const url = `http://localhost:3000/agencies/${license}/job-postings`;
console.log('API URL:', url);

// Should show: http://localhost:3000/agencies/REG-2025-123456/job-postings
// NOT: http://localhost:3000/agencies/null/job-postings
```

### 3. Full Debug Check
```javascript
console.log('=== LocalStorage Debug ===');
console.log('Token:', localStorage.getItem('udaan_token') ? '✅ Set' : '❌ Missing');
console.log('User:', localStorage.getItem('udaan_user') ? '✅ Set' : '❌ Missing');
console.log('License:', localStorage.getItem('udaan_agency_license') || '❌ Missing');
console.log('Portal:', localStorage.getItem('login_portal') || 'Not set');
```

## Common Issues

### Issue: License is NULL
**Causes**:
1. User hasn't created an agency yet
2. Agency data hasn't been fetched yet
3. User is an owner without an agency

**Solution**:
- Ensure user has created an agency
- Wait for AgencyContext to load
- Check if `agencyData` exists in AgencyContext

### Issue: Token is NULL
**Causes**:
1. User is not logged in
2. Token expired
3. Using wrong key

**Solution**:
- Log in again
- Use `udaan_token` not `token`

## Summary

✅ **Fixed**: Changed all localStorage keys to use `udaan_` prefix
✅ **Added**: Validation to check if license exists before API call
✅ **Result**: URL now shows correct license number instead of `null`

The form will now properly construct the API URL:
- Before: `http://localhost:3000/agencies/null/job-postings` ❌
- After: `http://localhost:3000/agencies/REG-2025-123456/job-postings` ✅
