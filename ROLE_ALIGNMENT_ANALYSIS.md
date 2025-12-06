# Role Alignment Analysis & Solution

## Problem Statement

The application had **misaligned role definitions** across different parts of the codebase:

### Team Member Assignment (Members.jsx)
Only 3 roles could be assigned:
- ❌ Staff
- ❌ Administrator  
- ❌ Manager

### RBAC Configuration (roleBasedAccess.js)
8 roles were defined with permissions:
- ✅ Owner
- ✅ Admin
- ✅ Manager
- ✅ Staff
- ✅ Recruiter
- ✅ Coordinator (Interview Coordinator)
- ✅ Visa Officer
- ✅ Accountant

### Auth Service (authService.js)
Legacy role constants:
- ADMIN
- RECIPIENT
- COORDINATOR
- AGENCY_OWNER
- AGENCY_MEMBER

## Root Cause

**No single source of truth** for role definitions. Roles were hardcoded in multiple places:
1. Team member pages had hardcoded dropdown options
2. RBAC config defined roles independently
3. Auth service used different role naming conventions

## Solution Implemented

### 1. Created Central Role Configuration

**File**: `src/config/roles.js`

This is now the **SINGLE SOURCE OF TRUTH** for all roles in the application.

```javascript
export const ROLES = {
  OWNER: { value: 'owner', label: 'Agency Owner', ... },
  ADMIN: { value: 'admin', label: 'Administrator', ... },
  MANAGER: { value: 'manager', label: 'Manager', ... },
  STAFF: { value: 'staff', label: 'Staff', ... },
  RECRUITER: { value: 'recruiter', label: 'Recruiter', ... },
  COORDINATOR: { value: 'coordinator', label: 'Interview Coordinator', ... },
  VISA_OFFICER: { value: 'visaOfficer', label: 'Visa Officer', ... },
  ACCOUNTANT: { value: 'accountant', label: 'Accountant', ... },
};
```

Each role includes:
- `value` - The role identifier
- `label` - Display name
- `description` - What the role does
- `color` - UI color scheme
- `canBeAssignedToMembers` - Whether it can be assigned to team members

### 2. Updated RBAC Configuration

**File**: `src/config/roleBasedAccess.js`

Now imports roles from central config:

```javascript
import ROLES from './roles';

export const ROLE_FEATURES = {
  [ROLES.OWNER.value]: {
    label: ROLES.OWNER.label,
    description: ROLES.OWNER.description,
    color: ROLES.OWNER.color,
    features: { ... }
  },
  // ... other roles
};
```

### 3. Updated Team Member Pages

**Files**: 
- `src/pages/Members.jsx`
- `src/pages/MemberManagement.jsx`

Now dynamically generate role dropdowns from central config:

```javascript
import { getAssignableRoles, getRoleLabel } from '../config/roles';

const assignableRoles = getAssignableRoles();

// In dropdown
{assignableRoles.map(role => (
  <option key={role.value} value={role.value}>
    {getRoleDisplayName(role.value)}
  </option>
))}
```

### 4. Helper Functions

Created utility functions in `src/config/roles.js`:

- `getAllRoleValues()` - Get all role values
- `getAssignableRoles()` - Get roles that can be assigned to members
- `getRoleByValue(value)` - Get role object by value
- `getRoleLabel(value)` - Get role display label
- `getRoleDescription(value)` - Get role description
- `getRoleColor(value)` - Get role color classes
- `isValidRole(value)` - Check if role exists
- `canAssignRole(value)` - Check if role can be assigned

## Current State

### ✅ Fully Aligned

1. **RBAC Configuration** → References `src/config/roles.js`
2. **Team Member Pages** → References `src/config/roles.js`
3. **Role Dropdowns** → Dynamically generated from central config
4. **Role Filters** → Dynamically generated from central config
5. **Role Display** → Uses helper functions from central config

### All 8 Roles Now Available

When adding team members at `/teammembers`, you can now assign:

1. ✅ **Administrator** - Manages operations, team, and most features
2. ✅ **Manager** - Manages recruitment process and team coordination
3. ✅ **Staff** - Handles job postings and candidate applications
4. ✅ **Recruiter** - Focuses on candidate sourcing and screening
5. ✅ **Interview Coordinator** - Manages interview scheduling
6. ✅ **Visa Officer** - Handles visa processing and documentation
7. ✅ **Accountant** - Manages payments and financial tracking

**Note**: Owner role cannot be assigned to team members (by design).

