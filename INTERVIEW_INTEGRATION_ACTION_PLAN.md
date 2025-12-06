# Interview API Integration - Action Plan

**Date**: November 30, 2025  
**Status**: Ready to Integrate  
**Priority**: HIGH

---

## 🎯 Executive Summary

The backend team has completed all interview API implementations. All 7 endpoints are ready and tested. This document provides a step-by-step integration plan to connect the frontend with the real APIs.

**Current Status**:
- ✅ Backend: 100% Complete (7/7 endpoints)
- ⏳ Frontend: Using mock data, ready to integrate
- 🎯 Goal: Replace mock services with real API calls

---

## 📋 Key Findings from Backend Response

### ✅ What's Ready

1. **All Endpoints Implemented**
   - List/Filter interviews with full interview object ✅
   - Schedule individual interview ✅
   - Bulk schedule interviews ✅
   - Reschedule interview ✅
   - Complete interview (pass/fail) ✅
   - Cancel/reject interview ✅
   - Interview statistics (NEW) ✅

2. **Enhanced Data Model**
   - 11 new fields added to match frontend requirements
   - Interview type auto-detection from location
   - Timestamps for all state changes
   - Feedback and scoring support

3. **Server-Side Filtering**
   - `interview_filter=today` ✅
   - `interview_filter=tomorrow` ✅
   - `interview_filter=unattended` ✅ (30min grace period)
   - `interview_filter=all` ✅

### ⚠️ Important Differences

1. **No-Show Status**: Not stored in DB, derived at runtime
   - Use `interview_filter=unattended` to get no-shows
   - Frontend should check if interview is past scheduled time + duration + 30min

2. **Rescheduled Status**: Not an interview status
   - Interview status stays "scheduled"
   - Check `rescheduled_at` timestamp to detect rescheduled interviews
   - Application status becomes "interview_rescheduled"

3. **Interview Type**: Auto-detected from location
   - "zoom", "meet", "teams" → Online
   - "phone", "call" → Phone
   - Default → In-person

---

## 🔧 Integration Tasks

### Phase 1: Core API Integration (Day 1-2)

#### Task 1.1: Update interviewApiClient.js

**File**: `src/services/interviewApiClient.js`

**Current Status**: Partially implemented  
**Action**: Add missing methods and update existing ones

```javascript
// ADD: Get interviews with filtering
export const getInterviews = async (jobId, license, filters = {}) => {
  const params = new URLSearchParams({
    stage: 'interview_scheduled',
    ...(filters.interview_filter && { interview_filter: filters.interview_filter }),
    ...(filters.search && { search: filters.search }),
    ...(filters.page && { page: filters.page }),
    ...(filters.limit && { limit: filters.limit })
  })
  
  const response = await fetch(
    `${API_BASE_URL}/agencies/${license}/jobs/${jobId}/candidates?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch interviews')
  }
  
  return response.json()
}

// ADD: Get interview statistics
export const getInterviewStats = async (jobId, license, dateRange = 'all') => {
  const response = await fetch(
    `${API_BASE_URL}/agencies/${license}/jobs/${jobId}/interview-stats?date_range=${dateRange}`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch interview statistics')
  }
  
  return response.json()
}
```

**Existing Methods**: Already implemented ✅
- `scheduleInterview(applicationId, interviewData)`
- `rescheduleInterview(applicationId, interviewId, updates)`
- `completeInterview(applicationId, result, note)`

#### Task 1.2: Update Interviews.jsx (Main Page)

**File**: `src/pages/Interviews.jsx`

**Changes Needed**:

1. **Replace loadData() method**:

```javascript
// BEFORE (lines 64-85)
const loadData = async () => {
  try {
    setIsLoading(true)
    const [jobsData, interviewsData] = await Promise.all([
      jobService.getJobs({ status: 'published' }),
      interviewService.getAllInterviews() // ❌ Mock data
    ])
    
    setJobs(jobsData)
    setInterviews(interviewsData)
    
    if (selectedJob) {
      const candidatesData = await candidateService.getCandidatesByJobId(selectedJob)
      setCandidates(candidatesData)
    }
  } catch (error) {
    console.error('Failed to load interviews data:', error)
  } finally {
    setIsLoading(false)
  }
}

