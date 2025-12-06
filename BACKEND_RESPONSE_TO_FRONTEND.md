# Backend Response to Frontend Team - Candidate Detail API

**Date**: 2025-11-29  
**From**: Backend Team  
**To**: Frontend Team  
**Re**: Candidate Detail API Requirements

---

## Executive Summary

After analyzing the backend codebase, here are the findings:

✅ **GOOD NEWS**: The endpoint exists and is already implemented  
⚠️ **CLARIFICATION NEEDED**: The endpoint structure differs from your proposed options  
📋 **ACTION REQUIRED**: Frontend integration adjustments needed

---

## 1. Does the Endpoint Exist?

### YES - Endpoint Already Exists

**Endpoint**: `GET /agencies/:license/jobs/:jobId/candidates`

**Location**: `/src/modules/agency/job-candidates.controller.ts`

**Purpose**: Get candidates for a specific job with filtering, pagination, and priority scoring

---

## 2. Current Endpoint Details

### Base Endpoint

```
GET /agencies/:license/jobs/:jobId/candidates
```

**Path Parameters**:
- `license` (string) - Agency license number (e.g., "LIC-AG-0001")
- `jobId` (UUID) - Job posting ID

**Query Parameters**:
- `stage` (string, required) - Application stage filter
  - Values: `'applied'`, `'shortlisted'`, `'interview_scheduled'`, `'interview_rescheduled'`, `'interview_passed'`, `'interview_failed'`, `'withdrawn'`
- `limit` (number, optional) - Results per page (default: 10)
- `offset` (number, optional) - Pagination offset (default: 0)
- `skills` (string, optional) - Comma-separated skills filter (AND logic)
- `sort_by` (string, optional) - Sort field (default: 'priority_score')
  - Values: `'priority_score'`, `'applied_at'`, `'name'`
- `sort_order` (string, optional) - Sort direction (default: 'desc')
  - Values: `'asc'`, `'desc'`

---

## 3. Response Structure

### Current Response Format

```json
{
  "candidates": [
    {
      "id": "candidate-uuid",
      "name": "John Doe",
      "priority_score": 85,
      "location": {
        "city": "Kathmandu",
        "country": "Nepal"
      },
      "phone": "+977-9841234567",
      "email": "john.doe@example.com",
      "experience": "5 years as Chef in 5-star hotels",
      "skills": ["Cooking", "English", "Customer Service"],
      "applied_at": "2025-11-20T10:30:00Z",
      "application_id": "application-uuid",
      "documents": []
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 10,
    "offset": 0,
    "has_more": true
  }
}
```

---

## 4. What's Missing from Current Implementation?

### ❌ NOT Included in Current Response:

1. **Application History (`history_blob`)** - NOT included in this endpoint
2. **Job Title** - NOT included (job context is implicit from URL)
3. **Interview Information** - NOT included in candidate list
4. **Passport Number** - NOT included (privacy consideration)
5. **Education** - NOT included in list view

### ✅ What IS Included:

- ✅ Candidate basic info (id, name, phone, email)
- ✅ Location (city, country)
- ✅ Experience (string from job profile)
- ✅ Skills (array from job profile)
- ✅ Priority score (fitness calculation)
- ✅ Application ID
- ✅ Applied date
- ✅ Documents array (currently empty)

---

## 5. How to Get Application History

### The Missing Piece: Application Details

**Problem**: The current endpoint does NOT return `history_blob` because it's designed for listing candidates, not showing full details.

**Solution**: You need to make a SECOND API call to get application details.

### Recommended Approach

**Step 1**: Get candidate list from job
```
GET /agencies/:license/jobs/:jobId/candidates?stage=applied
```

**Step 2**: When user clicks on a candidate, fetch application details
```
GET /applications/:applicationId
```

**Note**: This endpoint exists in the application service but may not be exposed in the controller yet. See section 7 for implementation needs.

---

## 6. Application History Structure

### History Blob Format (from database)

