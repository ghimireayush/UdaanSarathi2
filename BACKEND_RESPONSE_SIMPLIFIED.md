# Backend Response - Candidate Detail API (SIMPLIFIED)

**Date**: 2025-11-29  
**From**: Backend Team  
**To**: Frontend Team (Admin Panel)  
**Re**: Candidate Detail API - Existing Endpoints

---

## TL;DR - Endpoints Already Exist! ✅

The admin panel can use the **SAME endpoints** that the Flutter candidate app uses:

1. **GET /candidates/:id** - Basic candidate info
2. **GET /candidates/:id/job-profiles** - Skills, education, experience
3. **GET /candidates/:id/documents** - Documents (already integrated)

---

## 1. Basic Candidate Profile

### Endpoint
```
GET /candidates/:id
```

### Response
```json
{
  "id": "candidate-uuid",
  "full_name": "John Doe",
  "phone": "+977-9841234567",
  "email": "john.doe@example.com",
  "gender": "Male",
  "age": 28,
  "address": {
    "name": "Kathmandu Metropolitan City",
    "coordinates": {
      "lat": 27.7172,
      "lng": 85.3240
    },
    "province": "Bagmati",
    "district": "Kathmandu",
    "municipality": "Kathmandu",
    "ward": "10"
  },
  "passport_number": "N1234567",
  "profile_image": "https://...",
  "is_active": true,
  "created_at": "2025-01-15T08:00:00Z",
  "updated_at": "2025-11-20T10:30:00Z"
}
```

### What You Get
- ✅ Name, phone, email
- ✅ Address (full JSONB with coordinates)
- ✅ Passport number
- ✅ Gender, age
- ✅ Profile image URL
- ✅ Active status

---

## 2. Job Profile (Skills, Education, Experience)

### Endpoint
```
GET /candidates/:id/job-profiles
```

### Response
```json
[
  {
    "id": "profile-uuid",
    "candidate_id": "candidate-uuid",
    "profile_blob": {
      "summary": "Experienced chef with 5 years in hospitality",
      "skills": [
        {
          "title": "Cooking",
          "years": 5
        },
        {
          "title": "English",
          "years": 3
        },
        {
          "title": "Customer Service",
          "years": 4
        }
      ],
      "education": [
        {
          "degree": "Culinary Arts Diploma",
          "institution": "Nepal Culinary Institute",
          "year_completed": 2018
        }
      ],
      "trainings": [
        {
          "title": "Food Safety Certification",
          "provider": "Nepal Food Authority",
          "hours": 40,
          "certificate": true
        }
      ],
      "experience": [
        {
          "title": "Chef",
          "employer": "5-Star Hotel Kathmandu",
          "start_date_ad": "2018-06-01",
          "end_date_ad": "2023-05-31",
          "months": 60,
          "description": "Prepared international cuisine for hotel guests"
        }
      ]
    },
    "label": "Chef Profile",
    "created_at": "2025-01-15T08:00:00Z",
    "updated_at": "2025-11-20T10:30:00Z"
  }
]
```

### What You Get
- ✅ Skills array with years of experience
- ✅ Education array with degrees and institutions
- ✅ Trainings array with certifications
- ✅ Experience array with detailed work history
- ✅ Profile summary text
- ✅ Multiple profiles (ordered by updated_at DESC, most recent first)

### Notes
- Returns an **array** (candidates can have multiple profiles)
- Use the **first item** `[0]` for the most recent profile
- `profile_blob` contains all the detailed information

---

## 3. Documents (Already Integrated)

### Endpoint
```
GET /candidates/:id/documents
```

### Response
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

## 4. Application Details (For History & Status)

### Current Situation
The frontend mentioned that **application workflow is already done**. This means you're already using:

```
GET /agencies/:license/jobs/:jobId/candidates
```

This returns candidates with their `application_id`. You can then use the application service to get history if needed.

### If You Need Application History

The `history_blob` is stored in the `job_applications` table. If you need it, you can:

**Option A**: Use the existing candidate list endpoint which includes `application_id`, then fetch application details separately if needed.

**Option B**: We can create a simple endpoint:
```
GET /applications/:applicationId
```

But based on your message, it seems you already have the application workflow handled in the frontend.

---

## 5. Complete Integration Example

### Frontend Code

