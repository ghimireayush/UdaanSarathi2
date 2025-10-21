# UdaanSarathi - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Page-by-Page Documentation](#page-by-page-documentation)
4. [Features & Functionality](#features--functionality)
5. [Technical Stack](#technical-stack)
6. [User Roles & Permissions](#user-roles--permissions)
7. [Workflows](#workflows)
8. [API Integration](#api-integration)
9. [Recent Updates](#recent-updates)

---

## Project Overview

### What is UdaanSarathi?

UdaanSarathi is a comprehensive recruitment management system designed specifically for foreign employment agencies in Nepal. The platform streamlines the entire recruitment lifecycle from job posting creation to candidate placement.

### Purpose
- Manage foreign employment job postings
- Track candidate applications and interviews
- Handle agency operations and compliance
- Facilitate team collaboration
- Ensure regulatory compliance with Nepali labor laws

### Target Users
- Foreign Employment Agencies
- Recruitment Officers
- HR Managers
- Agency Administrators
- Team Members with various roles

---

## System Architecture

### Frontend Architecture
- **Framework:** React 18+ with Hooks
- **Routing:** React Router v6
- **State Management:** Context API + Local State
- **Styling:** Tailwind CSS with dark mode support
- **Icons:** Lucide React
- **Date Handling:** date-fns

### Key Contexts
1. **AgencyContext** - Agency-wide data and settings
2. **NotificationContext** - Real-time notifications
3. **ThemeContext** - Light/Dark mode management
4. **LanguageContext** - Multi-language support (English/Nepali)

### Service Layer
- **jobService** - Job posting operations
- **applicationService** - Application management
- **interviewService** - Interview scheduling
- **candidateService** - Candidate data
- **authService** - Authentication & permissions
- **constantsService** - System constants
- **i18nService** - Internationalization

---

## Page-by-Page Documentation

### 1. Login Page (`/login`)

**Purpose:** User authentication entry point

**Features:**
- Email/password authentication
- Remember me functionality
- Password visibility toggle
- Error handling and validation
- Redirect to dashboard on success

**User Flow:**
1. Enter credentials
2. Click "Sign In"
3. System validates credentials
4. Redirect to dashboard if successful
5. Show error message if failed

**Permissions:** Public (no authentication required)

---

### 2. Member Login Page (`/login/member`)

**Purpose:** Separate login for team members

**Features:**
- Member-specific authentication
- Role-based access control
- Different permission levels
- Team member dashboard access

**User Flow:**
1. Team member enters credentials
2. System validates member status
3. Redirect to appropriate dashboard
4. Apply role-based restrictions

**Permissions:** Public (no authentication required)

---

### 3. Registration Page (`/register`)

**Purpose:** New agency registration

**Features:**
- Agency information collection
- License number validation
- Contact details
- Terms and conditions acceptance
- Email verification

**Form Fields:**
- Agency name
- License number
- Contact person
- Email address
- Phone number
- Password
- Confirm password

**User Flow:**
1. Fill registration form
2. Validate license number
3. Submit registration
4. Email verification sent
5. Redirect to company setup

**Permissions:** Public (no authentication required)

---

### 4. Company Setup Page (`/setup-company`)

**Purpose:** Initial agency configuration after registration

**Features:**
- Company profile setup
- Logo upload
- Address details
- Business information
- Initial settings configuration

**Setup Steps:**
1. Basic company information
2. Contact details
3. Business registration details
4. Upload documents
5. Configure preferences

**Permissions:** Authenticated (new registrations only)

---

### 5. Dashboard Page (`/` or `/dashboard`)

**Purpose:** Main overview and analytics hub

**Features:**
- Key metrics display
- Recent activities
- Quick actions
- Performance charts
- Notifications panel
- Upcoming interviews
- Application statistics

**Widgets:**
- Total Jobs (Active/Draft/Closed)
- Total Applications
- Interview Schedule
- Recent Activities
- Performance Metrics
- Quick Links

**User Flow:**
1. User logs in
2. Dashboard loads with latest data
3. View key metrics at a glance
4. Access quick actions
5. Navigate to detailed pages

**Permissions:** VIEW_DASHBOARD

---

### 6. Jobs Page (`/jobs`)

**Purpose:** Manage all published job postings

**Features:**
- Job listing with filters
- Search functionality
- Sort options (date, title, country)
- View modes (grid/list)
- Job status indicators
- Quick actions (view, edit, pause, close)
- Pagination

**Filters:**
- Country
- Status (Active/Paused/Closed)
- Date range
- Salary range
- Job category

**Job Card Information:**
- Job title
- Company name
- Country & city
- Salary range
- Number of positions
- Application count
- Posted date
- Status badge

**Actions:**
- View details
- Edit job
- Pause/Resume
- Close job
- View applications
- Share job

**User Flow:**
1. Navigate to Jobs page
2. Apply filters if needed
3. Browse job listings
4. Click on job for details
5. Perform actions as needed

**Permissions:** VIEW_JOBS

---

### 7. Job Details Page (`/jobs/:id`)

**Purpose:** Detailed view of a specific job posting

**Features:**
- Complete job information
- Application statistics
- Applicant list
- Interview schedule
- Job performance metrics
- Edit capabilities
- Share options

**Sections:**
1. **Job Overview**
   - Title and company
   - Location
   - Salary details
   - Contract terms
   - Posted date

2. **Job Description**
   - Responsibilities
   - Requirements
   - Skills needed
   - Experience required
   - Education requirements

3. **Contract Details**
   - Duration
   - Working hours
   - Benefits (food, accommodation, transport)
   - Leave policy
   - Overtime policy

4. **Positions**
   - Position titles
   - Vacancies (male/female)
   - Salary per position
   - Position-specific requirements

5. **Expenses**
   - Medical costs
   - Visa fees
   - Travel expenses
   - Training costs
   - Who pays what

6. **Applications**
   - Total applications
   - Shortlisted candidates
   - Rejected candidates
   - Interview scheduled
   - Application timeline

7. **Interview Details**
   - Interview date and time
   - Location
   - Contact person
   - Required documents

**Actions:**
- Edit job
- Pause/Close job
- View applications
- Schedule interview
- Download report
- Share job

**User Flow:**
1. Click on job from listing
2. View complete details
3. Review applications
4. Take actions as needed
5. Navigate to related pages

**Permissions:** VIEW_JOBS

---

### 8. Job Shortlist Page (`/jobs/:jobId/shortlist`)

**Purpose:** Manage shortlisted candidates for a specific job

**Features:**
- Shortlisted candidate list
- Candidate comparison
- Bulk actions
- Interview scheduling
- Status updates
- Notes and comments

**Candidate Information:**
- Name and photo
- Contact details
- Experience
- Skills
- Education
- Application date
- Current status

**Actions:**
- Schedule interview
- Move to next stage
- Reject candidate
- Add notes
- Download CV
- Contact candidate

**User Flow:**
1. Navigate from job details
2. View shortlisted candidates
3. Compare candidates
4. Schedule interviews
5. Update statuses

**Permissions:** VIEW_APPLICATIONS

---

### 9. Applications Page (`/applications`)

**Purpose:** Centralized application management

**Features:**
- All applications across jobs
- Advanced filtering
- Stage-based view
- Bulk operations
- Application tracking
- Status updates

**Application Stages:**
1. New Applications
2. Under Review
3. Shortlisted
4. Interview Scheduled
5. Interview Completed
6. Selected
7. Rejected

**Filters:**
- Job title
- Country
- Application stage
- Date range
- Candidate name
- Skills

**Application Card:**
- Candidate name
- Applied job
- Application date
- Current stage
- Quick actions

**Bulk Actions:**
- Move to stage
- Schedule interviews
- Send emails
- Export data
- Reject multiple

**User Flow:**
1. View all applications
2. Filter by criteria
3. Review applications
4. Update stages
5. Take actions

**Permissions:** VIEW_APPLICATIONS

---

### 10. Interviews Page (`/interviews`)

**Purpose:** Interview scheduling and management

**Features:**
- Interview calendar view
- Upcoming interviews
- Past interviews
- Interview scheduling
- Candidate details
- Interview feedback
- Rescheduling options

**Views:**
- Calendar view
- List view
- Timeline view

**Interview Information:**
- Candidate name
- Job title
- Interview date/time
- Interview type (in-person/video)
- Location/link
- Interviewer
- Status

**Interview Statuses:**
- Scheduled
- Confirmed
- In Progress
- Completed
- Cancelled
- Rescheduled

**Actions:**
- Schedule new interview
- Reschedule
- Cancel interview
- Add feedback
- Mark as completed
- Send reminders

**User Flow:**
1. View interview schedule
2. Check upcoming interviews
3. Schedule new interviews
4. Conduct interviews
5. Add feedback
6. Update status

**Permissions:** VIEW_INTERVIEWS, SCHEDULE_INTERVIEW

---

### 11. Workflow Page (`/workflow`)

**Purpose:** Visualize and manage recruitment workflow

**Features:**
- Kanban board view
- Drag-and-drop functionality
- Stage customization
- Workflow automation
- Progress tracking
- Bottleneck identification

**Workflow Stages:**
1. Application Received
2. Initial Screening
3. Shortlisted
4. Interview Scheduled
5. Interview Completed
6. Final Selection
7. Offer Extended
8. Accepted/Rejected

**Features per Stage:**
- Candidate count
- Average time in stage
- Success rate
- Actions available
- Automation rules

**Actions:**
- Move candidates between stages
- Add notes
- Set reminders
- Assign to team members
- Bulk operations

**User Flow:**
1. View workflow board
2. See candidates in each stage
3. Drag candidates to next stage
4. Add notes and updates
5. Monitor progress

**Permissions:** VIEW_WORKFLOW

---

### 12. Drafts Page (`/drafts`)

**Purpose:** Manage unpublished job drafts

**Features:**
- Draft listing
- Create new draft
- Edit existing drafts
- Bulk draft creation
- Preview drafts
- Publish drafts
- Delete drafts

**Draft Types:**
1. **Single Draft** - One detailed job posting
2. **Bulk Draft** - Multiple jobs at once

**Draft Information:**
- Draft title
- Country
- Company
- Creation date
- Last updated
- Completion status
- Progress indicator (X/8 steps)

**Draft Statuses:**
- Incomplete (partial)
- Complete (ready to publish)
- Bulk draft

**Actions:**
- Create new draft
- Edit draft
- Preview draft
- Publish draft
- Delete draft
- Expand bulk draft
- Duplicate draft

**View Modes:**
- Grid view
- List view

**Filters:**
- Country
- Company
- Category
- Date range
- Completion status

**User Flow:**
1. Navigate to Drafts page
2. Click "Create Draft"
3. Choose single or bulk
4. Fill in details
5. Save progress
6. Preview draft
7. Publish when ready

**Permissions:** CREATE_JOB, EDIT_JOB

---

### 13. Draft Wizard Page (`/draftwizard`)

**Purpose:** Step-by-step job draft creation

**Features:**
- 8-step wizard process
- Progress tracking
- Field validation
- Save and exit
- Auto-save
- Preview mode
- AI insights per step

**Wizard Steps:**

#### Step 1: Posting Details
**Fields:**
- City
- LT Number
- Chalani Number
- Approval Date
- Posting Date
- Announcement Type
- Notes

**Validation:**
- All fields required except notes
- Date validation
- LT/Chalani format check

#### Step 2: Contract
**Fields:**
- Contract period (years)
- Renewable (yes/no)
- Hours per day
- Days per week
- Overtime policy
- Weekly off days
- Food provision
- Accommodation
- Transport
- Annual leave days

**Validation:**
- Period: 1-10 years
- Hours: 1-16 per day
- Days: 1-7 per week
- All provisions required

#### Step 3: Positions
**Features:**
- Add multiple positions
- Position-specific details
- Contract overrides per position

**Fields per Position:**
- Position title
- Vacancies (male/female)
- Monthly salary
- Currency
- Contract overrides (optional)
- Position notes

**Validation:**
- At least one position required
- Total vacancies > 0
- Salary > 0
- Currency required

#### Step 4: Tags & Canonical Titles
**Fields:**
- Skills (multiple)
- Education requirements
- Experience requirements
  - Minimum years
  - Preferred years
  - Experience domains
- Canonical job titles

**Validation:**
- At least one skill
- At least one education requirement
- At least one experience domain
- At least one canonical title

#### Step 5: Expenses
**Features:**
- Add multiple expenses
- Free or paid options

**Fields per Expense:**
- Expense type
- Who pays
- Is free (yes/no)
- Amount (if not free)
- Currency
- Notes

**Expense Types:**
- Medical
- Insurance
- Travel
- Visa/Permit
- Training
- Welfare/Service

**Validation:**
- Type and payer required
- Amount required if not free

#### Step 6: Cutout
**Features:**
- Image upload
- Preview
- File validation

**Supported Formats:**
- JPG, JPEG, PNG
- Max size: 10MB

**Actions:**
- Upload image
- Preview image
- Remove image
- Replace image

**Validation:**
- Optional step
- File type validation
- File size validation

#### Step 7: Interview
**Fields:**
- Interview date
- Interview time
- Location
- Contact person
- Required documents
- Notes
- Interview expenses

**Validation:**
- All fields optional
- Time format validation
- Date validation

#### Step 8: Review and Publish
**Features:**
- Complete draft review
- All sections displayed
- Edit any section
- Validation summary
- Publish or save as draft

**Review Sections:**
- Posting details summary
- Contract terms summary
- All positions listed
- Tags and requirements
- Expenses breakdown
- Cutout preview
- Interview details

**Actions:**
- Edit any step
- Save as draft
- Publish job

**Wizard Features:**
- Progress indicator
- Step navigation
- Save and exit (any step)
- Field validation
- Error messages
- AI insights
- Help tooltips

**User Flow:**
1. Navigate to /draftwizard
2. Complete Step 1 (Posting Details)
3. Click "Next" or "Save & Exit"
4. Complete remaining steps
5. Review all information
6. Publish or save as draft

**Permissions:** CREATE_JOB, EDIT_JOB

---

### 14. Settings Page (`/settings`)

**Purpose:** Agency configuration and preferences

**Features:**
- Agency profile
- User preferences
- System settings
- Notification settings
- Integration settings
- Security settings

**Settings Sections:**

#### Agency Profile
- Agency name
- License number
- Logo
- Contact information
- Address
- Business details

#### User Preferences
- Language (English/Nepali)
- Theme (Light/Dark)
- Date format
- Currency
- Timezone
- Notifications

#### System Settings
- Email templates
- Workflow stages
- Custom fields
- Automation rules
- Data retention

#### Notification Settings
- Email notifications
- In-app notifications
- SMS notifications
- Notification frequency
- Notification types

#### Integration Settings
- API keys
- Webhooks
- Third-party integrations
- Export settings

#### Security Settings
- Password policy
- Two-factor authentication
- Session timeout
- IP whitelist
- Audit logs

**User Flow:**
1. Navigate to Settings
2. Select section
3. Update settings
4. Save changes
5. Confirm updates

**Permissions:** MANAGE_SETTINGS

---

### 15. Audit Log Page (`/auditlog`)

**Purpose:** Track all system activities

**Features:**
- Activity timeline
- User actions
- System events
- Filter and search
- Export logs

**Log Information:**
- Timestamp
- User
- Action type
- Resource affected
- IP address
- Details

**Action Types:**
- User login/logout
- Job created/edited/deleted
- Application status changed
- Interview scheduled
- Settings updated
- User added/removed

**Filters:**
- Date range
- User
- Action type
- Resource type

**User Flow:**
1. Navigate to Audit Log
2. Apply filters
3. Review activities
4. Export if needed

**Permissions:** VIEW_AUDIT_LOGS

---

### 16. Team Members Page (`/teammembers`)

**Purpose:** Manage agency team members

**Features:**
- Member listing
- Add new members
- Edit member details
- Role assignment
- Permission management
- Deactivate members

**Member Information:**
- Name
- Email
- Role
- Permissions
- Status (active/inactive)
- Last login
- Join date

**Roles:**
- Admin
- Manager
- Recruiter
- Viewer

**Permissions:**
- View jobs
- Create jobs
- Edit jobs
- Delete jobs
- View applications
- Manage applications
- Schedule interviews
- View reports
- Manage settings
- Manage members

**Actions:**
- Add member
- Edit member
- Change role
- Update permissions
- Deactivate member
- Resend invitation

**User Flow:**
1. Navigate to Team Members
2. Click "Add Member"
3. Enter member details
4. Assign role and permissions
5. Send invitation
6. Member receives email
7. Member accepts invitation

**Permissions:** MANAGE_MEMBERS

---

### 17. MVP Testing Dashboard (`/mvp-testing`)

**Purpose:** Internal testing and quality assurance

**Features:**
- Feature testing
- Bug reporting
- Performance metrics
- Test scenarios
- Test results

**Testing Categories:**
- Authentication
- Job management
- Application workflow
- Interview scheduling
- Reporting
- Integrations

**User Flow:**
1. Navigate to MVP Testing
2. Select test category
3. Run test scenarios
4. Report issues
5. View results

**Permissions:** MANAGE_SETTINGS (admin only)

---

## Features & Functionality

### Core Features

#### 1. Job Management
- Create detailed job postings
- Draft system with 8-step wizard
- Bulk job creation
- Job templates
- Job duplication
- Job status management (active/paused/closed)
- Job analytics

#### 2. Application Management
- Application tracking
- Stage-based workflow
- Bulk operations
- Application filtering
- Candidate profiles
- Document management
- Communication history

#### 3. Interview Management
- Interview scheduling
- Calendar integration
- Interview reminders
- Video interview links
- Interview feedback
- Rescheduling
- Interview analytics

#### 4. Candidate Management
- Candidate database
- Profile management
- Document storage
- Communication history
- Candidate notes
- Candidate search
- Candidate matching

#### 5. Team Collaboration
- Role-based access
- Permission management
- Activity tracking
- Internal notes
- Task assignment
- Notifications

#### 6. Reporting & Analytics
- Job performance
- Application metrics
- Interview statistics
- Conversion rates
- Time-to-hire
- Source tracking
- Custom reports

#### 7. Compliance & Documentation
- LT number tracking
- Chalani number management
- Approval dates
- Document storage
- Audit trail
- Regulatory compliance

### Advanced Features

#### 1. Multi-language Support
- English
- Nepali (Devanagari)
- Dynamic translation
- Language switching

#### 2. Dark Mode
- System-wide dark theme
- User preference
- Automatic switching
- Consistent styling

#### 3. Responsive Design
- Mobile-friendly
- Tablet optimized
- Desktop experience
- Touch-friendly

#### 4. Real-time Updates
- Live notifications
- Auto-refresh
- WebSocket support
- Push notifications

#### 5. Data Export
- CSV export
- PDF reports
- Excel export
- Custom formats

#### 6. Search & Filters
- Advanced search
- Multiple filters
- Saved searches
- Quick filters

---

## Technical Stack

### Frontend
- **React** 18.2.0
- **React Router** 6.x
- **Tailwind CSS** 3.x
- **Lucide React** (icons)
- **date-fns** (date handling)

### State Management
- React Context API
- Local component state
- Custom hooks

### Styling
- Tailwind CSS
- CSS Modules
- Dark mode support
- Responsive utilities

### Build Tools
- Vite
- ESLint
- Prettier

### Testing
- Manual testing
- Component testing
- Integration testing

---

## User Roles & Permissions

### Admin
**Full Access:**
- All job operations
- All application operations
- All interview operations
- Team management
- Settings management
- Audit logs
- Reports

### Manager
**Limited Admin:**
- Create/edit/delete jobs
- Manage applications
- Schedule interviews
- View reports
- Manage team members (limited)

### Recruiter
**Operational:**
- Create/edit jobs
- Manage applications
- Schedule interviews
- View reports

### Viewer
**Read-only:**
- View jobs
- View applications
- View interviews
- View reports

---

## Workflows

### Job Posting Workflow

1. **Draft Creation**
   - Create draft (single or bulk)
   - Fill 8-step wizard
   - Save progress
   - Preview draft

2. **Review & Approval**
   - Review all details
   - Validate information
   - Get internal approval
   - Make corrections if needed

3. **Publishing**
   - Publish job
   - Job goes live
   - Notifications sent
   - Job appears in listings

4. **Management**
   - Monitor applications
   - Update job details
   - Pause if needed
   - Close when filled

### Application Workflow

1. **Application Received**
   - Candidate applies
   - Application logged
   - Notification sent
   - Initial screening

2. **Review**
   - Review application
   - Check qualifications
   - Verify documents
   - Shortlist or reject

3. **Shortlisting**
   - Move to shortlist
   - Compare candidates
   - Schedule interviews
   - Notify candidates

4. **Interview**
   - Conduct interview
   - Add feedback
   - Evaluate candidate
   - Make decision

5. **Selection**
   - Select candidate
   - Send offer
   - Process documents
   - Onboarding

### Interview Workflow

1. **Scheduling**
   - Select candidates
   - Choose date/time
   - Set location/link
   - Send invitations

2. **Confirmation**
   - Candidate confirms
   - Send reminders
   - Prepare materials
   - Brief interviewers

3. **Conducting**
   - Conduct interview
   - Take notes
   - Evaluate candidate
   - Record feedback

4. **Follow-up**
   - Review feedback
   - Make decision
   - Notify candidate
   - Update status

---

## API Integration

### Job Service
- `getJobs()` - Fetch all jobs
- `getJobById(id)` - Get job details
- `createDraftJob(data)` - Create draft
- `updateJob(id, data)` - Update job
- `publishJob(id)` - Publish job
- `pauseJob(id)` - Pause job
- `closeJob(id)` - Close job
- `getDraftJobs()` - Get all drafts

### Application Service
- `getApplications(filters)` - Fetch applications
- `getApplicationById(id)` - Get application details
- `updateApplicationStage(id, stage)` - Update stage
- `shortlistApplication(id)` - Shortlist candidate
- `rejectApplication(id)` - Reject candidate

### Interview Service
- `getInterviews(filters)` - Fetch interviews
- `scheduleInterview(data)` - Schedule interview
- `updateInterview(id, data)` - Update interview
- `cancelInterview(id)` - Cancel interview
- `addInterviewFeedback(id, feedback)` - Add feedback

### Auth Service
- `login(credentials)` - User login
- `logout()` - User logout
- `register(data)` - User registration
- `checkPermission(permission)` - Check permission

---

## Recent Updates

### Version 2.0.0 (Latest)

#### Major Changes
1. **Draft Wizard Conversion**
   - Converted from modal to full-page
   - Added /draftwizard route
   - Browser navigation support
   - Shareable URLs

2. **Data Synchronization**
   - Auto-refetch mechanism
   - Real-time updates
   - Data formatting layer
   - Preview compatibility

3. **UI Improvements**
   - Positive validation messages
   - Orange color indicators
   - Better error handling
   - Improved accessibility

4. **Simplification**
   - Removed BS date format
   - Simplified date inputs
   - Cleaner validation
   - Reduced complexity

#### Technical Improvements
- Fixed all TypeScript errors
- Fixed all ESLint warnings
- Improved code organization
- Better error handling
- Enhanced performance

#### Test Results
- 21/21 tests passed
- 0 errors
- 0 warnings
- Production ready

---

## Best Practices

### For Users
1. Complete all required fields
2. Save drafts frequently
3. Preview before publishing
4. Use filters for better search
5. Keep candidate data updated
6. Schedule interviews promptly
7. Add feedback after interviews
8. Monitor application pipeline

### For Developers
1. Follow React best practices
2. Use TypeScript for type safety
3. Write clean, maintainable code
4. Add proper error handling
5. Test before committing
6. Document complex logic
7. Use consistent naming
8. Follow project structure

---

## Support & Resources

### Documentation
- UPDATE.md - Recent changes
- DRAFT_WIZARD_INTEGRATION.md - Wizard guide
- SYNC_FIX_SUMMARY.md - Sync fixes
- PREVIEW_FIX_SUMMARY.md - Preview fixes
- POSITIVE_VALIDATION_UPDATE.md - Validation updates
- BS_DATE_REMOVAL_SUMMARY.md - Date format changes
- DRAFT_WIZARD_TEST_RESULTS.md - Test results
- FINAL_VERIFICATION.md - Verification checklist

### Getting Help
1. Check documentation
2. Review test results
3. Check audit logs
4. Contact support team

---

**Document Version:** 1.0.0  
**Last Updated:** 2025-10-16  
**Status:** Complete ✅