## Benefits

### 1. Consistency
All parts of the application use the same role definitions.

### 2. Maintainability
To add/modify/remove a role, you only need to edit `src/config/roles.js`.

### 3. Scalability
Easy to add new roles in the future:
1. Add to `src/config/roles.js`
2. Add permissions to `src/config/roleBasedAccess.js`
3. Done! It automatically appears everywhere.

### 4. Type Safety
Helper functions provide validation and prevent typos.

### 5. Flexibility
Can easily control which roles can be assigned to members via `canBeAssignedToMembers` flag.

## How to Add a New Role (Example)

Let's say you want to add a "Document Manager" role:

### Step 1: Add to roles.js
```javascript
DOCUMENT_MANAGER: {
  key: 'documentManager',
  value: 'documentManager',
  label: 'Document Manager',
  description: 'Manages all candidate documents',
  color: 'bg-emerald-100 text-emerald-800',
  canBeAssignedToMembers: true,
},
```

### Step 2: Add permissions to roleBasedAccess.js
```javascript
[ROLES.DOCUMENT_MANAGER.value]: {
  label: ROLES.DOCUMENT_MANAGER.label,
  description: ROLES.DOCUMENT_MANAGER.description,
  color: ROLES.DOCUMENT_MANAGER.color,
  features: {
    dashboard: true,
    jobs: false,
    drafts: false,
    applications: true,
    interviews: false,
    workflow: true,
    teamMembers: false,
    auditLog: false,
    settings: false,
    analytics: false,
    candidateManagement: true,
    documentManagement: true, // Main feature
    paymentTracking: false,
    visaProcessing: false,
    complianceReports: false,
  }
},
```

### Step 3: Update navigation roles
```javascript
documents: {
  path: '/documents',
  label: 'Documents',
  icon: 'FileText',
  description: 'Manage candidate documents',
  roles: ['owner', 'admin', 'manager', 'staff', 'recruiter', 'visaOfficer', 'documentManager'],
},
```

### That's it!
The role will now:
- ✅ Appear in team member invitation dropdown
- ✅ Appear in role filter
- ✅ Have proper RBAC restrictions
- ✅ Show correct navigation items

## Testing

### Test 1: Team Member Dropdown
1. Go to `/teammembers`
2. Click "Invite Team Member"
3. Check role dropdown
4. **Expected**: All 7 assignable roles appear

### Test 2: Role Filter
1. Go to `/teammembers`
2. Check role filter dropdown
3. **Expected**: All 7 assignable roles appear

### Test 3: RBAC
1. Create a member with "Visa Officer" role
2. Login as that member
3. **Expected**: Only see Dashboard, Applications, Workflow, Candidate Management, Document Management, Visa Processing

### Test 4: Role Display
1. Go to `/teammembers`
2. Check role badges in member list
3. **Expected**: Correct role labels with proper colors

## Files Modified

1. ✅ **Created**: `src/config/roles.js` - Central role configuration
2. ✅ **Updated**: `src/config/roleBasedAccess.js` - Import roles from central config
3. ✅ **Updated**: `src/pages/Members.jsx` - Use dynamic role dropdowns
4. ✅ **Updated**: `src/pages/MemberManagement.jsx` - Use dynamic role dropdowns
5. ✅ **Created**: `ROLE_CONFIGURATION_GUIDE.md` - Comprehensive documentation
6. ✅ **Created**: `ROLE_ALIGNMENT_ANALYSIS.md` - This file

## Future Recommendations

### 1. Update Auth Service
`src/services/authService.js` still uses legacy role constants. Should be refactored to import from `src/config/roles.js`:

```javascript
import ROLES from '../config/roles';

// Instead of:
export const ROLES = {
  ADMIN: 'admin',
  RECIPIENT: 'recipient',
  // ...
}

// Use:
export const ROLES = ROLES; // from import
```

### 2. Backend Integration
Consider moving role definitions to backend database for true dynamic role management.

### 3. Permission Builder UI
Create an admin interface to configure role permissions without code changes.

### 4. Role Hierarchy
Implement role inheritance (e.g., Admin automatically gets all Manager permissions).

## Conclusion

The role system is now **fully aligned** with a **single source of truth**. All roles defined in RBAC are now available for team member assignment, and adding/modifying roles in the future is straightforward and centralized.

**Key Achievement**: Changed from 3 hardcoded roles to 7 dynamically configured roles, with easy extensibility for future roles.
