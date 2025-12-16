# Single Source of Truth for Roles

## Overview

All role definitions and validations now use a single source of truth: `src/config/roles.js`

This ensures consistency across the entire application and makes it easy to add, remove, or modify roles without updating multiple files.

## Single Source of Truth

**File:** `src/config/roles.js`

This is the ONLY place where roles are defined. All other files reference this configuration.

## How It Works

### 1. Role Definition (src/config/roles.js)
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

### 3. Validation in memberService.js
```javascript
import { getAssignableRoles } from '../config/roles.js';

export const inviteMember = async (memberData) => {
  // Validate role according to RBAC configuration
  const assignableRoles = getAssignableRoles();
  const validRoles = assignableRoles.map(role => role.value);
  if (!validRoles.includes(memberData.role)) {
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
  }
  // ... rest of implementation
};
```

## What Changed

### Before (Hardcoded)
```javascript
// ❌ BAD: Hardcoded role list
const validRoles = ['staff', 'admin', 'manager'];
if (!validRoles.includes(memberData.role)) {
  throw new Error('Invalid role. Must be one of: staff, admin, manager');
}
```

### After (Dynamic)
```javascript
// ✅ GOOD: Uses configuration
const assignableRoles = getAssignableRoles();
const validRoles = assignableRoles.map(role => role.value);
if (!validRoles.includes(memberData.role)) {
  throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
}
```

## Files Updated

### Production Code
- ✅ `src/services/memberService.js` - Now uses `getAssignableRoles()`

### Test Files
- ✅ `src/services/memberService.test.js` - Now uses `getAssignableRoles()`
- ✅ `src/services/memberInvite.test.js` - Now uses `getAssignableRoles()`
- ✅ `src/services/memberService.integration.test.js` - Now uses `getAssignableRoles()`

## Benefits

1. **Single Source of Truth**
   - All role definitions in one place
   - No duplication or inconsistency

2. **Easy to Add/Modify Roles**
   - Add a new role to `roles.js`
   - It automatically appears everywhere:
     - Team member dropdowns
     - Role switcher
     - Validation logic
     - Tests

3. **Consistency**
   - Navbar shows all roles (for testing)
   - Members page shows only assignable roles
   - memberService validates against assignable roles
   - All three are now in sync

4. **Maintainability**
   - No hardcoded role lists scattered throughout the code
   - Changes in one place propagate everywhere
   - Tests automatically validate all roles

5. **Type Safety**
   - Role values are defined in one place
   - Reduces typos and errors
   - IDE autocomplete works better

## Available Roles

All roles are defined in `src/config/roles.js`:

### Assignable Roles (can be invited as team members)
```
✅ admin
✅ manager
✅ staff
✅ recruiter
✅ coordinator
✅ visaOfficer
✅ accountant
```

### Non-Assignable Roles
```
❌ owner (system owner only)
```

## How to Add a New Role

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

3. **That's it!** The role will automatically:
   - Appear in team member dropdowns (if `canBeAssignedToMembers: true`)
   - Appear in role switcher (for testing)
   - Pass validation in memberService
   - Work in all tests

## Key Functions

```javascript
// Get only roles that can be assigned to team members
import { getAssignableRoles } from '../config/roles.js';
const roles = getAssignableRoles();
// Returns: [admin, manager, staff, recruiter, coordinator, visaOfficer, accountant]

// Get ALL roles including owner (for dev/testing)
import { getAllRoleValues } from '../config/roles.js';
const allRoles = getAllRoleValues();
// Returns: [owner, admin, manager, staff, recruiter, coordinator, visaOfficer, accountant]

// Get role label
import { getRoleLabel } from '../config/roles.js';
const label = getRoleLabel('admin'); // Returns: "Administrator"

// Check if role can be assigned
import { canAssignRole } from '../config/roles.js';
const canAssign = canAssignRole('owner'); // Returns: false

// Check if role is valid
import { isValidRole } from '../config/roles.js';
const isValid = isValidRole('admin'); // Returns: true
```

## Testing

All tests now use the dynamic role list:

```javascript
import { getAssignableRoles } from '../config/roles.js';

// Tests automatically use all assignable roles
const assignableRoles = getAssignableRoles();
const roles = assignableRoles.map(role => role.value);

for (const role of roles) {
  // Test each role
}
```

This means:
- ✅ When you add a new role, tests automatically test it
- ✅ No need to update test files when adding roles
- ✅ Tests always validate against the current role configuration

## Verification

To verify everything is working:

1. Check that `src/config/roles.js` is the only place with role definitions
2. Check that `memberService.js` uses `getAssignableRoles()`
3. Check that all test files use `getAssignableRoles()`
4. Add a new role and verify it appears everywhere

## Related Documentation

- `RBAC_ROLE_CONFIGURATION.md` - Comprehensive RBAC guide
- `ROLE_CONFIGURATION_QUICK_REFERENCE.md` - Quick reference
- `src/config/roles.js` - Role definitions (single source of truth)
- `src/config/roleBasedAccess.js` - Role permissions