```typescript
type JobApplicationHistoryEntry = {
  prev_status: JobApplicationStatus | null;
  next_status: JobApplicationStatus;
  updated_at: string; // ISO timestamp
  updated_by?: string | null;
  note?: string | null;
  corrected?: boolean; // manual correction flag
};
```

### Example History Blob

```json
[
  {
    "prev_status": null,
    "next_status": "applied",
    "updated_at": "2025-11-20T10:30:00Z",
    "updated_by": "candidate-uuid",
    "note": null
  },
  {
    "prev_status": "applied",
    "next_status": "shortlisted",
    "updated_at": "2025-11-25T14:20:00Z",
    "updated_by": "agency",
    "note": "Meets all requirements",
    "corrected": false
  }
]
```

---

## 7. What Needs to Be Implemented

### Option A: Extend Existing Endpoint (NOT RECOMMENDED)

Add `include` query parameter to existing endpoint:
```
GET /agencies/:license/jobs/:jobId/candidates?stage=applied&include=history,interview
```

**Pros**: Single API call
**Cons**: Heavy response, performance issues with many candidates

### Option B: Create New Detail Endpoint (RECOMMENDED)

Create a new endpoint for single candidate details:
```
GET /agencies/:license/jobs/:jobId/candidates/:candidateId
```

**Response Structure**:
```json
{
  "id": "candidate-uuid",
  "name": "John Doe",
  "phone": "+977-9841234567",
  "email": "john.doe@example.com",
  "address": {
    "municipality": "Kathmandu",
    "district": "Kathmandu",
    "province": "Bagmati"
  },
  "passport_number": "N1234567",
  
  "experience": "5 years as Chef",
  "education": ["Culinary Arts Diploma"],
  "skills": ["Cooking", "English", "Customer Service"],
  
  "job_title": "Chef - Dubai Restaurant",
  "job_company": "Luxury Hotels Group",
  
  "application": {
    "id": "application-uuid",
    "stage": "shortlisted",
    "created_at": "2025-11-20T10:30:00Z",
    "history_blob": [
      {
        "prev_status": null,
        "next_status": "applied",
        "updated_at": "2025-11-20T10:30:00Z",
        "updated_by": "candidate-uuid",
        "note": null
      },
      {
        "prev_status": "applied",
        "next_status": "shortlisted",
        "updated_at": "2025-11-25T14:20:00Z",
        "updated_by": "agency",
        "note": "Meets all requirements"
      }
    ]
  },
  
  "interview": {
    "interview_date_ad": "2025-11-28T10:00:00Z",
    "interview_time": "10:00 AM",
    "location": "Agency Office",
    "contact_person": "HR Manager",
    "notes": "Bring original documents"
  }
}
```

**Pros**: 
- Clean separation of concerns
- Better performance
- Easier to maintain
- Follows REST conventions

**Cons**: 
- Requires two API calls (list + detail)

---

## 8. Data Availability Analysis

### Available in Database

| Field | Source | Available |
|-------|--------|-----------|
| `id` | `candidates.id` | ✅ Yes |
| `name` | `candidates.full_name` | ✅ Yes |
| `phone` | `candidates.phone` | ✅ Yes |
| `email` | `candidates.email` | ✅ Yes (nullable) |
| `address` | `candidates.address` (JSONB) | ✅ Yes |
| `passport_number` | `candidates.passport_number` | ✅ Yes (nullable) |
| `gender` | `candidates.gender` | ✅ Yes (nullable) |
| `age` | `candidates.age` | ✅ Yes (nullable) |
| `experience` | `candidate_job_profiles.profile_blob.experience` | ✅ Yes |
| `education` | `candidate_job_profiles.profile_blob.education` | ✅ Yes |
| `skills` | `candidate_job_profiles.profile_blob.skills` | ✅ Yes |
| `job_title` | `job_postings.posting_title` | ✅ Yes |
| `job_company` | `employers.company_name` | ✅ Yes |
| `application.id` | `job_applications.id` | ✅ Yes |
| `application.stage` | `job_applications.status` | ✅ Yes |
| `application.created_at` | `job_applications.created_at` | ✅ Yes |
| `application.history_blob` | `job_applications.history_blob` | ✅ Yes |
| `interview.*` | `interview_details.*` | ✅ Yes (if scheduled) |

