# Sidebar Deep Dive Analysis

## Methodology
- ✅ Analyzed component implementations (not just names)
- ✅ Checked props, data structures, and behaviors
- ✅ Examined workflow stage requirements
- ✅ Identified dynamic vs static sections
- ✅ Understood context-specific needs
- ✅ Checked document handling (API vs mock)

## Complete Sidebar Inventory

### 1. Workflow Page (`src/pages/Workflow.jsx`)

**Component**: `CandidateSummaryS2`

**Context**: Full workflow management across all stages

**Workflow Stages** (4 stages):
```javascript
[
  { id: 'applied', label: 'Applied', icon: FileText },
  { id: 'shortlisted', label: 'Shortlisted', icon: CheckCircle },
  { id: 'interview-scheduled', label: 'Interview Scheduled', icon: Calendar },
  { id: 'interview-passed', label: 'Interview Passed', icon: CheckCircle }
]
```

**Props Passed**:
- `candidate` ✅
- `isOpen` ✅
- `onClose` ✅
- `onUpdateStatus` ✅ (Can change workflow stage)
- `onAttachDocument` ✅
- `onRemoveDocument` ✅
- `workflowStages` ✅ (4 stages)

**Features**:
- ✅ Profile section
- ✅ Workflow stage selector (4 stages)
- ✅ Application history
- ✅ Document management (API-based via `documentApiClient`)
- ✅ Stage progression validation
- ❌ Interview details section (not needed in this context)

**Document Handling**: **Real API** (`documentApiClient.getCandidateDocuments()`)

**Why This Variation**: Full workflow management, needs all stages and document handling

---

### 2. Applications Page (`src/pages/Applications.jsx`)

**Component**: `CandidateSummaryS2`

**Context**: Application review and management

**Workflow Stages** (4 stages):
```javascript
[
  { id: "applied", label: "Applied" },
  { id: "shortlisted", label: "Shortlisted" },
  { id: "interview-scheduled", label: "Interview Scheduled" },
  { id: "interview-passed", label: "Interview Passed" }
]
```

**Props Passed**:
- `candidate` ✅
- `isOpen` ✅
- `onClose` ✅
- `onUpdateStatus` ✅ (Can change workflow stage)
- `onAttachDocument` ✅
- `onRemoveDocument` ✅
- `workflowStages` ✅ (4 stages)

**Features**:
- ✅ Profile section
- ✅ Workflow stage selector (4 stages)
- ✅ Application history
- ✅ Document management (API-based)
- ✅ Stage progression validation
- ❌ Interview details section

**Document Handling**: **Real API** (`documentApiClient.getCandidateDocuments()`)

**Why This Variation**: Similar to Workflow, full application management

---

### 3. JobDetails Page (`src/pages/JobDetails.jsx`)

**Component**: `CandidateSummaryS2`

**Context**: Job-specific candidate view

**Workflow Stages** (6 stages - MORE than others!):
```javascript
[
  { id: 'applied', label: 'Applied' },
  { id: 'shortlisted', label: 'Shortlisted' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'interviewed', label: 'Interviewed' },
  { id: 'selected', label: 'Selected' },
  { id: 'rejected', label: 'Rejected' }
]
```

**Props Passed**:
- `candidate` ✅
- `isOpen` ✅
- `onClose` ✅
- `onUpdateStatus` ✅ (Can change workflow stage)
- `onAttachDocument` ✅
- `onRemoveDocument` ✅
- `workflowStages` ✅ (6 stages - different!)
- `isFromJobsPage` ✅ `true`
- `jobId` ✅

**Features**:
- ✅ Profile section
- ✅ Workflow stage selector (6 stages)
- ✅ Application history
- ✅ Document management (API-based)
- ✅ Stage progression validation
- ⚠️ Interview details (if available in data)

**Document Handling**: **Real API** (`documentApiClient.getCandidateDocuments()`)

**Why This Variation**: Job-specific view, needs more granular stages (6 vs 4)

---

### 4. CandidateShortlist Component (`src/components/CandidateShortlist.jsx`)

