# Frontend Questions - Answered by Backend Agent

**Date**: 2025-11-29  
**Status**: ✅ All Questions Answered Based on Code Analysis

---

## Question 1: Agency License Parameter

**Question**: Where do we get the license parameter from? Is this stored in the auth token or do we need to fetch it separately?

### ✅ Answer (Based on Code Analysis)

**Location**: The agency license is stored in **`AgencyContext`** and **localStorage**.

**How it works**:

1. **AgencyContext** (`src/contexts/AgencyContext.jsx`) fetches agency data on mount:
   ```javascript
   const fetchAgencyData = async () => {
     const data = await agencyService.getAgencyProfile()
     if (data) {
       setAgencyData(data)
       // Store license number for API calls
       if (data.license_number) {
         localStorage.setItem('udaan_agency_license', data.license_number)
       }
     }
   }
   ```

2. **Access in Components**:
   ```javascript
   import { useAgency } from '../contexts/AgencyContext'
   
   const { agencyData } = useAgency()
   const license = agencyData?.license_number
   
   // OR from localStorage
   const license = localStorage.getItem('udaan_agency_license')
   ```

3. **When is it available?**
   - After user logs in (owner or member)
   - After `AgencyContext` fetches agency profile
   - Stored in localStorage for persistence

**Implementation in JobDetails.jsx**:
```javascript
import { useAgency } from '../contexts/AgencyContext'

const JobDetails = () => {
  const { agencyData } = useAgency()
  const license = agencyData?.license_number
  
  // Use in API calls
  const loadAllData = async () => {
    if (!license) {
      console.error('Agency license not available')
      return
    }
    
    const response = await fetch(
      `/agencies/${license}/jobs/${id}/details`
    )
    // ...
  }
}
```

**Important Notes**:
- ⚠️ **Check for null**: Always check if `license` exists before making API calls
- ⚠️ **Loading state**: AgencyContext has `isLoading` - wait for it to be false
- ⚠️ **Error handling**: AgencyContext has `error` - handle 403 (no agency) gracefully

---

## Question 2: Available Skills Filter

**Question**: I notice the spec mentions we need a separate endpoint to get available skills for filtering (GET /api/jobs/{jobId}/candidates/filters), but I don't see this implemented in the quick reference. Should we add this endpoint, extract unique skills client-side, or pass all job tags as available filters?

### ✅ Answer (Based on Code Analysis)

**Current Frontend Implementation**: Uses **job tags** as available filters.

**From JobDetails.jsx** (lines 130-135):
```javascript
// Set available tags from job tags
if (jobData.tags && jobData.tags.length > 0) {
  setAvailableTags(jobData.tags);
}
```

**Recommendation**: ✅ **Keep using job tags** - No separate endpoint needed.

**Why?**
1. Job tags already represent the skills required for the job
2. Filtering candidates by job tags makes semantic sense
3. Avoids extra API call
4. Backend filters candidates by these tags using AND logic

**Implementation**:
```javascript
// 1. Get job details (includes tags)
const jobData = await fetch(`/agencies/${license}/jobs/${id}/details`)
  .then(r => r.json())

// 2. Use job tags as available filters
setAvailableTags(jobData.tags || [])

// 3. When user selects tags, pass to candidates endpoint
const params = new URLSearchParams({
  stage: 'applied',
  skills: selectedTags.join(','), // Backend uses AND logic
  limit: '10'
})

const candidates = await fetch(
  `/agencies/${license}/jobs/${id}/candidates?${params}`
).then(r => r.json())
```

**Alternative (if you want unique candidate skills)**:
You could extract unique skills from the first page of candidates, but this is **not recommended** because:
- ❌ Requires loading candidates first
- ❌ Only shows skills from first page
- ❌ Doesn't match job requirements

**Decision**: ✅ **Use job tags** (current implementation is correct)

---

## Question 3: Pagination Strategy

**Question**: When using "All" option (no limit), should we set a very high limit (e.g., 1000), make multiple paginated requests client-side, or add a special all=true parameter?

### ✅ Answer (Backend Recommendation)

**Recommended Approach**: ✅ **Make multiple paginated requests client-side**

**Why?**
1. ✅ Prevents server overload
2. ✅ Better user experience (progressive loading)
3. ✅ Handles large datasets gracefully
4. ✅ Follows REST best practices

**Implementation**:
```javascript
const loadAllCandidates = async (stage, skills) => {
  const allCandidates = []
  let offset = 0
  const limit = 100 // Reasonable page size
  let hasMore = true
  
  while (hasMore) {
    const params = new URLSearchParams({
      stage,
      limit: limit.toString(),
      offset: offset.toString(),
      skills: skills.join(','),
      sort_by: 'priority_score',
      sort_order: 'desc'
    })
    
    const response = await fetch(
      `/agencies/${license}/jobs/${id}/candidates?${params}`
    ).then(r => r.json())
    
    allCandidates.push(...response.candidates)
    hasMore = response.pagination.has_more
    offset += limit
    
    // Optional: Show progress
    setLoadingProgress(`Loaded ${allCandidates.length} of ${response.pagination.total}`)
  }
  
  return allCandidates
}
```

