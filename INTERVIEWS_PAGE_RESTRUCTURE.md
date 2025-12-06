# Interviews Page Restructure

## New Layout Structure

The Interviews page has been restructured with a cleaner, more logical layout:

```
┌─────────────────────────────────────────────────────────┐
│ Header (Title + Language Switch)                        │
├─────────────────────────────────────────────────────────┤
│ Stats (Today | Scheduled | Unattended | Completed)      │
├─────────────────────────────────────────────────────────┤
│ Mode Selector: [Contemporary] [Calendar]                │
├─────────────────────────────────────────────────────────┤
│ Common Filters:                                          │
│   - Filter by Job (dropdown)                            │
│   - Search Candidate (text input)                       │
├─────────────────────────────────────────────────────────┤
│ Mode-Specific Filters:                                  │
│                                                          │
│ IF Contemporary Mode:                                    │
│   - Tabs: Today | Tomorrow | Unattended | All          │
│                                                          │
│ IF Calendar Mode:                                        │
│   - [Week View] [Custom Range]                          │
│   - IF Week View: Week navigation slider               │
│   - IF Custom Range: From [date] to [date] [Clear]     │
├─────────────────────────────────────────────────────────┤
│ Interviews Listing                                       │
│   - Candidate cards with interview details              │
│   - Action buttons (Pass/Fail/Reschedule)              │
└─────────────────────────────────────────────────────────┘
```

## Two Modes

### 1. Contemporary Mode (Default)
- **Purpose**: Quick access to time-based filters
- **Filters**: Today, Tomorrow, Unattended, All
- **Backend**: Uses `interview_filter` parameter
- **Use Case**: Daily interview management

### 2. Calendar Mode
- **Purpose**: Date range-based filtering
- **Sub-modes**:
  - **Week View**: Navigate by week with prev/next buttons
  - **Custom Range**: Select specific date range
- **Backend**: Uses `date_from` and `date_to` parameters
- **Use Case**: Planning and historical review

## Filter Hierarchy

### Level 1: Stats (Always Visible)
- Today count
- Scheduled count
- Unattended count
- Completed count

### Level 2: Mode Selection
- Contemporary
- Calendar

### Level 3: Common Filters (Always Visible)
- Job filter (dropdown)
- Search query (text input)

### Level 4: Mode-Specific Filters
**Contemporary Mode:**
- Today/Tomorrow/Unattended/All tabs

**Calendar Mode:**
- Week View / Custom Range toggle
- Week navigation (if Week View)
- Date range inputs (if Custom Range)

### Level 5: Listing
- Filtered interview candidates
- Action buttons per candidate

## Data Flow

### Contemporary Mode
```
User selects "Today" tab
  ↓
setContemporaryFilter('today')
  ↓
loadInterviews() triggered
  ↓
API call with { interview_filter: 'today' }
  ↓
Backend filters interviews for today
  ↓
Display results
```

### Calendar Mode - Week View
```
User clicks "Next Week"
  ↓
setSelectedDate(nextWeek)
  ↓
loadInterviews() triggered
  ↓
Calculate week start/end dates
  ↓
API call with { date_from: '2025-12-09', date_to: '2025-12-15' }
  ↓
Backend filters interviews in date range
  ↓
Display results
```

### Calendar Mode - Custom Range
```
User selects from: 2025-12-01, to: 2025-12-31
  ↓
setCustomDateRange({ from: '2025-12-01', to: '2025-12-31' })
  ↓
loadInterviews() triggered
  ↓
API call with { date_from: '2025-12-01', date_to: '2025-12-31' }
  ↓
Backend filters interviews in date range
  ↓
Display results
```

## State Management

### Mode State
```javascript
const [mode, setMode] = useState('contemporary') // 'contemporary' | 'calendar'
```

### Contemporary Mode State
```javascript
const [contemporaryFilter, setContemporaryFilter] = useState('all') 
// 'today' | 'tomorrow' | 'unattended' | 'all'
```