**Component**: `CandidateSummaryS2`

**Context**: Shortlist-specific view

**Workflow Stages**: Inherited from parent (varies)

**Props Passed**:
- `candidate` ✅
- `isOpen` ✅
- `onClose` ✅
- `onUpdateStatus` ✅ (Can change workflow stage)
- `onAttachDocument` ✅
- `onRemoveDocument` ✅
- `workflowStages` ✅ (from parent)

**Features**:
- ✅ Profile section
- ✅ Workflow stage selector
- ✅ Application history
- ✅ Document management (API-based)
- ✅ Stage progression validation

**Document Handling**: **Real API** (`documentApiClient.getCandidateDocuments()`)

**Why This Variation**: Reusable component, adapts to parent's workflow stages

---

### 5. JobShortlist Page (`src/pages/JobShortlist.jsx`)

**Component**: `CandidateSummaryS2` (implied)

**Context**: Job shortlist view

**Workflow Stages** (4 stages):
```javascript
[
  { id: 'applied', label: 'Applied', icon: FileText },
  { id: 'shortlisted', label: 'Shortlisted', icon: CheckCircle },
  { id: 'interview-scheduled', label: 'Interview Scheduled', icon: Calendar },
  { id: 'interview-passed', label: 'Interview Passed', icon: CheckCircle }
]
```

**Props Passed**: Similar to Workflow page

**Features**: Similar to Workflow page

**Document Handling**: **Real API**

**Why This Variation**: Job-specific shortlist management

---

### 6. ScheduledInterviews Component (`src/components/ScheduledInterviews.jsx`)

**Component**: **Custom `CandidateSidebar`** (inline definition)

**Context**: Interview scheduling and management

**Workflow Stages**: ❌ **NONE** - No workflow stage selector!

**Props Passed**:
- `candidate` ✅
- `isOpen` ✅
- `onClose` ✅
- ❌ `onUpdateStatus` - NOT PASSED
- ❌ `onAttachDocument` - NOT PASSED
- ❌ `onRemoveDocument` - NOT PASSED
- ❌ `workflowStages` - NOT PASSED

**Features**:
- ✅ Profile section
- ❌ Workflow stage selector (NOT PRESENT)
- ❌ Application history (NOT PRESENT)
- ⚠️ Document section (PRESENT but read-only, no upload/delete)
- ✅ **Interview Details Section** (UNIQUE - not in S2)
- ✅ **Interview Notes/Feedback** (UNIQUE - editable)
- ✅ **Interview Actions** (Pass/Fail/Reject/Reschedule)

**Document Handling**: **Mixed**
- Shows `candidate.documents` from API ✅
- No upload/delete functionality ❌
- No API call to load documents ❌

**Why This Variation**: 
- **Interview-focused**: Needs interview details prominently
- **Action-oriented**: Pass/Fail/Reject/Reschedule buttons
- **No workflow changes**: Interview stage is fixed, no need to change
- **Notes management**: Editable interview feedback

---

## Key Findings

### Workflow Stage Requirements

| Page/Component | Workflow Stages | Can Change Stage? | Why? |
|----------------|-----------------|-------------------|------|
| Workflow | 4 stages | ✅ Yes | Full workflow management |
| Applications | 4 stages | ✅ Yes | Application management |
| JobDetails | **6 stages** | ✅ Yes | More granular job tracking |
| CandidateShortlist | Inherited | ✅ Yes | Reusable component |
| JobShortlist | 4 stages | ✅ Yes | Shortlist management |
| **ScheduledInterviews** | **0 stages** | ❌ **NO** | **Interview actions only** |

**Insight**: ScheduledInterviews doesn't need workflow stage changes because:
1. Candidates are already at "interview_scheduled" stage
2. Actions (Pass/Fail) automatically move to next stage via API
3. Workflow progression is handled by action buttons, not manual stage selection

### Document Handling

