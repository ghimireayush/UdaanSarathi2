# Frontend Integration Guide: Interview Filtering

## Backend Implementation Complete ✅

The backend has been updated to support interview filtering for scheduled candidates. Here's what was implemented:

### Changes Made

#### 1. Interview Data in API Response
**Endpoint**: `GET /agencies/:license/jobs/:jobId/candidates`

The API now includes interview details when `stage=interview_scheduled`:

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

#### 2. Interview Filtering
**New Query Parameter**: `interview_filter`

Supported values:
- `today` - Interviews scheduled for today
- `tomorrow` - Interviews scheduled for tomorrow
- `unattended` - Interviews where scheduled time + duration + 30min grace period has passed
- `all` - All scheduled interviews (default)

**Example Requests**:
```bash
# Today's interviews
GET /agencies/REG-2025-793487/jobs/{jobId}/candidates?stage=interview_scheduled&interview_filter=today

# Tomorrow's interviews
GET /agencies/REG-2025-793487/jobs/{jobId}/candidates?stage=interview_scheduled&interview_filter=tomorrow

# Unattended interviews
GET /agencies/REG-2025-793487/jobs/{jobId}/candidates?stage=interview_scheduled&interview_filter=unattended

# All scheduled (default)
GET /agencies/REG-2025-793487/jobs/{jobId}/candidates?stage=interview_scheduled&interview_filter=all
```

## Frontend Changes Required ⚠️

### CRITICAL: Status Name Change

The backend does NOT have a `rejected` status. It uses `withdrawn` instead.

#### 1. Update Constants
**File**: `src/services/constantsService.js`

```javascript
// BEFORE:
const applicationStages = {
  APPLIED: 'applied',
  SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_PASSED: 'interview_passed',
  REJECTED: 'rejected'  // ❌ This doesn't exist
};

// AFTER:
const applicationStages = {
  APPLIED: 'applied',
  SHORTLISTED: 'shortlisted',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_RESCHEDULED: 'interview_rescheduled',
  INTERVIEW_PASSED: 'interview_passed',
  INTERVIEW_FAILED: 'interview_failed',
  WITHDRAWN: 'withdrawn'  // ✅ Use this
};
```

#### 2. Update Rejection Logic
**File**: `src/services/applicationService.js`

```javascript
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

#### 3. Update UI Labels (Keep User-Facing Text)
**File**: `src/services/constantsService.js`

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

#### 4. Update Stage Colors
**File**: `src/pages/Applications.jsx`

```javascript
const getStageColor = (stage) => {
  const stageColors = {
    [applicationStages.APPLIED]: "chip-blue",
    [applicationStages.SHORTLISTED]: "chip-yellow",
    [applicationStages.INTERVIEW_SCHEDULED]: "chip-purple",
    [applicationStages.INTERVIEW_RESCHEDULED]: "chip-purple",
    [applicationStages.INTERVIEW_PASSED]: "chip-green",
    [applicationStages.INTERVIEW_FAILED]: "chip-red",
    [applicationStages.WITHDRAWN]: "chip-gray"  // Changed from REJECTED
  };
  return stageColors[stage] || "chip-blue";
};
```

#### 5. Update Filters
**File**: `src/pages/Applications.jsx`

```jsx
<select
  value={filters.stage || ""}
  onChange={(e) => handleFilterChange("stage", e.target.value)}
  className="..."
>
  <option value="">{tPage("filters.allStages")}</option>
  <option value="applied">{tPage("applicationStatus.applied")}</option>
  <option value="shortlisted">{tPage("applicationStatus.shortlisted")}</option>
  <option value="interview_scheduled">{tPage("filterOptions.scheduled")}</option>
  <option value="interview_rescheduled">{tPage("filterOptions.rescheduled")}</option>
  <option value="interview_passed">{tPage("filterOptions.passed")}</option>
  <option value="interview_failed">{tPage("filterOptions.failed")}</option>
  <option value="withdrawn">{tPage("applicationStatus.rejected")}</option>
</select>
```

#### 6. Update Rejection Checks
**File**: `src/pages/Applications.jsx`

```javascript
// BEFORE:
if (application.stage === applicationStages.REJECTED) {
  // ...
}

