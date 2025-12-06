# Untranslated Status Report

## Summary
Found **5 instances** where status is displayed without translation.

## Files Needing Fixes

### 1. Members.jsx (Line 413) ❌
**Current:**
```javascript
{member.status}
```

**Should be:**
```javascript
{tPage(`memberStatus.${member.status}`)}
```

**Status Values:** `active`, `inactive`, `pending`

---

### 2. OwnerAnalytics.jsx (Line 553) ❌
**Current:**
```javascript
{agency.status}
```

**Should be:**
```javascript
{tPage(`agencyStatus.${agency.status}`)}
```

**Status Values:** `active`, `inactive`, `pending`, `suspended`

---

### 3. OwnerAgencyDetails.jsx (Lines 472, 833, 925) ❌
**Current:**
```javascript
{agency.status}  // Line 472
{job.status}     // Line 833
{job.status}     // Line 925
```

**Should be:**
```javascript
{tPage(`agencyStatus.${agency.status}`)}  // Line 472
{tPage(`jobStatus.${job.status}`)}        // Line 833
{tPage(`jobStatus.${job.status}`)}        // Line 925
```

**Status Values:**
- Agency: `active`, `inactive`, `pending`, `suspended`
- Job: `draft`, `published`, `closed`, `paused`

---

## Already Correct ✅

### JobShortlist.jsx (Line 416)
```javascript
{tPage(`jobHeader.status.${job.status}`)} // ✅ Already translated
```

### OwnerAgencies.jsx (Lines 1025, 1151, 1326)
```javascript
{tPage(`status.${agency.status}`)} // ✅ Already translated
```

### Applications.jsx
```javascript
{getStageLabel(application.stage)} // ✅ Uses i18n-aware constantsService
```

---

## Translation Keys Needed

### English (`/public/translations/en/pages/members.json`)
```json
{
  "memberStatus": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending"
  }
}
```

### Nepali (`/public/translations/ne/pages/members.json`)
```json
{
  "memberStatus": {
    "active": "सक्रिय",
    "inactive": "निष्क्रिय",
    "pending": "बाँकी"
  }
}
```

### English (`/public/translations/en/pages/owner-analytics.json`)
```json
{
  "agencyStatus": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "suspended": "Suspended"
  }
}
```

### Nepali (`/public/translations/ne/pages/owner-analytics.json`)
```json
{
  "agencyStatus": {
    "active": "सक्रिय",
    "inactive": "निष्क्रिय",
    "pending": "बाँकी",
    "suspended": "निलम्बित"
  }
}
```

### English (`/public/translations/en/pages/owner-details.json`)
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

### Nepali (`/public/translations/ne/pages/owner-details.json`)
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

---

## Important Notes

### ✅ API Calls - Keep English
Status comparisons and API calls should **always use English values**:

```javascript
// ✅ CORRECT - API logic uses English
if (application.stage === 'applied') { ... }
if (member.status === 'active') { ... }
await updateStatus(id, 'shortlisted')

// ❌ WRONG - Don't translate for API
if (application.stage === 'आवेदन दिएको') { ... }
```

### ✅ Display - Use Translation
Only translate when **displaying to users**:

```javascript
// ✅ CORRECT - Display uses translation
<span>{tPage(`status.${item.status}`)}</span>
<span>{getStageLabel(application.stage)}</span>

// ❌ WRONG - Direct display without translation
<span>{item.status}</span>
```

---

## Action Items

- [ ] Add translation keys to all required JSON files
- [ ] Update Members.jsx line 413
- [ ] Update OwnerAnalytics.jsx line 553
- [ ] Update OwnerAgencyDetails.jsx lines 472, 833, 925
- [ ] Test in Nepali language
- [ ] Test in English language
- [ ] Verify API calls still use English values

---

**Total Fixes Needed:** 5 instances across 3 files  
**Translation Files to Update:** 6 files (3 English + 3 Nepali)  
**Estimated Time:** 30 minutes

**Date:** December 3, 2025
