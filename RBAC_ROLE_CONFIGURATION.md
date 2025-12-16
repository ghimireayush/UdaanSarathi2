# Role-Based Access Control (RBAC) Configuration

## Overview

The system uses a centralized role configuration that ensures consistency across the entire application. All role definitions come from a single source of truth.

## Single Source of Truth

**File:** `src/config/roles.js`

This file defines all roles in the system. Any changes to roles (add, remove, rename) should be made here first.

## Available Roles

### 1. **Owner** (Cannot be assigned to team members)
- **Value:** `owner`
- **Label:** Agency Owner
- **Description:** Full access to all features
- **Can Assign to Members:** ❌ No
- **Use Case:** System owner/founder

### 2. **Admin** ✅ Assignable
- **Value:** `admin`
- **Label:** Administrator
- **Description:** Manages operations, team, and most features
- **Can Assign to Members:** ✅ Yes
- **Permissions:** Dashboard, Jobs, Drafts, Applications, Interviews, Workflow, Team Members, Audit Log, Analytics, Candidate Management, Document Management, Payment Tracking, Visa Processing

### 3. **Manager** ✅ Assignable
- **Value:** `manager`
- **Label:** Manager
- **Description:** Manages recruitment process and team coordination
- **Can Assign to Members:** ✅ Yes
- **Permissions:** Dashboard, Jobs, Drafts, Applications, Interviews, Workflow, Analytics, Candidate Management, Document Management, Visa Processing

### 4. **Staff** ✅ Assignable
- **Value:** `staff`
- **Label:** Staff
- **Description:** Handles job postings and candidate applications
- **Can Assign to Members:** ✅ Yes
- **Permissions:** Dashboard, Jobs, Applications, Workflow, Candidate Management, Document Management

### 5. **Recruiter** ✅ Assignable
- **Value:** `recruiter`
- **Label:** Recruiter
- **Description:** Focuses on candidate sourcing and screening
- **Can Assign to Members:** ✅ Yes
- **Permissions:** Dashboard, Jobs, Applications, Interviews, Candidate Management, Document Management

### 6. **Coordinator** ✅ Assignable
- **Value:** `coordinator`
- **Label:** Interview Coordinator
- **Description:** Manages interview scheduling and coordination
- **Can Assign to Members:** ✅ Yes
- **Permissions:** Dashboard, Applications, Interviews

### 7. **Visa Officer** ✅ Assignable
- **Value:** `visaOfficer`
- **Label:** Visa Officer
- **Description:** Handles visa processing and documentation
- **Can Assign to Members:** ✅ Yes
- **Permissions:** Dashboard, Applications, Workflow, Candidate Management, Document Management, Visa Processing

### 8. **Accountant** ✅ Assignable
- **Value:** `accountant`
- **Label:** Accountant
- **Description:** Manages payments and financial tracking
- **Can Assign to Members:** ✅ Yes
- **Permissions:** Dashboard, Applications, Analytics, Payment Tracking

## How It Works

### 1. Role Definition (`src/config/roles.js`)
```javascript
export const ROLES = {
  ADMIN: {
    key: 'admin',
    value: 'admin',
    label: 'Administrator',
    description: 'Manages operations, team, and most features',
    color: 'bg-blue-100 text-blue-800',
    canBeAssignedToMembers: true,
  },
  // ... other roles
};
```

### 2. Getting Assignable Roles
```javascript
import { getAssignableRoles } from '../config/roles.js';

// Returns only roles where canBeAssignedToMembers: true
const assignableRoles = getAssignableRoles();
// Result: [admin, manager, staff, recruiter, coordinator, visaOfficer, accountant]
```

### 3. Getting All Roles (including Owner)
```javascript
import { getAllRoleValues } from '../config/roles.js';

// Returns all roles including owner
const allRoles = getAllRoleValues();
// Result: [owner, admin, manager, staff, recruiter, coordinator, visaOfficer, accountant]
```

### 4. Role Permissions (`src/config/roleBasedAccess.js`)
Defines what features each role can access:
```javascript
export const ROLE_FEATURES = {
  [ROLES.ADMIN.value]: {
    label: ROLES.ADMIN.label,
    features: {
      dashboard: true,
      jobs: true,
      teamMembers: true,
      // ... other features
    }
  },
  // ... other roles
};
```

## Where Roles Are Used

### 1. **Team Members Page** (`src/pages/Members.jsx`)
- Uses `getAssignableRoles()` to show only roles that can be assigned
- Excludes 'owner' role
- Validates role selection against assignable roles

### 2. **Role Switcher (Dev Tools)** (`src/components/DevTools/RoleSwitcher.jsx`)
- Uses `getAllRoleValues()` to show all roles for testing
- Includes 'owner' role for development/testing
- Only visible on localhost

### 3. **Member Service** (`src/services/memberService.js`)
- Validates invited member roles against `getAssignableRoles()`
- Ensures only valid roles can be assigned to team members
- Throws error if invalid role is provided

### 4. **RBAC Checks** (`src/config/roleBasedAccess.js`)
- Determines feature access for each role
- Used by `useRoleBasedAccess` hook
- Controls what UI elements are visible

## Adding a New Role

To add a new role to the system:

1. **Add to `src/config/roles.js`:**
```javascript
export const ROLES = {
  // ... existing roles
  NEW_ROLE: {
    key: 'newRole',
    value: 'newRole',
    label: 'New Role Label',
    description: 'Role description',
    color: 'bg-color-100 text-color-800',
    canBeAssignedToMembers: true, // or false
  },
};
```

2. **Add permissions to `src/config/roleBasedAccess.js`:**
```javascript
export const ROLE_FEATURES = {
  // ... existing roles
  [ROLES.NEW_ROLE.value]: {
    label: ROLES.NEW_ROLE.label,
    description: ROLES.NEW_ROLE.description,
    color: ROLES.NEW_ROLE.color,
    features: {
      dashboard: true,
      jobs: false,
      // ... define permissions
    }
  },
};
```

3. **That's it!** The role will automatically appear in:
   - Team member dropdowns (if `canBeAssignedToMembers: true`)
   - Role switcher (for testing)
   - RBAC checks throughout the app

## Key Differences

| Feature | RoleSwitcher (Navbar) | Members Page | memberService |
|---------|----------------------|--------------|----------------|
| **Function** | Dev tool for testing | Invite team members | Validate invitations |
| **Roles Shown** | ALL roles (including owner) | Only assignable roles | Only assignable roles |
| **Source** | `getAllRoleValues()` | `getAssignableRoles()` | `getAssignableRoles()` |
| **Includes Owner** | ✅ Yes | ❌ No | ❌ No |
| **Visible On** | localhost only | All environments | All environments |

## Why the Difference?

- **RoleSwitcher** shows all roles because it's a development tool for testing RBAC with different user types
- **Members Page** only shows assignable roles because you can't assign 'owner' to a team member
- **memberService** validates against assignable roles to prevent invalid role assignments

This design ensures:
1. ✅ Consistency across the app
2. ✅ Single source of truth for role definitions
3. ✅ Easy to add/modify roles
4. ✅ Prevents invalid role assignments
5. ✅ Clear separation between system roles and assignable roles