```javascript
// Step 1: Get basic candidate info
const candidate = await fetch(`/api/candidates/${candidateId}`)
  .then(res => res.json());

// Step 2: Get job profile (skills, education, experience)
const jobProfiles = await fetch(`/api/candidates/${candidateId}/job-profiles`)
  .then(res => res.json());

const profile = jobProfiles[0]; // Most recent profile

// Step 3: Get documents (if needed)
const documents = await fetch(`/api/candidates/${candidateId}/documents`)
  .then(res => res.json());

// Step 4: Combine data for display
const candidateDetails = {
  // Basic info
  id: candidate.id,
  name: candidate.full_name,
  phone: candidate.phone,
  email: candidate.email,
  address: candidate.address,
  passport_number: candidate.passport_number,
  
  // From job profile
  experience: profile?.profile_blob?.experience || [],
  skills: profile?.profile_blob?.skills || [],
  education: profile?.profile_blob?.education || [],
  trainings: profile?.profile_blob?.trainings || [],
  summary: profile?.profile_blob?.summary || '',
  
  // Documents
  documents: documents.data,
  documentProgress: documents.summary.progress
};
```

---

## 6. What About Job Title & Company?

### Context Matters

When viewing a candidate from the **Job Details page**, you already have:
- Job title (from the job posting)
- Company name (from the job posting)
- Application status (from the candidates list)

You don't need these in the candidate profile endpoint because they're **job-specific**, not **candidate-specific**.

### Current Flow (Already Working)

```
1. Admin views Job Details page
   ↓
2. Job info is already loaded (title, company, etc.)
   ↓
3. Admin clicks on a candidate card
   ↓
4. Fetch candidate details: GET /candidates/:id
   ↓
5. Fetch job profile: GET /candidates/:id/job-profiles
   ↓
6. Display in sidebar with job context from step 2
```

---

## 7. Authorization for Admin Access

### Current Implementation

The admin panel should use the **agency-scoped endpoints** to ensure proper authorization:

```
GET /agencies/:license/jobs/:jobId/candidates
```

This endpoint:
- ✅ Verifies the agency owns the job
- ✅ Returns candidates who applied to that job
- ✅ Includes `candidate_id` for fetching details

Then use the `candidate_id` to fetch:
- `GET /candidates/:id` (basic info)
- `GET /candidates/:id/job-profiles` (skills, experience)
- `GET /candidates/:id/documents` (documents)

### Security Note

The `/candidates/:id` endpoints are **public** (used by the Flutter app for candidates to view their own profiles). If you need to restrict access to only the agency's candidates, we should add authorization checks.

**Question**: Should we add agency authorization to the candidate endpoints, or is it okay for agencies to access any candidate profile by ID?

---

## 8. Summary - What You Need to Do

### Frontend Integration (2-3 hours)

**Step 1**: Update your candidate click handler
```javascript
const handleCandidateClick = async (candidateId) => {
  try {
    setLoadingCandidate(true);
    
    // Fetch basic info
    const candidate = await candidateApi.getProfile(candidateId);
    
    // Fetch job profile
    const profiles = await candidateApi.getJobProfiles(candidateId);
    const profile = profiles[0]; // Most recent
    
    // Combine data
    const fullDetails = {
      ...candidate,
      skills: profile?.profile_blob?.skills || [],
      education: profile?.profile_blob?.education || [],
      experience: profile?.profile_blob?.experience || [],
      trainings: profile?.profile_blob?.trainings || [],
    };
    
    setSelectedCandidate(fullDetails);
    setIsSidebarOpen(true);
  } catch (error) {
    console.error('Failed to load candidate:', error);
    toast.error('Failed to load candidate details');
  } finally {
    setLoadingCandidate(false);
  }
};
```

