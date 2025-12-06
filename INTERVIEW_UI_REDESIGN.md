# Interview Page UI Redesign - Date Navigation

**Goal**: Simplify date filtering with intuitive week/day navigation  
**Current**: Complex dropdowns with alias/single/range options  
**Desired**: Clean navigation similar to calendar apps

---

## 🎯 Desired UI

### Mode 1: Week View (Default)
```
┌─────────────────────────────────────────────────────────────┐
│  <  [Sun 1] [Mon 2] [Tue 3] [Wed 4*] [Thu 5] [Fri 6] [Sat 7]  >  │
│     ←prev                  today                      next→     │
└─────────────────────────────────────────────────────────────┘
```
- Shows 7 days of current week
- Today is highlighted with special styling
- Selected day has blue background
- Click day to select it
- Arrows navigate to prev/next week

### Mode 2: Day View
```
┌──────────────────────────────────────┐
│  <  [Wednesday, December 4, 2025*]  >  │
│     ←prev        today         next→   │
└──────────────────────────────────────┘
```
- Shows single day
- Today is highlighted
- Arrows navigate to prev/next day

### Mode 3: Custom Range
```
┌─────────────────────────────────────┐
│  From: [date picker]  To: [date picker]  │
└─────────────────────────────────────┘
```
- No week/day slider visible
- Manual date range selection
- Used for specific date ranges

---

## 🔄 Mode Selector

```
┌──────────────────────────────────┐
│  [Week] [Day] [Custom Range]     │
└──────────────────────────────────┘
```

Three buttons to switch between modes

---

## 📊 Complete UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Interviews                                    [Language]     │
│  Manage interview schedules...                                │
├─────────────────────────────────────────────────────────────┤
│  Filters                                                      │
│  ┌─────────────────┐  ┌──────────────────────────────┐      │
│  │ Job: [dropdown] │  │ Search: [____________]       │      │
│  └─────────────────┘  └──────────────────────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  Date Navigation                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  [Week] [Day] [Custom Range]                         │   │
│  │                                                       │   │
│  │  <  [Sun] [Mon] [Tue] [Wed*] [Thu] [Fri] [Sat]  >   │   │
│  └──────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Status Filters                                               │
│  [Today] [Tomorrow] [Unattended] [All]                       │
├─────────────────────────────────────────────────────────────┤
│  Interview List                                               │
│  [Interview cards...]                                         │
├─────────────────────────────────────────────────────────────┤
│  Statistics                                                   │
│  [Today: 5] [Scheduled: 45] [Unattended: 2] [Completed: 30] │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Plan

### Step 1: Add Mode State

```javascript
const [dateMode, setDateMode] = useState('week') // 'week', 'day', 'custom'
const [selectedDate, setSelectedDate] = useState(new Date())
const [customRange, setCustomRange] = useState({ from: '', to: '' })
```

### Step 2: Navigation Handlers

```javascript
const handlePrevious = () => {
  if (dateMode === 'week') {
    setSelectedDate(subWeeks(selectedDate, 1))
  } else if (dateMode === 'day') {
    setSelectedDate(subDays(selectedDate, 1))
  }
}

const handleNext = () => {
  if (dateMode === 'week') {
    setSelectedDate(addWeeks(selectedDate, 1))
  } else if (dateMode === 'day') {
    setSelectedDate(addDays(selectedDate, 1))
  }
}

const handleToday = () => {
  setSelectedDate(new Date())
}
```

### Step 3: Build API Filters

```javascript
const buildDateFilters = () => {
  if (dateMode === 'week') {
    const weekStart = startOfWeek(selectedDate)
    const weekEnd = endOfWeek(selectedDate)
    return {
      date_from: format(weekStart, 'yyyy-MM-dd'),
      date_to: format(weekEnd, 'yyyy-MM-dd')
    }
  } else if (dateMode === 'day') {
    const dayStr = format(selectedDate, 'yyyy-MM-dd')
    return {
      date_from: dayStr,
      date_to: dayStr
    }
  } else if (dateMode === 'custom') {
    return {
      date_from: customRange.from,
      date_to: customRange.to
    }
  }
  return {}
}
```

### Step 4: Load Interviews with Date Range

```javascript
const loadInterviews = async () => {
  const dateFilters = buildDateFilters()
  
  const response = await interviewApiClient.getInterviewsForAgency(
    agencyLicense,
    {
      job_id: selectedJob || undefined,
      interview_filter: currentFilter,
      search: searchQuery,
      ...dateFilters,
      limit: 100
    }
  )
  
  setInterviews(response.candidates)
}
```

### Step 5: Render UI

```jsx
{/* Mode Selector */}
<div className="flex space-x-2 mb-4">
  <button
    onClick={() => setDateMode('week')}
    className={`px-4 py-2 rounded-md ${dateMode === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
  >
    Week
  </button>
  <button
    onClick={() => setDateMode('day')}
    className={`px-4 py-2 rounded-md ${dateMode === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
  >
    Day
  </button>
  <button
    onClick={() => setDateMode('custom')}
    className={`px-4 py-2 rounded-md ${dateMode === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
  >
    Custom Range
  </button>
</div>

{/* Date Navigation */}
<InterviewDateNavigation
  viewMode={dateMode}
  selectedDate={selectedDate}
  onDateChange={setSelectedDate}
  onPrevious={handlePrevious}
  onNext={handleNext}
/>

{/* Custom Range Pickers (only in custom mode) */}
{dateMode === 'custom' && (
  <div className="flex gap-4">
    <input
      type="date"
      value={customRange.from}
      onChange={(e) => setCustomRange(prev => ({ ...prev, from: e.target.value }))}
      placeholder="From"
    />
    <input
      type="date"
      value={customRange.to}
      onChange={(e) => setCustomRange(prev => ({ ...prev, to: e.target.value }))}
      placeholder="To"
    />
  </div>
)}
```

---

## 🎨 Visual Design

### Week View - Day Buttons

**Normal Day**:
```
┌─────┐
│ Mon │  ← Gray background
│  2  │  ← Date number
└─────┘
```

**Today (not selected)**:
```
┌─────┐
│ Wed │  ← Blue border, light blue background
│  4* │  ← Asterisk or "Today" label
└─────┘
```

**Selected Day**:
```
┌─────┐
│ Thu │  ← Blue background, white text
│  5  │  ← Bold
└─────┘
```

### Day View - Single Day Card

**Normal Day**:
```
┌──────────────────────────┐
│    Thursday              │
│  December 5, 2025        │
└──────────────────────────┘
```

**Today**:
```
┌──────────────────────────┐
│    Wednesday             │  ← Blue background
│  December 4, 2025        │  ← White text
│       Today              │  ← Small label
└──────────────────────────┘
```

---

## 📝 Implementation Summary

**Files to Create**:
1. ✅ `src/components/InterviewDateNavigation.jsx` - New navigation component

**Files to Modify**:
1. `src/pages/Interviews.jsx` - Replace date filter UI with new navigation

**Changes**:
- Remove: Complex date filter dropdowns (alias/single/range)
- Add: Simple mode selector (Week/Day/Custom)
- Add: InterviewDateNavigation component
- Keep: Job filter, search, status filters (today/tomorrow/unattended/all)

**Benefits**:
- ✅ Cleaner, more intuitive UI
- ✅ Faster navigation between dates
- ✅ Visual feedback (today highlighted)
- ✅ Mobile-friendly
- ✅ Matches calendar app UX patterns

---

**Status**: Component created, ready to integrate  
**Next**: Update Interviews.jsx to use new component