// AFTER:
if (application.stage === applicationStages.WITHDRAWN) {
  // ...
}
```

### Interview Filter Integration

The frontend is already set up to send the `interview_filter` parameter. No changes needed here - it should work automatically once the backend is deployed.

**Existing Code** (already correct):
```javascript
const paginationParams = {
  page: pagination.page,
  limit: pagination.limit,
  search: filters.search,
  stage: filters.stage,
  country: filters.country,
  jobId: filters.jobId,
  interview_filter: filters.interview_filter,  // ✅ Already implemented
  sortBy: "applied_at",
  sortOrder: "desc",
};
```

### Interview Duration Field

When scheduling interviews, the frontend can optionally send `duration_minutes`:

```javascript
// In your interview scheduling form/logic
const scheduleInterview = async (applicationId, interviewData) => {
  await applicationService.scheduleInterview(applicationId, {
    interview_date_ad: interviewData.date,
    interview_time: interviewData.time,
    duration_minutes: interviewData.duration || 60,  // Optional - defaults to 60
    location: interviewData.location,
    contact_person: interviewData.interviewer,
    required_documents: interviewData.documents,
    notes: interviewData.notes
  });
};
```

**Important**: 
- `duration_minutes` is **optional**
- If not provided, backend defaults to **60 minutes**
- Frontend can add a duration selector in the interview scheduling UI
- The duration is used for calculating "unattended" interviews (scheduled time + duration + 30min grace period)

## Testing Checklist

### Backend Testing
- [ ] Test interview data is returned for `stage=interview_scheduled`
- [ ] Test `interview_filter=today` returns only today's interviews
- [ ] Test `interview_filter=tomorrow` returns only tomorrow's interviews
- [ ] Test `interview_filter=unattended` returns past interviews
- [ ] Test `interview_filter=all` returns all scheduled interviews
- [ ] Test interview object is `null` for non-scheduled stages

### Frontend Testing
- [ ] Update all references from `rejected` to `withdrawn`
- [ ] Verify "Rejected" label still shows to users
- [ ] Test rejection functionality works with `withdrawn` status
- [ ] Test interview details display correctly
- [ ] Test Today/Tomorrow/Unattended/All tabs work
- [ ] Test filtering doesn't break when no interviews scheduled
- [ ] Test backward compatibility with existing data

## Interview Object Structure

### Response Format
```typescript
interface Interview {
  id: string;                    // Interview UUID
  scheduled_at: string | null;   // ISO 8601 date (e.g., "2025-12-01T00:00:00.000Z")
  time: string | null;            // Time string (e.g., "10:00:00")
  duration: number;               // Duration in minutes (default: 60)
  location: string | null;        // Interview location
  interviewer: string | null;     // Contact person name
  notes: string | null;           // Additional notes
  required_documents: string[];   // Array of required document types
}
```

### Scheduling Interview (Request Format)
When scheduling an interview, you can optionally include `duration_minutes`:

```javascript
// Example: Schedule interview with custom duration
await applicationService.scheduleInterview(applicationId, {
  interview_date_ad: '2025-12-01',
  interview_date_bs: '2082-08-15',
  interview_time: '10:00',
  duration_minutes: 90,  // Optional - defaults to 60 if not provided
  location: 'Office',
  contact_person: 'HR Manager',
  required_documents: ['passport', 'cv'],
  notes: 'Bring original documents'
});
```

**Note**: If `duration_minutes` is not provided, the backend will default to 60 minutes.

## Unattended Filter Logic

The "unattended" filter identifies interviews where:
1. The scheduled date/time + duration + 30min grace period has passed
2. The application status is still `interview_scheduled` (not moved to `interview_passed` or `interview_failed`)
3. This helps agencies identify candidates who may have missed their interview

**Example**:
- Interview scheduled: Dec 1, 2025 at 10:00 AM
- Duration: 60 minutes
- Grace period: 30 minutes
- Considered "unattended" after: Dec 1, 2025 at 11:30 AM

## Migration Path

1. **Deploy backend changes** (already done)
2. **Update frontend constants** (change `rejected` to `withdrawn`)
3. **Update UI labels** (keep showing "Rejected" to users)
4. **Test thoroughly** (especially rejection flow)
5. **Deploy frontend changes**

## Support

If you encounter any issues:
- Backend code: `portal/agency_research/code/src/modules/agency/job-candidates.controller.ts`
- Frontend code: `portal/agency_research/code/admin_panel/UdaanSarathi2/src/`
- Backend implementation details: `BACKEND_IMPLEMENTATION_SUMMARY.md`

## Summary

**What works now**:
✅ Interview data is included in API responses
✅ Interview filtering by date (today/tomorrow/unattended/all)
✅ Interview duration field supported (optional, defaults to 60 minutes)
✅ Backward compatible (works without interview_filter parameter)

**What needs frontend changes**:
⚠️ Change `rejected` to `withdrawn` in code
⚠️ Keep "Rejected" label for users
⚠️ Update all status checks and filters
💡 Optionally add duration selector in interview scheduling UI

**Estimated frontend work**: 1-2 hours

## API Field Summary

### When Fetching Candidates
**Request**: `GET /agencies/:license/jobs/:jobId/candidates?stage=interview_scheduled&interview_filter=today`

**Response includes**:
```json
{
  "interview": {
    "id": "uuid",
    "scheduled_at": "2025-12-01T00:00:00.000Z",
    "time": "10:00:00",
    "duration": 60,
    "location": "Office",
    "interviewer": "HR Manager",
    "notes": "Bring documents",
    "required_documents": ["passport", "cv"]
  }
}
```

### When Scheduling Interview
**Request**: `POST /applications/:id/schedule-interview`

**Body can include**:
```json
{
  "interview_date_ad": "2025-12-01",
  "interview_date_bs": "2082-08-15",
  "interview_time": "10:00",
  "duration_minutes": 90,
  "location": "Office",
  "contact_person": "HR Manager",
  "required_documents": ["passport", "cv"],
  "notes": "Bring original documents"
}
```

**Note**: All fields except `interview_date_ad` and `interview_time` are optional. `duration_minutes` defaults to 60 if not provided.
