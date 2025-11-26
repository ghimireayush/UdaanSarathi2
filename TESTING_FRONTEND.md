# Frontend Testing Guide

## Quick Test (Without Backend)

Since the backend isn't implemented yet, you can test the frontend with mock data temporarily.

### Option 1: Use Mock Data Temporarily

**File**: `src/services/jobService.js`

Change the `getJobs` method temporarily:

```javascript
async getJobs(filters = {}) {
  // TEMPORARY: Use mock data until backend is ready
  return this.getJobsMock(filters);
}

async getJobStatistics() {
  // TEMPORARY: Use mock statistics
  const result = await handleServiceError(async () => {
    await delay(200);
    const stats = {
      byCountry: {
        'UAE': 15,
        'Qatar': 8,
        'Saudi Arabia': 5,
        'Kuwait': 3,
        'Oman': 2
      }
    };
    return stats;
  }, 3, 500);
  return result;
}
```

### Option 2: Mock the API Responses

**File**: `src/services/adminJobApiClient.js`

Add mock responses at the top of methods:

```javascript
async getAdminJobs(filters = {}) {
  // TEMPORARY MOCK - Remove when backend is ready
  if (import.meta.env.DEV) {
    const mockJobs = await import('../data/jobs.json');
    return mockJobs.default;
  }
  
  // Real API call (will be used when backend is ready)
  try {
    // ... existing code
  }
}
```

---

## Test the Frontend

### 1. Start the Development Server

```bash
cd portal/agency_research/code/admin_panel/UdaanSarathi2
npm run dev
```

### 2. Open in Browser

```
http://localhost:5173/jobs
```

### 3. Test Filters

#### Search Filter
1. Type "cook" in search box
2. Press Enter or wait for debounce
3. ✅ Should show only cook-related jobs

#### Country Filter (Dropdown)
1. Click country dropdown
2. Select "UAE"
3. ✅ Should show only UAE jobs
4. ✅ Country distribution should highlight UAE

#### Country Filter (Row)
1. Click "UAE (15)" button in country distribution
2. ✅ Should show only UAE jobs
3. ✅ Dropdown should show "UAE" selected

#### Sort Options
1. Select "Applications" from sort dropdown
2. ✅ Jobs with most applications should appear first
3. Select "Shortlisted"
4. ✅ Jobs with most shortlisted should appear first
5. Select "Interviews"
6. ✅ Jobs with most interviews today should appear first
7. Select "Published Date"
8. ✅ Most recent jobs should appear first

### 4. Test Pagination

1. ✅ Pagination controls should appear at bottom
2. Click "Next" button
3. ✅ Should show next page of jobs
4. Change "Items per page" to 25
5. ✅ Should show 25 jobs per page

### 5. Test Responsive Design

#### Desktop (1920x1080)
- ✅ All filters visible in one row
- ✅ Table displays properly
- ✅ No horizontal scroll

#### Tablet (768x1024)
- ✅ Filters wrap to multiple rows
- ✅ Table scrolls horizontally if needed
- ✅ Country distribution grid adjusts

#### Mobile (375x667)
- ✅ Filters stack vertically
- ✅ Table scrolls horizontally
- ✅ Country distribution shows 2 columns

---

## Test with Backend (When Ready)

### 1. Start Backend Server

```bash
cd portal/agency_research/code
npm run start:dev
```

### 2. Verify Backend Endpoints

Open Swagger UI:
```
http://localhost:3000/api-docs
```

Look for:
- `GET /admin/jobs`
- `GET /admin/jobs/statistics/countries`

### 3. Test API Calls

#### Using Browser DevTools

1. Open Jobs page: `http://localhost:5173/jobs`
2. Open DevTools (F12)
3. Go to Network tab
4. Filter by "Fetch/XHR"
5. Look for requests to `/admin/jobs`

**Expected Requests**:
```
GET http://localhost:3000/admin/jobs?search=&country=All%20Countries&sort_by=published_date&order=desc&page=1&limit=1000
GET http://localhost:3000/admin/jobs/statistics/countries
```

**Expected Response** (admin/jobs):
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Cook",
      "company": "Al Manara Restaurant",
      "country": "UAE",
      "applications_count": 45,
      "shortlisted_count": 12,
      "interviews_today": 2,
      ...
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 1000
}
```

**Expected Response** (statistics/countries):
```json
{
  "UAE": 15,
  "Qatar": 8,
  "Saudi Arabia": 5
}
```

#### Using Postman

1. Create new request
2. Method: GET
3. URL: `http://localhost:3000/admin/jobs`
4. Headers:
   - `Authorization`: `Bearer <your_jwt_token>`
   - `Content-Type`: `application/json`
