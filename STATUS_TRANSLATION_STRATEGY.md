# Status Translation Strategy

## Problem
Status values are displayed in English even when the UI is in Nepali, creating a poor user experience with mixed languages.

## Key Principle
**Separation of Concerns:**
- **API Communication:** Always use English status values (e.g., "applied", "shortlisted")
- **UI Display:** Show translated status based on user's locale (e.g., "आवेदन दिएको", "छनोट सूचीमा")

## Status Types in the System

### 1. Application/Workflow Stages
**English Values (API):**
- `applied` - Initial application
- `shortlisted` - Selected for interview
- `interview-scheduled` / `interview_scheduled` - Interview scheduled
- `interview-passed` / `interview_passed` - Interview passed
- `rejected` - Application rejected

**Translation Keys:**
- `applications.applicationStatus.applied`
- `applications.applicationStatus.shortlisted`
- `applications.applicationStatus.interviewScheduled`
- `applications.applicationStatus.interviewPassed`
- `applications.applicationStatus.rejected`

**Nepali Translations:**
- आवेदन दिएको (Applied)
- छनोट सूचीमा (Shortlisted)
- अन्तर्वार्ता निर्धारित (Interview Scheduled)
- अन्तर्वार्ता उत्तीर्ण (Interview Passed)
- अस्वीकृत (Rejected)

### 2. Interview Status
**English Values (API):**
- `scheduled` - Interview scheduled
- `completed` - Interview completed
- `cancelled` - Interview cancelled
- `no-show` / `no_show` - Candidate didn't show up
- `rescheduled` - Interview rescheduled

**Translation Keys:**
- `interviews.status.scheduled`
- `interviews.status.completed`
- `interviews.status.cancelled`
- `interviews.status.noShow`
- `interviews.status.rescheduled`

**Nepali Translations:**
- निर्धारित (Scheduled)
- पूरा भएको (Completed)
- रद्द गरिएको (Cancelled)
- उपस्थित नभएको (No Show)
- पुनः निर्धारित (Rescheduled)

### 3. Job Status
**English Values (API):**
- `draft` - Job in draft state
- `published` - Job published
- `closed` - Job closed
- `paused` - Job paused

**Translation Keys:**
- `jobs.status.draft`
- `jobs.status.published`
- `jobs.status.closed`
- `jobs.status.paused`

### 4. Agency Status
**English Values (API):**
- `active` - Agency active
- `inactive` - Agency inactive
- `pending` - Agency pending approval
- `suspended` - Agency suspended

**Translation Keys:**
- `owner-agencies.status.active`
- `owner-agencies.status.inactive`
- `owner-agencies.status.pending`
- `owner-agencies.status.suspended`

### 5. Member Status
**English Values (API):**
- `active` - Member active
- `inactive` - Member inactive
- `pending` - Invitation pending

## Implementation Strategy

### ✅ Already Fixed
1. **constantsService.js**
   - `getApplicationStageLabel(stage, t)` - Now i18n-aware
   - `getInterviewStatusLabel(status, t)` - Now i18n-aware

### 🔧 Need to Fix

#### High Priority (Visible to Users)

1. **Members.jsx** (Line 413)
```javascript
// BEFORE (English only)
{member.status}

// AFTER (Translated)
{tPage(`memberStatus.${member.status}`)}
```

2. **OwnerAnalytics.jsx** (Line 553)
```javascript
// BEFORE
{agency.status}

// AFTER
{tPage(`agencyStatus.${agency.status}`)}
```

3. **OwnerAgencyDetails.jsx** (Lines 329, 472, 833, 925)
```javascript
// BEFORE
{state.agencyDetails?.status}
{agency.status}
{job.status}

// AFTER
{tPage(`agencyStatus.${state.agencyDetails?.status}`)}
{tPage(`agencyStatus.${agency.status}`)}
{tPage(`jobStatus.${job.status}`)}
```

#### Already Correct ✅

