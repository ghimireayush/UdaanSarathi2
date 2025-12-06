# Backend Proposal - Unified Candidate Detail Endpoint

**Date**: 2025-11-29  
**From**: Backend Team  
**To**: Frontend Team  
**Re**: Proposed Unified Endpoint for One-Shot Candidate Details

---

## Proposal Summary

Instead of making 2-3 separate API calls, we can create a **unified endpoint** that combines all candidate information in a single response.

---

## Proposed Endpoint

### Option A: Agency-Scoped (Recommended)
```
GET /agencies/:license/jobs/:jobId/candidates/:candidateId/details
```

**Benefits**:
- ✅ Proper authorization (agency can only access their job candidates)
- ✅ Job context included (job title, company)
- ✅ Application status and history included
- ✅ Single API call

### Option B: Direct Candidate Access
```
GET /candidates/:candidateId/full-details
```

**Benefits**:
- ✅ Simpler URL
- ✅ Single API call
- ⚠️ No automatic authorization check
- ⚠️ No job context

---

## Proposed Response Structure

### Complete Response (One API Call)

```json
{
  "candidate": {
    "id": "candidate-uuid",
    "name": "John Doe",
    "phone": "+977-9841234567",
    "email": "john.doe@example.com",
    "gender": "Male",
    "age": 28,
    "address": {
      "name": "Kathmandu Metropolitan City",
      "coordinates": { "lat": 27.7172, "lng": 85.3240 },
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
    "summary": "Experienced chef with 5 years in hospitality",
    "skills": [
      { "title": "Cooking", "years": 5 },
      { "title": "English", "years": 3 },
      { "title": "Customer Service", "years": 4 }
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
  
  "job_context": {
    "job_id": "job-uuid",
    "job_title": "Chef - Dubai Restaurant",
    "job_company": "Luxury Hotels Group",
    "job_location": {
      "city": "Dubai",
      "country": "UAE"
    }
  },
  
  "application": {
    "id": "application-uuid",
    "position_id": "position-uuid",
    "position_title": "Chef",
    "status": "shortlisted",
    "created_at": "2025-11-20T10:30:00Z",
    "updated_at": "2025-11-25T14:20:00Z",
    "history": [
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
  
  "interview": {
    "id": "interview-uuid",
    "interview_date_ad": "2025-11-28T10:00:00Z",
    "interview_date_bs": "2082-08-13",
    "interview_time": "10:00 AM",
    "location": "Agency Office, Kathmandu",
    "contact_person": "HR Manager",
    "required_documents": ["Passport Copy", "Experience Certificate"],
    "notes": "Bring original documents for verification",
    "expenses": [
      {
        "expense_type": "travel",
        "who_pays": "candidate",
        "is_free": false,
        "amount": 500,
        "currency": "NPR",
        "refundable": true,
        "notes": "Bus fare to office"
      }
    ]
  },
  
  "documents": {
    "uploaded": [
      {
        "id": "doc-uuid",
        "type": "Passport",
        "name": "Passport.pdf",
        "url": "https://...",
        "file_type": "application/pdf",
        "file_size": 1234567,
        "verification_status": "pending",
        "uploaded_at": "2025-11-20T10:30:00Z"
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
}
```

---

## Comparison: Multiple Calls vs Unified Endpoint

### Current Approach (Multiple Calls)

```javascript
// 3 separate API calls
const candidate = await fetch(`/candidates/${id}`);
const profiles = await fetch(`/candidates/${id}/job-profiles`);
const documents = await fetch(`/candidates/${id}/documents`);

// Manual data combination
const fullDetails = {
  ...candidate,
  skills: profiles[0]?.profile_blob?.skills,
  // ... more mapping
};
```

**Pros**:
- ✅ Endpoints already exist
- ✅ No backend work needed
- ✅ Flexible (can fetch only what you need)

**Cons**:
- ❌ 3 separate network requests
- ❌ Slower (sequential or parallel fetching)
- ❌ More frontend code to combine data
- ❌ No job context included
- ❌ No application history included

### Proposed Approach (Unified Endpoint)

```javascript
// 1 API call
const fullDetails = await fetch(
  `/agencies/${license}/jobs/${jobId}/candidates/${candidateId}/details`
);

// Data is already combined and ready to use
setSelectedCandidate(fullDetails);
```

**Pros**:
- ✅ Single network request
- ✅ Faster response time
- ✅ Less frontend code
- ✅ Includes job context
- ✅ Includes application history
- ✅ Proper authorization
- ✅ Optimized database queries (can use joins)

