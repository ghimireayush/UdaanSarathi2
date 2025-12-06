# Backend Implementation Summary: Interview Filtering

## Current Status
✅ **Frontend**: Complete and ready
⚠️ **Backend**: Partially implemented - needs interview filtering logic

## Reality Check: What Actually Exists

### Application Statuses (From `job-application.entity.ts`)
The backend uses these statuses:
- `applied` - Initial application
- `shortlisted` - Candidate shortlisted
- `interview_scheduled` - Interview scheduled
- `interview_rescheduled` - Interview rescheduled
- `interview_passed` - Interview passed
- `interview_failed` - Interview failed
- `withdrawn` - Application withdrawn (this is what frontend calls "rejected")

**⚠️ Important**: There is NO `rejected` status. The frontend should use `withdrawn` instead.

### Interview Entity (From `domain.entity.ts`)
The `interview_details` table has these fields:
```typescript
{
  id: string (UUID)
  job_posting_id: string
  job_application_id: string
  interview_date_ad: Date | null
  interview_date_bs: string | null
  interview_time: string | null  // time format
  duration_minutes: number (default: 60)
  location: string | null
  contact_person: string | null
  required_documents: string[] | null
  notes: string | null
  expenses: InterviewExpense[]
}
```

### Current API Behavior
The endpoint `GET /agencies/:license/jobs/:jobId/candidates` **already returns interview data** when available:

```typescript
// From job-candidates.controller.ts line ~200
const candidateDtos: JobCandidateDto[] = paginatedResults.map(({ application, candidate, profileBlob, candidateSkills, priority_score }) => {
  return {
    id: candidate.id,
    name: candidate.full_name,
    // ... other fields
    documents: (application as any).documents || [],
    // ❌ BUT: interview data is NOT included here
  };
});
```

**The issue**: Interview data exists in the database but is not being fetched or included in the response.

## Backend Tasks

### Phase 1: Add Interview Data to Response (CRITICAL - Blocking)
**Priority**: P0 - Frontend cannot display interview details without this
**File**: `src/modules/agency/job-candidates.controller.ts`
**Method**: `getJobCandidates()` (line ~150)

**Current Code** (line ~200):
```typescript
const candidateDtos: JobCandidateDto[] = paginatedResults.map(({ application, candidate, profileBlob, candidateSkills, priority_score }) => {
  return {
    id: candidate.id,
    name: candidate.full_name,
    priority_score,
    location: { city, country },
    phone: candidate.phone,
    email: candidate.email || 'N/A',
    experience: profileBlob.experience || 'N/A',
    skills: candidateSkills,
    applied_at: application.created_at.toISOString(),
    application_id: application.id,
    documents: (application as any).documents || [],
    // ❌ Missing: interview data
  };
});
```

**Required Changes**:

1. **Fetch applications with interview relations** (line ~165):
```typescript
// BEFORE:
const applications = await this.jobAppRepo
  .createQueryBuilder('ja')
  .where('ja.job_posting_id = :jobId', { jobId })
  .andWhere('ja.status = :stage', { stage })
  .getMany();

// AFTER:
const applications = await this.jobAppRepo
  .createQueryBuilder('ja')
  .leftJoinAndSelect('ja.interview_details', 'interview')
  .where('ja.job_posting_id = :jobId', { jobId })
  .andWhere('ja.status = :stage', { stage })
  .getMany();
```

2. **Include interview in the response** (line ~200):
```typescript
const candidateDtos: JobCandidateDto[] = paginatedResults.map(({ application, candidate, profileBlob, candidateSkills, priority_score }) => {
  // Extract interview data if available
  const interview = application.interview_details?.[0];
  
  return {
    id: candidate.id,
    name: candidate.full_name,
    priority_score,
    location: { city, country },
    phone: candidate.phone,
    email: candidate.email || 'N/A',
    experience: profileBlob.experience || 'N/A',
    skills: candidateSkills,
    applied_at: application.created_at.toISOString(),
    application_id: application.id,
    documents: (application as any).documents || [],
    // ✅ ADD THIS:
    interview: interview ? {
      id: interview.id,
      scheduled_at: interview.interview_date_ad?.toISOString() || null,
      time: interview.interview_time || null,
      duration: interview.duration_minutes || 60,
      location: interview.location || null,
      interviewer: interview.contact_person || null,
      notes: interview.notes || null,
      required_documents: interview.required_documents || []
    } : null
  };
});
```

