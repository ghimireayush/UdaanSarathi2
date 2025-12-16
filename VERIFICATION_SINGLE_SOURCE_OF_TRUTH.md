# Verification: Single Source of Truth for Roles

## Checklist

### ✅ Production Code
- [x] `src/services/memberService.js` - Uses `getAssignableRoles()` for validation
- [x] `src/pages/Members.jsx` - Uses `getAssignableRoles()` for dropdown
- [x] `src/components/DevTools/RoleSwitcher.jsx` - Uses `getAllRoleValues()` for testing
- [x] `src/config/roles.js` - Single source of truth for all role definitions
- [x] `src/config/roleBasedAccess.js` - Role permissions reference `roles.js`

### ✅ Test Files
- [x] `src/services/memberService.test.js` - Uses `getAssignableRoles()`
- [x] `src/services/memberInvite.test.js` - Uses `getAssignableRoles()`
- [x] `src/services/memberService.integration.test.js` - Uses `getAssignableRoles()`

### ✅ No Hardcoded Role Lists
- [x] No hardcoded `['staff', 'admin', 'manager']` in production code
- [x] No hardcoded `['staff', 'admin', 'manager']` in test validation
- [x] All role validation uses `getAssignableRoles()`

## Current Role Configuration

### Available Roles (from src/config/roles.js)

| Role | Value | Assignable | Description |
|------|-------|-----------|-------------|
| Agency Owner | `owner` | ❌ No | Full access to all features |
| Administrator | `admin` | ✅ Yes | Manages operations, team, and most features |
| Manager | `manager` | ✅ Yes | Manages recruitment process and team coordination |
| Staff | `staff` | ✅ Yes | Handles job postings and candidate applications |
| Recruiter | `recruiter` | ✅ Yes | Focuses on candidate sourcing and screening |
| Interview Coordinator | `coordinator` | ✅ Yes | Manages interview scheduling and coordination |
| Visa Officer | `visaOfficer` | ✅ Yes | Handles visa processing and documentation |
| Accountant | `accountant` | ✅ Yes | Manages payments and financial tracking |

### Assignable Roles (7 total)
```
admin, manager, staff, recruiter, coordinator, visaOfficer, accountant
```

### Non-Assignable Roles (1 total)
```
owner
```

## How to Verify

### 1. Check memberService.js
```bash
grep -n "getAssignableRoles" src/services/memberService.js
```
Expected: Should show import and usage of `getAssignableRoles()`

### 2. Check for hardcoded roles
```bash
grep -r "staff.*admin.*manager" src/services/ --include="*.js" | grep -v test | grep -v node_modules
```
Expected: Should return NO results (except in test files)

### 3. Run tests
```bash
npm test -- memberService.test.js
npm test -- memberInvite.test.js
npm test -- memberService.integration.test.js
```
Expected: All tests should pass

### 4. Test in browser
1. Go to Team Members page
2. Open invite form
3. Check role dropdown - should show 7 roles (no owner)
4. Open RoleSwitcher (navbar, bottom)
5. Check role switcher - should show 8 roles (including owner)

## What This Achieves

✅ **Single Source of Truth**
- All role definitions in `src/config/roles.js`
- No duplication across files

✅ **Consistency**
- Navbar shows all roles (for testing)
- Members page shows only assignable roles
- memberService validates against assignable roles
- All three are now in sync

✅ **Maintainability**
- Add new role in one place
- It automatically appears everywhere
- Tests automatically validate new roles

✅ **No Hardcoded Lists**
- No `['staff', 'admin', 'manager']` scattered in code
- All validation uses `getAssignableRoles()`
- Easy to add/remove roles

✅ **Test Coverage**
- Tests use dynamic role list
- When you add a role, tests automatically test it
- No need to update test files

## Adding a New Role

To add a new role (e.g., "Supervisor"):

1. **Edit `src/config/roles.js`:**
```javascript
SUPERVISOR: {
  key: 'supervisor',
  value: 'supervisor',
  label: 'Supervisor',
  description: 'Supervises team and manages escalations',
  color: 'bg-teal-100 text-teal-800',
  canBeAssignedToMembers: true,
},
```

2. **Edit `src/config/roleBasedAccess.js`:**
```javascript
[ROLES.SUPERVISOR.value]: {
  label: ROLES.SUPERVISOR.label,
  description: ROLES.SUPERVISOR.description,
  color: ROLES.SUPERVISOR.color,
  features: {
    dashboard: true,
    jobs: true,
    // ... define permissions
  }
},
```

3. **That's it!** The role will automatically:
   - ✅ Appear in Members page dropdown
   - ✅ Appear in RoleSwitcher
   - ✅ Pass validation in memberService
   - ✅ Be tested in all test files
   - ✅ Work in RBAC checks

## Documentation Files

- `SINGLE_SOURCE_OF_TRUTH_ROLES.md` - This file (verification)
- `RBAC_ROLE_CONFIGURATION.md` - Comprehensive RBAC guide
- `ROLE_CONFIGURATION_QUICK_REFERENCE.md` - Quick reference
- `src/config/roles.js` - Role definitions (single source of truth)
- `src/config/roleBasedAccess.js` - Role permissions

## Summary

✅ **All role definitions now use a single source of truth**
✅ **No hardcoded role lists in production code**
✅ **All tests use dynamic role configuration**
✅ **Easy to add/modify roles**
✅ **Consistent across the entire application**