1. **JobShortlist.jsx** (Line 416)
```javascript
{tPage(`jobHeader.status.${job.status}`)} // ✅ Already using translation
```

2. **OwnerAgencies.jsx** (Lines 1025, 1151, 1326)
```javascript
{tPage(`status.${agency.status}`)} // ✅ Already using translation
```

3. **Applications.jsx**
```javascript
{getStageLabel(application.stage)} // ✅ Uses constantsService which is now i18n-aware
```

## Translation Files to Update

### Add Missing Translations

#### 1. `/public/translations/en/pages/members.json`
```json
{
  "memberStatus": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending"
  }
}
```

#### 2. `/public/translations/ne/pages/members.json`
```json
{
  "memberStatus": {
    "active": "सक्रिय",
    "inactive": "निष्क्रिय",
    "pending": "बाँकी"
  }
}
```

#### 3. `/public/translations/en/pages/owner-details.json`
```json
{
  "agencyStatus": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "suspended": "Suspended"
  },
  "jobStatus": {
    "draft": "Draft",
    "published": "Published",
    "closed": "Closed",
    "paused": "Paused"
  }
}
```

#### 4. `/public/translations/ne/pages/owner-details.json`
```json
{
  "agencyStatus": {
    "active": "सक्रिय",
    "inactive": "निष्क्रिय",
    "pending": "बाँकी",
    "suspended": "निलम्बित"
  },
  "jobStatus": {
    "draft": "मस्यौदा",
    "published": "प्रकाशित",
    "closed": "बन्द",
    "paused": "रोकिएको"
  }
}
```

## Testing Checklist

### Manual Testing
- [ ] Switch to Nepali language
- [ ] Check Applications page - all statuses in Nepali
- [ ] Check Interviews page - all statuses in Nepali
- [ ] Check Jobs page - all statuses in Nepali
- [ ] Check Members page - all statuses in Nepali
- [ ] Check Agency Details - all statuses in Nepali
- [ ] Switch back to English - verify all statuses in English

### API Testing
- [ ] Create application - verify API receives English status
- [ ] Update application status - verify API receives English status
- [ ] Schedule interview - verify API receives English status
- [ ] Filter by status - verify API receives English status

## Code Pattern

### ❌ Wrong (Direct Display)
```javascript
<span>{application.status}</span>
<span>{interview.status}</span>
<span>{job.status}</span>
```

### ✅ Correct (Translated Display)
```javascript
// Option 1: Using translation function
<span>{tPage(`applicationStatus.${application.status}`)}</span>

// Option 2: Using constantsService helper
<span>{constantsService.getApplicationStageLabel(application.stage, tPage)}</span>

// Option 3: Using helper function in component
const getStatusLabel = (status) => tPage(`status.${status}`)
<span>{getStatusLabel(application.status)}</span>
```

### ✅ API Calls (Always English)
```javascript
// Sending to API - use raw English value
await applicationService.updateStatus(applicationId, 'shortlisted')

// Filtering - use raw English value
const filtered = applications.filter(app => app.status === 'applied')

// Comparing - use raw English value
if (application.status === 'interview-scheduled') {
  // ...
}
```

## Benefits

1. **Consistent UX** - All text in user's chosen language
2. **API Compatibility** - Backend always receives English values
3. **Maintainable** - Single source of truth for translations
4. **Scalable** - Easy to add new languages
5. **Type-safe** - Translation keys can be validated

## Migration Priority

### Phase 1 (Critical - User-Facing) ✅
- [x] Application status in Applications page
- [x] Interview status in Interviews page
- [x] Relative time strings

### Phase 2 (High Priority)
- [ ] Member status in Members page
- [ ] Agency status in Agency pages
- [ ] Job status in Job pages

### Phase 3 (Nice to Have)
- [ ] Audit log status
- [ ] Notification status
- [ ] System status messages

---

**Status:** Phase 1 Complete ✅  
**Next:** Implement Phase 2 fixes  
**Date:** December 3, 2025
