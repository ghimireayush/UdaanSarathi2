# Confirmation Dialogs Update - Owner Agencies Page

## Summary
Added confirmation dialogs to ALL actions on the `/owner/agencies` page to ensure users confirm before making any changes.

## Changes Made

### 1. Single Agency Status Change (NEW)
**Action**: Activate/Deactivate individual agency
**Before**: Changed status immediately without confirmation
**After**: Shows confirmation dialog before changing status

#### Implementation:
- Modified `handleStatusChange` to show confirmation dialog instead of executing immediately
- Added new `confirmSingleStatusChange` function to handle the actual status change
- Added new dialog type: `singleStatusChange`

### 2. Single Agency Delete (EXISTING - Already had confirmation)
**Action**: Delete individual agency
**Status**: ✅ Already had confirmation dialog requiring user to type agency name

### 3. Bulk Status Change (EXISTING - Already had confirmation)
**Action**: Change status for multiple selected agencies
**Status**: ✅ Already had confirmation dialog

### 4. Bulk Delete (EXISTING - Already had confirmation)
**Action**: Delete multiple selected agencies
**Status**: ✅ Already had confirmation dialog

## Complete List of Actions with Confirmations

### Individual Agency Actions (from dropdown menu)
1. ✅ **View Details** - No confirmation needed (read-only action)
2. ✅ **Activate** - Confirmation dialog added
3. ✅ **Deactivate** - Confirmation dialog added
4. ✅ **Delete** - Confirmation dialog (requires typing agency name)

### Bulk Actions (when agencies are selected)
1. ✅ **Activate Selected** - Confirmation dialog
2. ✅ **Deactivate Selected** - Confirmation dialog
3. ✅ **Delete Selected** - Confirmation dialog

### Non-Destructive Actions (No confirmation needed)
- Select/Deselect agencies (checkboxes)
- Search and filter
- Sort
- Pagination
- View details panel

## Dialog Types

### 1. Single Status Change Dialog
```javascript
{
  type: "singleStatusChange",
  data: {
    agencyId: "agency_001",
    newStatus: "active",
    agencyName: "Agency Name"
  }
}
```

**Message**: "Are you sure you want to change the status of "Agency Name" to Active?"
**Buttons**: Cancel (gray) | Confirm (blue)

### 2. Delete Dialog
```javascript
{
  type: "delete",
  data: {
    id: "agency_001",
    name: "Agency Name"
  }
}
```

**Message**: "Are you sure you want to delete this agency? This action cannot be undone."
**Requires**: User must type the exact agency name
**Buttons**: Cancel (gray) | Delete (red)

### 3. Bulk Status Change Dialog
```javascript
{
  type: "statusChange",
  data: {
    ids: ["agency_001", "agency_002"],
    status: "active"
  }
}
```

**Message**: "Change status to Active for 2 agencies?"
**Buttons**: Cancel (gray) | Confirm (blue)

### 4. Bulk Delete Dialog
```javascript
{
  type: "bulkDelete",
  data: {
    ids: ["agency_001", "agency_002"]
  }
}
```

**Message**: "Are you sure you want to delete 2 agencies? This action cannot be undone."
**Buttons**: Cancel (gray) | Delete All (red)

## Translation Keys Added

### English (`public/translations/en/pages/owner-agencies.json`)
```json
"confirmDialog": {
  "singleStatusChange": {
    "title": "Change Agency Status",
    "message": "Are you sure you want to change the status of \"{{agencyName}}\" to {{status}}?",
    "confirm": "Confirm",
    "cancel": "Cancel"
  }
}
```

### Nepali (`public/translations/ne/pages/owner-agencies.json`)
```json
"confirmDialog": {
  "singleStatusChange": {
    "title": "एजेन्सी स्थिति परिवर्तन गर्नुहोस्",
    "message": "के तपाईं \"{{agencyName}}\" को स्थिति {{status}} मा परिवर्तन गर्न निश्चित हुनुहुन्छ?",
    "confirm": "पुष्टि गर्नुहोस्",
    "cancel": "रद्द गर्नुहोस्"
  }
}
```

## Code Changes

### Modified Functions

