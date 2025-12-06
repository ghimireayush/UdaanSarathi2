# New Job Draft Module Implementation

## Overview
This document describes the implementation of the new job draft module that replaces the old draft system in the UdaanSarathi2 admin panel.

## Implementation Summary

### 1. New Page Created
**File**: `src/pages/NewJobDraft.jsx`

A comprehensive 5-step form for creating job postings with the following steps:

#### Step 1: Basic Information
- Job Title (posting_title)
- Country
- City
- LT Number
- Chalani Number
- Approval Date (AD) - defaults to today
- Posting Date (AD) - defaults to today
- Announcement Type (full_ad, brief, urgent)
- Notes

#### Step 2: Employer Information
- Company Name
- Country
- City

#### Step 3: Contract Details
- Contract Period (Years)
- Renewable (Yes/No)
- Hours Per Day
- Days Per Week
- Overtime Policy (paid, unpaid, compensatory)
- Weekly Off Days
- Food (free, subsidized, not_provided)
- Accommodation (free, subsidized, not_provided)
- Transport (free, subsidized, not_provided)
- Annual Leave Days

#### Step 4: Positions
- Multiple positions can be added
- For each position:
  - Position Title (from job titles API if available, otherwise manual input)
  - Male Vacancies
  - Female Vacancies
  - Monthly Salary
  - Currency (AED, USD, SAR, QAR, MYR, KWD)
  - Hours Per Day Override (optional - overrides contract default)
  - Position Notes

#### Step 5: Requirements
- Skills (multi-select from predefined list)
- Education Requirements (multi-select)
- Experience Requirements:
  - Min Years
  - Max Years
  - Experience Level (entry-level, mid-level, experienced, senior)

**Note**: Expenses are NOT included in the initial job creation. According to the test file, expenses are added separately AFTER the job posting is created via dedicated expense endpoints.

### 2. Features Implemented

#### Data Integration
- Fetches countries from `/countries` API endpoint
- Fetches job titles from `/job-titles` API endpoint
- Uses bearer token authentication from localStorage

#### Form Validation
- Step-by-step validation
- Required field checking
- Prevents progression without completing required fields

#### Actions
- **Save Draft**: Saves the job posting with status 'draft'
- **Publish**: Validates all steps and publishes the job posting
- **Navigation**: Previous/Next buttons for step navigation

#### UI/UX
- Progress indicator showing current step
- Completed steps marked with checkmarks
- Dark mode support
- Responsive design
- Error and success notifications
- Loading states

### 3. Routing Updates

**File**: `src/App.jsx`
- Added import for `NewJobDraft` component
- Added route `/new-job-draft` with proper authentication and permissions

### 4. Navigation Updates

**File**: `src/config/roleBasedAccess.js`
- Updated the `drafts` navigation item to point to `/new-job-draft`
- Changed label to "New Job Draft"
- Maintained role-based access (owner, admin, manager)

### 5. API Integration

The component integrates with the following API endpoints:

```javascript
// Fetch countries
GET /countries
Headers: { Authorization: Bearer <token> }
Response: { data: [{ name: "UAE", code: "AE" }, ...] }

// Fetch job titles (OPTIONAL - if not available, manual input is used)
GET /job-titles
Headers: { Authorization: Bearer <token> }
Response: { data: [{ id: 1, title: "Construction Worker" }, ...] }
// OR: [{ id: 1, title: "Construction Worker" }, ...]

// Create job posting
POST /agencies/:licenseNumber/job-postings
Headers: { Authorization: Bearer <token> }
Body: {
  posting_title: string,
  country: string,
  city: string,
  lt_number: string,
  chalani_number: string,
  approval_date_ad: string,
  posting_date_ad: string,
  announcement_type: string,
  notes: string,
  employer: {
    company_name: string,
    country: string,
    city: string
  },
  contract: {
    period_years: number,
    renewable: boolean,
    hours_per_day: number,
    days_per_week: number,
    overtime_policy: string,
    weekly_off_days: number,
    food: string,
    accommodation: string,
    transport: string,
    annual_leave_days: number
  },
  positions: [{
    title: string,
    vacancies: { male: number, female: number },
    salary: { monthly_amount: number, currency: string },
    hours_per_day_override?: number,  // Optional
    position_notes?: string            // Optional
  }],
  skills: string[],
  education_requirements: string[],
  experience_requirements: {
    min_years: number,
    max_years: number,
    level: string
  },
  canonical_title_names: string[]  // Auto-generated from position titles
}

// Note: Expenses are added AFTER job creation via separate endpoints
// POST /agencies/:license/job-postings/:jobId/expenses/medical
// POST /agencies/:license/job-postings/:jobId/expenses/insurance
// POST /agencies/:license/job-postings/:jobId/expenses/travel
// POST /agencies/:license/job-postings/:jobId/expenses/visa
// POST /agencies/:license/job-postings/:jobId/expenses/training
// POST /agencies/:license/job-postings/:jobId/expenses/welfare
```

