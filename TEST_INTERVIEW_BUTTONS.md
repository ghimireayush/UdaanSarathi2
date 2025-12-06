# Testing Guide: Interview Action Buttons (Pass/Fail/Reschedule)

## Prerequisites
1. Backend server running on port 3000
2. Frontend dev server running
3. Logged in as an agency user
4. At least one candidate in "Interview Scheduled" stage

## Test Scenario Setup

### Create Test Data
1. Navigate to a job with candidates
2. Move a candidate to "Interview Scheduled" stage
3. Click on the candidate to open the CandidateSummaryS2 sidebar

## Test Cases

### Test 1: Pass Button
**Steps:**
1. Open candidate summary for a candidate in "Interview Scheduled" stage
2. Verify the "Pass" button is visible (green button)
3. Click the "Pass" button
4. Verify confirmation dialog appears
5. Click "Yes, Update Stage"
6. Wait for API call to complete

**Expected Results:**
- ✅ Confirmation dialog shows: "Are you sure you want to move this candidate from 'Interview Scheduled' to 'Interview Passed'?"
- ✅ Loading state shows during API call
- ✅ API call to `POST /applications/:id/complete-interview` with `{ result: 'passed' }`
- ✅ Sidebar closes after success
- ✅ Candidate moves to "Interview Passed" stage
- ✅ Parent page refreshes to show updated data

**Check Browser Console:**
```
🎯 handleStatusUpdate called with: interview-passed
✅ User confirmed stage update
📋 Application ID: app_xxx
🔄 Calling onUpdateStatus...
✅ onUpdateStatus completed
```

**Check Network Tab:**
- Request: `POST http://localhost:3000/applications/{applicationId}/complete-interview`
- Payload: `{ "result": "passed", "note": "Interview passed via agency workflow", "updatedBy": "agency" }`
- Response: 200 OK with updated application data

---

### Test 2: Fail Button
**Steps:**
1. Open candidate summary for a candidate in "Interview Scheduled" stage
2. Verify the "Fail" button is visible (red button)
3. Click the "Fail" button
4. Verify confirmation dialog appears
5. Click "Yes, Update Stage"
6. Wait for API call to complete

**Expected Results:**
- ✅ Confirmation dialog shows: "Are you sure you want to move this candidate from 'Interview Scheduled' to 'Interview Failed'?"
- ✅ Loading state shows during API call
- ✅ API call to `POST /applications/:id/complete-interview` with `{ result: 'failed' }`
- ✅ Sidebar closes after success
- ✅ Candidate moves to "Interview Failed" stage
- ✅ Parent page refreshes to show updated data

**Check Browser Console:**
```
🎯 handleStatusUpdate called with: interview-failed
✅ User confirmed stage update
📋 Application ID: app_xxx
🔄 Calling onUpdateStatus...
✅ onUpdateStatus completed
```

**Check Network Tab:**
- Request: `POST http://localhost:3000/applications/{applicationId}/complete-interview`
- Payload: `{ "result": "failed", "note": "Interview failed via agency workflow", "updatedBy": "agency" }`
- Response: 200 OK with updated application data

---

### Test 3: Reschedule Button (No Interview Date)
**Steps:**
1. Open candidate summary for a candidate in "Interview Scheduled" stage with no scheduled date
2. Verify the "Reschedule" button is visible (gray border button)
3. Click the "Reschedule" button
4. Verify reschedule modal opens

**Expected Results:**
- ✅ Modal opens with title "Reschedule Interview"
- ✅ Date input field is visible and empty
- ✅ Time input field is visible and empty
- ✅ "Confirm Reschedule" button is disabled (no date/time entered)
- ✅ "Cancel" button is enabled

---

### Test 4: Reschedule Button (Past Interview Time)
**Steps:**
1. Open candidate summary for a candidate with interview time in the past
2. Verify the "Reschedule" button is visible (amber border button)
3. Click the "Reschedule" button
4. Verify reschedule modal opens

**Expected Results:**
- ✅ Button shows amber/yellow styling (indicating elapsed time)
- ✅ Modal opens with title "Reschedule Interview"
- ✅ Date and time inputs are empty

---

### Test 5: Reschedule Modal - Complete Flow
**Steps:**
1. Click "Reschedule" button to open modal
2. Select a future date (e.g., tomorrow)
3. Verify "Confirm Reschedule" button is still disabled
4. Select a time (e.g., 14:00)
5. Verify time is displayed in 12-hour format below the input
6. Verify "Confirm Reschedule" button is now enabled
7. Click "Confirm Reschedule"
8. Wait for API call to complete

**Expected Results:**
- ✅ Date input shows selected date
- ✅ Time input shows selected time
- ✅ Time is displayed in 12-hour format (e.g., "2:00 PM")
- ✅ "Confirm Reschedule" button becomes enabled
- ✅ Loading state shows during API call
- ✅ API call to `POST /applications/:id/reschedule-interview`
- ✅ Success message appears: "Interview rescheduled successfully!"
- ✅ Modal closes
- ✅ Sidebar closes
- ✅ Parent page refreshes to show updated interview date