**Alternative (simpler but less optimal)**:
```javascript
// Set a high limit (backend max is 100)
const params = new URLSearchParams({
  stage: 'applied',
  limit: '100', // Backend enforces max of 100
  offset: '0'
})
```

**Backend Constraints**:
- ✅ Max limit: 100 (enforced by validation)
- ✅ Default limit: 10
- ✅ `has_more` flag indicates more results

**Recommendation**: Use paginated loading with progress indicator for "All" option.

---

## Question 4: Stage Values

**Question**: The quick reference shows stages like interview_scheduled, interview_rescheduled, interview_passed, interview_failed. But our frontend uses applied, shortlisted, scheduled. Should we map scheduled → interview_scheduled in frontend, or update the backend to accept our stage names?

### ✅ Answer (Based on Code Analysis)

**Frontend Constants** (`src/data/constants.json`):
```json
{
  "applicationStages": {
    "APPLIED": "applied",
    "SHORTLISTED": "shortlisted",
    "INTERVIEW_SCHEDULED": "interview-scheduled",  // ← Note the hyphen!
    "INTERVIEW_PASSED": "interview-passed"
  }
}
```

**Backend API Expects** (from DTOs):
```typescript
enum: ['applied', 'shortlisted', 'interview_scheduled', 'interview_rescheduled', 
       'interview_passed', 'interview_failed']
// ← Note the underscore!
```

**Problem**: ⚠️ **Mismatch in naming convention**
- Frontend uses: `interview-scheduled` (hyphen)
- Backend uses: `interview_scheduled` (underscore)

### ✅ Solution: Map in Frontend

**Create a mapping utility**:
```javascript
// src/utils/stageMapper.js
export const STAGE_MAPPING = {
  // Frontend → Backend
  'applied': 'applied',
  'shortlisted': 'shortlisted',
  'interview-scheduled': 'interview_scheduled',
  'interview-passed': 'interview_passed',
  'scheduled': 'interview_scheduled', // Alias
}

export const REVERSE_STAGE_MAPPING = {
  // Backend → Frontend
  'applied': 'applied',
  'shortlisted': 'shortlisted',
  'interview_scheduled': 'interview-scheduled',
  'interview_rescheduled': 'interview-scheduled', // Map to same
  'interview_passed': 'interview-passed',
  'interview_failed': 'interview-passed', // Or create new frontend stage
}

export const mapStageToBackend = (frontendStage) => {
  return STAGE_MAPPING[frontendStage] || frontendStage
}

export const mapStageToFrontend = (backendStage) => {
  return REVERSE_STAGE_MAPPING[backendStage] || backendStage
}
```

**Usage in JobDetails.jsx**:
```javascript
import { mapStageToBackend, mapStageToFrontend } from '../utils/stageMapper'

const loadCandidates = async (frontendStage) => {
  const backendStage = mapStageToBackend(frontendStage)
  
  const params = new URLSearchParams({
    stage: backendStage, // Use backend format
    limit: '10'
  })
  
  const response = await fetch(
    `/agencies/${license}/jobs/${id}/candidates?${params}`
  ).then(r => r.json())
  
  // Response candidates already have correct stage from backend
  return response
}

// When displaying tabs
const tabs = [
  { id: 'applied', label: 'Applied', backendStage: 'applied' },
  { id: 'shortlisted', label: 'Shortlisted', backendStage: 'shortlisted' },
  { id: 'scheduled', label: 'Scheduled', backendStage: 'interview_scheduled' }
]
```

**Why not change backend?**
- ❌ Backend follows database naming convention (snake_case)
- ❌ Would require migration of existing data
- ❌ Breaking change for other clients
- ✅ Frontend mapping is simpler and safer

---

## Question 5: Documents Field

**Question**: The response includes a documents array. Are these pre-filtered by stage, or do we get all documents and need to filter client-side?

### ✅ Answer (Based on Backend Implementation)

**Current Implementation**: ✅ **All documents returned** (not filtered by stage)

**From backend controller** (`job-candidates.controller.ts` line 220):
```typescript
documents: (application as any).documents || [],
```

**Why all documents?**
1. Documents are attached to the **application**, not to a specific stage
2. Agencies may want to see all documents regardless of current stage
3. Filtering client-side gives more flexibility

**Frontend Handling**:

