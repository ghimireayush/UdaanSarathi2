# Interview Page - API Analysis

**Date**: November 30, 2025  
**Issue**: No API calls being made on page load  
**Root Cause**: Using mock jobService instead of real API

---

## 🔍 Current API Calls on Interview Page

### On Page Load (useEffect)

```javascript
useEffect(() => {
  loadJobs()  // ❌ MOCK DATA - No real API call
  setIsLoading(false)
}, [])
```

**What it calls**:
```javascript
const loadJobs = async () => {
  const jobsData = await jobService.getJobs({ status: 'published' })  // ❌ MOCK
  setJobs(jobsData)
}
```

**Problem**: `jobService.getJobs()` uses MOCK data from `src/data/jobs.json`

**Result**: No network request, jobs loaded from local JSON file

---

### When Job is Selected

```javascript
const handleJobSelect = async (jobId) => {
  setSelectedJob(jobId)
  
  // 1. Load candidates (for scheduling tab)
  const candidatesData = await candidateService.getCandidatesByJobId(jobId)  // ❌ MOCK
  setCandidates(candidatesData)
}
```

**Then useEffect triggers**:
```javascript
useEffect(() => {
  if (selectedJob) {
    loadInterviewsWithFilter(currentFilter)  // ✅ REAL API
    loadStats()  // ✅ REAL API
  }
}, [selectedJob, viewMode])
```

---

## 📋 All APIs Used on Interview Page

### 1. Load Jobs (MOCK) ❌

**Current**:
```javascript
jobService.getJobs({ status: 'published' })
```

**What it does**: Loads from `src/data/jobs.json` (mock data)

**Should be**: Real API call to get agency's jobs
```
GET /agencies/:license/jobs?status=published
```

---

### 2. Load Candidates (MOCK) ❌

**Current**:
```javascript
candidateService.getCandidatesByJobId(jobId)
```

**What it does**: Loads from mock data

**Should be**: Real API call
```
GET /agencies/:license/jobs/:jobId/candidates?stage=shortlisted
```

**Used for**: Populating the "Schedule New" tab with shortlisted candidates

---

### 3. Load Interviews (REAL API) ✅

**Current**:
```javascript
interviewApiClient.getInterviewsForJob(jobId, license, {
  interview_filter: 'all',
  search: searchQuery,
  page: currentPage,
  limit: itemsPerPage
})
```

**API Call**:
```
GET /agencies/:license/jobs/:jobId/candidates?stage=interview_scheduled&interview_filter=all
```

**Status**: ✅ Using real API

**Problem**: Never called because `selectedJob` is never set (jobs don't load)

---

### 4. Load Statistics (REAL API) ✅

**Current**:
```javascript
interviewApiClient.getInterviewStats(jobId, license, 'all')
```

**API Call**:
```
GET /agencies/:license/jobs/:jobId/interview-stats?date_range=all
```

**Status**: ✅ Using real API

**Problem**: Never called because `selectedJob` is never set

---

### 5. Schedule Interview (REAL API) ✅

**Current**:
```javascript
interviewApiClient.scheduleInterview(applicationId, {
  date: '2025-12-15',
  time: '14:00',
  duration: 60,
  location: 'Office',
  interviewer: 'Ahmed',
  notes: 'Interview scheduled'
})
```

**API Call**:
```
POST /applications/:applicationId/schedule-interview
```

**Status**: ✅ Using real API

**Used in**: "Schedule New" tab when scheduling interviews

---

## 🐛 The Problem

### Root Cause

The interview page flow is:

```
1. Page loads
   ↓
2. loadJobs() called
   ↓
3. jobService.getJobs() returns MOCK data ❌
   ↓
4. Jobs populate dropdown
   ↓
5. User selects a job
   ↓
6. selectedJob state updates
   ↓
7. useEffect triggers
   ↓
8. loadInterviewsWithFilter() called ✅
   ↓
9. Real API call made ✅
```

**The issue**: Step 3 uses mock data, so if the mock data is empty or doesn't match your database, the dropdown will be empty or show wrong jobs.

---

## ✅ Solution

### Option 1: Use Real Job API (Recommended)

Replace `jobService.getJobs()` with real API call.

**Check if job API client exists**:
```bash
# Search for job API client
ls src/services/*job*Api*.js
```

**If exists**: Use it
```javascript
import jobApiClient from './jobApiClient.js'

const loadJobs = async () => {
  const jobsData = await jobApiClient.getJobs(agencyLicense, { status: 'published' })
  setJobs(jobsData)
}
```

**If doesn't exist**: Create it or use admin API
```javascript
const loadJobs = async () => {
  const agencyLicense = agencyData?.license_number
  const response = await fetch(
    `${API_BASE_URL}/agencies/${agencyLicense}/jobs?status=published`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    }
  )
  const jobsData = await response.json()
  setJobs(jobsData)
}
```

---

### Option 2: Use Mock Data (Quick Test)

If you just want to test with mock data:

1. **Check mock jobs file**:
   ```bash
   cat src/data/jobs.json
   ```

2. **Make sure it has jobs with `status: 'published'`**

3. **Select one of those jobs from dropdown**

4. **Then the real interview APIs will be called**

---

## 🔧 Quick Fix

Let me check what job API clients exist:

<function_calls>
<invoke name="executeBash">
<parameter name="command">ls -la src/services/*job*Api*.js 2>/dev/null || echo "No job API clients found"