**Cons**:
- ❌ Requires backend implementation (4-6 hours)
- ❌ Larger response payload
- ❌ Less flexible (always returns everything)

---

## Implementation Details

### Backend Implementation

**File**: `/src/modules/agency/job-candidates.controller.ts`

**Method**:
```typescript
@Get(':jobId/candidates/:candidateId/details')
@HttpCode(200)
@ApiOperation({
  summary: 'Get complete candidate details for a job application',
  description: 'Returns all candidate information in a single response: profile, job profile, application history, interview details, and documents'
})
async getCandidateFullDetails(
  @Param('license') license: string,
  @Param('jobId', ParseUUIDPipe) jobId: string,
  @Param('candidateId', ParseUUIDPipe) candidateId: string,
): Promise<CandidateFullDetailsDto> {
  // 1. Verify agency owns this job
  const job = await this.jobPostingService.findJobPostingById(jobId);
  const belongs = job.contracts?.some(c => c.agency?.license_number === license);
  if (!belongs) {
    throw new ForbiddenException('Cannot access job posting of another agency');
  }

  // 2. Fetch candidate basic info
  const candidate = await this.candidateService.findById(candidateId);
  if (!candidate) {
    throw new NotFoundException('Candidate not found');
  }

  // 3. Fetch job profile (most recent)
  const jobProfiles = await this.candidateService.listJobProfiles(candidateId);
  const profile = jobProfiles[0];

  // 4. Fetch application with history
  const application = await this.applicationService.getApplicationByJobAndCandidate(
    jobId, 
    candidateId
  );
  if (!application) {
    throw new NotFoundException('Application not found');
  }

  // 5. Fetch interview details (if exists)
  const interview = application.interview_details?.[0] || null;

  // 6. Fetch documents
  const documents = await this.candidateService.getDocumentsWithSlots(candidateId);

  // 7. Get job context
  const contract = job.contracts[0];
  const position = contract?.positions?.find(p => p.id === application.position_id);

  // 8. Combine and return
  return {
    candidate: {
      id: candidate.id,
      name: candidate.full_name,
      phone: candidate.phone,
      email: candidate.email,
      gender: candidate.gender,
      age: candidate.age,
      address: candidate.address,
      passport_number: candidate.passport_number,
      profile_image: candidate.profile_image,
      is_active: candidate.is_active,
    },
    job_profile: profile?.profile_blob || null,
    job_context: {
      job_id: job.id,
      job_title: job.posting_title,
      job_company: contract?.employer?.company_name || null,
      job_location: {
        city: job.city,
        country: job.country,
      },
    },
    application: {
      id: application.id,
      position_id: application.position_id,
      position_title: position?.title || null,
      status: application.status,
      created_at: application.created_at,
      updated_at: application.updated_at,
      history: application.history_blob,
    },
    interview: interview ? {
      id: interview.id,
      interview_date_ad: interview.interview_date_ad,
      interview_date_bs: interview.interview_date_bs,
      interview_time: interview.interview_time,
      location: interview.location,
      contact_person: interview.contact_person,
      required_documents: interview.required_documents,
      notes: interview.notes,
      expenses: interview.expenses || [],
    } : null,
    documents: {
      uploaded: documents.data
        .filter(slot => slot.document)
        .map(slot => ({
          id: slot.document.id,
          type: slot.document_type.name,
          name: slot.document.name,
          url: slot.document.document_url,
          file_type: slot.document.file_type,
          file_size: slot.document.file_size,
          verification_status: slot.document.verification_status,
          uploaded_at: slot.document.created_at,
        })),
      summary: documents.summary,
    },
  };
}
```

---

## Questions for Frontend Team

### 1. Do you prefer the unified endpoint?

**Option A**: Unified endpoint (1 API call)
- Faster, cleaner code
- Requires 4-6 hours backend work

**Option B**: Multiple endpoints (2-3 API calls)
- Available immediately
- More frontend code

### 2. Does the proposed response structure meet your needs?

Review the response structure above. Does it include everything you need?

**Missing anything?**
- Additional candidate fields?
- Different data format?
- Additional relationships?

### 3. Do you need the application history?

You mentioned "application workflow is already done in the frontend."

**Clarify**:
- ✅ Do you already have the history timeline?
- ✅ Or do you need it from the backend?

If you already have it, we can exclude `application.history` from the response to reduce payload size.

### 4. Do you need interview details?

**Clarify**:
- ✅ Do you need interview information in the candidate details?
- ✅ Or is it handled separately in your workflow?

### 5. Do you need documents in the same response?

**Clarify**:
- ✅ Include documents in unified response?
- ✅ Or keep documents as a separate call?

Documents can be large, so including them might slow down the response.