#### 1. `handleStatusChange` (Modified)
```javascript
// Before: Executed immediately
const handleStatusChange = async (agencyId, newStatus) => {
  await agencyService.updateAgencyStatus(agencyId, newStatus);
  // ... update state
}

// After: Shows confirmation first
const handleStatusChange = (agencyId, newStatus) => {
  const agency = agencies.find(a => a.id === agencyId);
  setConfirmDialog({
    isOpen: true,
    type: "singleStatusChange",
    data: { agencyId, newStatus, agencyName: agency?.name },
  });
};
```

#### 2. `confirmSingleStatusChange` (New)
```javascript
const confirmSingleStatusChange = async () => {
  try {
    await agencyService.updateAgencyStatus(
      confirmDialog.data.agencyId,
      confirmDialog.data.newStatus
    );
    // ... update state
    setConfirmDialog({ isOpen: false, type: null, data: null });
  } catch (err) {
    showToast("error", tPage("toast.statusUpdateFailed"));
  }
};
```

#### 3. `ConfirmationDialog` Component (Updated)
- Added support for `singleStatusChange` type
- Added dynamic button colors (red for delete, blue for status change)
- Added new message rendering for single status change

### Dialog Rendering (Updated)
```javascript
onConfirm={() => {
  if (confirmDialog.type === "delete") confirmDelete();
  else if (confirmDialog.type === "bulkDelete") confirmBulkDelete();
  else if (confirmDialog.type === "statusChange") confirmBulkStatusChange();
  else if (confirmDialog.type === "singleStatusChange") confirmSingleStatusChange(); // NEW
}}
```

## User Experience Flow

### Single Agency Status Change
1. User clicks "Activate" or "Deactivate" in agency dropdown menu
2. Confirmation dialog appears with agency name and new status
3. User clicks "Confirm" or "Cancel"
4. If confirmed, status changes and success toast appears
5. If cancelled, dialog closes with no changes

### Visual Indicators
- **Delete actions**: Red button (destructive)
- **Status change actions**: Blue button (non-destructive)
- **Cancel button**: Gray border (neutral)
- **Disabled state**: Gray background when conditions not met

## Testing Checklist

- [x] Single agency activate shows confirmation
- [x] Single agency deactivate shows confirmation
- [x] Single agency delete shows confirmation (with name typing)
- [x] Bulk activate shows confirmation
- [x] Bulk deactivate shows confirmation
- [x] Bulk delete shows confirmation
- [x] Confirmation messages display correct agency name
- [x] Confirmation messages display correct status
- [x] Cancel button closes dialog without changes
- [x] Confirm button executes action
- [x] Success toast appears after confirmation
- [x] Error toast appears if action fails
- [x] Translations work in both English and Nepali
- [x] Dialog closes after successful action
- [x] No TypeScript/linting errors

## Benefits

### 1. Prevents Accidental Changes
- Users must explicitly confirm before any status change
- Reduces risk of accidentally activating/deactivating agencies

### 2. Clear Communication
- Dialog shows exactly what will change
- Agency name is displayed for clarity
- New status is clearly stated

### 3. Consistent UX
- All destructive/important actions now have confirmations
- Consistent dialog design across all actions
- Predictable user experience

### 4. Internationalized
- Full support for English and Nepali
- Consistent translations across all dialogs

### 5. Accessibility
- Keyboard navigation support
- Clear focus indicators
- Screen reader friendly

## Files Modified

1. **src/pages/OwnerAgencies.jsx**
   - Modified `handleStatusChange` function
   - Added `confirmSingleStatusChange` function
   - Updated `ConfirmationDialog` component
   - Updated dialog rendering logic

2. **public/translations/en/pages/owner-agencies.json**
   - Added `confirmDialog.singleStatusChange` translations

3. **public/translations/ne/pages/owner-agencies.json**
   - Added `confirmDialog.singleStatusChange` translations

## No Breaking Changes

- All existing functionality preserved
- Existing confirmation dialogs unchanged
- Only added new confirmation for previously unconfirmed action
- Backward compatible with existing code

## Security Considerations

- Prevents accidental bulk operations
- Requires explicit user confirmation
- Shows clear information about what will change
- Delete action requires typing agency name (extra safety)

## Performance Impact

- Minimal: Only adds one dialog render per action
- No additional API calls
- No performance degradation
- Dialog renders only when needed

## Future Enhancements (Optional)

1. Add undo functionality for status changes
2. Add confirmation for other sensitive actions
3. Add audit log entry for all confirmed actions
4. Add keyboard shortcuts (e.g., Enter to confirm, Esc to cancel)
5. Add animation transitions for dialog appearance
