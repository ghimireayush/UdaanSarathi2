# Candidate Summary S2 - Pass/Fail/Reschedule Buttons Fix

## Issue Summary
The Pass, Fail, and Reschedule buttons in the CandidateSummaryS2 component were not calling the real backend APIs. The Shortlist button was recently updated to work, but the interview-related buttons needed similar fixes.

## Root Cause
1. **Pass/Fail buttons**: Were calling `handleStatusUpdate` which goes through stage validation that was blocking the transition from `interview-scheduled` to `interview-passed`/`interview-failed`
2. **Reschedule button**: Was calling `onReschedule` prop (which may not be passed) instead of opening the built-in reschedule modal and calling the API

## Changes Made

### 1. Fixed Stage Validation (`validateStageTransition`)
**File**: `src/components/CandidateSummaryS2.jsx`

Added special case to allow Pass/Fail transitions from interview-scheduled stage:

```javascript
const validateStageTransition = (currentStage, targetStage) => {
  // Allow pass/fail from interview-scheduled stage
  if (currentStage === 'interview-scheduled' && 
      (targetStage === 'interview-passed' || targetStage === 'interview-failed')) {
    return true
  }
  
  // Strict progression: allow only immediate next stage
  const nextAllowed = getNextAllowedStage(currentStage)
  return targetStage === nextAllowed
}
```

### 2. Fixed Reschedule Button
**File**: `src/components/CandidateSummaryS2.jsx`

Changed the reschedule button to open the built-in modal instead of calling a prop:

```javascript
<button
  onClick={() => {
    setInterviewActionType('reschedule')
  }}
  className="text-xs px-3 py-2 rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
  title="Open reschedule dialog"
>
  Reschedule
</button>
```

### 3. Wired Up Reschedule Modal to API
**File**: `src/components/CandidateSummaryS2.jsx`

Updated the "Confirm Reschedule" button in the modal to call the real API:

```javascript
onClick={async () => {
  setIsProcessingInterview(true)
  try {
    // Call the reschedule API
    const applicationId = candidateData.application?.id
    const interviewId = candidateData.interview?.id
    
    if (!applicationId || !interviewId) {
      throw new Error('Missing application or interview ID')
    }
    
    await InterviewDataSource.rescheduleInterview(
      applicationId,
      interviewId,
      {
        date: rescheduleData.date,
        time: rescheduleData.time,
        duration: candidateData.interview?.duration || 60,
        location: candidateData.interview?.location || 'Office',
        interviewer: candidateData.interview?.interviewer || candidateData.interview?.contact_person || '',
        notes: `Rescheduled from ${candidateData.interview?.scheduled_at || 'previous date'}`
      }
    )
    
    // Close modal and refresh
    setInterviewActionType('')
    setRescheduleData({ date: '', time: '' })
    onClose() // Close the sidebar to trigger parent refresh
    
    await confirm({
      title: 'Success',
      message: 'Interview rescheduled successfully!',
      confirmText: 'OK',
      type: 'success'
    })
  } catch (error) {
    console.error('Failed to reschedule interview:', error)
    await confirm({
      title: 'Error',
      message: `Failed to reschedule interview: ${error.message}`,
      confirmText: 'OK',
      type: 'danger'
    })
  } finally {
    setIsProcessingInterview(false)
  }
}}
```

### 4. Added Missing Import
**File**: `src/components/CandidateSummaryS2.jsx`

Added the InterviewDataSource import:

```javascript
import InterviewDataSource from '../api/datasources/InterviewDataSource.js'
```

## How It Works Now

### Pass Button Flow:
1. User clicks "Pass" button
2. Calls `handleStatusUpdate('interview-passed')`
3. Validation now allows this transition
4. Calls `onUpdateStatus(applicationId, 'interview-passed')`
5. Parent component's `handleUpdateStatus` calls `applicationService.updateApplicationStage`
6. Service calls `InterviewDataSource.completeInterview(applicationId, 'passed', ...)`
7. Backend API: `POST /applications/:id/complete-interview` with `{ result: 'passed' }`

### Fail Button Flow:
1. User clicks "Fail" button
2. Calls `handleStatusUpdate('interview-failed')`
3. Validation now allows this transition
4. Calls `onUpdateStatus(applicationId, 'interview-failed')`
5. Parent component's `handleUpdateStatus` calls `applicationService.updateApplicationStage`
6. Service calls `InterviewDataSource.completeInterview(applicationId, 'failed', ...)`
7. Backend API: `POST /applications/:id/complete-interview` with `{ result: 'failed' }`

### Reschedule Button Flow:
1. User clicks "Reschedule" button
2. Opens the reschedule modal (sets `interviewActionType` to 'reschedule')
3. User enters new date and time
4. User clicks "Confirm Reschedule"
5. Calls `InterviewDataSource.rescheduleInterview(applicationId, interviewId, { date, time, ... })`
6. Backend API: `POST /applications/:id/reschedule-interview`
7. Shows success message and closes sidebar to trigger parent refresh

## Backend API Endpoints Used

### Complete Interview (Pass/Fail)
- **Endpoint**: `POST /applications/:id/complete-interview`
- **Payload**:
  ```json
  {
    "result": "passed" | "failed",
    "note": "Optional feedback",
    "updatedBy": "agency"
  }
  ```

### Reschedule Interview
- **Endpoint**: `POST /applications/:id/reschedule-interview`
- **Payload**:
  ```json
  {
    "interview_id": "string",
    "interview_date_ad": "YYYY-MM-DD",
    "interview_time": "HH:mm",
    "duration_minutes": 60,
    "location": "string",
    "contact_person": "string",
    "notes": "string",
    "updatedBy": "agency"
  }
  ```

## Testing Checklist

- [ ] Pass button marks interview as passed and updates application status
- [ ] Fail button marks interview as failed and updates application status
- [ ] Reschedule button opens modal with date/time inputs
- [ ] Reschedule modal validates required fields (date and time)
- [ ] Reschedule confirm button calls API and shows success message
- [ ] All buttons show loading states during API calls
- [ ] Error messages are displayed if API calls fail
- [ ] Parent component refreshes data after successful actions
- [ ] Sidebar closes after successful actions

## Notes

- The existing flow through `handleStatusUpdate` → `onUpdateStatus` → `applicationService.updateApplicationStage` is maintained
- The `applicationService.updateApplicationStage` method already has the correct logic to call interview-specific APIs for pass/fail
- The reschedule functionality now uses the built-in modal instead of relying on parent props
- All API calls use the InterviewDataSource which is already configured with the correct endpoints