3. **Update the DTO** (`src/modules/agency/dto/job-candidates.dto.ts`):
```typescript
export class JobCandidateDto {
  // ... existing fields ...
  
  @ApiPropertyOptional({ description: 'Interview details (if scheduled)' })
  interview?: {
    id: string;
    scheduled_at: string | null;
    time: string | null;
    duration: number;
    location: string | null;
    interviewer: string | null;
    notes: string | null;
    required_documents: string[];
  } | null;
}
```

### Phase 2: Implement Interview Filtering (Important)
**Priority**: P1 - Enables Today/Tomorrow/Unattended filtering
**File**: `src/modules/agency/job-candidates.controller.ts`
**Method**: `getJobCandidates()`

**Add new query parameter** to `GetJobCandidatesQueryDto`:
```typescript
@ApiPropertyOptional({ 
  description: 'Interview date filter (only for interview_scheduled stage)',
  enum: ['today', 'tomorrow', 'unattended', 'all'],
  example: 'today'
})
@IsOptional()
@IsEnum(['today', 'tomorrow', 'unattended', 'all'])
interview_filter?: string;
```

**Add filtering logic** after fetching applications (line ~170):
```typescript
const applications = await this.jobAppRepo
  .createQueryBuilder('ja')
  .leftJoinAndSelect('ja.interview_details', 'interview')
  .where('ja.job_posting_id = :jobId', { jobId })
  .andWhere('ja.status = :stage', { stage })
  .getMany();

// ✅ ADD INTERVIEW FILTERING:
if (stage === 'interview_scheduled' && query.interview_filter && query.interview_filter !== 'all') {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const filteredApplications = applications.filter(app => {
    const interview = app.interview_details?.[0];
    if (!interview || !interview.interview_date_ad) return false;
    
    const interviewDate = new Date(interview.interview_date_ad);
    const interviewDateTime = new Date(interviewDate);
    
    // Parse time if available (format: "HH:MM:SS" or "HH:MM")
    if (interview.interview_time) {
      const [hours, minutes] = interview.interview_time.split(':').map(Number);
      interviewDateTime.setHours(hours, minutes, 0, 0);
    }
    
    switch (query.interview_filter) {
      case 'today':
        return interviewDate >= today && interviewDate < tomorrow;
      
      case 'tomorrow':
        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        return interviewDate >= tomorrow && interviewDate < dayAfterTomorrow;
      
      case 'unattended':
        // Interview time + duration + 30min grace period has passed
        const duration = interview.duration_minutes || 60;
        const gracePeriod = 30; // minutes
        const endTime = new Date(interviewDateTime);
        endTime.setMinutes(endTime.getMinutes() + duration + gracePeriod);
        return now > endTime;
      
      default:
        return true;
    }
  });
  
  applications = filteredApplications;
}
```

**Note**: The "unattended" filter identifies interviews where:
- The scheduled time + duration + 30min grace period has passed
- The application status is still `interview_scheduled` (not moved to `interview_passed` or `interview_failed`)
- This helps agencies identify candidates who may have missed their interview

### Phase 3: Performance Optimization (Enhancement)
**Priority**: P2 - Nice to have

1. Add database indexes (via migration):
```sql
CREATE INDEX idx_interview_details_date ON interview_details(interview_date_ad);
CREATE INDEX idx_interview_details_application ON interview_details(job_application_id);
CREATE INDEX idx_job_applications_status_posting ON job_applications(status, job_posting_id);
```

2. Consider caching for frequently accessed job postings

## Testing

### Test Endpoint
```bash
# Base URL
BASE_URL="http://localhost:3000/agencies/REG-2025-793487/jobs/f09c0bd6-3a1a-4213-8bc8-29eaede16dcc"

# Test 1: Get scheduled interviews with interview data
curl -X GET "$BASE_URL/candidates?stage=interview_scheduled&limit=10&offset=0"

# Test 2: Filter today's interviews
curl -X GET "$BASE_URL/candidates?stage=interview_scheduled&interview_filter=today"

# Test 3: Filter tomorrow's interviews
curl -X GET "$BASE_URL/candidates?stage=interview_scheduled&interview_filter=tomorrow"

# Test 4: Filter unattended interviews
curl -X GET "$BASE_URL/candidates?stage=interview_scheduled&interview_filter=unattended"

# Test 5: Get all scheduled (explicit)
curl -X GET "$BASE_URL/candidates?stage=interview_scheduled&interview_filter=all"
```

### Expected Response Format
```json
{
  "candidates": [
    {
      "id": "candidate-uuid",
      "name": "Ramesh Bahadur",
      "priority_score": 85,
      "location": { "city": "Baglung", "country": "Nepal" },
      "phone": "+9779862146253",
      "email": "ramesh.bahadur@example.com",
      "experience": "5 years",
      "skills": ["Cooking", "English"],
      "applied_at": "2025-11-29T07:10:43.039Z",
      "application_id": "application-uuid",
      "documents": [],
      "interview": {
        "id": "interview-uuid",
        "scheduled_at": "2025-12-01T00:00:00.000Z",
        "time": "10:00:00",
        "duration": 60,
        "location": "Office",
        "interviewer": "HR Manager",
        "notes": "Bring original documents",
        "required_documents": ["passport", "cv", "certificates"]
      }
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "has_more": false
  }
}
```

