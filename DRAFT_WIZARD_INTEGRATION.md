# Draft Wizard Page Integration

## Overview
Successfully converted the JobDraftWizard from a modal component to a full-page experience with proper routing and state synchronization.

## Changes Made

### 1. New Page Created: `src/pages/DraftWizard.jsx`
- Full-page wrapper for the JobDraftWizard component
- Handles draft loading from URL params or location state
- Manages all save operations (bulk, single, partial, publish)
- Navigates back to /drafts with success/error messages
- Supports both creating new drafts and editing existing ones

**Key Features:**
- Loads draft by ID from URL params: `/draftwizard?id=123&step=2`
- Accepts draft data via location state for seamless navigation
- Handles all draft types: single, bulk, partial, and publish
- Shows loading state while fetching draft data
- Automatically redirects to /drafts on error

### 2. Updated Routing: `src/App.jsx`
- Added new route: `/draftwizard`
- Protected with same permissions as /drafts page
- Wrapped in Layout and PrivateRoute components

```jsx
<Route 
  path="/draftwizard" 
  element={
    <Layout>
      <PrivateRoute requiredPermissions={[PERMISSIONS.CREATE_JOB, PERMISSIONS.EDIT_JOB]}>
        <DraftWizard />
      </PrivateRoute>
    </Layout>
  } 
/>
```

### 3. Updated Drafts Page: `src/pages/Drafts.jsx`

**Removed:**
- `showWizard` state
- `editingDraft` state
- `editingStep` state
- `handleWizardSave` function
- JobDraftWizard component import and usage

**Modified:**
- "Create Draft" buttons now navigate to `/draftwizard`
- `handleEdit()` navigates to `/draftwizard` with draft data in state
- `handleExpandBulkDraft()` navigates to `/draftwizard` with converted draft
- `confirmActionHandler()` navigates to `/draftwizard` for edit actions
- Added location state handling to show toast messages on return

**Navigation Examples:**
```jsx
// Create new draft
navigate("/draftwizard");

// Edit existing draft
navigate("/draftwizard", {
  state: {
    draft: draftData,
    step: 2,
  },
});

// Return with success message
navigate("/drafts", {
  state: {
    message: "Draft saved successfully",
    type: "success",
  },
});
```

## User Flow

### Creating a New Draft
1. User clicks "Create Draft" button on /drafts page
2. Navigates to `/draftwizard`
3. User completes wizard steps
4. On save/publish, returns to `/drafts` with success message

### Editing an Existing Draft
1. User clicks "Edit" on a draft card
2. Navigates to `/draftwizard` with draft data in location state
3. Wizard opens at appropriate step
4. On save/publish, returns to `/drafts` with success message

### Expanding a Bulk Draft
1. User clicks "Expand" on a bulk draft
2. Draft is converted to single draft format
3. Navigates to `/draftwizard` with converted draft
4. User completes remaining steps
5. Returns to `/drafts` on save

## State Synchronization

### From Drafts → Wizard
- Draft data passed via `location.state.draft`
- Initial step passed via `location.state.step`
- Alternative: URL params `?id=123&step=2`

### From Wizard → Drafts
- Success/error messages via `location.state.message`
- Message type via `location.state.type` ("success" or "error")
- Drafts page shows toast notification
- Location state cleared after displaying message

## Benefits

1. **Better UX**: Full-page wizard provides more space and focus
2. **Browser Navigation**: Users can use back/forward buttons
3. **Shareable URLs**: Can bookmark or share specific draft editing URLs
4. **State Management**: Cleaner separation of concerns
5. **Performance**: No need to keep wizard mounted when not in use
6. **Accessibility**: Better keyboard navigation and screen reader support

## API Integration

The DraftWizard page handles all API calls:
- `jobService.createDraftJob()` - Create new draft
- `jobService.updateJob()` - Update existing draft
- `jobService.publishJob()` - Publish draft to jobs
- `jobService.getJob()` - Load draft by ID

## Testing Checklist

- [ ] Create new single draft
- [ ] Create new bulk draft
- [ ] Edit existing single draft
- [ ] Edit existing bulk draft
- [ ] Expand bulk draft to single
- [ ] Save & Exit (partial save)
- [ ] Publish draft
- [ ] Browser back button works correctly
- [ ] Toast messages appear on return to /drafts
- [ ] URL params work for direct navigation
- [ ] Error handling redirects properly

## Future Enhancements

1. Add draft auto-save functionality
2. Add unsaved changes warning
3. Add draft version history
4. Add collaborative editing support
5. Add draft templates
6. Add keyboard shortcuts for navigation