### NOT Available in Database

| Field | Status |
|-------|--------|
| `interview_type` | ❌ Not stored (could be added) |
| `interview_remarks` | ⚠️ Stored as `interview_details.notes` |

---

## 9. Implementation Plan

### Phase 1: Create Detail Endpoint (1-2 hours)

**File**: `/src/modules/agency/job-candidates.controller.ts`

**New Endpoint**:
```typescript
@Get(':jobId/candidates/:candidateId')
async getCandidateDetail(
  @Param('license') license: string,
  @Param('jobId', ParseUUIDPipe) jobId: string,
  @Param('candidateId', ParseUUIDPipe) candidateId: string,
): Promise<CandidateDetailDto>
```

**Implementation Steps**:
1. Verify agency owns the job
2. Fetch candidate by ID
3. Fetch application for candidate + job
4. Fetch job profile (most recent)
5. Fetch interview details (if exists)
6. Combine and return

### Phase 2: Frontend Integration (1-2 hours)

**Step 1**: Update API client
```javascript
// src/services/candidateApiClient.js
export const getCandidateDetail = async (license, jobId, candidateId) => {
  const response = await fetch(
    `${API_BASE_URL}/agencies/${license}/jobs/${jobId}/candidates/${candidateId}`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch candidate details')
  }
  
  return response.json()
}
```

**Step 2**: Update JobDetails.jsx
```javascript
const handleCandidateClick = async (candidateId) => {
  try {
    setLoadingCandidate(true)
    const candidateData = await candidateApiClient.getCandidateDetail(
      agencyLicense,
      jobId,
      candidateId
    )
    setSelectedCandidate(candidateData)
    setIsSidebarOpen(true)
  } catch (error) {
    console.error('Failed to load candidate:', error)
    toast.error('Failed to load candidate details')
  } finally {
    setLoadingCandidate(false)
  }
}
```

---

## 10. Alternative: Use Existing Candidate Endpoint

### Option: Direct Candidate Access

If you don't need job-specific context, you can use:

```
GET /candidates/:candidateId
```

**Response**:
```json
{
  "id": "candidate-uuid",
  "full_name": "John Doe",
  "phone": "+977-9841234567",
  "email": "john.doe@example.com",
  "address": {
    "municipality": "Kathmandu",
    "district": "Kathmandu",
    "province": "Bagmati",
    "coordinates": { "lat": 27.7172, "lng": 85.3240 }
  },
  "passport_number": "N1234567",
  "gender": "male",
  "age": 28,
  "profile_image": "https://...",
  "is_active": true,
  "created_at": "2025-01-15T08:00:00Z",
  "updated_at": "2025-11-20T10:30:00Z"
}
```

**Then fetch application separately**:
```
GET /applications/:applicationId
```

**Limitation**: This approach requires you to already know the `applicationId` from the candidate list.

---

## 11. Documents API

### Already Implemented ✅

```
GET /candidates/:candidateId/documents
```

**Response**:
```json
{
  "data": [
    {
      "document_type": {
        "id": "type-uuid",
        "name": "Passport",
        "type_code": "PASSPORT",
        "is_required": true
      },
      "document": {
        "id": "doc-uuid",
        "document_url": "https://...",
        "name": "Passport.pdf",
        "file_type": "application/pdf",
        "file_size": 1234567,
        "verification_status": "pending",
        "created_at": "2025-11-20T10:30:00Z"
      }
    }
  ],
  "summary": {
    "total_types": 5,
    "uploaded": 3,
    "pending": 2,
    "required_pending": 1,
    "progress": 60
  }
}
```

---

## 12. Authorization & Security

### Current Implementation

**Authorization Check**:
```typescript
const job = await this.jobPostingService.findJobPostingById(jobId);
const belongs = job.contracts?.some(c => c.agency?.license_number === license);
if (!belongs) {
  throw new ForbiddenException('Cannot access job posting of another agency');
}
```