### Calendar Mode State
```javascript
const [calendarViewMode, setCalendarViewMode] = useState('week') // 'week' | 'custom'
const [selectedDate, setSelectedDate] = useState(new Date()) // For week navigation
const [customDateRange, setCustomDateRange] = useState({ from: '', to: '' })
```

### Common State
```javascript
const [selectedJob, setSelectedJob] = useState('')
const [searchQuery, setSearchQuery] = useState('')
const [interviews, setInterviews] = useState([])
const [stats, setStats] = useState({ today: 0, scheduled: 0, unattended: 0, completed: 0 })
```

## API Integration

### Contemporary Mode API Call
```javascript
const filterParams = {
  interview_filter: contemporaryFilter, // 'today', 'tomorrow', 'unattended', 'all'
  search: searchQuery,
  job_id: selectedJob || undefined,
  page: 1,
  limit: 100
}

await InterviewDataSource.getInterviewsForAgency(license, filterParams)
```

### Calendar Mode - Week View API Call
```javascript
const weekStart = startOfWeek(selectedDate)
const weekEnd = endOfWeek(selectedDate)

const filterParams = {
  date_from: format(weekStart, 'yyyy-MM-dd'),
  date_to: format(weekEnd, 'yyyy-MM-dd'),
  search: searchQuery,
  job_id: selectedJob || undefined,
  page: 1,
  limit: 100
}

await InterviewDataSource.getInterviewsForAgency(license, filterParams)
```

### Calendar Mode - Custom Range API Call
```javascript
const filterParams = {
  date_from: customDateRange.from,
  date_to: customDateRange.to,
  search: searchQuery,
  job_id: selectedJob || undefined,
  page: 1,
  limit: 100
}

await InterviewDataSource.getInterviewsForAgency(license, filterParams)
```

## Refresh Triggers

The page reloads data when any of these change:
- `selectedJob` - Job filter changes
- `mode` - Mode switches between Contemporary/Calendar
- `contemporaryFilter` - Contemporary tab changes
- `calendarViewMode` - Calendar sub-mode changes
- `selectedDate` - Week navigation
- `customDateRange.from` or `customDateRange.to` - Custom range changes
- `searchQuery` - Search query (debounced 500ms)

## Component Props

### ScheduledInterviews Component
```javascript
<ScheduledInterviews
  candidates={interviews}              // Array of interview candidates
  jobId={selectedJob}                  // Selected job ID (optional)
  currentFilter={contemporaryFilter}   // Current filter (for Contemporary mode)
  onFilterChange={setContemporaryFilter} // Callback when filter changes
  onDataReload={loadInterviews}        // Callback to reload data
  showFilters={mode === 'contemporary'} // Show Today/Tomorrow/etc tabs
/>
```

## User Experience

### Contemporary Mode
1. User opens page → Defaults to Contemporary mode, "All" tab
2. User clicks "Today" → Shows only today's interviews
3. User clicks "Tomorrow" → Shows only tomorrow's interviews
4. User clicks "Unattended" → Shows interviews past their time
5. User clicks "All" → Shows all scheduled interviews

### Calendar Mode
1. User clicks "Calendar" mode → Defaults to Week View
2. Week View shows current week's interviews
3. User clicks "Next" → Shows next week
4. User clicks "Custom Range" → Shows date inputs
5. User selects date range → Shows interviews in that range
6. User clicks "Clear" → Clears custom range

### Common Filters (Both Modes)
1. User selects a job → Filters to that job only
2. User types in search → Filters by name/email/phone (debounced)
3. Filters combine with mode-specific filters

## Benefits

1. **Clear Hierarchy**: Stats → Mode → Common Filters → Mode Filters → Listing
2. **No Clutter**: Only relevant filters shown based on mode
3. **Intuitive**: Contemporary for daily use, Calendar for planning
4. **Flexible**: Can combine job filter + search + mode filters
5. **Responsive**: All filters trigger immediate data reload
6. **Clean UI**: No overlapping or confusing filter sections

## Files Modified

- `src/pages/Interviews.jsx` - Complete restructure
- `src/components/ScheduledInterviews.jsx` - Added `showFilters` prop to conditionally show tabs
