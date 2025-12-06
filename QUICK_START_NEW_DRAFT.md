# Quick Start: New Job Draft Module

## What Was Done

I've created a brand new job draft page that replaces the old draft system. The new page follows the exact structure from your test file and creates job postings step-by-step.

## Files Created/Modified

### New Files
1. **`src/pages/NewJobDraft.jsx`** - The main new job draft page with 6-step wizard

### Modified Files
1. **`src/App.jsx`** - Added route for `/new-job-draft`
2. **`src/config/roleBasedAccess.js`** - Updated navigation to point to new draft page

## How to Use

### Access the New Draft Page
1. Log in to the admin panel
2. Click on "New Job Draft" in the sidebar (replaces old "Drafts" link)
3. You'll see a 6-step wizard

### The 6 Steps

**Step 1: Basic Info**
- Job title, country, city
- LT number, Chalani number
- Approval and posting dates
- Announcement type

**Step 2: Employer**
- Company name
- Company location (country, city)

**Step 3: Contract**
- Contract duration and terms
- Working hours and days
- Benefits (food, accommodation, transport)
- Leave policy

**Step 4: Positions**
- Add multiple positions
- Set vacancies (male/female)
- Define salary and currency
- Add position-specific notes

**Step 5: Requirements**
- Select required skills
- Choose education requirements
- Set experience requirements

**Step 6: Expenses** (Optional)
- Configure expense details
- Medical, insurance, travel, visa, training, welfare

### Actions Available

- **Previous/Next**: Navigate between steps
- **Save Draft**: Save at any step (redirects to `/drafts`)
- **Publish**: Complete all steps and publish (redirects to `/jobs`)

## API Integration

The page automatically fetches:
- **Countries**: From `/countries` endpoint
- **Job Titles**: From `/job-titles` endpoint

When saving/publishing, it POSTs to:
- **Endpoint**: `/agencies/:licenseNumber/job-postings`
- **Auth**: Uses bearer token from localStorage
- **License**: Uses agency license from localStorage

## Key Features

✅ Step-by-step validation
✅ Progress indicator
✅ Dark mode support
✅ Responsive design
✅ Error handling
✅ Success notifications
✅ Multiple positions support
✅ Dynamic skill/education selection

## Testing

### Quick Test
1. Navigate to `/new-job-draft`
2. Fill in Step 1 (all fields required)
3. Click "Next"
4. Fill in Step 2
5. Continue through all steps
6. Click "Save Draft" or "Publish"

### What to Check
- ✅ Countries dropdown populates
- ✅ Job titles dropdown populates
- ✅ Validation prevents skipping incomplete steps
- ✅ Can add/remove multiple positions
- ✅ Save draft works
- ✅ Publish validates all steps

## Payload Structure

The form creates a payload matching your test file structure:

```javascript
{
  posting_title: "Construction Worker - UAE Project",
  country: "UAE",
  city: "Dubai",
  lt_number: "LT-2025-12345",
  chalani_number: "CH-2025-98765",
  approval_date_ad: "2025-11-26",
  posting_date_ad: "2025-11-26",
  announcement_type: "full_ad",
  notes: "Urgent requirement...",
  
  employer: {
    company_name: "Gulf Construction LLC",
    country: "UAE",
    city: "Dubai"
  },
  
  contract: {
    period_years: 2,
    renewable: true,
    hours_per_day: 8,
    days_per_week: 6,
    overtime_policy: "paid",
    weekly_off_days: 1,
    food: "free",
    accommodation: "free",
    transport: "free",
    annual_leave_days: 30
  },
  
  positions: [{
    title: "Construction Worker",
    vacancies: { male: 5, female: 2 },
    salary: { monthly_amount: 2000, currency: "AED" },
    position_notes: "Experience required"
  }],
  
  skills: ["professional-skills", "communication", "teamwork"],
  education_requirements: ["high-school", "diploma"],
  experience_requirements: {
    min_years: 2,
    max_years: 10,
    level: "mid-level"
  },
  
  status: "draft" // or "published"
}
```

## Next Steps

### To Complete the Implementation

1. **Test the Integration**:
   ```bash
   cd portal/agency_research/code/admin_panel/UdaanSarathi2
   npm run dev
   ```

2. **Verify API Endpoints**:
   - Ensure `/countries` returns country list
   - Ensure `/job-titles` returns job titles
   - Ensure `/agencies/:license/job-postings` accepts POST

3. **Add Job Titles API** (if not exists):
   - The frontend expects a `/job-titles` endpoint
   - Should return: `{ data: [{ id, title }, ...] }`

4. **Complete Expenses Step** (optional):
   - Currently shows placeholder
   - Can add detailed forms for each expense type

5. **Remove Old Draft System** (when ready):
   - Keep `/drafts` route for viewing existing drafts
   - Remove `/draftwizard` route
   - Update any other references

## Troubleshooting

### Countries Not Loading
- Check if `/countries` API is accessible
- Verify token in localStorage
- Check browser console for errors

### Job Titles Not Loading
- Implement `/job-titles` endpoint if missing
- Should return array of job title objects

### Save/Publish Fails
- Check agency license in localStorage
- Verify API endpoint format
- Check payload structure matches backend expectations

### Navigation Not Updated
- Clear browser cache
- Restart dev server
- Check roleBasedAccess.js changes applied

## Environment Variables

Make sure these are set:
```env
VITE_API_BASE_URL=http://localhost:3000
```

## Support

- **Implementation Doc**: See `NEW_JOB_DRAFT_IMPLEMENTATION.md`
- **Test Reference**: `/portal/dev_tools/test_web_frontend/tests/agency_owner_create_agency.test.ts`
- **Component**: `src/pages/NewJobDraft.jsx`
