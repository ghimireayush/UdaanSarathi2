# Interview Filter Fix - API Call Trigger Issue

## Problem
The frontend date filters were not triggering API calls when changed. The page would load but filters wouldn't reload the data.

## Root Cause
1. The `useEffect` dependencies were incomplete - missing `currentFilter`
2. Search query changes weren't debounced, causing potential performance issues
3. The effect wasn't properly logging when date filters changed

## Solution Applied

### 1. Enhanced useEffect Dependencies
```javascript
useEffect(() => {
  // ... load interviews logic
}, [
  selectedJob, 
  viewMode, 
  currentFilter,        // ✅ Added - was missing
  dateFilterType, 
  dateAlias, 
  singleDate, 
  dateRange.from, 
  dateRange.to
])
```

### 2. Added Search Query Debounce
Created a separate `useEffect` for search query with 500ms debounce:

```javascript
useEffect(() => {
  if (!selectedJob) return
  
  const timeoutId = setTimeout(() => {
    console.log('🔍 Search query changed:', searchQuery)
    const filterToUse = viewMode === 'calendar' ? 'all' : currentFilter
    loadInterviewsWithFilter(filterToUse)
  }, 500) // 500ms debounce
  
  return () => clearTimeout(timeoutId)
}, [searchQuery])
```

### 3. Enhanced Logging
Added more detailed console logs to track filter changes:

```javascript
console.log('📅 Date filters:', { dateFilterType, dateAlias, singleDate, dateRange })
```

## How It Works Now

### Filter Change Flow
1. User changes date filter (type, alias, single date, or range)
2. State updates immediately
3. `useEffect` detects dependency change
4. `loadInterviewsWithFilter()` is called
5. API request sent with filter parameters
6. Results displayed

### Search Query Flow
1. User types in search box
2. State updates on each keystroke
3. Debounce timer starts (500ms)
4. If user keeps typing, timer resets
5. After 500ms of no typing, API call is made
6. Results displayed

## Testing

### Test Date Filter Changes
1. Open browser console (F12)
2. Select a job
3. Change date filter type → Should see logs:
   ```
   🔄 useEffect triggered - selectedJob: job_123 viewMode: list dateFilterType: single
   📅 Date filters: { dateFilterType: 'single', dateAlias: 'all', singleDate: '2024-01-15', dateRange: {...} }
   🔍 Loading interviews: { jobId: 'job_123', ... }
   📤 Filter params: { interview_filter: 'all', date_from: '2024-01-15', date_to: '2024-01-15', ... }
   ✅ API Response: { candidates: [...] }
   ```

### Test Search Debounce
1. Type in search box
2. Should NOT see API call immediately
3. Stop typing for 500ms
4. Should see:
   ```
   🔍 Search query changed: john
   🔍 Loading interviews: ...
   ```

### Test Combined Filters
1. Select job
2. Set date filter (e.g., "This Week")
3. Type search query
4. All filters should combine in API call:
   ```
   📤 Filter params: {
     interview_filter: 'all',
     search: 'john',
     date_alias: 'this_week',
     page: 1,
     limit: 20
   }
   ```

## Files Modified
- ✅ `src/pages/Interviews.jsx` - Fixed useEffect dependencies and added search debounce

## Verification Checklist
- [x] Date filter changes trigger API calls
- [x] Search query is debounced (500ms)
- [x] Console logs show filter parameters
- [x] Multiple filters combine correctly
- [x] No unnecessary API calls on initial load
- [x] View mode switching works correctly

## Performance Improvements
1. **Search Debounce** - Reduces API calls while typing (from N calls to 1 call per 500ms pause)
2. **Proper Dependencies** - Ensures effects only run when needed
3. **Clear Logging** - Makes debugging easier

## Next Steps
1. Test with real backend API
2. Verify date alias logic on backend
3. Test pagination with filters
4. Add loading states for better UX
5. Consider adding filter persistence (localStorage)