// AFTER
const loadData = async () => {
  try {
    setIsLoading(true)
    
    // Load jobs
    const jobsData = await jobService.getJobs({ status: 'published' })
    setJobs(jobsData)
    
    // Load interviews if job is selected
    if (selectedJob) {
      const agencyLicense = agencyData?.license_number
      if (!agencyLicense) {
        throw new Error('Agency license not available')
      }
      
      // ✅ Use real API with filtering
      const response = await interviewApiClient.getInterviews(
        selectedJob,
        agencyLicense,
        {
          interview_filter: 'all', // Will be updated based on active filter
          page: currentPage,
          limit: itemsPerPage
        }
      )
      
      // Transform response to match expected format
      const interviewsData = response.candidates.map(candidate => ({
        ...candidate,
        // Ensure interview object is present
        interview: candidate.interview || null
      }))
      
      setInterviews(interviewsData)
    } else {
      setInterviews([])
    }
  } catch (error) {
    console.error('Failed to load interviews data:', error)
    alert(`Failed to load interviews: ${error.message}`)
  } finally {
    setIsLoading(false)
  }
}
```

2. **Add agency context**:

```javascript
// Add at top of component
import { useAgency } from '../contexts/AgencyContext.jsx'

// Inside component
const { agencyData } = useAgency()
```

3. **Update getFilteredInterviews() to use server-side filtering**:

```javascript
// BEFORE: Client-side filtering
const getFilteredInterviews = () => {
  let filtered = interviews
  // ... client-side filter logic
  return filtered
}

// AFTER: Server-side filtering (trigger reload with filter)
const getFilteredInterviews = () => {
  // Return current interviews (already filtered by server)
  return interviews
}

// Add new method to reload with filter
const loadInterviewsWithFilter = async (filter) => {
  if (!selectedJob) return
  
  try {
    setIsLoading(true)
    const agencyLicense = agencyData?.license_number
    
    const response = await interviewApiClient.getInterviews(
      selectedJob,
      agencyLicense,
      {
        interview_filter: filter,
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage
      }
    )
    
    const interviewsData = response.candidates.map(candidate => ({
      ...candidate,
      interview: candidate.interview || null
    }))
    
    setInterviews(interviewsData)
  } catch (error) {
    console.error('Failed to load interviews:', error)
  } finally {
    setIsLoading(false)
  }
}
```

4. **Update getTabCounts() to use statistics API**:

```javascript
// BEFORE: Client-side counting
const getTabCounts = () => {
  const today = new Date()
  const todayInterviews = interviews.filter(...)
  // ... more client-side logic
  return { scheduled, today, unattended, completed }
}

// AFTER: Use statistics endpoint
const [stats, setStats] = useState({
  scheduled: 0,
  today: 0,
  unattended: 0,
  completed: 0
})

const loadStats = async () => {
  if (!selectedJob) return
  
  try {
    const agencyLicense = agencyData?.license_number
    const response = await interviewApiClient.getInterviewStats(
      selectedJob,
      agencyLicense,
      'all'
    )
    
    setStats({
      scheduled: response.total_scheduled || 0,
      today: response.today || 0,
      unattended: response.unattended || 0,
      completed: response.completed || 0
    })
  } catch (error) {
    console.error('Failed to load statistics:', error)
  }
}

// Call in useEffect
useEffect(() => {
  loadData()
  loadStats()
}, [selectedJob])

// Use in render
const tabCounts = stats
```

#### Task 1.3: Update ScheduledInterviews.jsx

**File**: `src/components/ScheduledInterviews.jsx`

**Changes Needed**:

1. **Update to receive filter changes from parent**:

```javascript
// Component already has onFilterChange prop
// Parent should call loadInterviewsWithFilter when filter changes

// In Interviews.jsx:
<ScheduledInterviews 
  candidates={candidates}
  jobId={selectedJob}
  interviews={paginatedInterviews}
  currentFilter={activeSubtab}
  onFilterChange={(filter) => {
    setActiveSubtab(filter)
    loadInterviewsWithFilter(filter) // ✅ Reload with new filter
  }}
  onDataReload={loadData}