---

## Performance Considerations

### Response Size

**Estimated payload size**:
- Candidate info: ~1 KB
- Job profile: ~2-5 KB (depends on experience/skills)
- Application history: ~0.5-2 KB (depends on history length)
- Interview: ~0.5 KB
- Documents: ~1-10 KB (depends on number of documents)

**Total**: ~5-20 KB per candidate

**Acceptable?** Yes, for a detail view this is reasonable.

### Response Time

**Estimated response time**:
- Database queries: ~50-100ms (with proper indexes)
- Data transformation: ~10-20ms
- Network: ~50-200ms (depends on connection)

**Total**: ~110-320ms

**Comparison**:
- Multiple calls: 3 × (50-150ms) = 150-450ms (sequential)
- Multiple calls: max(50-150ms) = 50-150ms (parallel, but more complex)
- Unified call: 110-320ms

**Verdict**: Unified endpoint is comparable or faster, with simpler frontend code.

---

## Implementation Timeline

### Backend Work

| Task | Effort | Priority |
|------|--------|----------|
| Create unified endpoint | 2 hours | 🔴 Critical |
| Create response DTO | 1 hour | 🔴 Critical |
| Add service methods | 1 hour | 🔴 Critical |
| Write unit tests | 1.5 hours | 🟡 Medium |
| Update API documentation | 30 min | 🟡 Medium |
| **Total Backend** | **6 hours** | |

### Frontend Work

| Task | Effort | Priority |
|------|--------|----------|
| Update API client | 30 min | 🔴 Critical |
| Update component | 1 hour | 🔴 Critical |
| Test integration | 1 hour | 🔴 Critical |
| **Total Frontend** | **2.5 hours** | |

### Total Time: 8.5 hours (~1 business day)

---

## Alternative: Hybrid Approach

### Option C: Unified Endpoint + Optional Includes

```
GET /agencies/:license/jobs/:jobId/candidates/:candidateId/details?include=interview,documents
```

**Query Parameters**:
- `include` (optional): Comma-separated list of what to include
  - `interview` - Include interview details
  - `documents` - Include documents
  - `history` - Include application history

**Default** (no include parameter):
- Candidate basic info
- Job profile
- Job context
- Application status (without history)

**Benefits**:
- ✅ Flexible (frontend controls what to fetch)
- ✅ Smaller default payload
- ✅ Can expand as needed

**Example**:
```javascript
// Minimal (fast)
const details = await fetch(
  `/agencies/${license}/jobs/${jobId}/candidates/${candidateId}/details`
);

// Full details (slower but complete)
const fullDetails = await fetch(
  `/agencies/${license}/jobs/${jobId}/candidates/${candidateId}/details?include=interview,documents,history`
);
```

---

## Recommendation

### Backend Team Recommends: **Unified Endpoint (Option A)**

**Reasoning**:
1. **Better UX**: Single API call = faster perceived performance
2. **Cleaner Code**: Less frontend complexity
3. **Proper Authorization**: Agency-scoped endpoint ensures security
4. **Future-Proof**: Easy to add more fields later
5. **Optimized**: Can use database joins for better performance

**Trade-off**: Requires 1 day of backend work, but saves ongoing frontend maintenance.

---

## Next Steps

### Please Respond With:

**1. Endpoint Preference**:
- [ ] Option A: Unified endpoint (1 call, 1 day backend work)
- [ ] Option B: Multiple endpoints (2-3 calls, available now)
- [ ] Option C: Hybrid with optional includes

**2. Response Structure**:
- [ ] Proposed structure looks good
- [ ] Need modifications (please specify)

**3. Required Fields**:
- [ ] Include application history: Yes / No
- [ ] Include interview details: Yes / No
- [ ] Include documents: Yes / No

**4. Timeline**:
- [ ] Need it ASAP (use existing endpoints)
- [ ] Can wait 1 day (unified endpoint)
- [ ] Can wait longer (hybrid approach)

---

## Contact

Once we get your feedback, we can:
- **Option A/C**: Start implementation immediately (1 day)
- **Option B**: Provide integration guide (available now)

**Ready to proceed based on your preference!** 🚀

---

## Summary

| Approach | API Calls | Backend Work | Frontend Work | Available |
|----------|-----------|--------------|---------------|-----------|
| **Multiple Endpoints** | 2-3 | None | 3 hours | Now |
| **Unified Endpoint** | 1 | 6 hours | 2.5 hours | 1 day |
| **Hybrid Approach** | 1 | 8 hours | 3 hours | 1.5 days |

**Your choice!** Let us know what works best for your timeline and requirements.
