# UdaanSarathi2 Frontend - Use Cases Analysis

**Generated from API Tracer Data (Port 9000)**  
**Date:** December 3, 2025  
**Total Endpoints:** 78 (36 GET, 27 POST, 12 PATCH, 3 DELETE)

---

## 1. Authentication & User Management

### 1.1 Owner Authentication
**Use Case:** Agency owner registration and login
- `POST /agency/register-owner` - Register new agency owner
- `POST /agency/verify-owner` - Verify owner registration (OTP)
- `POST /agency/login/start-owner` - Initiate owner login (send OTP)
- `POST /agency/login/verify-owner` - Verify owner login (OTP)

### 1.2 Member Authentication
**Use Case:** Team member login
- `POST /member/login` - Member login
- `POST /member/login/start` - Initiate member login (send OTP)
- `POST /member/login/verify` - Verify member login (OTP)

### 1.3 Generic Authentication
**Use Case:** General authentication flow
- `POST /login/start` - Start login process
- `POST /login/verify` - Verify login credentials

**Total Endpoints:** 9

---

## 2. Agency Profile Management

### 2.1 Agency Information
**Use Case:** View and manage agency profile
- `GET /agencies/owner/agency` - Get agency profile
- `POST /agencies/owner/agency` - Create agency profile
- `PATCH /agencies/owner/agency/basic` - Update basic information
- `PATCH /agencies/owner/agency/contact` - Update contact details
- `PATCH /agencies/owner/agency/location` - Update location
- `PATCH /agencies/owner/agency/services` - Update services (3 endpoints)
- `PATCH /agencies/owner/agency/settings` - Update settings
- `PATCH /agencies/owner/agency/social-media` - Update social media links

### 2.2 Public Agency Search
**Use Case:** Search for agencies publicly
- `GET /api/public/agencies/search?${queryString}` - Search agencies
- `GET /agencies/search/config` - Get search configuration
- `GET http://localhost:3000/agencies/search/config` - Local dev search config

**Total Endpoints:** 12

---

## 3. Team Member Management

### 3.1 Member Operations
**Use Case:** Manage team members
- `POST /agencies/owner/members/invite` - Invite new team member
- `PATCH /agencies/owner/members/${memberId}/status` - Update member status
- `DELETE /agencies/owner/members/${memberId}` - Remove team member

**Total Endpoints:** 3

---

## 4. Job Management

### 4.1 Job Listings (Admin View)
**Use Case:** View and manage all jobs
- `GET /admin/jobs?${queryString}` - Get jobs with filters
- `GET /admin/jobs/statistics/countries` - Get job statistics by country

### 4.2 Job Details
**Use Case:** View specific job information
- `GET /agencies/${license}/jobs/${jobId}/details` - Get job details
- `PATCH /jobs/${jobId}/toggle` - Toggle job active/inactive status

### 4.3 Draft Jobs
**Use Case:** Create and manage job drafts before publishing
- `GET /agencies/${license}/draft-jobs` - List all draft jobs
- `GET /agencies/${license}/draft-jobs/${draftId}` - Get draft job details
- `POST /agencies/${license}/draft-jobs` - Create new draft job
- `PATCH /agencies/${license}/draft-jobs/${draftId}` - Update draft job
- `DELETE /agencies/${license}/draft-jobs/${draftId}` - Delete draft job
- `POST /agencies/${license}/draft-jobs/${draftId}/validate` - Validate draft
- `POST /agencies/${license}/draft-jobs/${draftId}/publish` - Publish draft

### 4.4 Job Posting
**Use Case:** Create and publish job postings
- `POST /agencies/${licenseNumber}/job-postings` - Create job posting
- `GET /job-titles` - Get available job titles

**Total Endpoints:** 13

---

## 5. Candidate Management

### 5.1 Candidate Viewing
**Use Case:** View candidate information
- `GET /agencies/${license}/jobs/${jobId}/candidates?${params}` - List candidates for job
- `GET /agencies/${license}/jobs/${jobId}/candidates/${candidateId}/details` - Get candidate details
- `GET /agencies/${license}/jobs/candidates?${params}` - Get all candidates
- `GET /candidates/${candidateId}/documents` - View candidate documents

### 5.2 Bulk Candidate Operations
**Use Case:** Perform actions on multiple candidates
- `POST /agencies/${license}/jobs/${jobId}/candidates/bulk-reject` - Bulk reject candidates
- `POST /agencies/${license}/jobs/${jobId}/candidates/bulk-shortlist` - Bulk shortlist candidates
- `POST /agencies/${license}/jobs/${jobId}/candidates/bulk-schedule-interview` - Bulk schedule interviews
- `POST /agencies/${license}/jobs/${jobId}/candidates/multi-batch-schedule` - Multi-batch interview scheduling

**Total Endpoints:** 8

---

## 6. Application Management

### 6.1 Application Viewing
**Use Case:** View application details
- `GET /applications/${applicationId}` - Get application details

### 6.2 Application Status Updates
**Use Case:** Update application status and workflow
- `POST /applications/${applicationId}/shortlist` - Shortlist application
- `POST /applications/${applicationId}/update-status` - Update application status
- `POST /applications/${applicationId}/withdraw` - Withdraw application

### 6.3 Application Notes
**Use Case:** Add notes to applications
- `GET /application-notes/application/${applicationId}` - Get application notes
- `POST /application-notes` - Create note
- `PATCH /application-notes/${noteId}` - Update note
- `DELETE /application-notes/${noteId}` - Delete note

**Total Endpoints:** 8

---

## 7. Interview Management

