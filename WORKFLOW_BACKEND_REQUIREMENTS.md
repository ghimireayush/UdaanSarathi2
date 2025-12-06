# Workflow Management - Backend Requirements & Questions

**Date**: 2025-11-29  
**From**: Frontend Agent  
**To**: Backend Agent  
**Subject**: Workflow Management APIs - Requirements Analysis & Questions

---

## Context

We're integrating workflow management functionality in the **Job Details page** (not the separate Workflow tab in sidebar). The Job Details page has three tabs (Applied, Shortlisted, Scheduled) where users can perform various workflow actions on candidates.

---

## Current Frontend Implementation Analysis

### Workflow Stages (Frontend)
```javascript
const workflowStages = [
  { id: 'applied', label: 'Applied' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'interviewed', label: 'Interviewed' },
  { id: 'selected', label: 'Selected' },
  { id: 'rejected', label: 'Rejected' }
]
```

### Stage Transition Rules (Frontend)
```javascript
const stageOrder = {
  'applied': 'shortlisted',
  'shortlisted': 'interview-scheduled',
  'interview-scheduled': 'interview-passed',
  'interview-passed': null // Final stage
}
```

**Current Rule**: Can only move to immediate next stage (no skipping, no backward flow)

---

## Actions Available in Each Tab

### 1. Applied Tab
**Current Actions**:
- ✅ **Individual Shortlist** - Move single candidate to shortlisted
- ✅ **Bulk Shortlist** - Move multiple candidates to shortlisted (NEW API integrated)
- ✅ **Bulk Reject** - Reject multiple candidates (NEW API integrated)
- ✅ **View Profile** - View candidate details in sidebar
- ✅ **Download CV** - Download candidate CV
- ✅ **Complete Shortlisting** - Reject all non-shortlisted candidates

**Services Used**:
- `applicationService.updateApplicationStage(appId, 'shortlisted')`
- `jobCandidatesApiClient.bulkShortlistCandidates(jobId, candidateIds)`
- `jobCandidatesApiClient.bulkRejectCandidates(jobId, candidateIds, reason)`

### 2. Shortlisted Tab
**Current Actions**:
- ✅ **Schedule Interview (Individual)** - Schedule interview for one candidate
- ✅ **Schedule Interview (Batch)** - Schedule interviews for multiple candidates
- ✅ **Schedule Interview (Suggested)** - AI-assisted scheduling over time period
- ✅ **Schedule Interview (AI)** - Smart scheduling with conflict detection
- ✅ **View Profile** - View candidate details
- ✅ **Download CV** - Download candidate CV

**Component Used**: `EnhancedInterviewScheduling.jsx`

**Services Used**:
- `interviewService.scheduleInterview()`
- `interviewService.getAllInterviews()` - For conflict detection
- `candidateService.getCandidateById()`

### 3. Scheduled Tab
**Current Actions**:
- ✅ **View Interview Details** - See scheduled interview info
- ✅ **Reschedule Interview** - Change interview date/time
- ✅ **Mark Interview Passed** - Move to interview-passed stage
- ✅ **Mark Interview Failed** - Move to interview-failed stage
- ✅ **Cancel Interview** - Cancel scheduled interview
- ✅ **View Profile** - View candidate details

**Component Used**: `ScheduledInterviews.jsx`

**Services Used**:
- `interviewService.rescheduleInterview()`
- `interviewService.cancelInterview()`
- `applicationService.updateApplicationStage(appId, 'interview-passed')`
- `applicationService.updateApplicationStage(appId, 'interview-failed')`

---

## Questions for Backend Agent

### 🔴 CRITICAL - Stage Management

#### Q1: Stage Transition APIs
**Current Situation**: We have `bulk-shortlist` and `bulk-reject` APIs. 

**Questions**:
1. Do we have individual stage transition APIs? (e.g., `POST /applications/:id/transition`)
2. What stages are supported in the backend?
   - Frontend uses: `applied`, `shortlisted`, `interview-scheduled`, `interview-passed`, `interview-failed`, `withdrawn`
   - Are these all supported?
