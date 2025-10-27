# Custom Date Range Feature - Owner Audit Log

## Overview
Added a custom date range filter to the Owner Audit Log page, allowing users to select specific start and end dates to view audit logs within a custom time period.

## Implementation Details

### Files Modified

1. **src/pages/OwnerAuditLog.jsx**
   - Added `customDateRange` state for storing start and end dates
   - Updated filter logic to handle custom date ranges
   - Added date input fields that appear when "Custom Range" is selected
   - Updated pagination reset to include custom date range changes

2. **public/translations/en/pages/owner-auditlog.json**
   - Added `filters.custom`: "Custom Range"
   - Added `filters.startDate`: "Start Date"
   - Added `filters.endDate`: "End Date"

3. **public/translations/ne/pages/owner-auditlog.json**
   - Added `filters.custom`: "अनुकूल दायरा"
   - Added `filters.startDate`: "सुरु मिति"
   - Added `filters.endDate`: "अन्त्य मिति"

## Features

### Date Range Options

The Date Range dropdown now includes:
- **All Time** - Shows all audit logs
- **Today** - Shows logs from the last 24 hours
- **This Week** - Shows logs from the last 7 days
- **This Month** - Shows logs from the last 30 days
- **Custom Range** ✨ NEW - Allows selecting specific start and end dates

### Custom Date Range Behavior

When "Custom Range" is selected:

1. **Two date pickers appear below the dropdown:**
   - Start Date picker
   - End Date picker

2. **Smart date validation:**
   - Start Date cannot be after End Date
   - End Date cannot be before Start Date
   - Date pickers automatically enforce these constraints

3. **Flexible filtering:**
   - Can set only Start Date (shows logs from that date onwards)
   - Can set only End Date (shows logs up to that date)
   - Can set both dates (shows logs within the range)

4. **Time handling:**
   - Start Date includes logs from 00:00:00 (midnight)
   - End Date includes logs up to 23:59:59 (end of day)
   - Ensures full day coverage for selected dates

### Filter Logic

```javascript
if (filters.dateRange === "custom") {
  // Custom date range
  if (customDateRange.startDate || customDateRange.endDate) {
    result = result.filter((log) => {
      const logDate = log.timestamp.getTime();
      const startDate = customDateRange.startDate
        ? new Date(customDateRange.startDate).setHours(0, 0, 0, 0)
        : 0;
      const endDate = customDateRange.endDate
        ? new Date(customDateRange.endDate).setHours(23, 59, 59, 999)
        : Date.now();
      return logDate >= startDate && logDate <= endDate;
    });
  }
}
```

## User Interface

### Date Range Dropdown
```
┌─────────────────────────┐
│ Date Range              │
├─────────────────────────┤
│ All Time                │
│ Today                   │
│ This Week               │
│ This Month              │
│ Custom Range         ✓  │ ← Selected
└─────────────────────────┘
```

### Custom Date Inputs (shown when Custom Range is selected)
```
┌─────────────────────────┐
│ Start Date              │
│ ┌─────────────────────┐ │
│ │ 2025-10-01         │ │ ← Date picker
│ └─────────────────────┘ │
└─────────────────────────┘

┌─────────────────────────┐
│ End Date                │
│ ┌─────────────────────┐ │
│ │ 2025-10-27         │ │ ← Date picker
│ └─────────────────────┘ │
└─────────────────────────┘
```

## Usage Examples

### Example 1: View logs for a specific day
1. Open Filters panel
2. Select "Custom Range" from Date Range dropdown
3. Set Start Date: 2025-10-15
4. Set End Date: 2025-10-15
5. Result: Shows all logs from October 15, 2025

### Example 2: View logs from a specific date onwards
1. Open Filters panel
2. Select "Custom Range" from Date Range dropdown
3. Set Start Date: 2025-10-01
4. Leave End Date empty
5. Result: Shows all logs from October 1, 2025 to present

### Example 3: View logs up to a specific date
1. Open Filters panel
2. Select "Custom Range" from Date Range dropdown
3. Leave Start Date empty
4. Set End Date: 2025-10-20
5. Result: Shows all logs up to October 20, 2025

### Example 4: View logs for a date range
1. Open Filters panel
2. Select "Custom Range" from Date Range dropdown
3. Set Start Date: 2025-10-01
4. Set End Date: 2025-10-15
5. Result: Shows all logs between October 1-15, 2025

## Technical Details

### State Management

```javascript
const [customDateRange, setCustomDateRange] = useState({
  startDate: "",
  endDate: "",
});
```

### Date Input Constraints

```javascript
// Start Date input
<input
  type="date"
  value={customDateRange.startDate}
  max={customDateRange.endDate || undefined}  // Can't be after end date
  // ...
/>

// End Date input
<input
  type="date"
  value={customDateRange.endDate}
  min={customDateRange.startDate || undefined}  // Can't be before start date
  // ...
/>
```

### Reset Behavior

When switching away from "Custom Range":
- Custom date values are cleared
- Filter reverts to the newly selected option
- Pagination resets to page 1

## Styling

The date inputs use consistent styling with the rest of the application:
- Dark mode support
- Responsive design
- Proper spacing and alignment
- Accessible labels and inputs

## Accessibility

- ✅ Proper label associations
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Clear visual feedback
- ✅ Logical tab order

## Browser Compatibility

The `<input type="date">` element is supported in:
- ✅ Chrome/Edge (full support)
- ✅ Firefox (full support)
- ✅ Safari (full support)
- ⚠️ IE11 (falls back to text input)

## Future Enhancements

Potential improvements:

1. **Date Presets**: Quick buttons for "Last 7 days", "Last 30 days", etc.
2. **Date Format Localization**: Show dates in Nepali calendar format when Nepali language is selected
3. **Time Selection**: Add time pickers for more precise filtering
4. **Relative Dates**: Support for "Last X days" with custom number input
5. **Save Custom Ranges**: Allow users to save frequently used date ranges
6. **Calendar Popup**: Replace native date picker with custom calendar UI
7. **Date Range Shortcuts**: Keyboard shortcuts for common date ranges

## Testing

### Manual Testing Steps

1. **Test Custom Range Selection**
   - Select "Custom Range" from dropdown
   - Verify date inputs appear
   - Verify other options hide date inputs

2. **Test Date Validation**
   - Set Start Date after End Date
   - Verify End Date picker prevents this
   - Set End Date before Start Date
   - Verify Start Date picker prevents this

3. **Test Filtering**
   - Set custom date range
   - Verify only logs within range are shown
   - Test with only Start Date
   - Test with only End Date
   - Test with both dates

4. **Test Pagination**
   - Change custom dates
   - Verify pagination resets to page 1

5. **Test Language Support**
   - Switch to Nepali
   - Verify translations are correct
   - Verify date inputs still work

6. **Test Reset Behavior**
   - Set custom dates
   - Switch to "Today"
   - Verify custom dates are cleared
   - Switch back to "Custom Range"
   - Verify date inputs are empty

## Related Files

- `src/pages/OwnerAuditLog.jsx` - Main implementation
- `public/translations/en/pages/owner-auditlog.json` - English translations
- `public/translations/ne/pages/owner-auditlog.json` - Nepali translations

## Status

✅ **IMPLEMENTED** - Custom date range filter is fully functional and ready for use.

Users can now filter audit logs by selecting a custom date range with start and end dates.
