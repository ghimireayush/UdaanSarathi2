# Sidebar UI Consistency Fix

## Problem
The candidate details sidebar (CandidateSummaryS2) showed inconsistent layouts depending on the context:

### Before - Applied Tab
- ✅ Showed job title ("Applied for: Scaffolder - Kuwait Project")
- ✅ Showed application date
- ✅ Showed passport, address, education
- ✅ Showed all professional details

### Before - Interview Scheduled Tab  
- ❌ Missing job title
- ❌ Different layout structure
- ❌ Interview details in different position
- ❌ Inconsistent styling

## Solution
Made the sidebar layout **consistent across all contexts** while adding interview-specific information when available.

## Changes Made

### 1. Consistent Profile Section
**File**: `src/components/CandidateSummaryS2.jsx`

- **Always show** job title, regardless of context
- **Always show** application date
- **Always show** current stage badge
- Removed conditional hiding based on `isInterviewContext`

```jsx
// Now shows consistently:
- Candidate name
- Current stage badge
- "Applied for: [Job Title]"
- "Applied: [Date]"
```

### 2. Unified Interview Details Section
- **Shows when interview data exists** (not just in interview context)
- Consistent styling with blue background
- Uses `formatTime12Hour()` for AM/PM display
- Better visual hierarchy

**Interview Details Now Show:**
- Date & Time (with AM/PM format)
- Duration
- Location
- Interviewer
- Interview Notes (if any)

### 3. Time Format Consistency
- Interview time now displays with AM/PM
- Example: "6:00 AM" instead of "06:00"
- Consistent with the rest of the application

### 4. Required Documents Display
- Shows `interview.required_documents` from API
- Displays as purple badges (CV, Citizenship, Education, etc.)
- Clear indication of what candidate must bring to interview
- Maps document type IDs to readable names

## Layout Structure (Now Consistent)

```
┌─────────────────────────────────────┐
│ Header: "Candidate Details"         │
├─────────────────────────────────────┤
│ Profile Section                     │
│ - Name                              │
│ - Current Stage Badge               │
│ - Applied for: [Job Title]          │ ← Always shown
│ - Applied: [Date]                   │ ← Always shown
├─────────────────────────────────────┤
│ Interview Details (if scheduled)    │ ← Shows when data exists
│ - Date & Time (with AM/PM)          │
│ - Duration                          │
│ - Location                          │
│ - Interviewer                       │
│ - Required Documents (badges)       │ ← NEW
│ - Notes                             │
├─────────────────────────────────────┤
│ Contact Information                 │
│ - Phone, Email, Passport, Address   │
├─────────────────────────────────────┤
│ Professional Details                │
│ - Experience                        │
│ - Education                         │
│ - Skills                            │
├─────────────────────────────────────┤
│ Interview Actions (if in context)   │
│ - Mark Pass/Fail                    │
│ - Reject/Reschedule                 │
├─────────────────────────────────────┤
│ Application History                 │
├─────────────────────────────────────┤
│ Documents                           │
├─────────────────────────────────────┤
│ Footer: Status Update & Close       │
└─────────────────────────────────────┘
```

## Benefits

### 1. Consistency
- Same information shown regardless of which tab you're viewing from
- Users don't get confused by missing information
- Professional, polished appearance

### 2. Context Awareness
- Interview details appear when scheduled
- Interview actions appear when in interview context
- No information is hidden unnecessarily

### 3. Better UX
- Users can always see what job the candidate applied for
- Clear timeline (application date + interview date)
- AM/PM time format is clearer for users

## Testing Checklist

- [ ] View candidate from "Applied" tab - shows all info
- [ ] View candidate from "Shortlisted" tab - shows all info
- [ ] View candidate from "Interview Scheduled" tab - shows all info + interview details
- [ ] Interview time shows AM/PM format
- [ ] Job title always visible
- [ ] Application date always visible
- [ ] Required documents shown as purple badges
- [ ] Required documents match what was selected during scheduling
- [ ] Interview actions only show in interview context
- [ ] Documents section works in all contexts

## Technical Details

### Props Used
- `isInterviewContext`: Controls whether interview actions are shown
- `candidateData.interview`: Controls whether interview details section appears
- `candidateData.job_title`: Always displayed when available
- `candidateData.application.created_at`: Always displayed when available

### Key Change
Changed from:
```jsx
{isInterviewContext && candidateData.interview && (
  // Interview details
)}
```

To:
```jsx
{candidateData.interview && (
  // Interview details - shows whenever data exists
)}
```

This ensures interview information is visible regardless of context, while interview **actions** (Mark Pass/Fail, etc.) only appear when `isInterviewContext=true`.

## Result
✅ Consistent sidebar layout across all tabs
✅ No missing information
✅ Clear AM/PM time display
✅ Professional, unified user experience