**Step 2**: Update your API client
```javascript
// src/services/candidateApiClient.js
export const candidateApi = {
  getProfile: async (candidateId) => {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`);
    if (!response.ok) throw new Error('Failed to fetch candidate profile');
    return response.json();
  },
  
  getJobProfiles: async (candidateId) => {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/job-profiles`);
    if (!response.ok) throw new Error('Failed to fetch job profiles');
    return response.json();
  },
  
  getDocuments: async (candidateId) => {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/documents`);
    if (!response.ok) throw new Error('Failed to fetch documents');
    return response.json();
  }
};
```

**Step 3**: Update your CandidateSummaryS2 component to handle the new data structure

---

## 9. Data Mapping Guide

### From Frontend Requirements to Backend Response

| Frontend Field | Backend Source | Endpoint |
|----------------|----------------|----------|
| `id` | `candidates.id` | GET /candidates/:id |
| `name` | `candidates.full_name` | GET /candidates/:id |
| `phone` | `candidates.phone` | GET /candidates/:id |
| `email` | `candidates.email` | GET /candidates/:id |
| `address` | `candidates.address` | GET /candidates/:id |
| `passport_number` | `candidates.passport_number` | GET /candidates/:id |
| `experience` | `profile_blob.experience[]` | GET /candidates/:id/job-profiles |
| `education` | `profile_blob.education[]` | GET /candidates/:id/job-profiles |
| `skills` | `profile_blob.skills[]` | GET /candidates/:id/job-profiles |
| `job_title` | From job context (already loaded) | N/A |
| `job_company` | From job context (already loaded) | N/A |
| `application.stage` | From candidates list | GET /agencies/:license/jobs/:jobId/candidates |
| `application.history_blob` | From application (if needed) | TBD - let us know if needed |

---

## 10. Do You Need Application History?

### Question for Frontend Team

You mentioned that "application workflow and documents are already done in the frontend."

**Does this mean:**
- ✅ You already have the application status and history?
- ✅ You don't need the `history_blob` from the backend?

**If you DO need history_blob**, we can:
1. Add it to the existing candidates list endpoint
2. Create a new endpoint: `GET /applications/:applicationId`
3. Add it to a new combined endpoint

**Please confirm**: Do you need the application history timeline, or is the current status sufficient?

---

## 11. Timeline

### No Backend Work Needed! ✅

All endpoints already exist. You can start integration immediately.

### Frontend Integration
- **Estimated Time**: 2-3 hours
- **Tasks**:
  1. Update API client methods (30 min)
  2. Update candidate click handler (1 hour)
  3. Update CandidateSummaryS2 component (1 hour)
  4. Test with real data (30 min)

### Can Start: **Immediately**

---

## 12. Testing

### Test Candidate IDs

You can test with any candidate ID from your database. To get a candidate ID:

1. Call the candidates list endpoint:
   ```
   GET /agencies/:license/jobs/:jobId/candidates?stage=applied
   ```

2. Pick a `candidate_id` from the response

3. Test the profile endpoints:
   ```
   GET /candidates/{candidate_id}
   GET /candidates/{candidate_id}/job-profiles
   GET /candidates/{candidate_id}/documents
   ```

---

## 13. Questions?

### If You Need Help

1. **Authorization Issues**: If you get 403/401 errors, check your auth token
2. **Missing Data**: Some candidates might not have job profiles yet
3. **Empty Arrays**: Skills/education might be empty for new candidates
4. **Multiple Profiles**: Always use `[0]` to get the most recent profile

### Contact Backend Team

If you encounter any issues or need modifications, let us know!

---

## 14. Final Answer to Your Questions

### From Your Original Requirements Document

**Q1: Does an endpoint already exist to fetch candidate details with application information?**
- ✅ **YES** - Multiple endpoints exist:
  - `GET /candidates/:id` (basic info)
  - `GET /candidates/:id/job-profiles` (skills, experience, education)
  - `GET /candidates/:id/documents` (documents)

**Q2: Application History (`history_blob`)**
- ✅ Data is stored in `job_applications.history_blob`
- ⚠️ Not currently included in candidate endpoints
- ❓ **Do you need it?** (You said workflow is already done)

**Q3: Job Information**
- ✅ Job details are already loaded in your Job Details page
- ✅ No need to embed in candidate response
- ✅ Use job context from the page

**Q4: Interview Information**
- ✅ Stored in `interview_details` table
- ✅ Linked to applications
- ❓ **Do you need it in candidate details?** (You said workflow is already done)

---

## 15. Next Steps

1. **Frontend Team**: Start integration using existing endpoints
2. **Backend Team**: Standing by for any issues or modifications
3. **Both Teams**: Schedule quick sync if you need application history

**Ready to integrate!** 🚀

---

**Questions? Concerns? Need modifications?**

Reply with:
- ✅ "Good to go, starting integration"
- ❓ "Need application history endpoint"
- 🔧 "Need modifications to response structure"
