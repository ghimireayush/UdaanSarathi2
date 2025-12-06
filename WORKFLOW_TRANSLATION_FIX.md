# Workflow Page Translation Fix

## Problem
The WorkflowV2 page (`http://localhost:5850/workflow`) displays stages in English even when the UI is in Nepali because:
1. Stages are fetched from the backend API
2. Backend returns English labels
3. Frontend displays `stage.label` directly without translation

## Current Implementation

### WorkflowV2.jsx
```javascript
// Fetches stages from backend
const stagesResponse = await workflowApiService.getWorkflowStages()
setStages(stagesResponse.data.stages)

// Displays stage label directly (NO TRANSLATION)
<p>{stage.label}</p>  // ❌ Shows English only
<span>{currentStage.label}</span>  // ❌ Shows English only
```

### Backend Response Example
```json
{
  "stages": [
    { "id": "applied", "label": "Applied", "description": "..." },
    { "id": "shortlisted", "label": "Shortlisted", "description": "..." },
    { "id": "interview-scheduled", "label": "Interview Scheduled", "description": "..." },
    { "id": "interview-passed", "label": "Interview Passed", "description": "..." }
  ]
}
```

## Solution Strategy

### Option 1: Client-Side Translation Mapping (Recommended) ✅

Map backend stage IDs to translation keys on the frontend.

**Advantages:**
- No backend changes needed
- Immediate fix
- Consistent with other pages
- Easy to maintain

**Implementation:**

#### 1. Create Stage Translation Helper
```javascript
// In WorkflowV2.jsx or a utility file
const getStageLabel = (stageId, t) => {
  const translationKeys = {
    'applied': 'stages.applied',
    'shortlisted': 'stages.shortlisted',
    'interview-scheduled': 'stages.interviewScheduled',
    'interview_scheduled': 'stages.interviewScheduled',
    'interview-passed': 'stages.interviewPassed',
    'interview_passed': 'stages.interviewPassed',
  }
  
  const key = translationKeys[stageId]
  return key ? t(key) : stageId
}
```

#### 2. Add useLanguage Hook
```javascript
import { useLanguage } from '../hooks/useLanguage'

const WorkflowV2 = () => {
  const { tPageSync } = useLanguage({ 
    pageName: 'workflow', 
    autoLoad: true 
  })
  
  const tPage = (key, params = {}) => tPageSync(key, params)
  
  // ... rest of component
}
```

#### 3. Update Stage Display
```javascript
// BEFORE
<p>{stage.label}</p>
<span>{currentStage.label}</span>

// AFTER
<p>{getStageLabel(stage.id, tPage)}</p>
<span>{getStageLabel(currentStage.id, tPage)}</span>
```

### Option 2: Backend Localization (Future Enhancement)

Backend returns localized labels based on Accept-Language header.

**Advantages:**
- Centralized translation management
- Consistent across all clients

**Disadvantages:**
- Requires backend changes
- More complex implementation
- Needs API versioning

## Existing Translations

### English (`/public/translations/en/pages/workflow.json`)
```json
{
  "stages": {
    "applied": "Applied",
    "appliedDescription": "Candidates who have submitted applications",
    "shortlisted": "Shortlisted",
    "shortlistedDescription": "Candidates selected for interview",
    "interviewScheduled": "Interview Scheduled",
    "interviewScheduledDescription": "Candidates with scheduled interviews",
    "interviewPassed": "Interview Passed",
    "interviewPassedDescription": "Candidates who passed interviews"
  }
}
```

### Nepali (`/public/translations/ne/pages/workflow.json`)
```json
{
  "stages": {
    "applied": "आवेदन दिएको",
    "appliedDescription": "आवेदन पेश गरेका उम्मेदवारहरू",
    "shortlisted": "छनोट सूचीमा",
    "shortlistedDescription": "अन्तर्वार्ताका लागि चयनित उम्मेदवारहरू",
    "interviewScheduled": "अन्तर्वार्ता निर्धारित",
    "interviewScheduledDescription": "निर्धारित अन्तर्वार्ता भएका उम्मेदवारहरू",
    "interviewPassed": "अन्तर्वार्ता उत्तीर्ण",
    "interviewPassedDescription": "अन्तर्वार्ता उत्तीर्ण गरेका उम्मेदवारहरू"
  }
}
```

## Implementation Steps

