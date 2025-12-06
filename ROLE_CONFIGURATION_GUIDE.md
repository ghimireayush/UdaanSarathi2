# Role Configuration Guide

## Overview

This application uses a **centralized role configuration system** where all roles are defined in a single source of truth. This ensures consistency across:

- **RBAC (Role-Based Access Control)** - What pages/features each role can access
- **Team Member Management** - What roles can be assigned to team members
- **Authentication** - Role validation and permissions

## Single Source of Truth

**File**: `src/config/roles.js`

This is the **ONLY** place where roles are defined. All other parts of the application reference this file.

## Current Roles

### 1. Owner
- **Value**: `owner`
- **Label**: Agency Owner
- **Can be assigned to members**: ❌ No
- **Description**: Full access to all features
- **Access**: Everything (dashboard, jobs, drafts, applications, interviews, workflow, team members, audit log, settings, analytics, etc.)

### 2. Administrator
- **Value**: `admin`
- **Label**: Administrator
- **Can be assigned to members**: ✅ Yes
- **Description**: Manages operations, team, and most features
- **Access**: Almost everything except agency settings and compliance reports

### 3. Manager
- **Value**: `manager`
- **Label**: Manager
- **Can be assigned to members**: ✅ Yes
- **Description**: Manages recruitment process and team coordination
- **Access**: Dashboard, jobs, drafts, applications, interviews, workflow, analytics, candidate management, document management, visa processing

### 4. Staff
- **Value**: `staff`
- **Label**: Staff
- **Can be assigned to members**: ✅ Yes
- **Description**: Handles job postings and candidate applications
- **Access**: Dashboard, jobs, applications, workflow, candidate management, document management

### 5. Recruiter
- **Value**: `recruiter`
- **Label**: Recruiter
- **Can be assigned to members**: ✅ Yes
- **Description**: Focuses on candidate sourcing and screening
- **Access**: Dashboard, jobs, applications, interviews, candidate management, document management

### 6. Interview Coordinator
- **Value**: `coordinator`
- **Label**: Interview Coordinator
- **Can be assigned to members**: ✅ Yes
- **Description**: Manages interview scheduling and coordination
- **Access**: Dashboard, applications, interviews

### 7. Visa Officer
- **Value**: `visaOfficer`
- **Label**: Visa Officer
- **Can be assigned to members**: ✅ Yes
- **Description**: Handles visa processing and documentation
- **Access**: Dashboard, applications, workflow, candidate management, document management, visa processing

### 8. Accountant
- **Value**: `accountant`
- **Label**: Accountant
- **Can be assigned to members**: ✅ Yes
- **Description**: Manages payments and financial tracking
- **Access**: Dashboard, applications, analytics, payment tracking, compliance reports

## How to Add a New Role

### Step 1: Add Role Definition

Edit `src/config/roles.js` and add your new role to the `ROLES` object:

```javascript
NEW_ROLE: {
  key: 'newRole',
  value: 'newRole',
  label: 'New Role Name',
  description: 'What this role does',
  color: 'bg-teal-100 text-teal-800', // Tailwind classes
  canBeAssignedToMembers: true, // or false
},
```

### Step 2: Add Permissions

Edit `src/config/roleBasedAccess.js` and add permissions for your new role:

```javascript
export const ROLE_FEATURES = {
  // ... existing roles ...
  
  [ROLES.NEW_ROLE.value]: {
    label: ROLES.NEW_ROLE.label,
    description: ROLES.NEW_ROLE.description,
    color: ROLES.NEW_ROLE.color,
    features: {
      dashboard: true,
      jobs: true,
      drafts: false,
      applications: true,
      interviews: false,
      workflow: false,
      teamMembers: false,
      auditLog: false,
      settings: false,
      analytics: false,
      candidateManagement: true,
      documentManagement: false,
      paymentTracking: false,
      visaProcessing: false,
      complianceReports: false,
    }
  },
};
```

### Step 3: Add to Navigation

In `src/config/roleBasedAccess.js`, update the `NAVIGATION_ITEMS` to include your new role in the appropriate pages:

```javascript
dashboard: {
  path: '/dashboard',
  label: 'Dashboard',
  icon: 'BarChart3',
  description: 'View agency overview and metrics',
  roles: ['owner', 'admin', 'manager', 'staff', 'recruiter', 'coordinator', 'visaOfficer', 'accountant', 'newRole'],
},
```

### Step 4: Add Feature Permissions

In `src/config/roleBasedAccess.js`, update `FEATURE_PERMISSIONS` to define what actions the role can perform:

```javascript
export const FEATURE_PERMISSIONS = {
  jobs: {
    view: ['owner', 'admin', 'manager', 'staff', 'recruiter', 'newRole'],
    create: ['owner', 'admin', 'manager'],
    edit: ['owner', 'admin', 'manager'],
    delete: ['owner', 'admin'],
    publish: ['owner', 'admin', 'manager'],
  },
  // ... other features
};
```

### Step 5: Add Translations (Optional)

Add translations in `src/translations/en/pages/team-members.json` and `src/translations/ne/pages/team-members.json`:

```json
{
  "roles": {
    "newRole": "New Role Name"
  }
}
```

### That's It!

The new role will automatically:
- ✅ Appear in the team member invitation dropdown (if `canBeAssignedToMembers: true`)
- ✅ Appear in the role filter dropdown
- ✅ Have proper RBAC restrictions applied
- ✅ Show correct navigation items based on permissions

## How to Rename a Role

### Step 1: Update Role Definition

Edit `src/config/roles.js`:

```javascript
STAFF: {
  key: 'staff',
  value: 'staff', // Keep this the same for backward compatibility
  label: 'Team Member', // Change this
  description: 'Updated description', // Change this
  color: 'bg-yellow-100 text-yellow-800',
  canBeAssignedToMembers: true,
},
```

### Step 2: Update Translations

Update `src/translations/en/pages/team-members.json`:

```json
{
  "roles": {
    "staff": "Team Member"
  }
}
```

## How to Remove a Role

### Step 1: Remove from Role Definition

Edit `src/config/roles.js` and remove or comment out the role.

### Step 2: Remove from RBAC

Edit `src/config/roleBasedAccess.js` and remove the role from:
- `ROLE_FEATURES`
- `NAVIGATION_ITEMS` (remove from roles arrays)
- `FEATURE_PERMISSIONS` (remove from permission arrays)

### Step 3: Database Migration

**Important**: If you have existing users with this role in your database, you need to:
1. Migrate them to a different role
2. Or handle the deprecated role gracefully in your backend

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    src/config/roles.js                       │
│              (SINGLE SOURCE OF TRUTH)                        │
│  - Defines all roles                                         │
│  - Role metadata (label, description, color)                 │
│  - Which roles can be assigned to members                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ imports
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│ roleBasedAccess  │    │   Team Member Pages  │
│      .js         │    │  (Members.jsx, etc)  │
│                  │    │                      │
│ - RBAC rules     │    │ - Role dropdowns     │
│ - Permissions    │    │ - Role filters       │
│ - Navigation     │    │ - Role display       │
└──────────────────┘    └──────────────────────┘
```

## Files That Reference Roles

1. **`src/config/roles.js`** - Role definitions (SOURCE OF TRUTH)
2. **`src/config/roleBasedAccess.js`** - RBAC permissions
3. **`src/pages/Members.jsx`** - Team member management
4. **`src/pages/MemberManagement.jsx`** - Alternative member management
5. **`src/hooks/useRoleBasedAccess.js`** - Role access hook
6. **`src/services/authService.js`** - Authentication (uses legacy role constants, needs update)

## Current Alignment Status

### ✅ Aligned
- **RBAC Configuration** → Uses `src/config/roles.js`
- **Team Member Pages** → Uses `src/config/roles.js`
- **Role Display** → Uses `src/config/roles.js`

### ⚠️ Needs Attention
- **Auth Service** (`src/services/authService.js`) - Still uses legacy `ROLES` constants. Should be updated to import from `src/config/roles.js`

## Testing Your Changes

After adding/modifying roles:

1. **Check Team Members Page** (`/teammembers`)
   - Verify new role appears in dropdown
   - Verify role filter works
   - Verify role display is correct

2. **Check RBAC**
   - Login as a user with the new role
   - Verify correct pages are visible in navigation
   - Verify correct features are accessible

3. **Check Translations**
   - Switch language to Nepali
   - Verify role names are translated

## Best Practices

1. **Never hardcode role values** - Always import from `src/config/roles.js`
2. **Use helper functions** - Use `getRoleLabel()`, `getRoleByValue()`, etc.
3. **Keep role values stable** - Don't change the `value` field once in production
4. **Update all three places** when adding a role:
   - Role definition (`roles.js`)
   - Permissions (`roleBasedAccess.js`)
   - Translations (optional)

## Future Improvements

1. **Backend Integration**: Move role definitions to backend database
2. **Dynamic Roles**: Allow admins to create custom roles via UI
3. **Role Hierarchy**: Implement role inheritance (e.g., Admin inherits Manager permissions)
4. **Permission Builder**: UI for configuring role permissions
5. **Auth Service Update**: Refactor `authService.js` to use centralized roles

## Questions?

If you need to modify roles, always start with `src/config/roles.js` and work your way out to the other files.