**Option 1: Show all documents** (Recommended)
```javascript
const CandidateCard = ({ candidate }) => (
  <div>
    {/* Show all documents */}
    {candidate.documents && candidate.documents.length > 0 && (
      <div className="documents">
        <FileText className="w-4 h-4" />
        <span>{candidate.documents.length} document(s) attached</span>
      </div>
    )}
  </div>
)
```

**Option 2: Filter by document type** (if needed)
```javascript
// If documents have a 'stage' or 'type' field
const relevantDocs = candidate.documents.filter(doc => 
  doc.type === 'resume' || doc.stage === currentStage
)
```

**Option 3: Show document count only**
```javascript
<span>{candidate.documents?.length || 0} documents</span>
```

**Recommendation**: ✅ **Show all documents** - Let users see complete candidate profile.

---

## Question 6: Error Handling for Bulk Operations

**Question**: When some candidates fail in bulk operations, should we show a toast notification for each failure, or a summary message?

### ✅ Answer (User Confirmed)

**User's Decision**: ✅ **Summary message**

**Implementation**:
```javascript
const handleBulkShortlist = async () => {
  try {
    const response = await fetch(
      `/agencies/${license}/jobs/${id}/candidates/bulk-shortlist`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_ids: Array.from(selectedCandidates)
        })
      }
    )
    
    const result = await response.json()
    
    // Show summary message
    if (result.success) {
      toast.success(
        `Successfully shortlisted ${result.updated_count} candidate(s)`
      )
    } else {
      // Some failed
      toast.warning(
        `Shortlisted ${result.updated_count} candidate(s). ` +
        `${result.failed.length} failed. ` +
        `Click to see details.`,
        {
          onClick: () => showErrorDetails(result.errors)
        }
      )
    }
    
    setSelectedCandidates(new Set())
    loadAllData()
  } catch (error) {
    toast.error('Failed to shortlist candidates. Please try again.')
  }
}

// Optional: Show detailed errors in a modal
const showErrorDetails = (errors) => {
  const errorList = Object.entries(errors)
    .map(([candidateId, error]) => `• ${error}`)
    .join('\n')
  
  alert(`Failed candidates:\n${errorList}`)
  // Or use a modal component
}
```

**Toast Examples**:
```javascript
// All success
toast.success('✅ Successfully shortlisted 5 candidates')

// Partial success
toast.warning('⚠️ Shortlisted 3 of 5 candidates. 2 failed. Click for details.')

// All failed
toast.error('❌ Failed to shortlist candidates. Please try again.')
```

**Why summary message?**
- ✅ Less intrusive
- ✅ Cleaner UI
- ✅ User can click for details if needed
- ✅ Doesn't spam notifications

---

## Summary of Answers

| Question | Answer | Action Required |
|----------|--------|-----------------|
| 1. Agency License | Use `AgencyContext` or localStorage | ✅ Already available |
| 2. Skills Filter | Use job tags (no separate endpoint) | ✅ Current implementation correct |
| 3. Pagination "All" | Multiple paginated requests (limit 100) | ⚠️ Implement progressive loading |
| 4. Stage Values | Map frontend stages to backend format | ⚠️ Create mapping utility |
| 5. Documents | All documents returned (not filtered) | ✅ Show all documents |
| 6. Error Handling | Summary message with optional details | ⚠️ Implement toast with summary |

---

## Implementation Checklist

### ✅ Ready to Use (No Changes Needed)
- [x] Agency license from AgencyContext
- [x] Skills filter using job tags
- [x] Documents display (all documents)

### ⚠️ Needs Implementation
- [ ] Create stage mapping utility (`src/utils/stageMapper.js`)
- [ ] Implement progressive loading for "All" option
- [ ] Add summary toast notifications for bulk operations
- [ ] Add error details modal (optional)

### 📝 Code Examples Provided
- [x] Agency license access
- [x] Skills filtering
- [x] Pagination strategy
- [x] Stage mapping
- [x] Error handling with toasts

---

## Additional Notes

### Performance Considerations
1. **Agency License**: Cached in localStorage, no extra API call needed
2. **Skills Filter**: Job tags already loaded, no extra API call needed
3. **Pagination**: Use limit=100 for best balance of performance and UX
4. **Stage Mapping**: Minimal overhead, can be memoized if needed

### Error Scenarios to Handle
1. **No Agency License**: Show error message, redirect to setup
2. **Invalid Stage**: Backend returns 400, show user-friendly message
3. **Bulk Operation Partial Failure**: Show summary with option to see details
4. **Network Error**: Show retry button

### Testing Recommendations
1. Test with missing agency license
2. Test with different stage values
3. Test bulk operations with mixed success/failure
4. Test "All" option with large datasets (100+ candidates)
5. Test with no documents vs multiple documents

---

**All questions answered based on actual code analysis!** ✅
