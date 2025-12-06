# Interview Filtering Logic - Calendar vs List Mode

**Date**: November 30, 2025  
**Status**: Updated ✅

---

## 🎯 Filtering Strategy

### List Mode (Daily Filters)
- Uses **server-side filtering**
- Filters: Today, Tomorrow, Unattended, All
- API parameter: `interview_filter=today|tomorrow|unattended|all`
- Data is pre-filtered by backend

### Calendar Mode (Date Range Filtering)
- Uses **client-side filtering** on ALL interviews
- Fetches ALL interviews once (`interview_filter=all`)
- Filters by selected date/week on the client
- More efficient for navigating between dates

---

## 📅 Date Picker Visibility

| View Mode | Time Range | Date Picker Visible? | Reason |
|-----------|-----------|---------------------|---------|
| List | N/A | ❌ No | Uses filter buttons (today/tomorrow/etc) |
| Calendar | Day | ✅ Yes | User selects specific day |
| Calendar | Week | ❌ No | Week navigation via arrows |

---

## 🔄 Data Flow

### List Mode Flow

```
User clicks "Today" filter
  ↓
loadInterviewsWithFilter('today')
  ↓
API: GET /agencies/:license/jobs/:jobId/candidates?stage=interview_scheduled&interview_filter=today
  ↓
Backend filters by today's date
  ↓
Frontend displays results
```

### Calendar Week Mode Flow

```
User switches to Calendar + Week
  ↓
loadInterviewsWithFilter('all')  // Fetch ALL interviews
  ↓
API: GET /agencies/:license/jobs/:jobId/candidates?stage=interview_scheduled&interview_filter=all
  ↓
Backend returns all scheduled interviews
  ↓
getFilteredInterviews() filters by selected week (client-side)
  ↓
Frontend displays week view
```

### Calendar Day Mode Flow

```
User switches to Calendar + Day
  ↓
loadInterviewsWithFilter('all')  // Fetch ALL interviews
  ↓
API: GET /agencies/:license/jobs/:jobId/candidates?stage=interview_scheduled&interview_filter=all
  ↓
Backend returns all scheduled interviews
  ↓
User selects date from date picker
  ↓
getFilteredInterviews() filters by selected day (client-side)
  ↓
Frontend displays day view
```

---

## 💻 Implementation

### 1. Load Interviews Based on View Mode

```javascript
useEffect(() => {
  if (selectedJob) {
    // In calendar mode, load ALL interviews for client-side filtering
    // In list mode, use the current filter (today/tomorrow/unattended/all)
    const filterToUse = viewMode === 'calendar' ? 'all' : currentFilter
    loadInterviewsWithFilter(filterToUse)
    loadStats()
  } else {
    setInterviews([])
    setStats({ scheduled: 0, today: 0, unattended: 0, completed: 0 })
    setIsLoading(false)
  }
}, [selectedJob, viewMode])
```

### 2. Filter Interviews for Display

```javascript
const getFilteredInterviews = () => {
  // In list mode: interviews are already filtered by server
  // In calendar mode: apply client-side date range filtering
  if (viewMode === 'calendar') {
    const startDate = timeRange === 'day' 
      ? startOfDay(selectedDate)
      : startOfWeek(selectedDate)
    const endDate = timeRange === 'day'
      ? endOfDay(selectedDate)
      : endOfWeek(selectedDate)

    return interviews.filter(interview => {
      if (!interview.interview) return false
      const interviewDate = new Date(interview.interview.scheduled_at)
      return interviewDate >= startDate && interviewDate <= endDate
    })
  }
  
  // List mode: return as-is (already filtered by server)
  return interviews
}
```

### 3. Date Picker Visibility

```javascript
{/* Date Picker for Calendar View - Only show in day mode, not week mode */}
{activeTab === 'scheduled' && viewMode === 'calendar' && timeRange === 'day' && (
  <div>
    <input
      type="date"
      value={format(selectedDate, 'yyyy-MM-dd')}
      onChange={(e) => setSelectedDate(new Date(e.target.value))}
      className="..."
    />
  </div>
)}
```

---

## 🎨 UI Behavior

### List Mode

**Visible Controls**:
- ✅ Filter chips (Today, Tomorrow, Unattended, All)
- ✅ Search box
- ✅ Job dropdown
- ❌ Date picker (not needed)
- ❌ Time range toggle (not needed)