### 7.1 Interview Scheduling
**Use Case:** Schedule and manage interviews
- `GET /interviews?${params}` - List interviews with filters
- `GET /agencies/${license}/interviews?${params}` - Get agency interviews
- `POST /applications/${applicationId}/schedule-interview` - Schedule interview
- `POST /applications/${applicationId}/reschedule-interview` - Reschedule interview
- `POST /applications/${applicationId}/complete-interview` - Mark interview complete

### 7.2 Interview Statistics
**Use Case:** View interview analytics
- `GET /agencies/${license}/interviews/stats?date_range=${dateRange}` - Get interview stats
- `GET /agencies/${license}/jobs/interview-stats?${params}` - Get job-specific interview stats

**Total Endpoints:** 7

---

## 8. Internationalization (i18n)

### 8.1 Translation Loading
**Use Case:** Support multiple languages (English, Nepali)
- `GET /translations/${locale}/common.json` (2 endpoints) - Common translations
- `GET /translations/${locale}/pages/${pageName}.json` (3 endpoints) - Page translations
- `GET /translations/${locale}/components/${componentName}.json` (2 endpoints) - Component translations
- `GET /translations/${locale}/${file}` (2 endpoints) - Generic translation files
- `GET /translations/en/pages/landing.json` - English landing page
- `GET /translations/ne/pages/landing.json` - Nepali landing page
- `GET /translations/${language}/pages/landing.json` - Dynamic landing page

**Total Endpoints:** 12

---

## 9. Utilities & System

### 9.1 Reference Data
**Use Case:** Get system reference data
- `GET /countries` - Get list of countries

### 9.2 Error Logging
**Use Case:** Log frontend errors for monitoring
- `POST ${errorLoggingUrl}/log-error` - Log error to monitoring service

### 9.3 Workflow
**Use Case:** Generic workflow operations
- `GET ${API_BASE_URL}${endpoint}` - Dynamic workflow endpoint
- `GET ${baseUrl}${endpoint}` - Dynamic base endpoint

**Total Endpoints:** 4

---

## Summary by Use Case Category

| Category | Endpoints | Percentage |
|----------|-----------|------------|
| Internationalization | 12 | 15.4% |
| Job Management | 13 | 16.7% |
| Agency Profile | 12 | 15.4% |
| Authentication | 9 | 11.5% |
| Candidate Management | 8 | 10.3% |
| Application Management | 8 | 10.3% |
| Interview Management | 7 | 9.0% |
| Utilities & System | 4 | 5.1% |
| Team Management | 3 | 3.8% |
| **Total** | **78** | **100%** |

---

## Key User Journeys

### Journey 1: Agency Owner Onboarding
1. Register as owner (`POST /agency/register-owner`)
2. Verify registration (`POST /agency/verify-owner`)
3. Create agency profile (`POST /agencies/owner/agency`)
4. Update agency details (multiple PATCH endpoints)
5. Invite team members (`POST /agencies/owner/members/invite`)

### Journey 2: Job Posting Workflow
1. Create draft job (`POST /agencies/${license}/draft-jobs`)
2. Update draft (`PATCH /agencies/${license}/draft-jobs/${draftId}`)
3. Validate draft (`POST /agencies/${license}/draft-jobs/${draftId}/validate`)
4. Publish job (`POST /agencies/${license}/draft-jobs/${draftId}/publish`)
5. Monitor job (`GET /agencies/${license}/jobs/${jobId}/details`)

### Journey 3: Candidate Processing
1. View candidates (`GET /agencies/${license}/jobs/${jobId}/candidates`)
2. View candidate details (`GET /agencies/${license}/jobs/${jobId}/candidates/${candidateId}/details`)
3. Shortlist candidates (`POST /agencies/${license}/jobs/${jobId}/candidates/bulk-shortlist`)
4. Schedule interviews (`POST /agencies/${license}/jobs/${jobId}/candidates/bulk-schedule-interview`)
5. Complete interview (`POST /applications/${applicationId}/complete-interview`)
6. Update application status (`POST /applications/${applicationId}/update-status`)

### Journey 4: Interview Management
1. View scheduled interviews (`GET /agencies/${license}/interviews`)
2. View interview statistics (`GET /agencies/${license}/interviews/stats`)
3. Reschedule if needed (`POST /applications/${applicationId}/reschedule-interview`)
4. Mark complete (`POST /applications/${applicationId}/complete-interview`)

---

## API Method Distribution

- **GET (46.2%)** - Primarily for viewing data (jobs, candidates, interviews, translations)
- **POST (34.6%)** - Creating resources and triggering actions (auth, scheduling, bulk operations)
- **PATCH (15.4%)** - Updating existing resources (agency profile, draft jobs, notes)
- **DELETE (3.8%)** - Removing resources (draft jobs, members, notes)

---

## Technology Stack Insights

### Frontend Framework
- **React** - Single Page Application

### API Communication Patterns
- RESTful API calls
- OTP-based authentication
- Bulk operations support
- Draft/publish workflow
- Multi-language support (i18n)

### Key Features
1. **Multi-tenant** - License-based agency isolation
2. **Bilingual** - English and Nepali support
3. **Role-based** - Owner and Member roles
4. **Workflow-driven** - Draft → Validate → Publish
5. **Bulk operations** - Efficient candidate management
6. **Real-time stats** - Interview and job statistics

---

**Analysis Complete**  
**Generated by:** API Tracer Server (Port 9000)  
**Frontend:** UdaanSarathi2 (React)  
**Total Use Cases Identified:** 9 major categories, 78 endpoints