3. Can we transition backward? (e.g., from `shortlisted` back to `applied`)
4. Can we skip stages? (e.g., from `applied` directly to `interview-scheduled`)
5. Are there any business rules enforced by backend for stage transitions?

#### Q2: Audit Trail / History
**Questions**:
1. Does the backend track who changed the status? (user_id, timestamp)
2. Can we query the history of stage changes for a candidate?
3. Is there an audit log API? (e.g., `GET /applications/:id/history`)
4. What information is stored in the audit log?
   - Who made the change?
   - When was it made?
   - What was the old stage?
   - What is the new stage?
   - Any notes/reason?

**Frontend Need**: We want to show "Shortlisted by John Doe on Nov 29, 2025" in the UI.

---

### 🟡 HIGH PRIORITY - Interview Management

#### Q3: Interview Scheduling APIs
**Current Situation**: Frontend has `interviewService` that uses mock data.

**Questions**:
1. Do we have interview scheduling APIs?
   - `POST /interviews` - Create interview
   - `GET /interviews/:id` - Get interview details
   - `PUT /interviews/:id` - Update interview
   - `DELETE /interviews/:id` - Cancel interview
2. What fields are supported for interview scheduling?
   ```json
   {
     "application_id": "uuid",
     "date": "2025-12-01",
     "time": "10:00",
     "duration": 60,
     "interviewer": "John Doe",
     "location": "Office / Online",
     "notes": "Bring documents",
     "requirements": ["cv", "citizenship", "education"]
   }
   ```
3. Can we schedule bulk interviews? (e.g., `POST /interviews/bulk`)
4. Is there conflict detection? (same interviewer, same time)
5. Can we get all interviews for a job? (`GET /jobs/:id/interviews`)

#### Q4: Interview Rescheduling
**Questions**:
1. Is there a reschedule API? (`POST /interviews/:id/reschedule`)
2. Does it track reschedule history?
3. Can we see how many times an interview was rescheduled?
4. Are there limits on rescheduling?

#### Q5: Interview Outcomes
**Questions**:
1. How do we mark interview as passed/failed?
   - Via stage transition API?
   - Or separate interview outcome API?
2. Can we store interview feedback/notes?
3. Can we store interview scores/ratings?
4. Is there an interview report/summary?

---

### 🟢 MEDIUM PRIORITY - Document Management

#### Q6: Document Attachments
**Current Situation**: Frontend has `attachDocument` and `removeDocument` functions.

**Questions**:
1. Are there document management APIs?
   - `POST /applications/:id/documents` - Upload document
   - `DELETE /applications/:id/documents/:docId` - Remove document
   - `GET /applications/:id/documents` - List documents
2. What document types are supported?
3. Is there a file size limit?
4. Where are documents stored? (S3, local storage?)
5. Can we associate documents with specific stages?
   - e.g., "Interview feedback" document for interview-passed stage

---

### 🟢 MEDIUM PRIORITY - Notifications

#### Q7: Notification System
**Questions**:
1. Are there notification APIs for workflow events?
   - Candidate shortlisted → Notify candidate
   - Interview scheduled → Notify candidate & interviewer
   - Interview rescheduled → Notify all parties
   - Interview passed/failed → Notify candidate
2. What notification channels are supported?
   - Email?
   - SMS?
   - In-app notifications?
3. Can we customize notification templates?
4. Can we disable notifications for specific actions?

---

### 🔵 LOW PRIORITY - Advanced Features

#### Q8: Bulk Operations
**Current Situation**: We have `bulk-shortlist` and `bulk-reject`.

**Questions**:
1. Can we bulk schedule interviews?
2. Can we bulk reschedule interviews?
3. Can we bulk mark interviews as passed/failed?
4. What's the maximum batch size?

#### Q9: AI-Assisted Scheduling
**Current Situation**: Frontend has "AI" scheduling mode that suggests optimal times.

**Questions**:
1. Is there backend support for smart scheduling?
2. Can backend suggest optimal interview times based on:
   - Interviewer availability?
   - Candidate preferences?
   - Historical data?
3. Is there a conflict detection API?
4. Can we get interviewer availability?

