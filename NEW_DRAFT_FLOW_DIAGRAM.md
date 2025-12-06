# New Job Draft Flow Diagram

## User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Login                               │
│                    (Owner/Admin/Manager)                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Dashboard/Sidebar                           │
│                  Click "New Job Draft"                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    /new-job-draft Page                           │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Progress Bar: [1] [2] [3] [4] [5] [6]                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              STEP 1: Basic Information                   │   │
│  │  • Job Title                                             │   │
│  │  • Country, City                                         │   │
│  │  • LT Number, Chalani Number                            │   │
│  │  • Approval Date, Posting Date                          │   │
│  │  • Announcement Type                                     │   │
│  │  • Notes                                                 │   │
│  │                                                          │   │
│  │  [Previous]                    [Save Draft]  [Next] ──┐ │   │
│  └──────────────────────────────────────────────────────│─┘   │
└───────────────────────────────────────────────────────│─────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           STEP 2: Employer Information                   │   │
│  │  • Company Name                                          │   │
│  │  • Country                                               │   │
│  │  • City                                                  │   │
│  │                                                          │   │
│  │  [Previous]                    [Save Draft]  [Next] ──┐ │   │
│  └──────────────────────────────────────────────────────│─┘   │
└───────────────────────────────────────────────────────│─────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            STEP 3: Contract Details                      │   │
│  │  • Contract Period (Years)                               │   │
│  │  • Renewable (Yes/No)                                    │   │
│  │  • Hours Per Day, Days Per Week                         │   │
│  │  • Overtime Policy                                       │   │
│  │  • Weekly Off Days                                       │   │
│  │  • Food, Accommodation, Transport                       │   │
│  │  • Annual Leave Days                                     │   │
│  │                                                          │   │
│  │  [Previous]                    [Save Draft]  [Next] ──┐ │   │
│  └──────────────────────────────────────────────────────│─┘   │
└───────────────────────────────────────────────────────│─────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               STEP 4: Positions                          │   │
│  │                                                          │   │
│  │  Position 1:                        [Add Position]       │   │
│  │  • Position Title (dropdown)                             │   │
│  │  • Male Vacancies, Female Vacancies                     │   │
│  │  • Monthly Salary, Currency                             │   │
│  │  • Position Notes                                        │   │
│  │                                          [Remove]        │   │
│  │  Position 2:                                             │   │
│  │  • ...                                                   │   │
│  │                                                          │   │
│  │  [Previous]                    [Save Draft]  [Next] ──┐ │   │
│  └──────────────────────────────────────────────────────│─┘   │
└───────────────────────────────────────────────────────│─────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              STEP 5: Requirements                        │   │
│  │                                                          │   │
│  │  Skills:                                                 │   │
│  │  [Select Skill ▼]  [Add]                                │   │
│  │  [skill1 ×] [skill2 ×] [skill3 ×]                       │   │
│  │                                                          │   │
│  │  Education Requirements:                                 │   │
│  │  [high-school] [diploma] [bachelors] [masters]          │   │
│  │                                                          │   │
│  │  Experience:                                             │   │
│  │  • Min Years, Max Years                                 │   │
│  │  • Experience Level                                      │   │
│  │                                                          │   │
│  │  [Previous]                    [Save Draft]  [Next] ──┐ │   │
│  └──────────────────────────────────────────────────────│─┘   │
└───────────────────────────────────────────────────────│─────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           STEP 6: Expenses (Optional)                    │   │
│  │                                                          │   │
│  │  [Medical]  [Insurance]  [Travel]                       │   │
│  │  [Visa]     [Training]   [Welfare]                      │   │
│  │                                                          │   │
│  │  Click any to configure expense details                 │   │
│  │                                                          │   │
│  │  [Previous]              [Save Draft]  [Publish] ──┐    │   │
│  └────────────────────────────────────────────────────│────┘   │
└─────────────────────────────────────────────────────│───────────┘
                                                       │
                                                       ▼
                                    ┌──────────────────────────────┐
                                    │   Validation Check           │
                                    │   All steps complete?        │
                                    └──────────┬───────────────────┘
                                               │
                                ┌──────────────┴──────────────┐
                                │                             │
                            ❌ No                         ✅ Yes
                                │                             │
                                ▼                             ▼
                    ┌───────────────────────┐   ┌───────────────────────┐
                    │  Show Error           │   │  POST to API          │
                    │  "Complete Step X"    │   │  /agencies/:license/  │
                    │  Navigate to step     │   │  job-postings         │
                    └───────────────────────┘   └──────────┬────────────┘
                                                           │
                                                           ▼
                                            ┌──────────────────────────┐
                                            │  Success?                │
                                            └──────┬───────────────────┘
                                                   │
                                    ┌──────────────┴──────────────┐
                                    │                             │
                                ❌ Error                      ✅ Success
                                    │                             │
                                    ▼                             ▼
                        ┌───────────────────────┐   ┌───────────────────────┐
                        │  Show Error Message   │   │  Show Success Message │
                        │  Stay on page         │   │  Redirect to:         │
                        └───────────────────────┘   │  • /drafts (draft)    │
                                                    │  • /jobs (published)  │
                                                    └───────────────────────┘
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      Component Mount                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────────┐
                    │  Fetch Countries   │
                    │  GET /countries    │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │  Fetch Job Titles  │
                    │  GET /job-titles   │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │  Populate Dropdowns│
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │  User Fills Form   │
                    │  Step by Step      │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │  Save Draft or     │
                    │  Publish           │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │  Build Payload     │
                    │  {                 │
                    │    posting_title,  │
                    │    country,        │
                    │    employer: {...},│
                    │    contract: {...},│
                    │    positions: [...],│
                    │    skills: [...],  │
                    │    ...             │
                    │    status: 'draft' │
                    │  }                 │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │  POST to API       │
                    │  /agencies/:license│
                    │  /job-postings     │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │  Handle Response   │
                    │  • Success: Redirect│
                    │  • Error: Show Msg │
                    └────────────────────┘
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                      Component State                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  currentStep: number (0-5)                                       │
│  ├─ Controls which step is displayed                            │
│  └─ Updated by Previous/Next buttons                            │
│                                                                   │
│  formData: object                                                │
│  ├─ posting_title, country, city, ...                           │
│  ├─ employer: { company_name, country, city }                   │
│  ├─ contract: { period_years, renewable, ... }                  │
│  ├─ positions: [{ title, vacancies, salary, ... }]              │
│  ├─ skills: []                                                   │
│  ├─ education_requirements: []                                   │
│  ├─ experience_requirements: { min_years, max_years, level }    │
│  └─ expenses: { medical, insurance, ... }                       │
│                                                                   │
│  countries: array                                                │
│  └─ Fetched from API on mount                                   │
│                                                                   │
│  jobTitles: array                                                │
│  └─ Fetched from API on mount                                   │
│                                                                   │
│  loading: boolean                                                │
│  └─ Shows loading state during API calls                        │
│                                                                   │
│  error: string | null                                            │
│  └─ Displays error messages                                     │
│                                                                   │
│  success: string | null                                          │
│  └─ Displays success messages                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Validation Flow

