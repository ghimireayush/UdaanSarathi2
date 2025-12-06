# Backend API Requirements: Interview Filtering for Scheduled Candidates

## Overview
The frontend now expects server-side filtering for scheduled interviews based on date/time criteria. This document specifies the required backend API changes.

## Endpoint to Update
`GET /agencies/:license/jobs/:jobId/candidates`

## New Query Parameter

### `interview_filter` (optional)
- **Type**: String (enum)
- **Applies to**: Only when `stage=interview_scheduled`
- **Values**:
  - `today` - Return candidates with interviews scheduled for today
  - `tomorrow` - Return candidates with interviews scheduled for tomorrow
  - `unattended` - Return candidates whose interview time has passed but status is still 'scheduled' (grace period: 30 minutes after scheduled end time)
  - `all` - Return all scheduled candidates (default behavior if parameter is omitted)

## Filter Logic Details

### 1. `today` Filter
**Criteria**: 
- Interview date matches current date (server timezone)
- Interview status is 'scheduled' OR is unattended (past grace period)
- Exclude completed or cancelled interviews

**SQL Example**:
```sql
WHERE stage = 'interview_scheduled'
  AND DATE(interview_scheduled_at) = CURRENT_DATE
  AND (
    interview_status = 'scheduled' 
    OR (
      interview_status = 'scheduled' 
      AND interview_scheduled_at + INTERVAL '1 hour' + INTERVAL '30 minutes' < NOW()
    )
  )
```

### 2. `tomorrow` Filter
**Criteria**:
- Interview date matches tomorrow's date (server timezone)
- Interview status is 'scheduled'
- Exclude completed or cancelled interviews

**SQL Example**:
```sql
WHERE stage = 'interview_scheduled'
  AND DATE(interview_scheduled_at) = CURRENT_DATE + INTERVAL '1 day'
  AND interview_status = 'scheduled'
```

### 3. `unattended` Filter
**Criteria**:
- Interview scheduled time + duration + grace period (30 minutes) has passed
- Interview status is still 'scheduled' (not marked as completed/cancelled)
- This indicates the candidate did not attend or the interview was not marked as completed

**SQL Example**:
```sql
WHERE stage = 'interview_scheduled'
  AND interview_status = 'scheduled'
  AND interview_scheduled_at + 
      INTERVAL '1 hour' * (duration_minutes / 60) + 
      INTERVAL '30 minutes' < NOW()
```

### 4. `all` Filter (Default)
**Criteria**:
- Return all candidates with stage = 'interview_scheduled'
- No additional date/time filtering
- This is the current behavior

## Current API Response (Missing Interview Data)

**Current Response** from `GET /agencies/:license/jobs/:jobId/candidates?stage=interview_scheduled`:
```json
{
  "candidates": [
    {
      "id": "9e0e4669-f8e4-4850-a006-5bf8c1171b2c",
      "name": "Ramesh Bahadur",
      "priority_score": 0,
      "location": {
        "city": "Baglung",
        "country": "Nepal"
      },
      "phone": "+9779862146253",
      "email": "ramesh.bahadur@example.com",
      "experience": [...],
      "skills": [...],
      "applied_at": "2025-11-29T07:10:43.039Z",
      "application_id": "da320842-fefb-4370-b88e-adce33327a1c",
      "documents": []
    }
  ],
  "pagination": {
    "total": 1,
    "limit": "10",
    "offset": "0",
    "has_more": false
  }
}
```

**Problem**: The response is missing the `interview` object with scheduling details.

## Required Response Format

**⚠️ CRITICAL**: The API must include interview details for candidates with `stage=interview_scheduled`.

