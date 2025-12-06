# Workflow Integration - Implementation Specification

**Date**: 2025-11-29  
**Status**: 📋 **Ready for Implementation**

---

## Executive Summary

This specification details the complete integration of workflow management features with the backend APIs. Based on backend confirmation, we will replace all mock services with real API calls.

**Scope**:
- Replace mock application services with real APIs
- Replace mock interview services with real APIs  
- Add application history display
- Implement document view-only for admin
- Add duration field to interview scheduling (when backend ready)
- Implement bulk interview scheduling (when backend ready)

**Timeline**: 
- **Phase 1** (This Week): Replace mocks, add history, document viewing
- **Phase 2** (Next Week): Add duration field, bulk scheduling

---

## Phase 1: Immediate Implementation (This Week)

### Task 1: Create Real API Client Services

#### 1.1 Create Application API Client

**New File**: `src/services/applicationApiClient.js`

**Purpose**: Replace mock `applicationService` methods with real API calls

**Methods to Implement**:

```javascript
// src/services/applicationApiClient.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * Shortlist an application
 * @param {string} applicationId - Application ID
 * @param {string} note - Optional note
 * @param {string} updatedBy - User ID
 * @returns {Promise<Object>} Updated application
 */
export const shortlistApplication = async (applicationId, note = '', updatedBy = 'agency') => {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/shortlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ note, updatedBy })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to shortlist application')
  }
  
  return response.json()
}

/**
 * Withdraw/reject an application
 * @param {string} applicationId - Application ID
 * @param {string} note - Rejection reason
 * @param {string} updatedBy - User ID
 * @returns {Promise<Object>} Updated application
 */
export const withdrawApplication = async (applicationId, note = '', updatedBy = 'agency') => {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ note, updatedBy })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to withdraw application')
  }
  
  return response.json()
}

/**
 * Get application with history
 * @param {string} applicationId - Application ID
 * @returns {Promise<Object>} Application with history_blob
 */
export const getApplicationWithHistory = async (applicationId) => {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch application')
  }
  
  return response.json()
}
```

#### 1.2 Create Interview API Client

**New File**: `src/services/interviewApiClient.js`

**Purpose**: Replace mock `interviewService` methods with real API calls

**Methods to Implement**:

```javascript
// src/services/interviewApiClient.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * Schedule an interview
 * @param {string} applicationId - Application ID
 * @param {Object} interviewData - Interview details
 * @returns {Promise<Object>} Created interview
 */
export const scheduleInterview = async (applicationId, interviewData) => {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/schedule-interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      interview_date_ad: interviewData.date,
      interview_time: interviewData.time,
      location: interviewData.location,
      contact_person: interviewData.interviewer, // Map interviewer to contact_person
      required_documents: interviewData.requirements || [],
      notes: interviewData.notes,
      updatedBy: interviewData.updatedBy || 'agency'
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to schedule interview')
  }
  
  return response.json()
}

/**
 * Reschedule an interview
 * @param {string} applicationId - Application ID
 * @param {string} interviewId - Interview ID
 * @param {Object} updates - Updated interview details
 * @returns {Promise<Object>} Updated interview
 */
export const rescheduleInterview = async (applicationId, interviewId, updates) => {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/reschedule-interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      interview_id: interviewId,
      interview_date_ad: updates.date,
      interview_time: updates.time,
      location: updates.location,
      contact_person: updates.interviewer,
      required_documents: updates.requirements,
      notes: updates.notes,
      updatedBy: updates.updatedBy || 'agency'
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to reschedule interview')
  }
  
  return response.json()
}

/**
 * Complete an interview (mark as passed/failed)
 * @param {string} applicationId - Application ID
 * @param {string} result - "passed" or "failed"
 * @param {string} note - Optional feedback/notes
 * @returns {Promise<Object>} Updated application
 */
export const completeInterview = async (applicationId, result, note = '') => {
  const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/complete-interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({
      result, // "passed" or "failed"
      note,
      updatedBy: 'agency'
    })
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to complete interview')
  }
  
  return response.json()
}

/**
 * Get interviews for candidates
 * @param {Array<string>} candidateIds - Array of candidate IDs
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of interviews
 */
export const getInterviews = async (candidateIds, options = {}) => {
  const params = new URLSearchParams({
    candidate_ids: candidateIds.join(','),
    page: options.page || 1,
    limit: options.limit || 10,
    only_upcoming: options.onlyUpcoming || false,
    order: options.order || 'upcoming'
  })
  
  const response = await fetch(`${API_BASE_URL}/interviews?${params}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch interviews')
  }
  
  return response.json()
}
```

#### 1.3 Create Document API Client

**New File**: `src/services/documentApiClient.js`

**Purpose**: View candidate documents (read-only for admin)

**Methods to Implement**:

```javascript
// src/services/documentApiClient.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

