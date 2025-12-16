# Role Configuration - Quick Reference

## The Issue You Found

**Problem:** The navbar (RoleSwitcher) shows different roles than the Members page invite form.

**Why:** 
- **Navbar (RoleSwitcher):** Shows ALL roles including 'owner' (for development/testing)
- **Members Page:** Shows only ASSIGNABLE roles (excludes 'owner')

This is intentional and correct!

## Quick Facts

### Assignable Roles (Can be invited as team members)
```
✅ admin
✅ manager
✅ staff
✅ recruiter
✅ coordinator
✅ visaOfficer
✅ accountant
```

### Non-Assignable Roles (Cannot be invited)
```
❌ owner (system owner only)
```

## Where to Check/Update Roles

### 1. View All Roles
**File:** `src/config/roles.js`
- This is the SINGLE SOURCE OF TRUTH
- All role definitions are here
- Each role has: key, value, label, description, color, canBeAssignedToMembers

### 2. View Role Permissions
**File:** `src/config/roleBasedAccess.js`
- Defines what features each role can access
- Maps to roles.js definitions

### 3. View Where Roles Are Used
- **Members Page:** `src/pages/Members.jsx` → uses `getAssignableRoles()`
- **RoleSwitcher:** `src/components/DevTools/RoleSwitcher.jsx` → uses `getAllRoleValues()`
- **Member Service:** `src/services/memberService.js` → validates against `getAssignableRoles()`

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
```

## What Was Fixed

**Before:** memberService.js had hardcoded roles
```javascript
const validRoles = ['staff', 'admin', 'manager'];
```

**After:** memberService.js now uses the RBAC configuration
```javascript
const assignableRoles = getAssignableRoles();
const validRoles = assignableRoles.map(role => role.value);
```

**Result:** 
- ✅ Roles are now consistent across the app
- ✅ Adding new roles automatically updates validation
- ✅ No more hardcoded role lists
- ✅ Single source of truth maintained

## Testing

1. Open navbar (RoleSwitcher) - you'll see all 8 roles including 'owner'
2. Go to Team Members page - you'll see only 7 roles (excludes 'owner')
3. Try to invite a member - validation uses the same 7 assignable roles
4. All three are now in sync!

## Documentation Files

- **Full Details:** `RBAC_ROLE_CONFIGURATION.md`
- **This Quick Reference:** `ROLE_CONFIGURATION_QUICK_REFERENCE.md`
- **Source Code:** `src/config/roles.js` (single source of truth)