/>
```

2. **Handle unattended status display**:

```javascript
// Update isUnattended function to match backend logic
const isUnattended = (interview) => {
  if (!interview || interview.status !== 'scheduled') return false
  
  const scheduledTime = new Date(interview.scheduled_at)
  const endTime = new Date(scheduledTime)
  endTime.setMinutes(endTime.getMinutes() + (interview.duration || 60) + 30) // 30min grace
  
  return new Date() > endTime
}
```

3. **Update status badge to show rescheduled**:

```javascript
const getStatusBadge = (interview) => {
  const isUnattendedInterview = isUnattended(interview)

  if (isUnattendedInterview) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">Unattended</span>
  }
  
  // ✅ Check rescheduled_at timestamp
  if (interview.rescheduled_at && interview.status === 'scheduled') {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">Rescheduled</span>
  }

  switch (interview.status) {
    case 'scheduled':
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">Scheduled</span>
    case 'completed':
      if (interview.result === 'pass') {
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">Passed</span>
      } else if (interview.result === 'fail') {
        return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">Failed</span>
      }
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">Completed</span>
    case 'cancelled':
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">Cancelled</span>
    default:
      return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">Scheduled</span>
  }
}
```

4. **Add interview type icon display**:

```javascript
// Add after location icon
const getInterviewTypeIcon = (type) => {
  switch (type) {
    case 'Online':
      return '💻'
    case 'Phone':
      return '📞'
    case 'In-person':
    default:
      return '🏢'
  }
}

// In render:
<div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-3">
  <span className="mr-2">{getInterviewTypeIcon(interview.type)}</span>
  <span>{interview.type || 'In-person'}</span>
</div>
```

#### Task 1.4: Update applicationApiClient.js

**File**: `src/services/applicationApiClient.js`

**Action**: Add missing `updateApplicationStatus` method

```javascript
/**
 * Update application status (generic status update)
 * @param {string} applicationId - Application ID
 * @param {string} status - New status
 * @param {string} note - Optional note
 * @param {string} updatedBy - User ID
 * @returns {Promise<Object>} Updated application
 */
export const updateApplicationStatus = async (applicationId, status, note = '', updatedBy = 'agency') => {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/update-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ status, note, updatedBy })
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update application status' }))
    throw new Error(error.message || 'Failed to update application status')
  }
  
  return response.json()
}
```

---

### Phase 2: Enhanced Features (Day 3-4)

#### Task 2.1: Add Interview Type Display

**Files**: 
- `src/components/ScheduledInterviews.jsx`
- `src/components/InterviewCalendarView.jsx`

**Action**: Display interview type with icons

```javascript
// Add type display in interview cards
<div className="flex items-center space-x-2 text-sm">
  <span>{getInterviewTypeIcon(interview.type)}</span>
  <span>{interview.type}</span>
