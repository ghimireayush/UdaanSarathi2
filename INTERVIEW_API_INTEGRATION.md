# Interview API Integration - Pass/Fail/Reschedule

## Overview
This document describes how the frontend integrates with the backend APIs for interview management actions (Pass, Fail, Reschedule).

## Architecture

```
User Action (Button Click)
    ↓
CandidateSummaryS2 Component
    ↓
handleStatusUpdate() / InterviewDataSource
    ↓
Parent Component (JobDetails, ScheduledInterviews, etc.)
    ↓
applicationService.updateApplicationStage()
    ↓
InterviewDataSource / ApplicationDataSource
    ↓
Backend API Endpoints
```

## API Endpoints

### 1. Complete Interview (Pass/Fail)

**Endpoint**: `POST /applications/:id/complete-interview`

**Backend File**: `src/modules/application/application.controller.ts` (Line 193)

**Request Payload**:
```json
{
  "result": "passed" | "failed",
  "note": "Optional feedback or notes",
  "updatedBy": "agency"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "app_123",
    "status": "interview_passed" | "interview_failed",
    "interview": {
      "id": "interview_456",
      "result": "passed" | "failed",
      "completed_at": "2025-12-03T10:30:00Z",
      "notes": "Optional feedback or notes"
    },
    "updated_at": "2025-12-03T10:30:00Z"
  }
}
```

**Frontend Implementation**:
```javascript
// In InterviewDataSource.js
async completeInterview(applicationId, result, note = '') {
  return httpClient.post(`/applications/${applicationId}/complete-interview`, {
    result,
    note,
    updatedBy: 'agency'
  })
}

// In applicationService.js
case 'interview-passed':
  result = await InterviewDataSource.completeInterview(
    applicationId, 
    'passed', 
    'Interview passed via agency workflow'
  )
  break
  
case 'interview-failed':
  result = await InterviewDataSource.completeInterview(
    applicationId, 
    'failed', 
    'Interview failed via agency workflow'
  )
  break
```

---

### 2. Reschedule Interview

**Endpoint**: `POST /applications/:id/reschedule-interview`

**Backend File**: `src/modules/application/application.controller.ts` (Line 148)

**Request Payload**:
```json
{
  "interview_id": "interview_456",
  "interview_date_ad": "2025-12-05",
  "interview_time": "14:00",
  "duration_minutes": 60,
  "location": "Office",
  "contact_person": "John Doe",
  "required_documents": ["cv", "passport"],
  "notes": "Rescheduled due to candidate request",
  "updatedBy": "agency"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "app_123",
    "status": "interview_rescheduled",
    "interview": {
      "id": "interview_456",
      "scheduled_at": "2025-12-05T14:00:00Z",
      "duration": 60,
      "location": "Office",
      "contact_person": "John Doe",
      "required_documents": ["cv", "passport"],
      "notes": "Rescheduled due to candidate request",
      "rescheduled_at": "2025-12-03T10:30:00Z",
      "rescheduled_count": 1
    },
    "updated_at": "2025-12-03T10:30:00Z"
  }
}
```

**Frontend Implementation**:
```javascript
// In InterviewDataSource.js
async rescheduleInterview(applicationId, interviewId, updates) {
  return httpClient.post(`/applications/${applicationId}/reschedule-interview`, {
    interview_id: interviewId,
    interview_date_ad: updates.date,
    interview_time: updates.time,
    duration_minutes: updates.duration,
    location: updates.location,
    contact_person: updates.interviewer,
    required_documents: updates.requirements,
    notes: updates.notes,
    updatedBy: updates.updatedBy || 'agency'
  })
}

// In CandidateSummaryS2.jsx (Reschedule Modal)
await InterviewDataSource.rescheduleInterview(
  applicationId,
  interviewId,
  {
    date: rescheduleData.date,
    time: rescheduleData.time,
    duration: candidateData.interview?.duration || 60,
    location: candidateData.interview?.location || 'Office',
    interviewer: candidateData.interview?.interviewer || '',
    notes: `Rescheduled from ${candidateData.interview?.scheduled_at}`
  }
)
```