## Data Flow

1. **Component Mount**:
   - Fetches countries and job titles from API
   - Initializes form with default values

2. **User Interaction**:
   - User fills in form fields step by step
   - Validation occurs on "Next" button click
   - Can save draft at any step
   - Can only publish when all steps are complete

3. **Save Draft**:
   - Collects all form data
   - Sets status to 'draft'
   - POSTs to API
   - Redirects to `/drafts` on success

4. **Publish**:
   - Validates all steps
   - Collects all form data
   - Sets status to 'published'
   - POSTs to API
   - Redirects to `/jobs` on success

## Form Data Structure

```javascript
{
  // Basic Info
  posting_title: string,
  country: string,
  city: string,
  lt_number: string,
  chalani_number: string,
  approval_date_ad: string (YYYY-MM-DD),
  posting_date_ad: string (YYYY-MM-DD),
  announcement_type: 'full_ad' | 'brief' | 'urgent',
  notes: string,
  
  // Employer
  employer: {
    company_name: string,
    country: string,
    city: string
  },
  
  // Contract
  contract: {
    period_years: number,
    renewable: boolean,
    hours_per_day: number,
    days_per_week: number,
    overtime_policy: 'paid' | 'unpaid' | 'compensatory',
    weekly_off_days: number,
    food: 'free' | 'subsidized' | 'not_provided',
    accommodation: 'free' | 'subsidized' | 'not_provided',
    transport: 'free' | 'subsidized' | 'not_provided',
    annual_leave_days: number
  },
  
  // Positions
  positions: [{
    title: string,
    vacancies: { male: number, female: number },
    salary: { monthly_amount: number, currency: string },
    position_notes: string
  }],
  
  // Requirements
  skills: string[],
  education_requirements: string[],
  experience_requirements: {
    min_years: number,
    max_years: number,
    level: 'entry-level' | 'mid-level' | 'experienced' | 'senior'
  },
  canonical_title_names: string[],
  
  // Expenses (optional)
  expenses: {
    medical: object | null,
    insurance: object | null,
    travel: object | null,
    visa: object | null,
    training: object | null,
    welfare: object | null
  }
}
```

## Testing the Implementation

### Prerequisites
1. Backend API must be running
2. User must be logged in with appropriate role (owner, admin, or manager)
3. Agency license number must be stored in localStorage

### Test Steps

1. **Navigate to New Job Draft**:
   - Click on "New Job Draft" in the sidebar
   - Should see Step 1: Basic Information

2. **Fill Basic Information**:
   - Enter job title
   - Select country and city
   - Enter LT and Chalani numbers
   - Select dates
   - Click "Next"

3. **Fill Employer Information**:
   - Enter company name
   - Select country and city
   - Click "Next"

4. **Fill Contract Details**:
   - Enter contract period
   - Set working hours and days
   - Configure benefits
   - Click "Next"

5. **Add Positions**:
   - Select position title
   - Enter vacancies
   - Set salary
   - Add more positions if needed
   - Click "Next"

6. **Set Requirements**:
   - Add skills
   - Select education requirements
   - Set experience requirements
   - Click "Next"

7. **Configure Expenses (Optional)**:
   - Add expense details if needed
   - Click "Save Draft" or "Publish"

### Expected Behavior

- **Save Draft**: Should save and redirect to `/drafts`
- **Publish**: Should validate all steps, publish, and redirect to `/jobs`
- **Validation Errors**: Should show error messages for incomplete fields
- **API Errors**: Should display error messages from the backend

## Future Enhancements

1. **Expense Details**: Complete the expense configuration forms for each expense type
2. **Draft Editing**: Add ability to edit existing drafts
3. **Auto-save**: Implement auto-save functionality
4. **Field Validation**: Add more granular field validation (e.g., phone numbers, email formats)
5. **File Uploads**: Add support for uploading job-related documents
6. **Preview**: Add a preview step before publishing
7. **Localization**: Add multi-language support
8. **Bulk Import**: Add ability to import multiple job postings from CSV/Excel

## Migration from Old Draft System

The old draft system (`/drafts` and `/draftwizard`) is still available but the navigation now points to the new system. To fully deprecate the old system:

1. Migrate existing drafts to the new format
2. Update all references to `/drafts` and `/draftwizard`
3. Remove old draft components
4. Update documentation

## Notes

- The component uses Tailwind CSS for styling
- Icons are from `lucide-react`
- Form state is managed with React hooks
- API calls use axios
- Authentication token is retrieved from localStorage
- Agency license number is retrieved from localStorage

## Support

For issues or questions, refer to:
- Test file: `/portal/dev_tools/test_web_frontend/tests/agency_owner_create_agency.test.ts`
- API documentation: Check backend API docs for endpoint details
- Component file: `src/pages/NewJobDraft.jsx`
