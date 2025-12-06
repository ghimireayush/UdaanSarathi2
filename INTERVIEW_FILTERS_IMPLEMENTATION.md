# Interview Page Filters Implementation Guide

## Current State Analysis

The interview page currently has:
1. **Job Filter** - Select specific job (dropdown)
2. **Search Query** - Search by candidate name/details
3. **Interview Filter** - Predefined filters (today/tomorrow/unattended/all)

## Missing: Date Range Support

### Required Filters

1. **Job ID** - Already implemented ✅
2. **Search Query** - Already implemented ✅  
3. **Date Filter** - Needs enhancement:
   - Single date selection
   - Date range (start date + end date)
   - Date aliases (today, tomorrow, this_week, next_week, this_month)
   - Custom date range picker

## Implementation Plan

### 1. Update API Client (`interviewApiClient.js`)

Add date range parameters to `getInterviewsForJob`:

```javascript
export const getInterviewsForJob = async (jobId, license, filters = {}) => {
  const params = new URLSearchParams({
    stage: 'interview_scheduled'
  })
  
  // Existing filters
  if (filters.interview_filter) {
    params.append('interview_filter', filters.interview_filter)
  }
  if (filters.search) {
    params.append('search', filters.search)
  }
  
  // NEW: Date range filters
  if (filters.date_from) {
    params.append('date_from', filters.date_from) // Format: YYYY-MM-DD
  }
  if (filters.date_to) {
    params.append('date_to', filters.date_to) // Format: YYYY-MM-DD
  }
  if (filters.date_alias) {
    // Aliases: 'today', 'tomorrow', 'this_week', 'next_week', 'this_month'
    params.append('date_alias', filters.date_alias)
  }
  
  if (filters.page) {
    params.append('page', filters.page)
  }
  if (filters.limit) {
    params.append('limit', filters.limit)
  }
  
  const response = await fetch(
    `${API_BASE_URL}/agencies/${license}/jobs/${jobId}/candidates?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    }
  )
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch interviews' }))
    throw new Error(error.message || 'Failed to fetch interviews')
  }
  
  return response.json()
}
```

### 2. Update Interview Page Component (`Interviews.jsx`)

Add date range state and UI:

```javascript
// Add new state for date filters
const [dateFilterType, setDateFilterType] = useState('alias') // 'alias', 'single', 'range'
const [dateAlias, setDateAlias] = useState('all') // 'today', 'tomorrow', 'this_week', etc.
const [singleDate, setSingleDate] = useState('')
const [dateRange, setDateRange] = useState({ from: '', to: '' })

// Update loadInterviewsWithFilter to include date filters
const loadInterviewsWithFilter = async (filter) => {
  if (!selectedJob) return
  
  try {
    setIsLoading(true)
    const agencyLicense = agencyData?.license_number
    
    if (!agencyLicense) {
      throw new Error('Agency license not available')
    }
    
    // Build filter object with date parameters
    const filterParams = {
      interview_filter: filter,
      search: searchQuery,
      page: currentPage,
      limit: itemsPerPage
    }
    
    // Add date filters based on type
    if (dateFilterType === 'alias' && dateAlias !== 'all') {
      filterParams.date_alias = dateAlias
    } else if (dateFilterType === 'single' && singleDate) {
      filterParams.date_from = singleDate
      filterParams.date_to = singleDate
    } else if (dateFilterType === 'range' && dateRange.from && dateRange.to) {
      filterParams.date_from = dateRange.from
      filterParams.date_to = dateRange.to
    }
    
    const response = await interviewApiClient.getInterviewsForJob(
      selectedJob,
      agencyLicense,
      filterParams
    )
    
    const interviewsData = (response.candidates || []).map(candidate => ({
      ...candidate,
      interview: candidate.interview || null
    }))
    
    setInterviews(interviewsData)
    setCurrentFilter(filter)
  } catch (error) {
    console.error('❌ Failed to load interviews:', error)
    alert(`Failed to load interviews: ${error.message}`)
  } finally {
    setIsLoading(false)
  }
}
```

### 3. Add Date Filter UI Component

Create a new date filter section in the filters area:

```jsx
{/* Date Filter Section */}
<div className="flex-1">
  <div className="flex items-center space-x-2">
    {/* Date Filter Type Selector */}
    <select
      value={dateFilterType}
      onChange={(e) => {
        setDateFilterType(e.target.value)
        // Reset date values when switching types
        setDateAlias('all')
        setSingleDate('')
        setDateRange({ from: '', to: '' })
      }}
      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
    >
      <option value="alias">Quick Filter</option>
      <option value="single">Single Date</option>
      <option value="range">Date Range</option>
    </select>

    {/* Conditional Date Input based on type */}
    {dateFilterType === 'alias' && (
      <select
        value={dateAlias}
        onChange={(e) => {
          setDateAlias(e.target.value)
          loadInterviewsWithFilter(currentFilter)
        }}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
      >
        <option value="all">All Dates</option>
        <option value="today">Today</option>
        <option value="tomorrow">Tomorrow</option>
        <option value="this_week">This Week</option>
        <option value="next_week">Next Week</option>
        <option value="this_month">This Month</option>
      </select>
    )}

    {dateFilterType === 'single' && (
      <input
        type="date"
        value={singleDate}
        onChange={(e) => {
          setSingleDate(e.target.value)
          loadInterviewsWithFilter(currentFilter)
        }}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
      />
    )}

    {dateFilterType === 'range' && (
      <div className="flex-1 flex items-center space-x-2">
        <input
          type="date"
          value={dateRange.from}
          onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
          placeholder="From"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        <span className="text-gray-500">to</span>
        <input
          type="date"
          value={dateRange.to}
          onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
          placeholder="To"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        />
        <button
          onClick={() => loadInterviewsWithFilter(currentFilter)}
          disabled={!dateRange.from || !dateRange.to}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply
        </button>
      </div>
    )}
  </div>
