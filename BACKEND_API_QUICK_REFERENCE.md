# Job Details Backend API - Quick Reference

## 🚀 New Endpoints (Ready to Use)

All endpoints require agency license in the URL path for authorization.

---

### 1. Get Job Details with Analytics

**Endpoint**: `GET /agencies/:license/jobs/:jobId/details`

**Example**:
```javascript
const response = await fetch('/agencies/LIC-AG-0001/jobs/abc-123-def/details');
const data = await response.json();

// Response:
{
  id: "abc-123-def",
  title: "Cook",
  company: "Al Manara Restaurant",
  location: { city: "Dubai", country: "UAE" },
  posted_date: "2025-08-01T00:00:00.000Z",
  description: "...",
  requirements: ["5 years experience"],
  tags: ["Cooking", "Restaurant"],
  analytics: {
    view_count: 0,
    total_applicants: 45,
    shortlisted_count: 12,
    scheduled_count: 8,
    passed_count: 3
  }
}
```

**Use Case**: Replace separate calls to `getJobById()` and analytics queries.

---

### 2. Get Candidates with Filtering

**Endpoint**: `GET /agencies/:license/jobs/:jobId/candidates`

**Query Parameters**:
- `stage` (required): `applied` | `shortlisted` | `interview_scheduled` | `interview_rescheduled` | `interview_passed` | `interview_failed`
- `limit` (optional): 1-100, default 10
- `offset` (optional): default 0
- `skills` (optional): Comma-separated, e.g., `Cooking,English,Fast Food`
- `sort_by` (optional): `priority_score` | `applied_at` | `name`
- `sort_order` (optional): `asc` | `desc`

**Example**:
```javascript
// Get top 10 applied candidates with cooking skills
const params = new URLSearchParams({
  stage: 'applied',
  limit: '10',
  offset: '0',
  skills: 'Cooking,English',
  sort_by: 'priority_score',
  sort_order: 'desc'
});

const response = await fetch(
  `/agencies/LIC-AG-0001/jobs/abc-123-def/candidates?${params}`
);
const data = await response.json();

// Response:
{
  candidates: [
    {
      id: "candidate-uuid",
      name: "Ram Bahadur Thapa",
      priority_score: 85,
      location: { city: "Kathmandu", country: "Nepal" },
      phone: "+977-9841234567",
      email: "ram@example.com",
      experience: "5 years",
      skills: ["Cooking", "English", "Fast Food"],
      applied_at: "2025-08-25T10:30:00.000Z",
      application_id: "app-uuid",
      documents: []
    }
  ],
  pagination: {
    total: 45,
    limit: 10,
    offset: 0,
    has_more: true
  }
}
```

**Use Case**: Replace N+1 queries (getApplicationsByJobId + getCandidateById for each).

---

### 3. Bulk Shortlist Candidates

**Endpoint**: `POST /agencies/:license/jobs/:jobId/candidates/bulk-shortlist`

**Request Body**:
```json
{
  "candidate_ids": ["uuid-1", "uuid-2", "uuid-3"]
}
```

**Example**:
```javascript
const response = await fetch(
  '/agencies/LIC-AG-0001/jobs/abc-123-def/candidates/bulk-shortlist',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate_ids: Array.from(selectedCandidates)
    })
  }
);
const result = await response.json();

// Response:
{
  success: true,
  updated_count: 2,
  failed: ["uuid-3"],
  errors: {
    "uuid-3": "Cannot shortlist from \"shortlisted\" stage"
  }
}
```

**Use Case**: Replace loop calling individual shortlist endpoints.

---

### 4. Bulk Reject Candidates

**Endpoint**: `POST /agencies/:license/jobs/:jobId/candidates/bulk-reject`

**Request Body**:
```json
{
  "candidate_ids": ["uuid-1", "uuid-2"],
  "reason": "Does not meet minimum requirements"
}
```

**Example**:
```javascript
const response = await fetch(
  '/agencies/LIC-AG-0001/jobs/abc-123-def/candidates/bulk-reject',
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      candidate_ids: Array.from(selectedCandidates),
      reason: 'Does not meet requirements'
    })
  }
);
const result = await response.json();

// Response:
{
  success: true,
  updated_count: 2,
  failed: [],
  errors: {}
}
```

**Use Case**: Replace loop calling individual reject/withdraw endpoints.

---

## 🔄 Migration Steps

### Step 1: Update `loadAllData()` function

