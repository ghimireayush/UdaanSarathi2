# Preview Modal Fix - Complete Field Mapping

## Problem
The preview modal in `/drafts` page was not showing proper details after saving changes in `/draftwizard` because the field names didn't match between what was saved and what the preview expected.

## Root Cause
The `formatDraftData()` function was saving data with field names from the wizard form, but the PreviewModal component was looking for different field names.

### Example Mismatch:
```javascript
// Wizard saves:
{ posting_title: "Cook Position" }

// Preview looks for:
{ title: "Cook Position" }

// Result: Preview shows empty title ❌
```

## Solution
Enhanced `formatDraftData()` to map ALL fields to BOTH formats - ensuring compatibility with both the wizard and the preview.

## Fields Fixed

### 1. Basic Information
**Before:**
```javascript
{
  posting_title: "Cook",
  employer: "ABC Company"
}
```

**After:**
```javascript
{
  title: "Cook",              // ← Preview field
  posting_title: "Cook",      // ← Wizard field
  company: "ABC Company",     // ← Preview field
  employer: "ABC Company",    // ← Wizard field
  description: "Job notes"    // ← Added for preview
}
```

### 2. Contract Details
**Added preview-specific fields:**
```javascript
{
  // Existing fields
  period_years: 2,
  hours_per_day: 8,
  
  // New preview fields
  contract_duration: "2 years",
  working_hours: "8 hours/day",
  employment_type: "Full-time",
  visa_status: "Company will provide"
}
```

### 3. Positions Array
**Before:**
```javascript
positions: [{
  position_title: "Cook",
  monthly_salary: 1800
}]
```

**After:**
```javascript
positions: [{
  position_title: "Cook",      // ← Wizard field
  title: "Cook",               // ← Preview field
  monthly_salary: 1800,        // ← Wizard field
  salary_amount: 1800,         // ← Preview field
  job_description: "Notes",    // ← Preview field
  position_notes: "Notes"      // ← Wizard field
}]
```

### 4. Tags & Requirements
**Before:**
```javascript
{
  skills: ["Cooking", "Cleaning"]
}
```

**After:**
```javascript
{
  skills: ["Cooking", "Cleaning"],      // ← Wizard field
  tags: ["Cooking", "Cleaning"],        // ← Preview field
  requirements: ["High School"],        // ← Preview field
  education_requirements: ["High School"], // ← Wizard field
  category: "General"                   // ← Added for preview
}
```

### 5. Expenses Array
**Before:**
```javascript
expenses: [{
  type: "medical",
  amount: 500
}]
```

**After:**
```javascript
expenses: [{
  type: "medical",           // ← Wizard field
  description: "medical",    // ← Preview field (added)
  who_pays: "company",
  amount: 500,
  currency: "AED"
}]
```

### 6. Cutout/Image
**Before:**
```javascript
cutout: {
  file: File,
  preview_url: "blob:..."
}
```

**After:**
```javascript
cutout: {
  file: File,
  file_name: "image.jpg",        // ← Preview field
  file_url: "blob:...",          // ← Preview field
  file_size: 12345,              // ← Preview field
  file_type: "image/jpeg",       // ← Preview field
  has_file: true,                // ← Preview field
  is_uploaded: false,            // ← Preview field
  preview_url: "blob:...",       // ← Wizard field
  uploaded_url: null             // ← Wizard field
}
```

### 7. Interview Details
**Enhanced with all fields:**
```javascript
interview: {
  date_ad: "2025-10-15",
  date_bs: "2082-06-29",
  date_format: "AD",
  time: "10:00 AM",
  location: "Agency Office",
  contact_person: "John Doe",
  required_documents: ["Passport", "CV"],
  notes: "Bring originals",
  expenses: []
}
```

## Preview Modal Field Mapping

### What Preview Looks For:

#### Posting Details Section:
- ✅ `draft.title` (not `posting_title`)
- ✅ `draft.company` (not `employer`)
- ✅ `draft.city`
- ✅ `draft.country`
- ✅ `draft.lt_number`
- ✅ `draft.chalani_number`
- ✅ `draft.announcement_type`
- ✅ `draft.approval_date_ad`
- ✅ `draft.posting_date_ad`
- ✅ `draft.description`