</div>
```

### 4. Backend API Requirements

The backend endpoint should support these query parameters:

```
GET /agencies/:license/jobs/:jobId/candidates?stage=interview_scheduled&interview_filter=today&search=john&date_from=2024-01-01&date_to=2024-01-31&date_alias=this_week&page=1&limit=20
```

**Query Parameters:**
- `stage` - Always "interview_scheduled" for interviews
- `interview_filter` - today/tomorrow/unattended/all
- `search` - Search query for candidate name/details
- `date_from` - Start date (YYYY-MM-DD)
- `date_to` - End date (YYYY-MM-DD)
- `date_alias` - Quick date filter (today/tomorrow/this_week/next_week/this_month)
- `page` - Page number for pagination
- `limit` - Items per page

**Date Alias Logic (Backend):**
- `today` - Interviews scheduled for today
- `tomorrow` - Interviews scheduled for tomorrow
- `this_week` - Interviews in current week (Mon-Sun)
- `next_week` - Interviews in next week
- `this_month` - Interviews in current month

**Priority:** If `date_alias` is provided, it takes precedence over `date_from`/`date_to`.

### 5. Update useEffect Dependencies

Add date filter dependencies to trigger reload:

```javascript
useEffect(() => {
  if (selectedJob && selectedJob !== '') {
    const filterToUse = viewMode === 'calendar' ? 'all' : currentFilter
    loadInterviewsWithFilter(filterToUse)
    loadStats()
  } else {
    setInterviews([])
    setStats({ scheduled: 0, today: 0, unattended: 0, completed: 0 })
    setIsLoading(false)
  }
}, [selectedJob, viewMode, dateFilterType, dateAlias, singleDate, dateRange])
```

## Testing Checklist

- [ ] Job filter works correctly
- [ ] Search query filters candidates
- [ ] Date alias filters (today, tomorrow, etc.) work
- [ ] Single date selection works
- [ ] Date range selection works
- [ ] Filters combine correctly (job + search + date)
- [ ] Pagination works with filters
- [ ] Calendar view respects date filters
- [ ] List view respects date filters
- [ ] Clear/reset filters functionality

## API Response Format

Expected response from backend:

```json
{
  "candidates": [
    {
      "candidate_id": "cand_123",
      "candidate_name": "John Doe",
      "candidate_phone": "+977-9841234567",
      "candidate_email": "john@example.com",
      "application_id": "app_456",
      "interview": {
        "id": "int_789",
        "scheduled_at": "2024-01-15T10:00:00Z",
        "duration": 60,
        "location": "Office",
        "interviewer": "Jane Smith",
        "status": "scheduled",
        "notes": "Bring portfolio"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

## Notes

1. **Date Format:** Always use ISO 8601 format (YYYY-MM-DD) for date parameters
2. **Timezone:** Backend should handle timezone conversion based on agency location
3. **Performance:** Consider caching frequently used date ranges
4. **UX:** Show loading state when filters change
5. **Validation:** Ensure date_to >= date_from for range filters
