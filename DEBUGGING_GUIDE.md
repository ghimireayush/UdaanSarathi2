# Debugging Guide - New Job Draft Page

## Quick Checks

### 1. Check if Page Loads
```
Navigate to: /new-job-draft
Expected: See 5-step progress bar and Step 1 form
```

### 2. Open Browser Console
Press `F12` or `Cmd+Option+I` (Mac) to open Developer Tools

### 3. Check Console Logs

You should see:
```
Countries fetched: [{country_name: "United Arab Emirates", country_code: "UAE", ...}, ...]
Job titles fetched: [{id: 1, title: "Construction Worker"}, ...]
```

## Common Issues & Solutions

### Issue 1: Countries Dropdown is Empty

**Symptoms**:
- Dropdown shows only "Select Country"
- No countries listed

**Debug Steps**:
1. Check console for: `Countries fetched: []` or error
2. Check if countryService is working:
   ```javascript
   // In browser console
   import countryService from './services/countryService';
   countryService.getCountries().then(console.log);
   ```

**Solutions**:
- If API fails, countryService has fallback data (7 Gulf countries)
- Check if `VITE_API_BASE_URL` is set correctly
- Verify backend `/countries` endpoint is accessible

### Issue 2: Job Titles Dropdown is Empty

**Symptoms**:
- In Step 4, position title shows text input instead of dropdown
- Warning message: "Job titles API not available"

**Debug Steps**:
1. Check console for error: `Failed to fetch job titles: ...`
2. Check network tab for `/job-titles` request
3. Verify response format

**Solutions**:
- Ensure backend `/job-titles` API is running
- Check if token is valid: `localStorage.getItem('token')`
- Verify API returns correct format:
  ```javascript
  { data: [{id: 1, title: "..."}, ...] }
  // OR
  [{id: 1, title: "..."}, ...]
  ```

### Issue 3: Form Won't Submit

**Symptoms**:
- "Save Draft" or "Publish" button doesn't work
- Error message appears

**Debug Steps**:
1. Check console for errors
2. Check network tab for failed POST request
3. Verify payload structure

**Solutions**:
- Ensure all required fields are filled
- Check if `agency_license` is in localStorage
- Verify backend endpoint: `POST /agencies/:license/job-postings`

## Browser Console Commands

### Check LocalStorage
```javascript
// Check token
console.log('Token:', localStorage.getItem('token'));

// Check agency license
console.log('License:', localStorage.getItem('agency_license'));

// Check API URL
console.log('API URL:', import.meta.env.VITE_API_BASE_URL);
```

### Test API Endpoints
```javascript
// Test countries API
fetch('http://localhost:3000/countries')
  .then(r => r.json())
  .then(console.log);

// Test job titles API (with auth)
const token = localStorage.getItem('token');
fetch('http://localhost:3000/job-titles', {
  headers: { Authorization: `Bearer ${token}` }
})
  .then(r => r.json())
  .then(console.log);
```

### Check Form State
```javascript
// In React DevTools, find NewJobDraft component
// Check formData state
// Should show all form fields with current values
```

## Network Tab Debugging

### Check API Calls

1. Open Network tab in DevTools
2. Filter by "XHR" or "Fetch"
3. Look for these requests:
   - `GET /countries` - Should return 200
   - `GET /job-titles` - Should return 200
   - `POST /agencies/:license/job-postings` - Should return 201

### Check Request Payload

When you click "Save Draft" or "Publish":
1. Find the POST request in Network tab
2. Click on it
3. Go to "Payload" or "Request" tab
4. Verify structure matches:
```json
{
  "posting_title": "...",
  "country": "...",
  "city": "...",
  "lt_number": "...",
  "chalani_number": "...",
  "approval_date_ad": "2025-11-26",
  "posting_date_ad": "2025-11-26",
  "announcement_type": "full_ad",
  "notes": "...",
  "employer": {
    "company_name": "...",
    "country": "...",
    "city": "..."
  },
  "contract": { ... },
  "positions": [ ... ],
  "skills": [ ... ],
  "education_requirements": [ ... ],
  "experience_requirements": { ... },
  "canonical_title_names": [ ... ]
}
```

## Step-by-Step Testing

### Test Step 1: Basic Info
1. Fill in all fields
2. Select country from dropdown (should have options)
3. Click "Next"
4. Should move to Step 2

### Test Step 2: Employer
1. Fill in company name
2. Select country
3. Enter city
4. Click "Next"
5. Should move to Step 3

### Test Step 3: Contract
1. Set contract period (default: 2 years)
2. Set working hours (default: 8 hours/day, 6 days/week)
3. Configure benefits
4. Click "Next"
5. Should move to Step 4

### Test Step 4: Positions
1. Select or enter position title
2. Enter vacancies (male/female)
3. Enter salary and currency
4. Optionally set hours override
5. Click "Add Position" to test multiple positions
6. Click "Next"
7. Should move to Step 5

### Test Step 5: Requirements
1. Add at least one skill
2. Select at least one education requirement
3. Set experience requirements
4. Click "Save Draft" or "Publish"
5. Should show success message
6. Should redirect after 1.5 seconds

## Error Messages

### "Failed to load required data"
- Countries API failed
- Check backend is running
- Check API_BASE_URL

### "Failed to load job titles"
- Job titles API failed or doesn't exist
- Form will still work with manual input
- Check if backend has `/job-titles` endpoint

### "Please fill in all required fields"
- Validation failed
- Check which step has missing fields
- Required fields marked with *

### "Failed to save draft"
- API call failed
- Check network tab for error details
- Verify token and license in localStorage

## Quick Fix Checklist

- [ ] Backend API is running
- [ ] `VITE_API_BASE_URL` is set correctly
- [ ] Token exists in localStorage
- [ ] Agency license exists in localStorage
- [ ] `/countries` endpoint returns data
- [ ] `/job-titles` endpoint returns data (or form allows manual input)
- [ ] `/agencies/:license/job-postings` endpoint accepts POST
- [ ] Browser console shows no errors
- [ ] Network tab shows successful API calls

## Getting Help

If issues persist:

1. **Check Console Logs**: Look for red errors
2. **Check Network Tab**: Look for failed requests (red)
3. **Check Payload**: Verify structure matches expected format
4. **Check Backend Logs**: See what error backend is returning
5. **Test API Directly**: Use curl or Postman to test endpoints

## Example curl Commands

```bash
# Test countries API
curl http://localhost:3000/countries

# Test job titles API
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/job-titles

# Test job posting creation
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"posting_title":"Test Job",...}' \
     http://localhost:3000/agencies/YOUR_LICENSE/job-postings
```

Replace:
- `YOUR_TOKEN` with actual token from localStorage
- `YOUR_LICENSE` with actual agency license
- `http://localhost:3000` with your API base URL