#### Contract Section:
- ✅ `draft.period_years`
- ✅ `draft.renewable`
- ✅ `draft.hours_per_day`
- ✅ `draft.days_per_week`
- ✅ `draft.overtime_policy`
- ✅ `draft.food`
- ✅ `draft.accommodation`
- ✅ `draft.transport`
- ✅ `draft.annual_leave_days`
- ✅ `draft.visa_status`
- ✅ `draft.contract_duration`

#### Positions Section:
- ✅ `draft.positions[].position_title`
- ✅ `draft.positions[].vacancies_male`
- ✅ `draft.positions[].vacancies_female`
- ✅ `draft.positions[].monthly_salary`
- ✅ `draft.positions[].currency`
- ✅ `draft.positions[].job_description`

#### Tags Section:
- ✅ `draft.skills`
- ✅ `draft.tags`
- ✅ `draft.requirements`
- ✅ `draft.employment_type`
- ✅ `draft.category`

#### Expenses Section:
- ✅ `draft.expenses[].description`
- ✅ `draft.expenses[].amount`
- ✅ `draft.expenses[].currency`
- ✅ `draft.expenses[].type`

#### Cutout Section:
- ✅ `draft.cutout.file_name`
- ✅ `draft.cutout.file_url`
- ✅ `draft.cutout.has_file`
- ✅ `draft.cutout.is_uploaded`

#### Interview Section:
- ✅ `draft.interview.date_ad`
- ✅ `draft.interview.time`
- ✅ `draft.interview.location`
- ✅ `draft.interview.contact_person`
- ✅ `draft.interview.required_documents`

## Testing the Fix

### Test 1: Basic Info Preview
1. Edit draft
2. Change title to "New Title"
3. Change company to "New Company"
4. Save
5. Return to /drafts
6. Click "Preview"

**Expected:** ✅ Shows "New Title" and "New Company"

### Test 2: Positions Preview
1. Edit draft
2. Add 2 positions with different salaries
3. Save
4. Click "Preview"

**Expected:** ✅ Shows both positions with correct salaries

### Test 3: Image Preview
1. Edit draft
2. Upload image
3. Save
4. Click "Preview"

**Expected:** ✅ Shows image preview in cutout section

### Test 4: Expenses Preview
1. Edit draft
2. Add 3 expenses
3. Save
4. Click "Preview"

**Expected:** ✅ Shows all 3 expenses with amounts

### Test 5: Contract Preview
1. Edit draft
2. Change hours to 9, days to 5
3. Save
4. Click "Preview"

**Expected:** ✅ Shows "9 hours" and "5 days"

## Benefits

1. **Complete Preview** - All fields now visible
2. **No Missing Data** - Every saved field appears
3. **Dual Compatibility** - Works with both wizard and preview
4. **Future-Proof** - Handles both old and new field names
5. **No Breaking Changes** - Backward compatible

## Data Flow

```
User edits in /draftwizard
    ↓
Form data collected
    ↓
formatDraftData() - Maps to BOTH formats
    ↓
Save to API
    ↓
Return to /drafts
    ↓
Auto-refetch
    ↓
Click "Preview"
    ↓
PreviewModal reads data
    ↓
ALL fields display correctly ✅
```

## Files Modified

1. **src/pages/DraftWizard.jsx**
   - Enhanced `formatDraftData()` function
   - Added dual field mapping
   - Ensured preview compatibility

## Verification Checklist

- [x] Basic info fields mapped
- [x] Contract fields mapped
- [x] Positions array mapped
- [x] Tags/requirements mapped
- [x] Expenses array mapped
- [x] Cutout/image fields mapped
- [x] Interview fields mapped
- [x] Metadata fields included
- [x] No syntax errors
- [x] No type errors
- [x] Backward compatible

## Result

**✅ Preview now shows ALL saved details correctly!**

Every field that's saved in the wizard will now appear properly in the preview modal, with no missing or empty fields.
