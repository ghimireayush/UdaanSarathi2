# Parameter Trace Analysis - Document Upload

## ⚠️ CRITICAL ISSUE FOUND

The document upload has **PARAMETER PASSING ISSUES**. Let me trace each parameter:

---

## 1. **Candidate ID** ✅ CORRECT

**Source:** `src/components/CandidateSummaryS2.jsx` line 587
```javascript
const cId = candidate?.candidate?.id || candidateId
```

**Flow:**
- Props received: `candidateId` from parent (WorkflowV2)
- Fallback: `candidate?.candidate?.id` from API response
- **Status:** ✅ Correctly extracted

**Used in:**
- Line 603: `uploadAgencyCandidateDocument(agencyData?.license, candidate?.job_posting?.id, cId, formData)`
- Line 606: `getCandidateDocuments(cId)`

---

## 2. **Agency License** ✅ CORRECT

**Source:** `src/components/CandidateSummaryS2.jsx` line 600
```javascript
agencyData?.license
```

**Flow:**
- From context: `const { agencyData } = useAgency()`
- **Status:** ✅ Correctly extracted from context

**Used in:**
- Line 600: `uploadAgencyCandidateDocument(agencyData?.license, ...)`

---

## 3. **Job Posting ID** ❌ **PROBLEM!**

**Source:** `src/components/CandidateSummaryS2.jsx` line 601
```javascript
candidate?.job_posting?.id
```

**The Issue:**
- The component loads data from: `/applications/${applicationId}/details`
- The API response structure is: `{ candidate: {...}, application: {...}, job: {...}, employer: {...}, ... }`
- **There is NO `job_posting` field in the response!**

**What's actually available:**
- `candidate.job?.id` - Job ID (if available)
- `candidate.job?.title` - Job title
- `candidate.application?.id` - Application ID

**Current Code (line 601):**
```javascript
candidate?.job_posting?.id  // ❌ This will be UNDEFINED!
```

**Should be:**
```javascript
candidate?.job?.id  // ✅ Correct field from API response
```

---

## 4. **Document Type ID** ✅ CORRECT

**Source:** `src/components/CandidateSummaryS2.jsx` line 1365
```javascript
onChange={(e) => handleDocumentUpload(e, slot.document_type?.id, slot.document_type?.name)}
```

**Flow:**
- From slot object in documents list
- `slot.document_type?.id` is passed as `documentTypeId`
- **Status:** ✅ Correctly extracted

---

## 5. **API Endpoint URL** ❌ **PROBLEM!**

**Current Implementation:**
```javascript
await DocumentDataSource.uploadAgencyCandidateDocument(
  agencyData?.license,           // ✅ Correct
  candidate?.job_posting?.id,    // ❌ UNDEFINED - should be candidate?.job?.id
  cId,                           // ✅ Correct
  formData
)
```

**DocumentDataSource Method (line 32-45):**
```javascript
async uploadAgencyCandidateDocument(agencyLicense, jobId, candidateId, formData) {
  return httpClient.upload(
    `/agencies/${agencyLicense}/jobs/${jobId}/candidates/${candidateId}/documents`,
    formData
  )
}
```

**Resulting URL:**
```
POST /agencies/{license}/jobs/undefined/candidates/{candidateId}/documents
                              ^^^^^^^^^ UNDEFINED!
```

**This will FAIL because jobId is undefined!**

---

## 6. **FormData** ✅ CORRECT

**Source:** `src/components/CandidateSummaryS2.jsx` lines 595-598
```javascript
const formData = new FormData()
formData.append('file', file)
formData.append('document_type_id', documentTypeId)
formData.append('name', file.name)
formData.append('notes', 'Uploaded by agency')
```

**Status:** ✅ Correctly created with all required fields

---

## Summary of Issues

| Parameter | Status | Issue | Fix |
|-----------|--------|-------|-----|
| Candidate ID | ✅ | None | - |
| Agency License | ✅ | None | - |
| **Job ID** | ❌ | Using `candidate?.job_posting?.id` (undefined) | Change to `candidate?.job?.id` |
| Document Type ID | ✅ | None | - |
| FormData | ✅ | None | - |

---

## The Fix Required

**File:** `src/components/CandidateSummaryS2.jsx`
**Line:** 601

**Change from:**
```javascript
await DocumentDataSource.uploadAgencyCandidateDocument(
  agencyData?.license,
  candidate?.job_posting?.id,  // ❌ WRONG
  cId,
  formData
)
```

**Change to:**
```javascript
await DocumentDataSource.uploadAgencyCandidateDocument(
  agencyData?.license,
  candidate?.job?.id,  // ✅ CORRECT
  cId,
  formData
)
```

---

## Verification

After the fix, the URL will be:
```
POST /agencies/{license}/jobs/{jobId}/candidates/{candidateId}/documents
```

Which matches the DocumentDataSource endpoint pattern and will work correctly.

---

## Additional Notes

The backup file (`CandidateSummaryS2.jsx.bak`) likely had the same issue or used a different API endpoint structure. The current implementation is trying to use the agency endpoint but with incorrect parameter mapping.

**Alternative:** If the job ID is not available in the response, consider using the application-based endpoint instead:
```javascript
await DocumentDataSource.uploadDocumentByApplication(applicationId, formData)
```

This endpoint doesn't require job ID and derives it from the application ID on the backend.
