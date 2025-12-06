# Candidate Detail API Requirements

**Date**: 2025-11-29  
**From**: Frontend Team  
**To**: Backend Team  
**Subject**: API Endpoint for Candidate Profile Details

---

## Problem Statement

When clicking on a candidate card in the Job Details page, the frontend needs to display comprehensive candidate information in a sidebar. Currently, the frontend is trying to fetch candidate data from mock services, which causes the page to fail to load.

**Current Issue**: No API endpoint exists (or is not integrated) to fetch complete candidate profile data with application details.

---

## Required Data Structure

Based on the `CandidateSummaryS2.jsx` component analysis, here's what data the frontend needs to display:

### 1. Basic Candidate Information

**Required Fields**:
- `id` (string) - Candidate unique identifier
- `name` (string) - Full name
- `phone` (string) - Contact phone number
- `email` (string) - Email address
- `address` (string) - Physical address

**Optional Fields**:
- `passport_number` (string) - Passport number if available

---

### 2. Professional Information

**Required Fields**:
- `experience` (string or object) - Work experience details
  - Frontend currently expects a string or formatted experience object
  - Example: "5 years in hospitality" or structured experience data

**Optional Fields**:
- `education` (string) - Educational background
- `skills` (array of strings) - List of skills
  - Example: `["Cooking", "English", "Customer Service"]`

---

### 3. Application Information

**Required Fields**:
- `application` (object) - Application details
  - `id` (string) - Application ID
  - `stage` (string) - Current workflow stage
    - Possible values: `'applied'`, `'shortlisted'`, `'interview_scheduled'`, `'interview_rescheduled'`, `'interview_passed'`, `'interview_failed'`, `'withdrawn'`
  - `created_at` (ISO timestamp) - When application was submitted
  - `history_blob` (array) - **CRITICAL** - Application history for timeline
    - Each entry should contain:
      - `prev_status` (string | null) - Previous status
      - `next_status` (string) - New status
      - `updated_at` (ISO timestamp) - When change occurred
      - `updated_by` (string) - Who made the change (user ID or 'agency')
      - `note` (string | null) - Optional reason/note for change
      - `corrected` (boolean | optional) - If this was a manual correction

**Optional Fields**:
- `application.interview_type` (string) - Type of interview (e.g., "In-person", "Video call")

---

### 4. Job Information

**Required Fields**:
- `job_title` (string) - Title of the job they applied for
  - Example: "Chef - Dubai Restaurant"

**Optional Fields**:
- `job_company` (string) - Company name
- `job_location` (string) - Job location

---

### 5. Interview Information

**Optional Fields** (only if interview has occurred):
- `interviewed_at` (ISO timestamp) - When interview took place
- `interview_remarks` (string) - Interview feedback/notes
- `interview_type` (string) - Type of interview conducted

---

### 6. Documents

**Note**: Documents are now fetched separately via `GET /candidates/:id/documents`

The candidate object does NOT need to include documents, as we're using the dedicated documents API endpoint.

---

## Proposed API Endpoint

### Option 1: Get Candidate with Application Details

```
GET /candidates/:candidateId/application-details?jobId=:jobId
```

**Purpose**: Fetch candidate profile with application details for a specific job

**Response Structure**:
```json
{
  "id": "candidate-uuid",
  "name": "John Doe",
  "phone": "+977-9841234567",
  "email": "john.doe@example.com",
  "address": "Kathmandu, Nepal",
  "passport_number": "N1234567",
  
  "experience": "5 years as Chef in 5-star hotels",
  "education": "Culinary Arts Diploma",
  "skills": ["Cooking", "English", "Customer Service", "Team Management"],
  
  "job_title": "Chef - Dubai Restaurant",
  "job_company": "Luxury Hotels Group",
  
  "application": {
    "id": "application-uuid",
    "stage": "shortlisted",
    "created_at": "2025-11-20T10:30:00Z",
    "interview_type": "In-person",
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
        "note": "Meets all requirements",
        "corrected": false
      }
    ]
  },
  
  "interviewed_at": "2025-11-28T10:00:00Z",
  "interview_remarks": "Excellent communication skills. Strong technical knowledge. Recommended for next stage."
}
```

---

### Option 2: Enhance Existing Candidate Endpoint