## Database Schema (Confirmed)

✅ **Interview table**: `interview_details`
✅ **Columns**:
- `interview_date_ad`: Date (nullable)
- `interview_date_bs`: string (nullable)
- `interview_time`: time (nullable)
- `duration_minutes`: number (default: 60)
- `location`: string (nullable)
- `contact_person`: string (nullable)
- `required_documents`: string[] (nullable)
- `notes`: text (nullable)

✅ **Foreign key**: `job_application_id` links to `job_applications.id`
✅ **Timezone**: Dates are stored in UTC, times are stored as time type
✅ **No status field**: Interview status is tracked via application status (`interview_scheduled`, `interview_rescheduled`, `interview_passed`, `interview_failed`)

## Frontend Adjustments Needed

### 1. Change "Rejected" to "Withdrawn"
**File**: `admin_panel/UdaanSarathi2/src/services/applicationService.js`

The backend uses `withdrawn` status, not `rejected`. Update the frontend:

```javascript
// BEFORE:
const applicationStages = {
  APPLIED: 'applied',
  SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_PASSED: 'interview_passed',
  REJECTED: 'rejected'  // ❌ This doesn't exist in backend
};

// AFTER:
const applicationStages = {
  APPLIED: 'applied',
  SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_RESCHEDULED: 'interview_rescheduled',
  INTERVIEW_PASSED: 'interview_passed',
  INTERVIEW_FAILED: 'interview_failed',
  WITHDRAWN: 'withdrawn'  // ✅ Use this instead
};
```

### 2. Update Rejection Logic
```javascript
// When rejecting, use withdrawn status
async rejectApplication(applicationId, reason = '') {
  await delay(300)
  const updateData = {
    status: 'withdrawn',  // Changed from 'rejected'
    notes: reason,
    decision_at: new Date().toISOString()
  }
  return await this.updateApplication(applicationId, updateData)
}
```

### 3. Update UI Labels
Keep the UI showing "Rejected" to users, but use `withdrawn` in API calls:
```javascript
const getStageLabel = (stage) => {
  const labels = {
    'applied': 'Applied',
    'shortlisted': 'Shortlisted',
    'interview_scheduled': 'Interview Scheduled',
    'interview_rescheduled': 'Interview Rescheduled',
    'interview_passed': 'Interview Passed',
    'interview_failed': 'Interview Failed',
    'withdrawn': 'Rejected'  // Display as "Rejected" to users
  };
  return labels[stage] || stage;
};
```

## Timeline

- **Phase 1**: Critical - 2-4 hours (add interview data to response)
- **Phase 2**: Important - 2-3 hours (add filtering logic)
- **Phase 3**: Enhancement - 1-2 hours (add indexes)
- **Frontend fixes**: 1 hour (change rejected to withdrawn)

**Total estimated time**: 6-10 hours

## Implementation Notes

1. **No "unattended" status in database**: The "unattended" filter is calculated on-the-fly by comparing current time with interview time + duration + grace period

2. **Interview time format**: Stored as PostgreSQL `time` type (e.g., "10:00:00" or "14:30:00")

3. **Date handling**: `interview_date_ad` is a Date type, `interview_time` is separate. Combine them for accurate filtering

4. **Backward compatibility**: If `interview_filter` is not provided, return all scheduled candidates (current behavior)

5. **Grace period**: 30 minutes after scheduled end time is hardcoded but can be made configurable

## Files to Modify

### Backend
1. `src/modules/agency/job-candidates.controller.ts` - Add interview data and filtering
2. `src/modules/agency/dto/job-candidates.dto.ts` - Update DTOs
3. (Optional) Create migration for indexes

### Frontend
1. `admin_panel/UdaanSarathi2/src/services/applicationService.js` - Change rejected to withdrawn
2. `admin_panel/UdaanSarathi2/src/services/constantsService.js` - Update status constants
3. `admin_panel/UdaanSarathi2/src/pages/Applications.jsx` - Update status references

## Contact

For questions:
- Backend code: `portal/agency_research/code/src/modules/`
- Frontend code: `portal/agency_research/code/admin_panel/UdaanSarathi2/src/`
- Requirements: `BACKEND_INTERVIEW_FILTER_REQUIREMENTS.md`