5. Send request
6. ✅ Should return jobs array

### 4. Test Error Scenarios

#### 401 Unauthorized
1. Remove token from localStorage:
   ```javascript
   localStorage.removeItem('udaan_token')
   ```
2. Reload page
3. ✅ Should show error message
4. ✅ Should show login prompt

#### 500 Server Error
1. Stop backend server
2. Reload page
3. ✅ Should show error message
4. ✅ Should show retry button

#### Empty Results
1. Filter by country that has no jobs
2. ✅ Should show "No jobs found" message

---

## Common Issues & Solutions

### Issue 1: "Failed to fetch"
**Cause**: Backend not running or CORS issue

**Solution**:
```bash
# Check if backend is running
curl http://localhost:3000/admin/jobs

# If CORS error, check backend CORS config
# Should allow http://localhost:5173
```

### Issue 2: "401 Unauthorized"
**Cause**: No JWT token or expired token

**Solution**:
```javascript
// Check token in browser console
console.log(localStorage.getItem('udaan_token'))

// If null, login again
// If expired, refresh token or login again
```

### Issue 3: "Country filter not working"
**Cause**: Country name mismatch

**Solution**:
```javascript
// Check country names in response
console.log(countryDistribution)

// Should match exactly (case-sensitive)
// "UAE" !== "uae"
```

### Issue 4: "Statistics showing 0"
**Cause**: No applications in database

**Solution**:
```sql
-- Check if applications exist
SELECT job_posting_id, COUNT(*) 
FROM job_applications 
GROUP BY job_posting_id;

-- If empty, seed some test data
```

---

## Performance Testing

### 1. Load Time
- ✅ Initial page load < 2 seconds
- ✅ Filter change < 500ms
- ✅ Sort change < 500ms

### 2. Memory Usage
- ✅ No memory leaks
- ✅ Cache clears properly
- ✅ No excessive re-renders

### 3. Network
- ✅ API calls are cached (5 minutes for countries)
- ✅ No duplicate requests
- ✅ Proper error handling

---

## Accessibility Testing

### Keyboard Navigation
- [ ] Tab through all filters
- [ ] Enter key submits search
- [ ] Arrow keys navigate table
- [ ] Escape key clears filters

### Screen Reader
- [ ] All labels are read correctly
- [ ] Table headers are announced
- [ ] Filter changes are announced
- [ ] Error messages are announced

### Color Contrast
- [ ] Text meets WCAG AA standards
- [ ] Links are distinguishable
- [ ] Focus indicators are visible

---

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ |
| Firefox | Latest | ✅ |
| Safari | Latest | ✅ |
| Edge | Latest | ✅ |
| Mobile Safari | iOS 14+ | ✅ |
| Chrome Mobile | Latest | ✅ |

---

## Automated Testing (Future)

### Unit Tests
```javascript
// Test adminJobApiClient
describe('adminJobApiClient', () => {
  it('should fetch jobs with filters', async () => {
    const jobs = await adminJobApiClient.getAdminJobs({
      search: 'cook',
      country: 'UAE'
    });
    expect(jobs).toBeInstanceOf(Array);
  });
});
```

### Integration Tests
```javascript
// Test Jobs page
describe('Jobs Page', () => {
  it('should display jobs', () => {
    render(<Jobs />);
    expect(screen.getByText('Job Listings')).toBeInTheDocument();
  });
  
  it('should filter by country', async () => {
    render(<Jobs />);
    const countrySelect = screen.getByLabelText('Country');
    fireEvent.change(countrySelect, { target: { value: 'UAE' } });
    await waitFor(() => {
      expect(screen.getByText('UAE')).toBeInTheDocument();
    });
  });
});
```

---

## Sign-Off Checklist

Before marking as complete:

- [ ] All filters work correctly
- [ ] Statistics display accurately
- [ ] Pagination works
- [ ] Error handling works
- [ ] Responsive design works
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] No memory leaks
- [ ] Accessibility tested
- [ ] Browser compatibility verified
- [ ] Documentation updated

---

**Status**: Ready for Testing  
**Last Updated**: 2025-11-26
