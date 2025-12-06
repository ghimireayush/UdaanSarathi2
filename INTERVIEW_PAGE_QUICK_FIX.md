# Interview Page - Quick Fix

**Issue**: No API calls on page load because `jobService` uses mock data  
**Solution**: Add real API call to load jobs

---

## 🔧 The Fix

### Step 1: Create a simple function to load jobs from API

Add this to `Interviews.jsx`:

```javascript
const loadJobsFromAPI = async () => {
  try {
    console.log('📋 Loading jobs from API...')
    const agencyLicense = agencyData?.license_number
    
    if (!agencyLicense) {
      console.warn('⚠️ No agency license available')
      return
    }
    
    const token = localStorage.getItem('token') || localStorage.getItem('udaan_token')
    
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/agencies/${agencyLicense}/jobs`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ Jobs loaded from API:', data)
    
    // Handle different response formats
    const jobsData = data.jobs || data.data || data
    setJobs(Array.isArray(jobsData) ? jobsData : [])
    
  } catch (error) {
    console.error('❌ Failed to load jobs from API:', error)
    // Fallback to mock data
    console.log('⚠️ Falling back to mock data')
    const jobsData = await jobService.getJobs({ status: 'published' })
    setJobs(jobsData)
  }
}
```

### Step 2: Replace loadJobs() call

Change the useEffect:

```javascript
useEffect(() => {
  loadJobsFromAPI()  // ✅ Use real API
  setIsLoading(false)
}, [agencyData])  // Add agencyData as dependency
```

---

## 🎯 Alternative: Use Existing Jobs

If the jobs API doesn't exist yet, you can:

### Option A: Manually add a job ID

```javascript
// Temporarily hardcode a job ID for testing
const [selectedJob, setSelectedJob] = useState('your-job-id-here')
```

### Option B: Get job ID from URL

```javascript
// Get job ID from URL parameter
const searchParams = new URLSearchParams(window.location.search)
const jobIdFromUrl = searchParams.get('jobId')

if (jobIdFromUrl) {
  setSelectedJob(jobIdFromUrl)
}
```

### Option C: Use mock data but ensure it has jobs

Check `src/data/jobs.json` and make sure it has jobs with `status: 'published'`

---

## 📝 Implementation

I'll implement Option 1 (real API call) for you now.