/**
 * Get candidate documents (read-only for admin)
 * @param {string} candidateId - Candidate ID
 * @returns {Promise<Object>} Documents with slots and summary
 */
export const getCandidateDocuments = async (candidateId) => {
  const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/documents`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to fetch documents')
  }
  
  return response.json()
}
```

---

### Task 2: Update JobDetails Component

**File**: `src/pages/JobDetails.jsx`

**Changes Required**:

#### 2.1 Import New API Clients

```javascript
// Add these imports at the top
import * as applicationApiClient from '../services/applicationApiClient'
import * as interviewApiClient from '../services/interviewApiClient'
```

#### 2.2 Replace Mock Shortlist Handler

**Find**:
```javascript
const handleShortlist = async (candidateId) => {
  // Current mock implementation
  await applicationService.updateApplicationStage(appId, 'shortlisted')
}
```

**Replace with**:
```javascript
const handleShortlist = async (candidateId) => {
  try {
    setLoading(true)
    
    // Find application ID for this candidate
    const candidate = candidates.find(c => c.id === candidateId)
    if (!candidate?.application?.id) {
      throw new Error('Application not found')
    }
    
    // Call real API
    await applicationApiClient.shortlistApplication(
      candidate.application.id,
      'Shortlisted from job details',
      currentUser?.id || 'agency'
    )
    
    // Show success message
    toast.success('Candidate shortlisted successfully')
    
    // Refresh data
    await loadJobDetails()
    
  } catch (error) {
    console.error('Failed to shortlist candidate:', error)
    toast.error(error.message || 'Failed to shortlist candidate')
  } finally {
    setLoading(false)
  }
}
```

#### 2.3 Update Bulk Shortlist Handler

**Find**:
```javascript
const handleBulkShortlist = async () => {
  // Uses jobCandidatesApiClient.bulkShortlistCandidates
}
```

**Keep as-is** - This already uses the real API!

#### 2.4 Update Bulk Reject Handler

**Find**:
```javascript
const handleBulkReject = async () => {
  // Uses jobCandidatesApiClient.bulkRejectCandidates
}
```

**Keep as-is** - This already uses the real API!

---

### Task 3: Update Interview Scheduling Components

#### 3.1 Update EnhancedInterviewScheduling Component

**File**: `src/components/EnhancedInterviewScheduling.jsx`

**Changes Required**:

**Import new API client**:
```javascript
import * as interviewApiClient from '../services/interviewApiClient'
```

**Replace mock scheduleInterview calls**:

**Find**:
```javascript
await interviewService.scheduleInterview(interviewData)
```

**Replace with**:
```javascript
// For individual scheduling
await interviewApiClient.scheduleInterview(candidate.application.id, {
  date: formData.date,
  time: formData.time,
  interviewer: formData.interviewer,
  location: formData.location,
  requirements: formData.requirements,
  notes: formData.notes
})

// For batch scheduling (loop through candidates)
for (const candidate of selectedCandidates) {
  try {
    await interviewApiClient.scheduleInterview(candidate.application.id, {
      date: formData.date,
      time: formData.time,
      interviewer: formData.interviewer,
      location: formData.location,
      requirements: formData.requirements,
      notes: formData.notes
    })
    successCount++
  } catch (error) {
    console.error(`Failed to schedule for ${candidate.name}:`, error)
    failedCandidates.push(candidate.name)
  }
}
```

#### 3.2 Update ScheduledInterviews Component

**File**: `src/components/ScheduledInterviews.jsx`

**Changes Required**:

**Import new API client**:
```javascript
import * as interviewApiClient from '../services/interviewApiClient'
```

**Replace reschedule handler**:

**Find**:
```javascript
await interviewService.rescheduleInterview(interviewId, newDateTime)
```

**Replace with**:
```javascript
await interviewApiClient.rescheduleInterview(
  candidate.application.id,
  interview.id,
  {
    date: newDate,
    time: newTime,
    interviewer: interview.contact_person,
    location: interview.location,
    requirements: interview.required_documents,
    notes: rescheduleReason
  }
)
```

**Replace mark as passed/failed handlers**:

**Find**:
```javascript
await applicationService.updateApplicationStage(appId, 'interview-passed')
```

**Replace with**:
```javascript
await interviewApiClient.completeInterview(
  candidate.application.id,
  'passed',
  feedback
)
```

**Find**:
```javascript
await applicationService.updateApplicationStage(appId, 'interview-failed')
```

**Replace with**:
```javascript
await interviewApiClient.completeInterview(
  candidate.application.id,
  'failed',
  feedback
)
```

---

### Task 4: Add Application History Display

#### 4.1 Create History Timeline Component

**New File**: `src/components/ApplicationHistory.jsx`

```javascript
import React from 'react'
import { format } from 'date-fns'

const ApplicationHistory = ({ historyBlob }) => {
  if (!historyBlob || historyBlob.length === 0) {
    return (
      <div className="text-gray-500 text-sm">
        No history available
      </div>
    )
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      'applied': 'bg-blue-100 text-blue-800',
      'shortlisted': 'bg-green-100 text-green-800',
      'interview_scheduled': 'bg-purple-100 text-purple-800',
      'interview_rescheduled': 'bg-yellow-100 text-yellow-800',
      'interview_passed': 'bg-green-100 text-green-800',
      'interview_failed': 'bg-red-100 text-red-800',
      'withdrawn': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Application History</h3>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {/* History entries */}
        <div className="space-y-6">
          {historyBlob.map((entry, index) => (
            <div key={index} className="relative flex items-start space-x-4">
              {/* Timeline dot */}
              <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-300 rounded-full">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              </div>
              
              {/* Entry content */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(entry.next_status)}`}>
                    {formatStatus(entry.next_status)}
                  </span>
                  {entry.corrected && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      Corrected
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600">
                  <span className="font-medium">by {entry.updated_by || 'System'}</span>
                  <span className="mx-1">•</span>
                  <span>{format(new Date(entry.updated_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                
                {entry.note && (
                  <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                    {entry.note}
                  </div>
                )}
                
                {entry.prev_status && (
                  <div className="mt-1 text-xs text-gray-500">
                    Changed from: {formatStatus(entry.prev_status)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ApplicationHistory
```

#### 4.2 Add History to Candidate Sidebar

**File**: `src/components/CandidateSummaryS2.jsx`

**Add import**:
```javascript
import ApplicationHistory from './ApplicationHistory'
```

**Add history section** (after candidate details, before documents):
```javascript
{/* Application History */}
{candidate.application?.history_blob && (
  <div className="border-t border-gray-200 pt-4 mt-4">
    <ApplicationHistory historyBlob={candidate.application.history_blob} />
  </div>
)}
```

---

### Task 5: Implement Document View-Only

#### 5.1 Update CandidateSummaryS2 Component

**File**: `src/components/CandidateSummaryS2.jsx`

**Add import**:
```javascript
import * as documentApiClient from '../services/documentApiClient'
import { useState, useEffect } from 'react'
```

**Add state for documents**:
```javascript
const [documents, setDocuments] = useState(null)
const [loadingDocuments, setLoadingDocuments] = useState(false)
```

**Add function to load documents**:
```javascript
const loadDocuments = async () => {
  if (!candidate?.id) return
  
  try {
    setLoadingDocuments(true)
    const docs = await documentApiClient.getCandidateDocuments(candidate.id)
    setDocuments(docs)
  } catch (error) {
    console.error('Failed to load documents:', error)
    toast.error('Failed to load documents')
  } finally {
    setLoadingDocuments(false)
  }
}

useEffect(() => {
  if (candidate?.id) {
    loadDocuments()
  }
}, [candidate?.id])
```

**Add documents display section**:
```javascript
{/* Documents Section (View Only) */}
<div className="border-t border-gray-200 pt-4 mt-4">
  <h3 className="text-lg font-semibold text-gray-900 mb-3">
    Documents (View Only)
  </h3>
  
  {loadingDocuments ? (
    <div className="text-center py-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>
  ) : documents ? (
    <div className="space-y-3">
      {documents.slots.map((slot) => (
        <div 
          key={slot.document_type_id} 
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">
                {slot.document_type_name}
              </span>
              {slot.is_required && (
                <span className="text-xs text-red-600">Required</span>
              )}
            </div>
            
            {slot.uploaded && slot.document ? (
              <div className="mt-1 space-y-1">
                <div className="text-sm text-gray-600">
                  {slot.document.name}
                </div>
                <div className="text-xs text-gray-500">
                  {(slot.document.file_size / 1024).toFixed(2)} KB • 
                  {slot.document.file_type} •
                  Uploaded {format(new Date(slot.document.created_at), 'MMM dd, yyyy')}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    slot.document.verification_status === 'approved' ? 'bg-green-100 text-green-800' :
                    slot.document.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {slot.document.verification_status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-1 text-sm text-gray-500">
                Not uploaded
              </div>
            )}
          </div>
          
          {slot.uploaded && slot.document && (
            <a
              href={slot.document.document_url}
              download
              className="ml-4 inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          )}
        </div>
      ))}
      
      {/* Summary */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-gray-700">
          <strong>{documents.summary.uploaded_count}</strong> of <strong>{documents.summary.total_slots}</strong> documents uploaded
          {documents.summary.required_count > 0 && (
            <span className="ml-2">
              (<strong>{documents.summary.required_uploaded}</strong> of <strong>{documents.summary.required_count}</strong> required)
            </span>
          )}
        </div>
      </div>
    </div>
  ) : (
    <div className="text-gray-500 text-sm">
      No documents available
    </div>
  )}
</div>
```

---

## Phase 2: When Backend Ready (Next Week)

### Task 6: Add Duration Field to Interview Scheduling

**Wait for**: Backend to add `duration_minutes` field to schema

**File**: `src/components/EnhancedInterviewScheduling.jsx`

**Changes**:

1. Add duration field to form state:
```javascript
const [formData, setFormData] = useState({
  date: '',
  time: '',
  duration: 60, // NEW - default 60 minutes
  interviewer: '',
  location: '',
  requirements: [],
  notes: ''
})
```

2. Add duration input to form:
```javascript
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Duration (minutes)
  </label>
  <input
    type="number"
    min="15"
    step="15"
    value={formData.duration}
    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
    className="w-full px-3 py-2 border border-gray-300 rounded-md"
  />
  <p className="mt-1 text-xs text-gray-500">
    Interview duration in minutes (default: 60)
  </p>
</div>
```

3. Update API call to include duration:
```javascript
await interviewApiClient.scheduleInterview(candidate.application.id, {
  date: formData.date,
  time: formData.time,
  duration_minutes: formData.duration, // NEW
  interviewer: formData.interviewer,
  location: formData.location,
  requirements: formData.requirements,
  notes: formData.notes
})
```

---

### Task 7: Implement Bulk Interview Scheduling

**Wait for**: Backend to implement `POST /agencies/:license/jobs/:jobId/candidates/bulk-schedule-interview`

**File**: `src/services/interviewApiClient.js`

**Add new method**:
```javascript
/**
 * Bulk schedule interviews
 * @param {string} license - Agency license
 * @param {string} jobId - Job ID
 * @param {Array<string>} candidateIds - Array of candidate IDs
 * @param {Object} interviewData - Interview details
 * @returns {Promise<Object>} Bulk operation result
 */
export const bulkScheduleInterviews = async (license, jobId, candidateIds, interviewData) => {
  const response = await fetch(
    `${API_BASE_URL}/agencies/${license}/jobs/${jobId}/candidates/bulk-schedule-interview`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        candidate_ids: candidateIds,
        interview_date_ad: interviewData.date,
        interview_time: interviewData.time,
        duration_minutes: interviewData.duration || 60,
        location: interviewData.location,
        contact_person: interviewData.interviewer,
        required_documents: interviewData.requirements || [],
        notes: interviewData.notes,
        updatedBy: 'agency'
      })
    }
  )
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to bulk schedule interviews')
  }
  
  return response.json()
}
```

**File**: `src/components/EnhancedInterviewScheduling.jsx`

**Update batch scheduling handler**:

**Replace loop with bulk API call**:
```javascript
// OLD - Loop through candidates
for (const candidate of selectedCandidates) {
  await interviewApiClient.scheduleInterview(...)
}

// NEW - Use bulk endpoint
const result = await interviewApiClient.bulkScheduleInterviews(
  agencyLicense,
  jobId,
  selectedCandidates.map(c => c.id),
  {
    date: formData.date,
    time: formData.time,
    duration: formData.duration,
    interviewer: formData.interviewer,
    location: formData.location,
    requirements: formData.requirements,
    notes: formData.notes
  }
)

// Show results
toast.success(`Scheduled ${result.scheduled_count} interviews`)
if (result.failed && result.failed.length > 0) {
  toast.warning(`Failed to schedule ${result.failed.length} interviews`)
  console.error('Failed candidates:', result.errors)
}
```

---

## Testing Checklist

### Phase 1 Testing

- [ ] Individual shortlist works with real API
- [ ] Bulk shortlist works (already integrated)
- [ ] Bulk reject works (already integrated)
- [ ] Individual interview scheduling works
- [ ] Interview rescheduling works
- [ ] Mark interview as passed works
- [ ] Mark interview as failed works
- [ ] Application history displays correctly
- [ ] History shows correct user and timestamp
- [ ] History shows notes/reasons
- [ ] Documents load correctly
- [ ] Documents show correct status
- [ ] Document download works
- [ ] Error handling works for all operations
- [ ] Loading states display correctly
- [ ] Success/error toasts show

### Phase 2 Testing (When Backend Ready)

- [ ] Duration field appears in interview form
- [ ] Duration defaults to 60 minutes
- [ ] Duration is sent to backend correctly
- [ ] Bulk interview scheduling works
- [ ] Bulk scheduling shows progress
- [ ] Bulk scheduling handles partial failures
- [ ] Bulk scheduling shows detailed results

---

## Error Handling Strategy

### API Error Handling

All API calls should follow this pattern:

```javascript
try {
  setLoading(true)
  const result = await apiClient.someMethod(...)
  toast.success('Operation successful')
  await refreshData()
} catch (error) {
  console.error('Operation failed:', error)
  toast.error(error.message || 'Operation failed')
} finally {
  setLoading(false)
}
```

### Validation Before API Calls

```javascript
// Validate required fields
if (!formData.date || !formData.time) {
  toast.error('Please fill in all required fields')
  return
}

// Validate data format
if (!isValidDate(formData.date)) {
  toast.error('Invalid date format')
  return
}

// Then make API call
```

---

## Performance Considerations

### Minimize API Calls

- Cache application history (don't refetch on every render)
- Batch operations when possible
- Use debouncing for search/filter operations

### Loading States

- Show loading spinners for async operations
- Disable buttons during operations
- Show progress for bulk operations

### Error Recovery

- Retry failed operations (with exponential backoff)
- Show clear error messages
- Allow users to retry manually

---

## Success Criteria

### Phase 1 Complete When:
1. ✅ All mock services replaced with real APIs
2. ✅ Application history displays correctly
3. ✅ Documents view-only works
4. ✅ All workflows tested end-to-end
5. ✅ Error handling works correctly
6. ✅ Loading states implemented

### Phase 2 Complete When:
1. ✅ Duration field added and working
2. ✅ Bulk interview scheduling implemented
3. ✅ All features tested with real backend

---

## Timeline

**Week 1** (Phase 1):
- Day 1-2: Create API clients, update JobDetails
- Day 3-4: Update interview components, add history
- Day 5: Add document viewing, testing

**Week 2** (Phase 2):
- Day 1-2: Add duration field (when backend ready)
- Day 3-4: Implement bulk scheduling (when backend ready)
- Day 5: Final testing and polish

---

## Next Steps

1. ✅ Review this specification
2. ✅ Confirm approach with team
3. ✅ Start Phase 1 implementation
4. ✅ Test each feature as implemented
5. ⏳ Wait for backend Phase 2 features
6. ✅ Implement Phase 2 when ready

**Ready to start implementation!** 🚀
