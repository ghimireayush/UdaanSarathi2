# Candidate Data Fetching Migration - Simplified & Organized

## Summary
All pages pass only the candidate object with `application.id`. CandidateSummaryS2 uses a single, clean API endpoint that only requires `applicationId` to fetch all enriched candidate data. This is the simplest and most organized approach.

## API Endpoint

**New Simplified Endpoint:**
```
GET /applications/{applicationId}/candidate-details
```

**Why this is better:**
- ✅ Only requires `applicationId` - no need for license, jobId, or candidateId
- ✅ Backend can fetch everything it needs from the application record
- ✅ Cleaner URL structure
- ✅ Simpler to maintain and understand
- ✅ No dependency on multiple IDs

**Old Endpoint (deprecated):**
```
GET /agencies/{license}/jobs/{jobId}/candidates/{candidateId}/details?application_id={applicationId}
```

## Data Flow

```
Page Component
    ↓
handleCandidateClick(candidate)
    ↓
setSelectedCandidate(candidate)
    ↓
CandidateSummaryS2 opens
    ↓
useEffect checks if data is complete
    ↓
If not complete:
  Extract applicationId from candidate.application.id
    ↓
  Call: CandidateDataSource.getCandidateDetailsByApplication(applicationId)
    ↓
  GET /applications/{applicationId}/candidate-details
    ↓
Backend returns complete candidate data with:
  - candidate info
  - job_profile (experience, education, skills, trainings)
  - job_context (job title, company)
  - application data
  - interview data
    ↓
Component renders with enriched data
```

## Implementation

### CandidateDataSource.js
```javascript
async getCandidateDetailsByApplication(applicationId) {
  return httpClient.get(`/applications/${applicationId}/candidate-details`)
}
```

### CandidateSummaryS2.jsx
```javascript
useEffect(() => {
  const fetchEnrichedData = async () => {
    // Check if already complete
    if (candidate?.job_profile && candidate?.job_context) return
    
    // Only need application ID
    const applicationId = candidate?.application?.id
    if (!applicationId) return
    
    // Fetch enriched data
    const enrichedData = await CandidateDataSource.getCandidateDetailsByApplication(applicationId)
  }
}, [candidate, isOpen])
```

## Benefits

1. **Simplicity**: Only one ID needed (applicationId)
2. **Clean API**: Organized endpoint structure
3. **No Dependencies**: No need for license, jobId, or candidateId
4. **Maintainability**: Single endpoint to maintain
5. **Scalability**: Backend can optimize based on application record
6. **Clarity**: Clear intent - get candidate details for this application

## Files Changed

1. **CandidateDataSource.js**
   - Added `getCandidateDetailsByApplication(applicationId)` method
   - Marked old `getCandidateDetails()` as deprecated

2. **CandidateSummaryS2.jsx**
   - Simplified enrichment logic to only use applicationId
   - Removed useAgency hook (no longer needed)
   - Removed CandidateDataSource import (added it back)
   - Cleaner, more focused useEffect

3. **All Pages** (Workflow, Applications, CandidateShortlist, ScheduledInterviews)
   - No changes needed - already passing candidate with application.id

## Data Flow

```
User clicks candidate row
    ↓
handleCandidateClick(candidate)
    ↓
Check if already complete?
    ├─ YES → Use cached data
    └─ NO → Fetch from API
    ↓
CandidateDataSource.getCandidateDetails(
  license,
  jobId,
  candidateId,
  applicationId
)
    ↓
Receive enriched candidate data
    ↓
setSelectedCandidate(candidateDetails)
    ↓
CandidateSummaryS2 renders with complete data
```

## API Endpoint Used

All pages now use the same endpoint:
```
GET /api/candidates/{candidateId}/details
Query params:
  - license: agency license number
  - jobId: job ID (optional)
  - applicationId: application ID (required for context)
```

## Testing Checklist

- [ ] Workflow page - click candidate, verify sidebar opens with complete data
- [ ] Applications page - click candidate, verify sidebar opens with complete data
- [ ] JobDetails page - click candidate, verify sidebar opens with complete data
- [ ] CandidateShortlist - click candidate, verify sidebar opens with complete data
- [ ] ScheduledInterviews - click candidate, verify sidebar opens with complete data
- [ ] Verify fallback works when API fails
- [ ] Verify caching works (no re-fetch on same candidate)
- [ ] Check console for debug logs (✅ and ❌ messages)

## Files Modified

1. `src/pages/Workflow.jsx` - Added enhanced handleCandidateClick
2. `src/pages/Applications.jsx` - Added enhanced handleCandidateClick
3. `src/components/CandidateShortlist.jsx` - Added enhanced handleCandidateClick
4. `src/components/ScheduledInterviews.jsx` - Already had implementation

## No API Changes Required

This migration required **zero backend changes**. All pages already had:
- Access to `application.id`
- Access to `candidate.id`
- Access to `agencyData.license_number`

The migration simply standardizes how this data is used to fetch enriched candidate details.