### Step 1: Add useLanguage Hook
```javascript
// At the top of WorkflowV2.jsx
import { useLanguage } from '../hooks/useLanguage'

const WorkflowV2 = () => {
  const { agencyData, isLoading: agencyLoading } = useAgency()
  const { tPageSync } = useLanguage({ 
    pageName: 'workflow', 
    autoLoad: true 
  })
  
  const tPage = (key, params = {}) => tPageSync(key, params)
  
  // ... rest of component
}
```

### Step 2: Create Translation Helper
```javascript
// Add this function inside WorkflowV2 component
const getStageLabel = (stageId) => {
  const translationKeys = {
    'applied': 'stages.applied',
    'shortlisted': 'stages.shortlisted',
    'interview-scheduled': 'stages.interviewScheduled',
    'interview_scheduled': 'stages.interviewScheduled',
    'interview-passed': 'stages.interviewPassed',
    'interview_passed': 'stages.interviewPassed',
  }
  
  const key = translationKeys[stageId]
  if (!key) return stageId
  
  try {
    return tPage(key)
  } catch (error) {
    console.warn(`Translation missing for stage: ${stageId}`)
    return stageId
  }
}

const getStageDescription = (stageId) => {
  const translationKeys = {
    'applied': 'stages.appliedDescription',
    'shortlisted': 'stages.shortlistedDescription',
    'interview-scheduled': 'stages.interviewScheduledDescription',
    'interview_scheduled': 'stages.interviewScheduledDescription',
    'interview-passed': 'stages.interviewPassedDescription',
    'interview_passed': 'stages.interviewPassedDescription',
  }
  
  const key = translationKeys[stageId]
  return key ? tPage(key) : ''
}
```

### Step 3: Update Stage Display (Line 393)
```javascript
// BEFORE
<p className={`text-sm font-medium ${
  isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-400'
}`}>
  {stage.label}
</p>

// AFTER
<p className={`text-sm font-medium ${
  isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-400'
}`}>
  {getStageLabel(stage.id)}
</p>
```

### Step 4: Update Current Stage Display (Line 608)
```javascript
// BEFORE
{currentStage && (
  <span className="chip chip-blue text-xs flex-shrink-0">
    {currentStage.label}
  </span>
)}

// AFTER
{currentStage && (
  <span className="chip chip-blue text-xs flex-shrink-0">
    {getStageLabel(currentStage.id)}
  </span>
)}
```

### Step 5: Add Other Translations

Update other hardcoded English text in WorkflowV2:

```javascript
// Title and subtitle
<h1>{tPage('title')}</h1>
<p>{tPage('subtitle')}</p>

// Search placeholder
<input placeholder={tPage('search.byJobPlaceholder')} />

// Empty states
<p>{tPage('empty.noCandidates')}</p>

// Loading states
<p>{tPage('loading.workflow')}</p>

// Error messages
<p>{tPage('error.failedToLoad')}</p>
```

## Testing Checklist

- [ ] Switch to Nepali language
- [ ] Navigate to Workflow page
- [ ] Verify all stage labels are in Nepali
- [ ] Verify stage descriptions are in Nepali
- [ ] Click through different stages
- [ ] Verify candidate cards show Nepali text
- [ ] Switch back to English
- [ ] Verify all text is in English
- [ ] Test with backend returning different stage IDs

## Comparison: Workflow.jsx vs WorkflowV2.jsx

### Workflow.jsx (Old) ✅
- **Uses translations:** Yes
- **Stage source:** Hardcoded in frontend
- **Translation method:** `tPage('stages.applied')`
- **Status:** Already correct

### WorkflowV2.jsx (Current) ❌
- **Uses translations:** No
- **Stage source:** Fetched from backend API
- **Translation method:** None (displays `stage.label` directly)
- **Status:** Needs fix

## Benefits After Fix

1. **Consistent UX** - All workflow text in user's language
2. **No backend changes** - Frontend-only solution
3. **Maintainable** - Uses existing translation infrastructure
4. **Flexible** - Easy to add new stages or languages
5. **Fallback safe** - Shows stage ID if translation missing

## Related Files

- `src/pages/WorkflowV2.jsx` - Main file to update
- `src/pages/Workflow.jsx` - Reference implementation (already correct)
- `public/translations/en/pages/workflow.json` - English translations (complete)
- `public/translations/ne/pages/workflow.json` - Nepali translations (complete)
- `src/hooks/useLanguage.js` - Translation hook
- `src/services/workflowApiService.js` - API service (no changes needed)

---

**Priority:** High  
**Effort:** Low (30 minutes)  
**Impact:** High (user-facing)  
**Status:** Ready to implement  
**Date:** December 3, 2025