```json
{
  "candidates": [
    {
      "id": "candidate-uuid",
      "name": "Candidate Name",
      "phone": "+977-9841234567",
      "email": "candidate@example.com",
      "priority_score": 85,
      "skills": ["skill1", "skill2"],
      "experience": [
        {
          "title": "Job Title",
          "months": 60,
          "employer": "Company Name",
          "description": "Job description",
          "start_date_ad": "2020-01-01",
          "end_date_ad": "2025-01-01"
        }
      ],
      "location": {
        "city": "Kathmandu",
        "country": "Nepal"
      },
      "applied_at": "2024-01-15T10:30:00Z",
      "application_id": "application-uuid",
      "documents": [],
      "interview": {
        "id": "interview-uuid",
        "scheduled_at": "2024-01-20T14:00:00Z",
        "duration": 60,
        "location": "Office",
        "interviewer": "John Doe",
        "status": "scheduled",
        "notes": "Bring original documents",
        "required_documents": ["cv", "citizenship", "education", "photo", "hardcopy"]
      }
    }
  ],
  "pagination": {
    "total": 25,
    "limit": "10",
    "offset": "0",
    "has_more": false
  }
}
```

### Interview Object Fields (Required)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string (UUID) | Yes | Unique interview identifier |
| `scheduled_at` | string (ISO 8601) | Yes | Interview date and time |
| `duration` | integer | Yes | Duration in minutes (e.g., 60) |
| `location` | string | Yes | Interview location (e.g., "Office", "Zoom", "Phone") |
| `interviewer` | string | Yes | Name of the interviewer/contact person |
| `status` | string | Yes | Interview status: "scheduled", "completed", "cancelled" |
| `notes` | string | No | Additional notes or instructions |
| `required_documents` | array of strings | No | List of required document types |

### Where to Get Interview Data

The interview details should be retrieved from the `interviews` table or wherever interview scheduling data is stored when an application is moved to `interview_scheduled` status.

**Suggested SQL Join** (adjust based on your schema):
```sql
SELECT 
  c.*,
  a.id as application_id,
  a.status,
  a.created_at as applied_at,
  i.id as interview_id,
  i.interview_date_ad as scheduled_at,
  i.interview_time,
  i.duration_minutes as duration,
  i.location,
  i.contact_person as interviewer,
  i.status as interview_status,
  i.notes,
  i.required_documents
FROM candidates c
JOIN applications a ON c.id = a.candidate_id
LEFT JOIN interviews i ON a.id = i.application_id
WHERE a.job_posting_id = :jobId
  AND a.status = 'interview_scheduled'
```

## Important Notes

1. **⚠️ CRITICAL - Missing Interview Data**: The current API response does NOT include interview details. This must be added by joining with the interviews table and including the `interview` object in each candidate response when `stage=interview_scheduled`.

2. **Timezone Handling**: All date/time comparisons should use the server's timezone consistently. The frontend will display times in the user's local timezone.

3. **Grace Period**: The 30-minute grace period for "unattended" status is to account for interviews running slightly over time or delays in marking completion.

4. **Interview Data Structure**: When `stage=interview_scheduled`, each candidate object MUST include an `interview` object with:
   - `id` (UUID) - Interview record ID
   - `scheduled_at` (ISO 8601 datetime) - Interview date and time
   - `duration` (integer) - Duration in minutes
   - `status` (string) - 'scheduled', 'completed', or 'cancelled'
   - `location` (string) - Interview location
   - `interviewer` (string) - Interviewer/contact person name
   - `notes` (string, optional) - Additional notes
   - `required_documents` (array, optional) - List of required documents

5. **Backward Compatibility**: If `interview_filter` parameter is not provided, the API should return all scheduled candidates (current behavior).

6. **Performance**: Consider adding database indexes on:
   - `interviews.interview_date_ad` (or `scheduled_at`)
   - `interviews.status`
   - Composite index on `(applications.status, interviews.interview_date_ad, interviews.status)`

7. **Data Consistency**: Ensure that when an application is moved to `interview_scheduled` status, a corresponding interview record exists. The API should handle cases where interview data might be missing gracefully (return null for interview object rather than failing).

## Frontend Implementation Status
✅ Frontend has been updated to:
- Send `interview_filter` parameter based on user's selected tab
- Expect server-filtered results (no client-side filtering)
- Reload data when filter changes
- Display counts for each filter category