**Check Browser Console:**
```
Rescheduling interview for application: app_xxx
Interview ID: interview_xxx
```

**Check Network Tab:**
- Request: `POST http://localhost:3000/applications/{applicationId}/reschedule-interview`
- Payload:
  ```json
  {
    "interview_id": "interview_xxx",
    "interview_date_ad": "2025-12-05",
    "interview_time": "14:00",
    "duration_minutes": 60,
    "location": "Office",
    "contact_person": "John Doe",
    "notes": "Rescheduled from 2025-12-03T10:00:00Z",
    "updatedBy": "agency"
  }
  ```
- Response: 200 OK with updated interview data

---

### Test 6: Reschedule Modal - Cancel
**Steps:**
1. Click "Reschedule" button to open modal
2. Select a date and time
3. Click "Cancel" button

**Expected Results:**
- ✅ Modal closes
- ✅ No API call is made
- ✅ Sidebar remains open
- ✅ No changes to interview data

---

### Test 7: Error Handling - Pass/Fail
**Steps:**
1. Stop the backend server
2. Click "Pass" or "Fail" button
3. Confirm the action

**Expected Results:**
- ✅ Loading state shows
- ✅ Error dialog appears: "Failed to update candidate status. Please try again."
- ✅ Sidebar remains open
- ✅ No changes to candidate stage

---

### Test 8: Error Handling - Reschedule
**Steps:**
1. Stop the backend server
2. Click "Reschedule" button
3. Enter date and time
4. Click "Confirm Reschedule"

**Expected Results:**
- ✅ Loading state shows
- ✅ Error dialog appears: "Failed to reschedule interview: [error message]"
- ✅ Modal remains open
- ✅ No changes to interview data

---

## Validation Tests

### Test 9: Stage Validation
**Steps:**
1. Open candidate in "Applied" stage
2. Verify Pass/Fail buttons are NOT visible
3. Move candidate to "Shortlisted" stage
4. Verify Pass/Fail buttons are NOT visible
5. Move candidate to "Interview Scheduled" stage
6. Verify Pass/Fail/Reschedule buttons ARE visible

**Expected Results:**
- ✅ Pass/Fail/Reschedule buttons only appear for "Interview Scheduled" stage
- ✅ Other stages show appropriate buttons (e.g., "Shortlist" for "Applied")

---

### Test 10: Required Fields - Reschedule
**Steps:**
1. Open reschedule modal
2. Try to click "Confirm Reschedule" without entering date
3. Enter date only
4. Try to click "Confirm Reschedule" without entering time
5. Enter time
6. Verify button is now enabled

**Expected Results:**
- ✅ Button is disabled when date is missing
- ✅ Button is disabled when time is missing
- ✅ Button is enabled when both date and time are entered
- ✅ Visual feedback shows which fields are required (red asterisk)

---

## Integration Tests

### Test 11: Full Workflow
**Steps:**
1. Create a new candidate application
2. Move to "Shortlisted" stage
3. Schedule an interview
4. Open candidate summary
5. Click "Pass" button
6. Verify candidate moves to "Interview Passed"
7. Check that interview data is preserved

**Expected Results:**
- ✅ All stage transitions work correctly
- ✅ Interview data (date, time, location, notes) is preserved
- ✅ Application history shows all transitions
- ✅ Analytics/stats are updated correctly

---

## Performance Tests

### Test 12: Multiple Rapid Clicks
**Steps:**
1. Open candidate summary
2. Rapidly click "Pass" button multiple times
3. Observe behavior

**Expected Results:**
- ✅ Only one API call is made
- ✅ Button is disabled during processing
- ✅ No duplicate updates occur

---

## Browser Compatibility

Test all scenarios in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

---

## Accessibility Tests

### Test 13: Keyboard Navigation
**Steps:**
1. Open candidate summary
2. Use Tab key to navigate to buttons
3. Press Enter to activate buttons
4. Use Tab to navigate modal fields
5. Press Escape to close modal

**Expected Results:**
- ✅ All buttons are keyboard accessible
- ✅ Focus indicators are visible
- ✅ Modal can be closed with Escape key
- ✅ Tab order is logical

---

## Notes for Testers

1. **Check Console**: Always keep browser console open to see debug logs
2. **Check Network**: Monitor Network tab to verify API calls
3. **Check State**: Verify candidate stage updates in the UI
4. **Check Data**: Verify interview data is preserved after actions
5. **Check Errors**: Test error scenarios by stopping backend or using invalid data

## Known Issues / Limitations

1. Reschedule button only shows for candidates with interview scheduled
2. Pass/Fail buttons only available in "Interview Scheduled" stage
3. No undo functionality - actions are permanent
4. Requires parent component to refresh data after actions

## Success Criteria

All tests should pass with:
- ✅ No console errors
- ✅ Correct API calls made
- ✅ Proper error handling
- ✅ Good user feedback (loading states, success/error messages)
- ✅ Data consistency maintained
