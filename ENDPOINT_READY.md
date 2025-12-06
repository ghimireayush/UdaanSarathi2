# Unified Candidate Detail Endpoint - Ready for Integration

**Date**: 2025-11-29  
**Status**: READY  
**From**: Backend Team  
**To**: Frontend Team

---

## Endpoint

```
GET /agencies/:license/jobs/:jobId/candidates/:candidateId/details
```

**Parameters**:
- `license` - Agency license number
- `jobId` - Job posting UUID
- `candidateId` - Candidate UUID

**Headers**:
```
Authorization: Bearer {token}
```

---

## Response Example

```json
{
  "candidate": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "+977-9841234567",
    "email": "john@example.com",
    "gender": "Male",
    "age": 28,
    "address": {
      "formatted": "Kathmandu, Ward 10, Bagmati Province",
      "name": "Kathmandu",
      "province": "Bagmati",
      "district": "Kathmandu",
      "municipality": "Kathmandu",
      "ward": "10"
    },
    "passport_number": "N1234567",
    "profile_image": "https://...",
    "is_active": true
  },
  "job_profile": {
    "summary": "Experienced chef...",
    "skills": ["Cooking", "English", "Customer Service"],
    "education": [
      {
        "degree": "Culinary Arts Diploma",
        "institution": "Nepal Culinary Institute",
        "year_completed": 2018
      }
    ],
    "trainings": [...],
    "experience": [
      {
        "title": "Chef",
        "employer": "5-Star Hotel",
        "start_date_ad": "2018-06-01",
        "end_date_ad": "2023-05-31",
        "months": 60,
        "description": "..."
      }
    ]
  },
  "job_context": {
    "job_id": "uuid",
    "job_title": "Chef - Dubai Restaurant",
    "job_company": "Luxury Hotels Group",
    "job_location": {
      "city": "Dubai",
      "country": "UAE"
    }
  },
  "application": {
    "id": "uuid",
    "position_id": "uuid",
    "position_title": "Chef",
    "status": "shortlisted",
    "created_at": "2025-11-20T10:30:00.000Z",
    "updated_at": "2025-11-25T14:20:00.000Z",
    "history_blob": [
      {
        "prev_status": null,
        "next_status": "applied",
        "updated_at": "2025-11-20T10:30:00.000Z",
        "updated_by": "candidate-uuid",
        "note": null
      },
      {
        "prev_status": "applied",
        "next_status": "shortlisted",
        "updated_at": "2025-11-25T14:20:00.000Z",
        "updated_by": "agency",
        "note": "Meets all requirements",
        "corrected": false
      }
    ]
  },
  "interview": {
    "id": "uuid",
    "interview_date_ad": "2025-11-28T10:00:00.000Z",
    "interview_date_bs": "2082-08-13",
    "interview_time": "10:00 AM",
    "location": "Agency Office",
    "contact_person": "HR Manager",
    "required_documents": ["Passport Copy"],
    "notes": "Bring original documents",
    "expenses": []
  }
}
```

---

## Key Points

1. **Skills**: Flat array of strings (as requested)
2. **Address**: Includes `formatted` field (as requested)
3. **History**: Named `history_blob` (as requested)
4. **Interview**: Will be `null` if not scheduled
5. **Documents**: NOT included - fetch separately

---

## Frontend Integration

### API Client

```javascript
// src/services/candidateApiClient.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export const getCandidateDetails = async (license, jobId, candidateId) => {
  const response = await fetch(
    `${API_BASE_URL}/agencies/${license}/jobs/${jobId}/candidates/${candidateId}/details`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch candidate details')
  }
  
  return response.json()
}
```

### Usage in Component

```javascript
const handleCandidateClick = async (candidateId) => {
  try {
    setLoadingCandidate(true)
    
    const candidateData = await getCandidateDetails(
      agencyLicense,
      jobId,
      candidateId
    )
    
    setSelectedCandidate(candidateData)
    setIsSidebarOpen(true)
  } catch (error) {
    console.error(error)
  } finally {
    setLoadingCandidate(false)
  }
}
```

### Accessing Data

```javascript
// Basic info
<h3>{candidate.candidate?.name}</h3>
<p>{candidate.candidate?.address?.formatted}</p>

// Skills
{candidate.job_profile?.skills?.map(skill => (
  <span key={skill}>{skill}</span>
))}

// Application history
<ApplicationHistory historyBlob={candidate.application?.history_blob} />

// Interview (if exists)
{candidate.interview && (
  <div>
    <p>{candidate.interview.interview_date_ad}</p>
    <p>{candidate.interview.location}</p>
  </div>
)}
```

---

## Error Responses

**403 Forbidden**: Agency doesn't own this job  
**404 Not Found**: Candidate or application not found

---

## Testing

```bash
curl -X GET \
  'http://localhost:3000/agencies/LIC-AG-0001/jobs/{jobId}/candidates/{candidateId}/details' \
  -H 'Authorization: Bearer {token}'
```

---

## Integration Checklist

- [ ] Create API client
- [ ] Update JobDetails.jsx
- [ ] Update CandidateSummaryS2.jsx
- [ ] Test with real data
- [ ] Verify error handling
- [ ] Verify documents API still works separately

---

**Ready to integrate!**

Backend Team - November 29, 2025