```
User clicks "Next"
       │
       ▼
┌──────────────────┐
│ validateStep()   │
│ Check current    │
│ step fields      │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
  Valid    Invalid
    │         │
    ▼         ▼
┌────────┐ ┌──────────────┐
│ Next   │ │ Show Error   │
│ Step   │ │ Stay on Step │
└────────┘ └──────────────┘
```

## API Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Endpoints                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. GET /countries                                               │
│     └─ Returns: { data: [{ name, code }, ...] }                 │
│                                                                   │
│  2. GET /job-titles                                              │
│     └─ Returns: { data: [{ id, title }, ...] }                  │
│                                                                   │
│  3. POST /agencies/:licenseNumber/job-postings                   │
│     ├─ Headers: { Authorization: Bearer <token> }               │
│     ├─ Body: { ...formData, status: 'draft'|'published' }       │
│     └─ Returns: { id, ...jobPosting }                           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Navigation Structure

```
Sidebar
  │
  ├─ Dashboard
  ├─ Jobs
  ├─ New Job Draft  ← NEW (replaces old Drafts)
  │   └─ /new-job-draft
  ├─ Applications
  ├─ Interviews
  ├─ Workflow
  ├─ Team Members
  ├─ Audit Log
  └─ Settings
```

## Component Hierarchy

```
NewJobDraft (Main Component)
  │
  ├─ Progress Bar
  │   └─ Step Indicators (1-6)
  │
  ├─ Alert Messages
  │   ├─ Error Alert
  │   └─ Success Alert
  │
  ├─ Step Content (Conditional Rendering)
  │   ├─ BasicInfoStep
  │   ├─ EmployerStep
  │   ├─ ContractStep
  │   ├─ PositionsStep
  │   ├─ RequirementsStep
  │   └─ ExpensesStep
  │
  └─ Navigation Buttons
      ├─ Previous Button
      ├─ Save Draft Button
      └─ Next/Publish Button
```