```
GET /candidates/:candidateId?include=application,job
```

**Purpose**: Fetch candidate with optional related data

**Query Parameters**:
- `include` - Comma-separated list of relations to include
  - `application` - Include application details with history
  - `job` - Include job details
  - `interview` - Include interview details

---

### Option 3: Use Existing Job Candidates Endpoint

```
GET /agencies/:license/jobs/:jobId/candidates/:candidateId
```

**Purpose**: Fetch specific candidate details within job context

**Advantage**: Already scoped to job and agency

---

## Questions for Backend Team

### Critical Questions:

1. **Does an endpoint already exist** to fetch candidate details with application information?
   - If yes, what is the endpoint URL and response structure?
   - If no, which of the 3 options above would be easiest to implement?

2. **Application History (`history_blob`)**:
   - Is this data already being stored in the database?
   - Is it included in existing candidate/application responses?
   - What format is it stored in?

3. **Job Information**:
   - Should job details be embedded in the candidate response?
   - Or should we make a separate call to get job details?

4. **Interview Information**:
   - Where is interview data stored?
   - Is it part of the application record or separate?
   - Should it be included in the candidate response?

### Implementation Questions:

5. **Endpoint Preference**:
   - Would you prefer to create a new endpoint or enhance an existing one?
   - What's the best way to scope this (by candidate ID, by job ID, or both)?

6. **Performance**:
   - Should we use a single endpoint with all data?
   - Or multiple endpoints (candidate, application, interview separately)?

7. **Authorization**:
   - What authorization is needed?
   - Agency license validation?
   - User role validation?

---

## Current Frontend Integration

### Where This API Will Be Used:

**File**: `src/pages/JobDetails.jsx`

**Current Flow**:
1. User clicks on candidate card
2. `setSelectedCandidate(candidate)` is called
3. `CandidateSummaryS2` sidebar opens
4. Sidebar tries to display candidate data
5. **FAILS** because candidate data is from mock service

**Proposed Flow**:
1. User clicks on candidate card
2. Frontend calls: `GET /candidates/:id/application-details?jobId=:jobId`
3. Receives complete candidate data with application history
4. `setSelectedCandidate(candidateData)` with real data
5. `CandidateSummaryS2` sidebar opens successfully
6. Sidebar displays all candidate information
7. Separately loads documents via `GET /candidates/:id/documents`

---

## Integration Plan

### Once Backend Provides Endpoint:

**Step 1**: Create API client method
```javascript
// src/services/candidateApiClient.js
export const getCandidateDetails = async (candidateId, jobId) => {
  const response = await fetch(
    `${API_BASE_URL}/candidates/${candidateId}/application-details?jobId=${jobId}`,
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
    const candidateData = await candidateApiClient.getCandidateDetails(candidateId, jobId)
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

**Step 3**: Test with real data

---

## Priority

**Priority**: 🔴 **CRITICAL - BLOCKING**

This is blocking the entire candidate detail view functionality. Without this API:
- ❌ Cannot view candidate profiles
- ❌ Cannot see application history
- ❌ Cannot update candidate status
- ❌ Cannot view interview details
- ❌ Job details page is partially broken

---

## Timeline

**Needed By**: ASAP

**Frontend Ready**: Yes - just need the endpoint URL and response structure

**Estimated Integration Time**: 1-2 hours once endpoint is available

---

## Summary

**What We Need**:
1. API endpoint to fetch candidate details with application information
2. Response must include `history_blob` for timeline display
3. Response must include job title and application stage
4. Response structure matching the format described above

**What We Have**:
- ✅ Documents API already integrated
- ✅ Frontend component ready to display data
- ✅ Error handling in place
- ✅ Loading states implemented

**What's Blocking**:
- ❌ No API endpoint for candidate details
- ❌ Frontend using mock data that doesn't work

---

## Next Steps

1. **Backend Team**: Review this document
2. **Backend Team**: Confirm if endpoint exists or needs to be created
3. **Backend Team**: Provide endpoint URL and response structure
4. **Frontend Team**: Integrate endpoint once available
5. **Both Teams**: Test integration together

---

**Please respond with**:
- Does this endpoint exist? If yes, what's the URL?
- If not, which option (1, 2, or 3) should we implement?
- What's the expected response structure?
- When can this be available?

Thank you! 🙏