**Security Considerations**:
- ✅ Agency can only access their own jobs
- ✅ Candidate data is scoped to job applications
- ⚠️ Passport numbers should be masked in list view
- ⚠️ Full contact info should require proper authorization

---

## 13. Recommended Solution

### Two-Step Approach (RECOMMENDED)

**Step 1: List Candidates**
```
GET /agencies/:license/jobs/:jobId/candidates?stage=applied&limit=10&offset=0
```

Returns: Basic candidate info with priority scores

**Step 2: Get Candidate Details** (NEW ENDPOINT NEEDED)
```
GET /agencies/:license/jobs/:jobId/candidates/:candidateId
```

Returns: Full candidate profile + application history + interview details

**Step 3: Get Documents** (ALREADY EXISTS)
```
GET /candidates/:candidateId/documents
```

Returns: Document slots with upload status

---

## 14. Timeline & Effort Estimate

### Backend Work Required

| Task | Effort | Priority |
|------|--------|----------|
| Create candidate detail endpoint | 2 hours | 🔴 Critical |
| Add DTO for response structure | 30 min | 🔴 Critical |
| Write unit tests | 1 hour | 🟡 Medium |
| Update API documentation | 30 min | 🟡 Medium |
| **Total Backend** | **4 hours** | |

### Frontend Work Required

| Task | Effort | Priority |
|------|--------|----------|
| Create API client method | 30 min | 🔴 Critical |
| Update JobDetails.jsx | 1 hour | 🔴 Critical |
| Test integration | 1 hour | 🔴 Critical |
| **Total Frontend** | **2.5 hours** | |

### Total Estimated Time: 6.5 hours

---

## 15. Next Steps

### Immediate Actions

1. **Backend Team** (Priority 1):
   - [ ] Create `GET /agencies/:license/jobs/:jobId/candidates/:candidateId` endpoint
   - [ ] Include `history_blob` in response
   - [ ] Include interview details if available
   - [ ] Test with real data

2. **Frontend Team** (Priority 2):
   - [ ] Review proposed response structure
   - [ ] Confirm if structure meets requirements
   - [ ] Prepare integration code

3. **Both Teams** (Priority 3):
   - [ ] Schedule integration testing session
   - [ ] Test with real candidate data
   - [ ] Verify timeline display works correctly

---

## 16. Questions for Frontend Team

Before we implement, please confirm:

1. **Response Structure**: Does the proposed response structure in Section 7 meet your needs?

2. **Two-Step Approach**: Are you okay with making two API calls (list + detail)?

3. **Privacy**: Should we mask sensitive data (passport, full phone) in list view?

4. **Interview Data**: Do you need interview expenses in the response?

5. **Education Format**: Education is stored as array of objects/strings. What format do you prefer?

6. **Experience Format**: Experience is stored as free-text string. Is this acceptable?

---

## 17. Code References

### Key Files to Review

1. **Candidate List Endpoint**:
   - File: `/src/modules/agency/job-candidates.controller.ts`
   - Method: `getJobCandidates()`
   - Line: ~100-300

2. **Application Service**:
   - File: `/src/modules/application/application.service.ts`
   - Method: `getById()`, `listApplied()`
   - History management: Lines 50-150

3. **Candidate Service**:
   - File: `/src/modules/candidate/candidate.service.ts`
   - Method: `findById()`, `listJobProfiles()`
   - Line: 80-120

4. **Entities**:
   - Candidate: `/src/modules/candidate/candidate.entity.ts`
   - Application: `/src/modules/application/job-application.entity.ts`
   - Job Profile: `/src/modules/candidate/candidate-job-profile.entity.ts`

---

## 18. Sample Implementation (Backend)

### Proposed Controller Method

