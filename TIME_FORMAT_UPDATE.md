# Time Format Update - AM/PM Display

## Summary
Updated the interview scheduling UI to display times in 12-hour format with AM/PM indicators, making it clearer for users in Nepal and other regions that use 12-hour time format.

## Changes Made

### 1. Added Time Formatting Utility
**File**: `src/utils/helpers.js`

Added `formatTime12Hour()` function that converts 24-hour time format (HH:mm:ss) to 12-hour format with AM/PM:
- `06:00:00` → `6:00 AM`
- `12:30:00` → `12:30 PM`
- `14:30:00` → `2:30 PM`
- `00:00:00` → `12:00 AM`

### 2. Updated ScheduledInterviews Component
**File**: `src/components/ScheduledInterviews.jsx`

- **Interview Cards**: Now display time with AM/PM format
  - Uses `interview.time` field from API (e.g., "12:30:00")
  - Displays as "12:30 PM" instead of just "12:30"
  
- **Reschedule Modal**: Added AM/PM helper text below time input
  - Shows selected time in 12-hour format as user types
  - Example: When user selects 14:30, shows "2:30 PM" below

### 3. Updated EnhancedInterviewScheduling Component
**File**: `src/components/EnhancedInterviewScheduling.jsx`

- **Individual Scheduling**: Added AM/PM helper text below time input
- **Batch Scheduling**: Added AM/PM helper text for each batch time input
- Shows real-time conversion as user selects time

### 4. Added Tests
**File**: `src/utils/__tests__/helpers.formatTime.test.js`

Comprehensive test suite covering:
- Midnight (00:00 → 12:00 AM)
- Morning times (06:00 → 6:00 AM)
- Noon (12:00 → 12:00 PM)
- Afternoon/evening (14:30 → 2:30 PM)
- Edge cases (empty input, invalid input)
- Real API data examples

All 7 tests pass ✅

## API Data Format
The backend API returns time in 24-hour format:
```json
{
  "interview": {
    "time": "12:30:00",
    "scheduled_at": "2025-12-11T00:00:00.000Z"
  }
}
```

**No changes needed to API** - the frontend now handles the display conversion.

## User Experience Improvements

### Before
- Time displayed as "12:30" or "06:00" (ambiguous)
- Users had to guess if it's AM or PM
- Time input showed 24-hour format in some browsers

### After
- Time clearly shows "12:30 PM" or "6:00 AM"
- Helper text below time inputs shows AM/PM as user types
- Consistent 12-hour format throughout the application

## Testing

### Manual Testing Checklist
- [ ] View scheduled interviews - times show AM/PM
- [ ] Schedule individual interview - helper text shows AM/PM
- [ ] Schedule batch interviews - helper text shows AM/PM for each batch
- [ ] Reschedule interview - helper text shows AM/PM
- [ ] Test with different times:
  - [ ] Midnight (00:00 → 12:00 AM)
  - [ ] Morning (06:00 → 6:00 AM)
  - [ ] Noon (12:00 → 12:00 PM)
  - [ ] Afternoon (14:30 → 2:30 PM)
  - [ ] Evening (18:00 → 6:00 PM)

### Automated Tests
Run: `npm test -- helpers.formatTime.test.js`

All tests pass ✅

## Browser Compatibility
- HTML `<input type="time">` is used (native browser support)
- Helper text provides consistent AM/PM display across all browsers
- Works in Chrome, Firefox, Safari, Edge

## Nepal Time Context
Nepal Standard Time (NPT) is UTC+5:45. The time format changes are display-only and don't affect:
- Time zone handling
- API data format
- Database storage
- Time calculations

The API continues to use 24-hour format and ISO 8601 timestamps, which is correct.