---

## Data Flow

### Pass Button Flow

```
1. User clicks "Pass" button
   ↓
2. CandidateSummaryS2.handleStatusUpdate('interview-passed')
   ↓
3. Validation: validateStageTransition('interview-scheduled', 'interview-passed') → true
   ↓
4. Show confirmation dialog
   ↓
5. User confirms
   ↓
6. Call onUpdateStatus(applicationId, 'interview-passed')
   ↓
7. Parent's handleUpdateStatus() calls applicationService.updateApplicationStage()
   ↓
8. applicationService detects 'interview-passed' stage
   ↓
9. Calls InterviewDataSource.completeInterview(applicationId, 'passed', ...)
   ↓
10. HTTP POST to /applications/:id/complete-interview
   ↓
11. Backend updates application status to 'interview_passed'
   ↓
12. Backend updates interview record with result='passed'
   ↓
13. Response returned to frontend
   ↓
14. Parent component reloads data
   ↓
15. Sidebar closes
   ↓
16. UI updates to show new stage
```

### Fail Button Flow

Same as Pass button flow, but with:
- Stage: `'interview-failed'`
- Result: `'failed'`
- Backend status: `'interview_failed'`

### Reschedule Button Flow

```
1. User clicks "Reschedule" button
   ↓
2. CandidateSummaryS2 sets interviewActionType='reschedule'
   ↓
3. Reschedule modal opens
   ↓
4. User enters new date and time
   ↓
5. User clicks "Confirm Reschedule"
   ↓
6. Extract applicationId and interviewId from candidateData
   ↓
7. Call InterviewDataSource.rescheduleInterview(applicationId, interviewId, {...})
   ↓
8. HTTP POST to /applications/:id/reschedule-interview
   ↓
9. Backend updates interview scheduled_at, rescheduled_at, rescheduled_count
   ↓
10. Backend updates application status to 'interview_rescheduled'
   ↓
11. Response returned to frontend
   ↓
12. Show success message
   ↓
13. Close modal
   ↓
14. Close sidebar (triggers parent refresh)
   ↓
15. UI updates to show new interview date
```

---

## Error Handling

### Frontend Error Handling

```javascript
try {
  await InterviewDataSource.completeInterview(applicationId, 'passed', note)
  // Success handling
} catch (error) {
  console.error('Failed to complete interview:', error)
  await confirm({
    title: 'Error',
    message: `Failed to update interview: ${error.message}`,
    confirmText: 'OK',
    type: 'danger'
  })
}
```

### Common Error Scenarios

1. **Network Error**: Backend server is down
   - Error: `Failed to fetch` or `Network request failed`
   - Handling: Show error dialog, keep sidebar open

2. **Validation Error**: Missing required fields
   - Error: `Missing application or interview ID`
   - Handling: Show error dialog, keep modal open

3. **Authorization Error**: User not authorized
   - Error: `401 Unauthorized`
   - Handling: Redirect to login page

4. **Not Found Error**: Application or interview not found
   - Error: `404 Not Found`
   - Handling: Show error dialog, close sidebar

5. **Server Error**: Backend processing error
   - Error: `500 Internal Server Error`
   - Handling: Show error dialog with retry option

---

## State Management

### Component State

```javascript
// CandidateSummaryS2.jsx
const [isUpdating, setIsUpdating] = useState(false)
const [isProcessingInterview, setIsProcessingInterview] = useState(false)
const [interviewActionType, setInterviewActionType] = useState('') // '', 'reschedule', 'reject'
const [rescheduleData, setRescheduleData] = useState({ date: '', time: '' })
```

### Loading States

- `isUpdating`: True during Pass/Fail API calls
- `isProcessingInterview`: True during Reschedule API calls
- Buttons are disabled during loading states
- Loading indicators are shown

### Data Refresh

After successful actions:
1. Close sidebar (`onClose()`)
2. Parent component's `loadAllData()` is triggered
3. Fresh data is fetched from backend
4. UI updates with new data

---

## Backend Status Mapping

### Frontend Stage → Backend Status