</div>
```

#### Task 2.2: Add Feedback and Scoring UI

**File**: `src/components/ScheduledInterviews.jsx`

**Action**: Show feedback, score, and recommendation for completed interviews

```javascript
// In interview details section
{interview.status === 'completed' && (
  <div className="mt-4 space-y-2">
    {interview.feedback && (
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-3">
        <h5 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">Feedback</h5>
        <p className="text-sm text-blue-700 dark:text-blue-300">{interview.feedback}</p>
      </div>
    )}
    
    {interview.score !== null && (
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">Score:</span>
        <span className="text-lg font-bold text-blue-600">{interview.score}/10</span>
      </div>
    )}
    
    {interview.recommendation && (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded p-3">
        <h5 className="text-sm font-medium text-green-800 dark:text-green-300 mb-1">Recommendation</h5>
        <p className="text-sm text-green-700 dark:text-green-300">{interview.recommendation}</p>
      </div>
    )}
  </div>
)}
```

#### Task 2.3: Update EnhancedInterviewScheduling.jsx

**File**: `src/components/EnhancedInterviewScheduling.jsx`

**Changes**: Already using real API via `jobCandidatesApiClient.bulkScheduleInterviews()` ✅

**Verify**: 
- Bulk scheduling works with new fields
- Duration field is passed correctly
- Required documents are sent

#### Task 2.4: Add Rescheduled Indicator

**Files**: All interview display components

**Action**: Show visual indicator for rescheduled interviews

```javascript
{interview.rescheduled_at && (
  <div className="flex items-center text-xs text-purple-600 dark:text-purple-400 mt-1">
    <RotateCcw className="w-3 h-3 mr-1" />
    Rescheduled on {format(new Date(interview.rescheduled_at), 'MMM dd, yyyy')}
  </div>
)}
```

---

### Phase 3: Testing & Validation (Day 5)

#### Task 3.1: Integration Testing

**Test Scenarios**:

1. **Load Interviews**
   - [ ] Select job → interviews load with real data
   - [ ] Interview object is present for all candidates
   - [ ] All fields are populated correctly

2. **Filter Interviews**
   - [ ] Click "Today" → shows only today's interviews
   - [ ] Click "Tomorrow" → shows only tomorrow's interviews
   - [ ] Click "Unattended" → shows no-shows (past scheduled time + 30min)
   - [ ] Click "All" → shows all scheduled interviews

3. **Search Interviews**
   - [ ] Search by candidate name → filters correctly
   - [ ] Search by phone → filters correctly
   - [ ] Search by interviewer → filters correctly

4. **Schedule Interview**
   - [ ] Individual scheduling works
   - [ ] Interview type auto-detected from location
   - [ ] Duration field saved correctly
   - [ ] Required documents saved

5. **Bulk Schedule**
   - [ ] Multiple candidates scheduled at once
   - [ ] Partial failures handled gracefully
   - [ ] Error messages displayed per candidate

6. **Reschedule Interview**
   - [ ] Date/time updated correctly
   - [ ] `rescheduled_at` timestamp displayed
   - [ ] "Rescheduled" badge shown

7. **Complete Interview**
   - [ ] Mark Pass → status updated, stage changed
   - [ ] Mark Fail → status updated, stage changed
   - [ ] Notes saved correctly

8. **Cancel/Reject**
   - [ ] Interview cancelled
   - [ ] Rejection reason saved
   - [ ] Application status updated to withdrawn

9. **Statistics**
   - [ ] Today count correct
   - [ ] Tomorrow count correct
   - [ ] Unattended count correct
   - [ ] Completed count correct

10. **UI Elements**
    - [ ] Interview type icons displayed
    - [ ] Unattended badge shown (red)
    - [ ] Rescheduled badge shown (purple)
    - [ ] Status badges correct colors
    - [ ] Feedback/score displayed for completed

#### Task 3.2: Edge Case Testing

1. **No Interview Data**
   - [ ] Candidate in `interview_scheduled` stage but no interview object
   - [ ] Should display gracefully (not crash)

2. **Past Interviews**
   - [ ] Cannot schedule interview in the past
   - [ ] Error message displayed

3. **Concurrent Actions**
   - [ ] Two users scheduling same candidate
   - [ ] Proper error handling

4. **Missing Fields**
   - [ ] Interview without duration → defaults to 60
   - [ ] Interview without type → defaults to "In-person"
   - [ ] Interview without location → displays "Not specified"

5. **Timezone Handling**
   - [ ] Server time vs local time
   - [ ] Dates displayed correctly in user's timezone

#### Task 3.3: Performance Testing

1. **Load Time**
   - [ ] Interview list loads in < 500ms
   - [ ] Statistics load in < 200ms
   - [ ] No unnecessary re-renders

2. **Pagination**
   - [ ] Large interview lists paginated correctly
   - [ ] Page navigation works smoothly

3. **Filter Performance**
   - [ ] Filter changes trigger server request
   - [ ] Loading states shown during filter changes

---

## 🔄 Data Mapping Reference

### Backend → Frontend Field Mapping

| Backend Field | Frontend Field | Notes |
|--------------|----------------|-------|
| `interview_date_ad` + `interview_time` | `scheduled_at` | Combined into ISO 8601 |
| `duration_minutes` | `duration` | Integer (minutes) |
| `contact_person` | `interviewer` | Name of interviewer |
| `interviewer_email` | `interviewer_email` | NEW field |
| `type` | `type` | Auto-detected or explicit |
| `status` | `status` | scheduled/completed/cancelled |
| `result` | `result` | pass/fail/rejected |
| `notes` | `notes` | Multi-line with timestamps |
| `feedback` | `feedback` | NEW field |
| `score` | `score` | NEW field (0-10) |
| `recommendation` | `recommendation` | NEW field |
| `rejection_reason` | `rejection_reason` | NEW field |
| `completed_at` | `completed_at` | NEW field |
| `cancelled_at` | `cancelled_at` | NEW field |
| `rescheduled_at` | `rescheduled_at` | NEW field |

### Status Mapping

| Interview Status | Application Status | UI Display |
|-----------------|-------------------|------------|
| `scheduled` | `interview_scheduled` | "Scheduled" (blue) |
| `scheduled` + past time | `interview_scheduled` | "Unattended" (red) |
| `scheduled` + `rescheduled_at` | `interview_rescheduled` | "Rescheduled" (purple) |
| `completed` + `result=pass` | `interview_passed` | "Passed" (green) |
| `completed` + `result=fail` | `interview_failed` | "Failed" (red) |
| `cancelled` | `withdrawn` | "Cancelled" (gray) |

---

## 📝 Code Changes Summary

### Files to Modify

1. **src/services/interviewApiClient.js**
   - Add `getInterviews()` method
   - Add `getInterviewStats()` method
   - Existing methods already correct ✅

2. **src/services/applicationApiClient.js**
   - Add `updateApplicationStatus()` method

3. **src/pages/Interviews.jsx**
   - Update `loadData()` to use real API
   - Add `loadInterviewsWithFilter()` method
   - Update `loadStats()` to use statistics endpoint
   - Add agency context

4. **src/components/ScheduledInterviews.jsx**
   - Update `isUnattended()` logic
   - Update `getStatusBadge()` to show rescheduled
   - Add interview type icon display
   - Add feedback/score display for completed interviews

5. **src/components/InterviewCalendarView.jsx**
   - Add interview type icons
   - Add rescheduled indicator
   - Update status colors

6. **src/components/EnhancedInterviewScheduling.jsx**
   - Verify bulk scheduling works (already using real API)
   - Ensure duration field is passed

### Files Already Correct ✅

- `src/services/interviewApiClient.js` - Core methods implemented
- `src/services/jobCandidatesApiClient.js` - Bulk scheduling works
- `src/components/EnhancedInterviewScheduling.jsx` - Using real API

---

## ⚠️ Important Considerations

### 1. Unattended Detection

**Backend Approach**: Calculated at runtime, not stored
**Frontend Impact**: 
- Use `interview_filter=unattended` to get no-shows
- Don't rely on interview status being "no_show"
- Calculate locally for real-time badge display

### 2. Rescheduled Status

**Backend Approach**: Timestamp-based, not status-based
**Frontend Impact**:
- Check `rescheduled_at` timestamp, not status
- Interview status stays "scheduled"
- Application status becomes "interview_rescheduled"

### 3. Interview Type

**Backend Approach**: Auto-detected from location
**Frontend Impact**:
- Don't need to explicitly set type in most cases
- Backend will detect from keywords in location
- Can override if needed

### 4. Notes Format

**Backend Approach**: Timestamped automatically
**Frontend Impact**:
- Don't add timestamps manually
- Backend handles timestamp formatting
- Display as-is from API

---

## 🎯 Success Metrics

### Integration Complete When:

- [ ] All mock data replaced with real API calls
- [ ] All 7 endpoints integrated and tested
- [ ] All filters work correctly (today/tomorrow/unattended/all)
- [ ] Statistics display real-time data
- [ ] Interview type icons displayed
- [ ] Rescheduled indicator shown
- [ ] Feedback/score displayed for completed interviews
- [ ] No console errors
- [ ] Performance acceptable (< 500ms loads)
- [ ] All edge cases handled gracefully

### Quality Checklist:

- [ ] Error handling for all API calls
- [ ] Loading states for all async operations
- [ ] User feedback for all actions (success/error messages)
- [ ] Proper TypeScript types (if using TS)
- [ ] Code comments for complex logic
- [ ] No hardcoded values (use constants)
- [ ] Responsive design maintained
- [ ] Dark mode support maintained
- [ ] Accessibility maintained

---

## 📞 Support & Resources

**Backend Team**: Available for questions  
**API Documentation**: Check Swagger at `http://localhost:3000/api`  
**Test Environment**: Docker setup at `http://localhost:3000`

**Questions to Ask Backend**:
1. ✅ All answered in backend response
2. Ready to proceed with integration

---

## 🚀 Next Steps

1. **Review this plan** - Ensure understanding of all changes
2. **Start with Phase 1** - Core API integration (Day 1-2)
3. **Test thoroughly** - Each endpoint as you integrate
4. **Move to Phase 2** - Enhanced features (Day 3-4)
5. **Complete Phase 3** - Full testing (Day 5)
6. **Deploy to staging** - End-to-end testing
7. **Production deployment** - After staging validation

**Estimated Timeline**: 5 days  
**Priority**: HIGH  
**Blocker**: None - Backend ready ✅

---

**Document Version**: 1.0  
**Date**: November 30, 2025  
**Status**: Ready to Execute
