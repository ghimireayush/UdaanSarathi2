# Draft Wizard Synchronization Fix

## Problem
Changes made in `/draftwizard` page were not being saved properly and not showing up in `/drafts` page. The preview was not displaying the correct saved data.

## Root Causes

1. **Data Not Being Formatted**: Raw form data from the wizard wasn't being properly formatted before saving to the API
2. **No Refetch on Return**: The `/drafts` page wasn't refetching data when returning from the wizard
3. **Inconsistent Data Structure**: Different save operations were using different data structures

## Solutions Implemented

### 1. Added Data Formatting Function (`src/pages/DraftWizard.jsx`)

Created `formatDraftData()` helper function that:
- Converts raw form data to API-compatible format
- Handles both new and existing data structures
- Ensures all fields are properly mapped
- Maintains data consistency across all save operations

```javascript
const formatDraftData = (data) => {
  // Formats positions, expenses, contract details, etc.
  // Returns consistent API-compatible structure
};
```

### 2. Updated All Save Operations

**Before:**
```javascript
await jobService.updateJob(editingDraft.id, draftData.data);
```

**After:**
```javascript
const formattedData = formatDraftData(draftData.data);
await jobService.updateJob(editingDraft.id, formattedData);
```

Applied to:
- ✅ Partial draft save (Save & Exit)
- ✅ Single draft save
- ✅ Single draft publish
- ✅ Default save behavior

### 3. Added Refetch Trigger (`src/pages/Drafts.jsx`)

**Enhanced location state handler:**
```javascript
useEffect(() => {
  if (location.state?.message) {
    showToast(location.state.message, location.state.type || "success");
    
    // Refetch drafts to show updated data
    const refetchDrafts = async () => {
      const allDrafts = await jobService.getDraftJobs();
      setDrafts(allDrafts);
      setPagination((prev) => ({
        ...prev,
        total: allDrafts.length,
      }));
    };
    
    refetchDrafts();
    navigate(location.pathname, { replace: true, state: {} });
  }
}, [location.state]);
```

### 4. Added Refetch Flag to Navigation

**Updated all navigate calls in DraftWizard:**
```javascript
navigate("/drafts", {
  state: {
    message: "Draft updated successfully",
    type: "success",
    refetch: true, // ← New flag
  },
});
```

## Data Flow

### Creating New Draft
```
User fills form → Click Save → formatDraftData() → jobService.createDraftJob() 
→ Navigate to /drafts with message → Refetch drafts → Show updated list
```

### Editing Existing Draft
```
/drafts → Click Edit → Navigate to /draftwizard with draft data 
→ User makes changes → Click Save → formatDraftData() 
→ jobService.updateJob() → Navigate to /drafts with message 
→ Refetch drafts → Show updated data
```

### Save & Exit (Partial Save)
```
User completes some steps → Click "Save & Exit" → formatDraftData() 
→ Save with last_completed_step → Navigate to /drafts 
→ Refetch → Draft shows progress indicator
```

## What Gets Saved

### Complete Draft Structure:
```javascript
{
  // Basic Info
  title, company, country, city,
  
  // Administrative
  lt_number, chalani_number, approval_date_ad, approval_date_bs,
  posting_date_ad, posting_date_bs, date_format, announcement_type,
  
  // Contract
  period_years, renewable, hours_per_day, days_per_week,
  overtime_policy, weekly_off_days, food, accommodation,
  transport, annual_leave_days,
  
  // Positions (array)
  positions: [{
    title, vacancies_male, vacancies_female,
    monthly_salary, currency,
    contract_overrides: { ... },
    position_notes
  }],
  
  // Tags & Requirements
  skills, education_requirements, experience_requirements,
  canonical_title_ids, canonical_title_names,
  
  // Expenses (array)
  expenses: [{
    type, who_pays, is_free, amount, currency, notes
  }],
  
  // Cutout
  cutout: { file, preview_url, uploaded_url, is_uploaded },
  
  // Interview
  interview: {
    date_ad, date_bs, time, location, contact_person,
    required_documents, notes, expenses
  },
  
  // Metadata
  status, created_at, updated_at, is_partial, last_completed_step
}
```

## Testing Checklist

- [x] Create new draft → Save → Check /drafts shows new draft
- [x] Edit draft → Make changes → Save → Check changes appear
- [x] Upload image → Save → Check image is saved
- [x] Fill partial form → Save & Exit → Check progress is saved
- [x] Complete all steps → Publish → Check job appears in /jobs
- [x] Edit bulk draft → Save → Check bulk draft updates
- [x] Expand bulk draft → Complete → Save → Check conversion works

## Benefits

1. **Data Consistency**: All saves use the same format
2. **Real-time Updates**: Changes immediately visible on return
3. **No Data Loss**: All form fields properly saved
4. **Better UX**: Users see their changes reflected instantly
5. **Debugging**: Easier to track data flow with consistent structure

## Files Modified

1. `src/pages/DraftWizard.jsx`
   - Added `formatDraftData()` function
   - Updated all save operations to use formatting
   - Added refetch flag to navigation

2. `src/pages/Drafts.jsx`
   - Enhanced location state handler
   - Added automatic refetch on return
   - Improved data synchronization

## No Breaking Changes

- ✅ Existing drafts still work
- ✅ Backward compatible with old data structure
- ✅ All existing features preserved
- ✅ No API changes required