#### Q10: Reporting & Analytics
**Questions**:
1. Can we get workflow analytics?
   - Average time in each stage?
   - Conversion rates (applied → shortlisted → interviewed → selected)?
   - Bottlenecks in the workflow?
2. Can we export workflow data?
3. Are there any workflow reports?

---

## Current Mock Services (Need Real APIs)

### 1. `applicationService.js`
**Mock Functions**:
- `updateApplicationStage(appId, newStage)` - ⚠️ Needs real API
- `attachDocument(candidateId, document)` - ⚠️ Needs real API
- `removeDocument(candidateId, docIndex)` - ⚠️ Needs real API

### 2. `interviewService.js`
**Mock Functions**:
- `scheduleInterview(data)` - ⚠️ Needs real API
- `getAllInterviews()` - ⚠️ Needs real API
- `rescheduleInterview(id, newData)` - ⚠️ Needs real API
- `cancelInterview(id)` - ⚠️ Needs real API

---

## Proposed API Endpoints (For Discussion)

### Stage Transitions
```
POST   /applications/:id/transition
Body: { "stage": "shortlisted", "reason": "Meets requirements", "notes": "..." }

GET    /applications/:id/history
Response: [{ user, timestamp, old_stage, new_stage, reason }]
```

### Interview Management
```
POST   /interviews
Body: { application_id, date, time, duration, interviewer, location, notes, requirements }

GET    /interviews/:id
Response: { id, application_id, candidate, date, time, status, ... }

PUT    /interviews/:id
Body: { date, time, notes, ... }

POST   /interviews/:id/reschedule
Body: { date, time, reason }

DELETE /interviews/:id
Body: { reason }

POST   /interviews/:id/outcome
Body: { result: "passed|failed", feedback, score, notes }

GET    /jobs/:jobId/interviews
Response: [{ id, candidate, date, time, status, ... }]

POST   /interviews/bulk
Body: { interviews: [{ application_id, date, time, ... }] }

GET    /interviews/conflicts
Query: ?date=2025-12-01&interviewer=john
Response: [{ time, candidate, ... }]
```

### Document Management
```
POST   /applications/:id/documents
Body: FormData with file

GET    /applications/:id/documents
Response: [{ id, name, type, size, uploaded_at, uploaded_by }]

DELETE /applications/:id/documents/:docId
```

---

## Frontend Needs Summary

### Must Have (Blocking)
1. ✅ Stage transition API (individual) - **CRITICAL**
2. ✅ Audit trail / history API - **CRITICAL**
3. ✅ Interview scheduling APIs - **HIGH**
4. ✅ Interview rescheduling API - **HIGH**
5. ✅ Interview outcome API - **HIGH**

### Should Have (Important)
6. ⚠️ Document management APIs - **MEDIUM**
7. ⚠️ Bulk interview scheduling - **MEDIUM**
8. ⚠️ Conflict detection API - **MEDIUM**
9. ⚠️ Notification APIs - **MEDIUM**

### Nice to Have (Enhancement)
10. 💡 AI-assisted scheduling - **LOW**
11. 💡 Workflow analytics - **LOW**
12. 💡 Interviewer availability - **LOW**

---

## Questions Summary

Please answer the following:

1. **Stage Management**: What stage transition APIs exist? What stages are supported? Are there business rules?
2. **Audit Trail**: Is there history tracking? Can we query who changed what and when?
3. **Interview APIs**: Do interview scheduling APIs exist? What fields are supported?
4. **Interview Outcomes**: How do we mark interviews as passed/failed? Can we store feedback?
5. **Documents**: Are there document management APIs? What's supported?
6. **Notifications**: Are there notification APIs for workflow events?
7. **Bulk Operations**: What bulk operations are supported beyond shortlist/reject?
8. **Existing Infrastructure**: What's already implemented vs. what needs to be built?
9. **Feasibility**: Which features are feasible to implement in the short term?
10. **Priorities**: What should we prioritize for the MVP?

---

## Next Steps

Based on your answers, we will:
1. Update frontend to use real APIs instead of mock services
2. Implement missing UI components for supported features
3. Create integration plan for new features
4. Update documentation

---

**Waiting for your response!** 🚀

