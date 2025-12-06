# Debug Interview Page - Step by Step

**Issue**: Seeing "No job selected, clearing interviews"  
**Date**: November 30, 2025

---

## 🔍 Debugging Steps

### Step 1: Open Browser Console

Press **F12** or right-click → Inspect → Console tab

### Step 2: Reload the Page

Refresh the interview page and watch the console logs

### Step 3: Check Initial Logs

You should see:
```
📋 Loading jobs...
✅ Jobs loaded: X jobs
Jobs: [array of job objects]
```

**If you DON'T see this**:
- Jobs are not loading
- Check if `jobService.getJobs()` is working
- Check Network tab for API calls

**If jobs array is empty**:
- No published jobs in database
- Check backend data

### Step 4: Check Job Dropdown

Look at the dropdown in the UI:
- Does it show "All Jobs" option? ✅
- Does it show actual job names below? ❓

**If no jobs in dropdown**:
- Jobs didn't load (see Step 3)
- Check `jobs` state in React DevTools

### Step 5: Select a Job

Click on a job in the dropdown (NOT "All Jobs")

You should see these logs:
```
🎯 Job selected from dropdown: job-uuid-here
Job ID type: string
Job ID length: 36 (or similar)
🔄 useEffect triggered - selectedJob: job-uuid-here viewMode: calendar
📌 Job selected, loading interviews: job-uuid-here
🎯 Filter to use: all
👥 Candidates loaded: X
🔍 Loading interviews: {...}
✅ API Response: {...}
📊 Candidates count: X
📝 Transformed interviews: X
```

**If you see "No job selected" instead**:
- Job ID is empty or undefined
- Check what value the dropdown is sending
- Check `handleJobSelect` logs

### Step 6: Check Network Tab

Switch to Network tab in DevTools

After selecting a job, you should see:
```
GET /agencies/REG-2025-793487/jobs/{jobId}/candidates?stage=interview_scheduled&interview_filter=all
```

**If no network request**:
- Job selection didn't trigger useEffect
- Check selectedJob state

**If request fails (red)**:
- Check response status (401, 404, 500?)
- Check response body for error message
- Check if backend is running

---

## 🐛 Common Issues

### Issue 1: "All Jobs" is Selected

**Symptom**: Console shows "No job selected"

**Cause**: "All Jobs" option has empty value `""`

**Solution**: Select a SPECIFIC job, not "All Jobs"

**Why**: Interview page requires a specific job ID to load interviews

---

### Issue 2: No Jobs in Dropdown

**Symptom**: Dropdown only shows "All Jobs", no other options

**Possible Causes**:
1. No published jobs in database
2. Jobs API not working
3. Jobs not loading

**Debug**:
```javascript
// In console, check:
console.log('Jobs state:', jobs)  // Should be array of jobs
```

**Solution**:
- Check backend has published jobs
- Check `jobService.getJobs()` is working
- Check Network tab for jobs API call

---

### Issue 3: Job Selected But No Interviews

**Symptom**: 
- Job is selected
- Console shows "Job selected, loading interviews"
- But no interviews appear

**Possible Causes**:
1. No interviews scheduled for this job
2. API returning empty array
3. API error

**Debug**:
```javascript
// Check console for:
✅ API Response: { candidates: [] }  // Empty array = no interviews
📊 Candidates count: 0
```

**Solution**:
- Check if job actually has scheduled interviews in database
- Check API response in Network tab
- Try different job

---

### Issue 4: API Error

**Symptom**: Console shows error message

**Common Errors**:

**401 Unauthorized**:
```
❌ Failed to load interviews: Unauthorized
```
- Auth token expired or invalid
- Solution: Re-login

**404 Not Found**:
```
❌ Failed to load interviews: Not Found
```
- Wrong endpoint URL
- Job ID doesn't exist
- Solution: Check backend logs

**500 Server Error**:
```
❌ Failed to load interviews: Internal Server Error
```
- Backend error
- Solution: Check backend logs

---

## 📋 Checklist

Go through this checklist:

### Backend
- [ ] Backend is running (`http://localhost:3000`)
- [ ] Database has published jobs
- [ ] Jobs have scheduled interviews
- [ ] Auth token is valid

### Frontend
- [ ] Page loads without errors
- [ ] Console shows "Loading jobs..."
- [ ] Jobs appear in dropdown
- [ ] Selecting a job triggers logs
- [ ] Network request is made
- [ ] API returns data

### Data Flow
- [ ] `loadJobs()` runs on mount
- [ ] Jobs populate dropdown
- [ ] Selecting job calls `handleJobSelect()`
- [ ] `selectedJob` state updates
- [ ] `useEffect` triggers
- [ ] `loadInterviewsWithFilter()` is called
- [ ] API request is made
- [ ] Data is received and displayed

---

## 🔧 Quick Fixes

### Fix 1: Force Job Selection

In browser console:
```javascript
// Manually set a job ID (replace with actual job ID)
window.dispatchEvent(new CustomEvent('setJob', { detail: 'your-job-id-here' }))
```

### Fix 2: Check Current State

In browser console:
```javascript
// Check React state (if React DevTools installed)
$r.state  // or $r.props

// Or add this to component temporarily:
console.log('Current state:', {
  selectedJob,
  jobs,
  interviews,
  stats,
  viewMode,
  currentFilter
})
```

### Fix 3: Test API Directly

In terminal:
```bash
# Get auth token from localStorage
TOKEN="your-token-here"

# Get jobs
curl -X GET "http://localhost:3000/agencies/REG-2025-793487/jobs" \
  -H "Authorization: Bearer $TOKEN"

# Get interviews for a job
curl -X GET "http://localhost:3000/agencies/REG-2025-793487/jobs/JOB_ID/candidates?stage=interview_scheduled&interview_filter=all" \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Expected Console Output

### Successful Flow:

```
📋 Loading jobs...
✅ Jobs loaded: 3 jobs
Jobs: [{id: "job1", title: "Cook"}, {id: "job2", title: "Driver"}, ...]

[User selects a job]

🎯 Job selected from dropdown: job-uuid-123
Job ID type: string
Job ID length: 36
🔄 useEffect triggered - selectedJob: job-uuid-123 viewMode: calendar
📌 Job selected, loading interviews: job-uuid-123
🎯 Filter to use: all
👥 Candidates loaded: 5
🔍 Loading interviews: {jobId: "job-uuid-123", license: "REG-2025-793487", filter: "all", ...}
✅ API Response: {candidates: Array(5), pagination: {...}}
📊 Candidates count: 5
📝 Transformed interviews: 5
```

### Failed Flow (No Job Selected):

```
📋 Loading jobs...
✅ Jobs loaded: 3 jobs
Jobs: [{id: "job1", title: "Cook"}, ...]

[User selects "All Jobs"]

🎯 Job selected from dropdown: 
Job ID type: string
Job ID length: 0
🔄 useEffect triggered - selectedJob:  viewMode: calendar
⚠️ No job selected, clearing interviews
   selectedJob value: 
   selectedJob type: string
```

---

## 🎯 Next Steps

1. **Open browser console** (F12)
2. **Reload the page**
3. **Look for the logs** listed above
4. **Select a specific job** (not "All Jobs")
5. **Watch the console** for the flow
6. **Check Network tab** for API calls
7. **Report what you see** - copy the console logs

---

## 💡 Tips

- Keep console open while testing
- Clear console (Ctrl+L) before each test
- Take screenshots of errors
- Copy full error messages
- Check both Console and Network tabs
- Use React DevTools to inspect state

---

**Document Version**: 1.0  
**Date**: November 30, 2025  
**Status**: Debugging Guide Ready