**Behavior**:
- Clicking filter chip triggers API call with that filter
- Results are paginated
- Statistics update based on filter

### Calendar Week Mode

**Visible Controls**:
- ✅ Week navigation arrows (< >)
- ✅ "Today" button
- ✅ Search box
- ✅ Job dropdown
- ❌ Date picker (hidden - use arrows to navigate)
- ❌ Filter chips (not needed - showing all)

**Behavior**:
- Shows 7 days (Sunday - Saturday)
- Arrows navigate to previous/next week
- "Today" button jumps to current week
- All interviews loaded once, filtered client-side

### Calendar Day Mode

**Visible Controls**:
- ✅ Day navigation arrows (< >)
- ✅ "Today" button
- ✅ Date picker (select specific day)
- ✅ Search box
- ✅ Job dropdown
- ❌ Filter chips (not needed - showing all)

**Behavior**:
- Shows single day view
- Arrows navigate to previous/next day
- Date picker allows jumping to specific date
- All interviews loaded once, filtered client-side

---

## 🔍 Debugging

### Check Current State

```javascript
// In browser console
console.log('View Mode:', viewMode)  // 'list' or 'calendar'
console.log('Time Range:', timeRange)  // 'day' or 'week'
console.log('Current Filter:', currentFilter)  // 'today', 'tomorrow', 'unattended', 'all'
console.log('Selected Date:', selectedDate)
console.log('Interviews Count:', interviews.length)
```

### Check API Calls

Open Network tab and look for:

**List Mode**:
```
GET /agencies/REG-2025-793487/jobs/{jobId}/candidates?stage=interview_scheduled&interview_filter=today
```

**Calendar Mode**:
```
GET /agencies/REG-2025-793487/jobs/{jobId}/candidates?stage=interview_scheduled&interview_filter=all
```

### Console Logging

The code now includes detailed logging:

```javascript
console.log('🔍 Loading interviews:', {
  jobId: selectedJob,
  license: agencyLicense,
  filter,
  viewMode,
  timeRange
})

console.log('✅ API Response:', response)
console.log('📊 Candidates count:', response.candidates?.length || 0)
console.log('📝 Transformed interviews:', interviewsData.length)
```

---

## ⚡ Performance Considerations

### List Mode
- **Pros**: Only loads filtered data, smaller payload
- **Cons**: Each filter change triggers API call
- **Best for**: When user stays on one filter

### Calendar Mode
- **Pros**: Loads all data once, fast navigation between dates
- **Cons**: Larger initial payload
- **Best for**: When user navigates between dates frequently

---

## 🐛 Common Issues

### Issue: No data in calendar mode

**Cause**: API not returning all interviews

**Solution**:
```javascript
// Check if filter is set to 'all' in calendar mode
console.log('Filter being used:', filterToUse)
// Should be 'all' in calendar mode
```

### Issue: Date picker not showing

**Cause**: Wrong conditions

**Check**:
```javascript
console.log('Active Tab:', activeTab)  // Should be 'scheduled'
console.log('View Mode:', viewMode)    // Should be 'calendar'
console.log('Time Range:', timeRange)  // Should be 'day'
```

### Issue: Filters not working in list mode

**Cause**: View mode might be 'calendar'

**Solution**:
```javascript
// Make sure you're in list mode
console.log('View Mode:', viewMode)  // Should be 'list'
```

---

## ✅ Testing Checklist

### List Mode
- [ ] Click "Today" → Shows only today's interviews
- [ ] Click "Tomorrow" → Shows only tomorrow's interviews
- [ ] Click "Unattended" → Shows only unattended interviews
- [ ] Click "All" → Shows all scheduled interviews
- [ ] Date picker is hidden
- [ ] Time range toggle is hidden

### Calendar Week Mode
- [ ] Shows 7 days (Sun-Sat)
- [ ] Date picker is hidden
- [ ] Left arrow → Previous week
- [ ] Right arrow → Next week
- [ ] "Today" button → Current week
- [ ] Shows all interviews for the week

### Calendar Day Mode
- [ ] Shows single day
- [ ] Date picker is visible
- [ ] Can select date from picker
- [ ] Left arrow → Previous day
- [ ] Right arrow → Next day
- [ ] "Today" button → Current day
- [ ] Shows all interviews for the day

---

**Document Version**: 1.0  
**Date**: November 30, 2025  
**Status**: Implementation Complete ✅