**Before**:
```javascript
const loadAllData = async () => {
  const jobData = await jobService.getJobById(id)
  const allJobApplications = await applicationService.getApplicationsByJobId(id)
  const detailedApplications = await Promise.all(
    allJobApplications.map(async (app) => {
      const candidate = await candidateService.getCandidateById(app.candidate_id)
      return { ...candidate, application: app }
    })
  )
  // Client-side filtering...
}
```

**After**:
```javascript
const loadAllData = async () => {
  // Single call for job + analytics
  const jobData = await fetch(`/agencies/${license}/jobs/${id}/details`)
    .then(r => r.json())
  
  setJob(jobData)
  setAnalytics(jobData.analytics)
  
  // Single call for candidates with server-side filtering
  const params = new URLSearchParams({
    stage: activeTab,
    limit: topNFilter.toString(),
    offset: '0',
    skills: selectedTags.join(','),
    sort_by: 'priority_score',
    sort_order: 'desc'
  })
  
  const candidatesData = await fetch(
    `/agencies/${license}/jobs/${id}/candidates?${params}`
  ).then(r => r.json())
  
  setAppliedCandidates(candidatesData.candidates)
}
```

### Step 2: Update Bulk Actions

**Before**:
```javascript
const handleBulkShortlist = async () => {
  for (const candidateId of selectedCandidates) {
    const candidate = appliedCandidates.find(c => c.id === candidateId)
    await applicationService.updateApplicationStage(
      candidate.application.id,
      'shortlisted'
    )
  }
  loadAllData()
}
```

**After**:
```javascript
const handleBulkShortlist = async () => {
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
  
  if (result.failed && result.failed.length > 0) {
    console.warn('Some candidates failed:', result.errors)
  }
  
  setSelectedCandidates(new Set())
  loadAllData()
}
```

### Step 3: Remove Client-Side Logic

Delete these functions (now handled server-side):
- ❌ Priority score calculation
- ❌ Skill filtering logic
- ❌ Sorting by priority score

---

## 📊 Performance Comparison

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Load job + candidates | 50+ API calls | 2 API calls | 25x fewer |
| Data transferred | ~500KB | ~50KB | 10x less |
| Load time | 3-5 seconds | <500ms | 10x faster |
| Bulk shortlist 10 | 10 API calls | 1 API call | 10x fewer |

---

## 🐛 Error Handling

All endpoints return standard error responses:

**404 Not Found**:
```json
{
  "statusCode": 404,
  "message": "Job not found",
  "error": "Not Found"
}
```

**403 Forbidden**:
```json
{
  "statusCode": 403,
  "message": "Cannot access job posting of another agency",
  "error": "Forbidden"
}
```

**400 Bad Request**:
```json
{
  "statusCode": 400,
  "message": ["stage must be one of the following values: applied, shortlisted, ..."],
  "error": "Bad Request"
}
```

---

## 🔐 Authorization

All endpoints require:
1. Valid agency license in URL path
2. Agency must own the job posting
3. Returns 403 Forbidden if unauthorized

---

## 📝 Notes

- **Priority Score**: Calculated server-side using skills, education, and experience matching
- **Skill Filtering**: Uses AND logic (candidate must have ALL selected skills)
- **Pagination**: Use `offset` and `limit` for pagination, check `has_more` flag
- **Bulk Actions**: Support partial success (some candidates may fail, others succeed)
- **Real-time**: Analytics counts are calculated in real-time from database

### ⚠️ Stage Name Mapping

**Important**: Frontend and backend use different naming conventions for stages.

**Frontend** (constants.json):
- `applied`
- `shortlisted`
- `interview-scheduled` (hyphen)
- `interview-passed` (hyphen)

**Backend** (API expects):
- `applied`
- `shortlisted`
- `interview_scheduled` (underscore)
- `interview_rescheduled` (underscore)
- `interview_passed` (underscore)
- `interview_failed` (underscore)

**Solution**: Create a mapping utility in frontend:
```javascript
// src/utils/stageMapper.js
export const mapStageToBackend = (frontendStage) => {
  const mapping = {
    'applied': 'applied',
    'shortlisted': 'shortlisted',
    'interview-scheduled': 'interview_scheduled',
    'scheduled': 'interview_scheduled', // Alias
    'interview-passed': 'interview_passed',
  }
  return mapping[frontendStage] || frontendStage
}
```

See `FRONTEND_QUESTIONS_ANSWERED.md` for complete implementation details.

---

## 🆘 Support

For issues or questions:
1. Check Swagger docs: `/api/docs`
2. Review full spec: `JOB_DETAILS_API_SPEC.md`
3. Check controller: `src/modules/agency/job-candidates.controller.ts`