| Frontend Stage | Backend Status | API Endpoint |
|---------------|----------------|--------------|
| `interview-scheduled` | `interview_scheduled` | N/A (current state) |
| `interview-passed` | `interview_passed` | `/complete-interview` |
| `interview-failed` | `interview_failed` | `/complete-interview` |
| `interview-rescheduled` | `interview_rescheduled` | `/reschedule-interview` |

### Backend Status → Frontend Stage

The reverse mapping is handled in `getCandidateData()`:

```javascript
const stageMap = {
  'applied': 'applied',
  'shortlisted': 'shortlisted',
  'interview_scheduled': 'interview-scheduled',
  'interview_rescheduled': 'interview-scheduled',
  'interview_passed': 'interview-passed',
  'interview_failed': 'interview-failed'
}
```

---

## Testing with API Tracer

The API tracer tool at port 9000 can be used to verify endpoints:

```bash
# List all interview-related endpoints
curl http://localhost:9000/endpoints | jq '.data[] | select(.path | contains("interview"))'

# Check complete-interview endpoint
curl http://localhost:9000/endpoints | jq '.data[] | select(.path | contains("complete-interview"))'

# Check reschedule-interview endpoint
curl http://localhost:9000/endpoints | jq '.data[] | select(.path | contains("reschedule-interview"))'
```

**Expected Output**:
```json
{
  "id": "endpoint-96",
  "projectId": "project-0",
  "path": "/applications/:id/complete-interview",
  "method": "POST",
  "file": "src/modules/application/application.controller.ts",
  "line": 193,
  "type": "backend"
}

{
  "id": "endpoint-95",
  "projectId": "project-0",
  "path": "/applications/:id/reschedule-interview",
  "method": "POST",
  "file": "src/modules/application/application.controller.ts",
  "line": 148,
  "type": "backend"
}
```

---

## Security Considerations

1. **Authentication**: All API calls include authentication token from localStorage
2. **Authorization**: Backend verifies user has permission to update applications
3. **Validation**: Backend validates all input data
4. **Audit Trail**: All actions are logged in audit system
5. **Rate Limiting**: Backend may implement rate limiting for API calls

---

## Performance Considerations

1. **Debouncing**: Buttons are disabled during API calls to prevent duplicate requests
2. **Optimistic Updates**: UI could be updated optimistically before API response (not currently implemented)
3. **Caching**: Parent component caches candidate data to reduce API calls
4. **Lazy Loading**: Documents are loaded separately when sidebar opens

---

## Future Enhancements

1. **Bulk Actions**: Support for marking multiple interviews as passed/failed
2. **Undo Functionality**: Allow users to undo recent actions
3. **Optimistic Updates**: Update UI immediately, rollback on error
4. **Real-time Updates**: WebSocket notifications for interview status changes
5. **Email Notifications**: Automatic emails to candidates on status changes
6. **SMS Reminders**: Send SMS reminders before rescheduled interviews
7. **Calendar Integration**: Sync rescheduled interviews with calendar apps
8. **Interview Feedback**: Rich text editor for detailed interview feedback
9. **Video Interview**: Integration with video conferencing platforms
10. **Interview Scoring**: Structured scoring system for interviews

---

## Troubleshooting

### Issue: Pass/Fail buttons not visible
**Solution**: Verify candidate is in "Interview Scheduled" stage

### Issue: Reschedule button not working
**Solution**: Check that `interviewActionType` state is being set correctly

### Issue: API calls failing
**Solution**: 
1. Check backend server is running
2. Verify authentication token is valid
3. Check network tab for error details
4. Verify application and interview IDs are correct

### Issue: Data not refreshing after action
**Solution**: Verify parent component's `loadAllData()` is being called

### Issue: Modal not closing
**Solution**: Check that `setInterviewActionType('')` is being called after success

---

## References

- Backend API Documentation: `BACKEND_API_QUICK_REFERENCE.md`
- Frontend Service Layer: `src/services/applicationService.js`
- Data Source Layer: `src/api/datasources/InterviewDataSource.js`
- Component: `src/components/CandidateSummaryS2.jsx`
- API Tracer: `http://localhost:9000`