| Page/Component | Document Source | Upload | Delete | API Call |
|----------------|-----------------|--------|--------|----------|
| Workflow | Real API | ✅ Yes | ✅ Yes | `documentApiClient.getCandidateDocuments()` |
| Applications | Real API | ✅ Yes | ✅ Yes | `documentApiClient.getCandidateDocuments()` |
| JobDetails | Real API | ✅ Yes | ✅ Yes | `documentApiClient.getCandidateDocuments()` |
| CandidateShortlist | Real API | ✅ Yes | ✅ Yes | `documentApiClient.getCandidateDocuments()` |
| JobShortlist | Real API | ✅ Yes | ✅ Yes | `documentApiClient.getCandidateDocuments()` |
| **ScheduledInterviews** | **Candidate data** | ❌ **NO** | ❌ **NO** | ❌ **NO API CALL** |

**Insight**: ScheduledInterviews shows documents from candidate data but doesn't:
- Make separate API call to load documents
- Allow uploading new documents
- Allow deleting documents

**Why**: Interview context is read-only for documents. Focus is on interview actions, not document management.

### Dynamic Sections Analysis

#### CandidateSummaryS2 Sections:

1. **Profile Section** - ✅ Always present
2. **Workflow Stage Selector** - ⚠️ Conditional (only if `workflowStages` prop provided)
3. **Application History** - ⚠️ Conditional (only if `candidate.application.history_blob` exists)
4. **Document Section** - ✅ Always present (loads via API)
5. **Interview Details** - ❌ NOT PRESENT (data exists but no dedicated section)

#### Custom CandidateSidebar (ScheduledInterviews) Sections:

1. **Profile Section** - ✅ Always present
2. **Interview Details** - ✅ **UNIQUE** - Prominent display
3. **Interview Notes/Feedback** - ✅ **UNIQUE** - Editable with history
4. **Experience Section** - ✅ Present (formatted for array)
5. **Document Section** - ⚠️ Present but read-only
6. **Workflow Stage Selector** - ❌ NOT PRESENT
7. **Application History** - ❌ NOT PRESENT

### Action Buttons

#### CandidateSummaryS2:
- **Workflow Actions**: Change stage (with validation)
- **Document Actions**: Upload, Delete, View
- **No Interview Actions**: Pass/Fail/Reject/Reschedule not available

#### Custom CandidateSidebar (ScheduledInterviews):
- **Interview Actions**: Pass, Fail, Reject, Reschedule, Send Reminder
- **Notes Actions**: Add, Edit, Delete notes
- **No Workflow Actions**: Can't manually change stage
- **No Document Actions**: Can't upload/delete

## Why Variations Exist

### Legitimate Reasons:

1. **Context-Specific Actions**:
   - Interview context needs Pass/Fail/Reschedule
   - Workflow context needs stage changes
   - Different actions for different contexts ✅

2. **Data Availability**:
   - Interview details only available in scheduled context
   - Application history only available in workflow context
   - Different data for different contexts ✅

3. **User Intent**:
   - Interview page: Focus on interview outcome
   - Workflow page: Focus on stage progression
   - Different goals for different pages ✅

4. **Workflow Stage Granularity**:
   - JobDetails: 6 stages (more detailed)
   - Others: 4 stages (simplified)
   - Different tracking needs ✅

### Questionable Reasons:

1. **Document Handling Inconsistency**:
   - ScheduledInterviews doesn't load documents via API
   - Shows documents from candidate data only
   - Could be unified ⚠️

2. **Code Duplication**:
   - ~500 lines of duplicate sidebar code
   - Profile section duplicated
   - Could be unified ⚠️

3. **Experience Rendering**:
   - Custom formatting in ScheduledInterviews
   - Could be added to CandidateSummaryS2 ⚠️

## Unified View Proposal

### Option 1: Enhance CandidateSummaryS2 (Recommended)

**Add to CandidateSummaryS2**:
1. **Interview Details Section** (conditional):
   ```javascript
   {candidate.interview && (
     <InterviewDetailsSection interview={candidate.interview} />
   )}
   ```

2. **Interview Actions** (conditional):
   ```javascript
   {isInterviewContext && (
     <InterviewActions 
       onPass={onMarkPass}
       onFail={onMarkFail}
       onReject={onReject}
       onReschedule={onReschedule}
     />
   )}
   ```