```typescript
@Get(':jobId/candidates/:candidateId')
@HttpCode(200)
@ApiOperation({
  summary: 'Get detailed candidate information for a job',
  description: 'Returns complete candidate profile with application history and interview details'
})
async getCandidateDetail(
  @Param('license') license: string,
  @Param('jobId', ParseUUIDPipe) jobId: string,
  @Param('candidateId', ParseUUIDPipe) candidateId: string,
): Promise<CandidateDetailDto> {
  // Verify agency owns this job
  const job = await this.jobPostingService.findJobPostingById(jobId);
  const belongs = job.contracts?.some(c => c.agency?.license_number === license);
  if (!belongs) {
    throw new ForbiddenException('Cannot access job posting of another agency');
  }

  // Fetch candidate
  const candidate = await this.candidateService.findById(candidateId);
  if (!candidate) {
    throw new NotFoundException('Candidate not found');
  }

  // Fetch application
  const application = await this.jobAppRepo.findOne({
    where: {
      candidate_id: candidateId,
      job_posting_id: jobId,
    },
    relations: ['interview_details'],
  });

  if (!application) {
    throw new NotFoundException('Application not found');
  }

  // Fetch job profile
  const jobProfiles = await this.candidateJobProfileRepo.find({
    where: { candidate_id: candidateId },
    order: { updated_at: 'DESC' },
    take: 1,
  });

  const profileBlob = jobProfiles[0]?.profile_blob || {};

  // Extract skills and education
  const skills = Array.isArray(profileBlob.skills)
    ? profileBlob.skills
        .map((s: any) => (typeof s === 'string' ? s : s?.title))
        .filter((v: any) => typeof v === 'string' && v.trim().length > 0)
    : [];

  const education = Array.isArray(profileBlob.education)
    ? profileBlob.education
        .map((e: any) => (typeof e === 'string' ? e : (e?.degree ?? e?.title ?? e?.name)))
        .filter((v: any) => typeof v === 'string' && v.trim().length > 0)
    : [];

  // Get interview details
  const interview = application.interview_details?.[0] || null;

  // Build response
  return {
    id: candidate.id,
    name: candidate.full_name,
    phone: candidate.phone,
    email: candidate.email || null,
    address: candidate.address,
    passport_number: candidate.passport_number || null,
    
    experience: profileBlob.experience || null,
    education,
    skills,
    
    job_title: job.posting_title,
    job_company: job.contracts[0]?.employer?.company_name || null,
    
    application: {
      id: application.id,
      stage: application.status,
      created_at: application.created_at.toISOString(),
      history_blob: application.history_blob,
    },
    
    interview: interview ? {
      interview_date_ad: interview.interview_date_ad?.toISOString() || null,
      interview_time: interview.interview_time || null,
      location: interview.location || null,
      contact_person: interview.contact_person || null,
      notes: interview.notes || null,
    } : null,
  };
}
```

---

## 19. Summary

### What Exists ✅

- Candidate list endpoint with filtering and pagination
- Priority score calculation
- Skills-based filtering
- Application status tracking
- Document management API

### What's Missing ❌

- Single candidate detail endpoint with history
- Application history in response
- Interview details in candidate context

### What We'll Build 🔨

- New endpoint: `GET /agencies/:license/jobs/:jobId/candidates/:candidateId`
- Response includes: candidate profile + application history + interview details
- Estimated time: 4 hours backend + 2.5 hours frontend

### When Can This Be Available? ⏰

- Backend implementation: **1 business day**
- Testing & documentation: **0.5 business days**
- Frontend integration: **1 business day**
- **Total: 2-3 business days**

---

## 20. Contact & Follow-up

### Backend Team Contacts

- **Primary**: Backend Lead
- **Secondary**: API Developer

### Next Meeting

- **When**: After frontend team reviews this document
- **Agenda**: 
  1. Confirm response structure
  2. Discuss any modifications needed
  3. Set implementation timeline
  4. Plan integration testing

---

**Please review this document and provide feedback on:**
1. Does the proposed solution meet your requirements?
2. Any modifications needed to the response structure?
3. Any additional fields or data needed?
4. Timeline acceptable?

We're ready to implement as soon as we get your confirmation! 🚀