## Testing Scenarios

### Test Case 1: Today's Interviews
**Request**: `GET /agencies/ABC123/jobs/job-uuid/candidates?stage=interview_scheduled&interview_filter=today`
**Expected**: Only candidates with interviews scheduled for today

### Test Case 2: Tomorrow's Interviews
**Request**: `GET /agencies/ABC123/jobs/job-uuid/candidates?stage=interview_scheduled&interview_filter=tomorrow`
**Expected**: Only candidates with interviews scheduled for tomorrow

### Test Case 3: Unattended Interviews
**Request**: `GET /agencies/ABC123/jobs/job-uuid/candidates?stage=interview_scheduled&interview_filter=unattended`
**Expected**: Only candidates whose interview time has passed (including grace period) but status is still 'scheduled'

### Test Case 4: All Scheduled
**Request**: `GET /agencies/ABC123/jobs/job-uuid/candidates?stage=interview_scheduled&interview_filter=all`
**Expected**: All candidates with scheduled interviews, regardless of date

### Test Case 5: No Filter (Backward Compatibility)
**Request**: `GET /agencies/ABC123/jobs/job-uuid/candidates?stage=interview_scheduled`
**Expected**: All candidates with scheduled interviews (same as 'all')

## Database Schema Questions

Based on testing, we need clarification on:

1. **Interview Table Structure**: 
   - What is the table name for interviews? (e.g., `interviews`, `interview_schedules`)
   - What are the exact column names for:
     - Interview date/time (e.g., `interview_date_ad`, `scheduled_at`)
     - Duration (e.g., `duration_minutes`)
     - Location (e.g., `location`, `interview_location`)
     - Interviewer (e.g., `contact_person`, `interviewer_name`)
     - Status (e.g., `status`, `interview_status`)

2. **Relationship**: How are interviews linked to applications?
   - Foreign key: `application_id` in interviews table?
   - Or is it stored differently?

3. **Timezone**: What timezone is used for storing interview timestamps?

4. **Duration Storage**: Are interview durations stored? If not, should we assume a default (e.g., 60 minutes)?

5. **Status Values**: What are the possible values for interview status?
   - Expected: 'scheduled', 'completed', 'cancelled'
   - Actual values in your database?

6. **Grace Period**: Should the 30-minute grace period for "unattended" be configurable, or is hardcoding acceptable?

## Testing Evidence

**Test Job ID**: `f09c0bd6-3a1a-4213-8bc8-29eaede16dcc`
**Test Application ID**: `da320842-fefb-4370-b88e-adce33327a1c`
**Agency License**: `REG-2025-793487`

**Current API Call**:
```bash
curl -X GET "http://localhost:3000/agencies/REG-2025-793487/jobs/f09c0bd6-3a1a-4213-8bc8-29eaede16dcc/candidates?stage=interview_scheduled&limit=10&offset=0"
```

**Current Response**: Returns candidate data but NO interview object (see "Current API Response" section above)

**Expected**: Should include `interview` object with scheduling details

## Implementation Priority

### Phase 1 (Critical - Blocking Frontend)
1. ✅ Add `interview` object to candidate response when `stage=interview_scheduled`
2. ✅ Include all required interview fields (id, scheduled_at, duration, location, interviewer, status)

### Phase 2 (Important - Filtering)
3. ⏳ Implement `interview_filter` parameter support
4. ⏳ Add filtering logic for 'today', 'tomorrow', 'unattended', 'all'

### Phase 3 (Enhancement)
5. ⏳ Add database indexes for performance
6. ⏳ Add pagination support for large result sets

## Timeline
- **Frontend Status**: ✅ Implementation complete and ready
- **Backend Status**: ⏳ Waiting for interview data inclusion and filter implementation
- **Blocker**: Frontend cannot display scheduled interviews without interview data in API response

Once backend implements Phase 1 (interview data inclusion), the frontend will be able to display scheduled interviews. Phase 2 (filtering) will enable the Today/Tomorrow/Unattended/All tabs to work correctly.