3. **Interview Notes** (conditional):
   ```javascript
   {candidate.interview?.notes && (
     <InterviewNotesSection 
       notes={candidate.interview.notes}
       onUpdateNotes={onUpdateNotes}
     />
   )}
   ```

**Props to Add**:
```javascript
{
  // Existing props...
  
  // New interview-specific props
  isInterviewContext?: boolean,
  onMarkPass?: (candidateId) => void,
  onMarkFail?: (candidateId) => void,
  onReject?: (candidateId, reason) => void,
  onReschedule?: (candidateId, date, time) => void,
  onUpdateNotes?: (candidateId, notes) => void,
  onSendReminder?: (candidateId) => void
}
```

**Benefits**:
- ✅ Single unified component
- ✅ Consistent UI across all pages
- ✅ Conditional sections based on context
- ✅ Maintains all existing functionality
- ✅ Removes ~500 lines of duplicate code

**Drawbacks**:
- ⚠️ Component becomes larger
- ⚠️ More props to manage
- ⚠️ Need to test all contexts

### Option 2: Keep Separate (Current State)

**Benefits**:
- ✅ No changes needed
- ✅ Interview sidebar optimized for its context

**Drawbacks**:
- ❌ Code duplication
- ❌ Inconsistent UI
- ❌ Maintenance burden
- ❌ Bug fixes need to be applied twice

### Option 3: Composition Pattern

**Create smaller components**:
```javascript
<CandidateSidebar>
  <ProfileSection />
  {isInterviewContext && <InterviewDetailsSection />}
  {hasWorkflowStages && <WorkflowStageSelector />}
  {hasDocuments && <DocumentSection />}
  {hasHistory && <ApplicationHistory />}
  {isInterviewContext && <InterviewActions />}
</CandidateSidebar>
```

**Benefits**:
- ✅ Maximum flexibility
- ✅ Reusable sections
- ✅ Easy to customize per context

**Drawbacks**:
- ⚠️ More components to maintain
- ⚠️ More complex architecture
- ⚠️ Requires refactoring

## Recommended Implementation Plan

### Phase 1: Enhance CandidateSummaryS2 (2-3 hours)

1. **Add Interview Details Section**:
   - Conditional rendering based on `candidate.interview`
   - Display: date, time, duration, location, interviewer, status

2. **Add Interview Notes Section**:
   - Conditional rendering based on `candidate.interview.notes`
   - Editable notes with history
   - Add/Edit/Delete functionality

3. **Add Interview Actions**:
   - Conditional rendering based on `isInterviewContext` prop
   - Pass/Fail/Reject/Reschedule buttons
   - Connect to real APIs

4. **Add Experience Formatting**:
   - Handle array of experience objects
   - Format duration (months to years/months)
   - Display title, employer, description

### Phase 2: Replace Custom Sidebar (1 hour)

1. **Update ScheduledInterviews**:
   - Remove custom `CandidateSidebar` component
   - Import `CandidateSummaryS2`
   - Pass appropriate props including `isInterviewContext={true}`

2. **Connect Actions**:
   - Implement action handlers
   - Pass to CandidateSummaryS2 as props

### Phase 3: Testing (1-2 hours)

1. Test all contexts:
   - Workflow page
   - Applications page
   - JobDetails page
   - ScheduledInterviews

2. Verify:
   - Correct sections show in each context
   - Actions work correctly
   - Documents load properly
   - Workflow stages work
   - Interview actions work

## Conclusion

**Current State**: 6 sidebar instances, 5 unified + 1 custom

**Variations Exist Because**:
- ✅ Different contexts need different actions (legitimate)
- ✅ Different data available in different contexts (legitimate)
- ⚠️ Code duplication (could be unified)
- ⚠️ Inconsistent document handling (could be unified)

**Recommendation**: Enhance CandidateSummaryS2 with conditional interview sections and actions, then replace custom sidebar.

**Estimated Work**: 4-6 hours total

**Priority**: Medium (improves maintainability and consistency, not blocking)
