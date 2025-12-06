# Role Switcher Navigation Fix

## Problem

When switching roles using the dev tool, the navigation sidebar items would update correctly, but clicking on them would cause the screen to flicker without actually navigating to the page. The user would be blocked from accessing pages even though the navigation items were visible.

## Root Cause

There were two main issues:

### 1. Missing Permission Mappings

The `authService.js` file only had permission mappings for legacy roles:
- `admin`
- `recipient`
- `coordinator`
- `agency_owner`

But the new RBAC system has 8 roles:
- `owner`
- `admin`
- `manager`
- `staff`
- `recruiter`
- `coordinator`
- `visaOfficer`
- `accountant`

When switching to roles like `visaOfficer`, `manager`, `staff`, etc., the `getUserPermissions()` function would return an empty array `[]`, causing all permission checks to fail.

### 2. Page Not Reloading After Role Switch

The `RoleSwitcher` component was updating the user role in state and localStorage, but NOT reloading the page. This meant:
- The `PrivateRoute` component was still using old permission checks
- The navigation items updated (because they use the new role from state)
- But the route guards didn't re-evaluate (because the component didn't remount)

### 3. Stale Permission Checks

The `hasPermission()` function in `AuthContext` was calling `authService.hasPermission()`, which checked `authService.currentUser.role`. Even though we updated `authService.currentUser` in `updateUserRole()`, React components were not re-rendering with the new permissions until a page reload.

## Solution

### Fix 1: Added Permission Mappings for All Roles

Updated `src/services/authService.js` to include permission mappings for all new roles:

```javascript
const ROLE_PERMISSIONS = {
  // ... existing roles ...
  
  'manager': [
    PERMISSIONS.CREATE_JOB,
    PERMISSIONS.EDIT_JOB,
    PERMISSIONS.PUBLISH_JOB,
    PERMISSIONS.VIEW_JOBS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.EDIT_APPLICATION,
    PERMISSIONS.SHORTLIST_CANDIDATE,
    PERMISSIONS.REJECT_APPLICATION,
    PERMISSIONS.SCHEDULE_INTERVIEW,
    PERMISSIONS.CONDUCT_INTERVIEW,
    PERMISSIONS.EDIT_INTERVIEW,
    PERMISSIONS.VIEW_INTERVIEWS,
    PERMISSIONS.VIEW_WORKFLOW,
    PERMISSIONS.UPDATE_WORKFLOW_STAGE,
    PERMISSIONS.MANAGE_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.EDIT_DOCUMENTS
  ],
  
  'staff': [
    PERMISSIONS.VIEW_JOBS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.EDIT_APPLICATION,
    PERMISSIONS.VIEW_WORKFLOW,
    PERMISSIONS.UPDATE_WORKFLOW_STAGE,
    PERMISSIONS.MANAGE_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.EDIT_DOCUMENTS
  ],
  
  'recruiter': [
    PERMISSIONS.VIEW_JOBS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.EDIT_APPLICATION,
    PERMISSIONS.SHORTLIST_CANDIDATE,
    PERMISSIONS.REJECT_APPLICATION,
    PERMISSIONS.SCHEDULE_INTERVIEW,
    PERMISSIONS.CONDUCT_INTERVIEW,
    PERMISSIONS.EDIT_INTERVIEW,
    PERMISSIONS.VIEW_INTERVIEWS,
    PERMISSIONS.MANAGE_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.EDIT_DOCUMENTS
  ],
  
  'coordinator': [
    PERMISSIONS.SCHEDULE_INTERVIEW,
    PERMISSIONS.MANAGE_CALENDAR,
    PERMISSIONS.SCHEDULE_EVENTS,
    PERMISSIONS.VIEW_INTERVIEWS,
    PERMISSIONS.EDIT_INTERVIEW,
    PERMISSIONS.SEND_NOTIFICATIONS,
    PERMISSIONS.VIEW_APPLICATIONS
  ],
  
  'visaOfficer': [
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.EDIT_APPLICATION,
    PERMISSIONS.VIEW_WORKFLOW,
    PERMISSIONS.UPDATE_WORKFLOW_STAGE,
    PERMISSIONS.MANAGE_DOCUMENTS,
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.EDIT_DOCUMENTS,
    PERMISSIONS.DELETE_DOCUMENTS
  ],
  
  'accountant': [
    PERMISSIONS.VIEW_APPLICATIONS
  ]
}
```

### Fix 2: Force Page Reload After Role Switch

Updated `src/components/DevTools/RoleSwitcher.jsx` to always reload the page after switching roles:

```javascript
const handleRoleSwitch = (newRole) => {
  if (updateUserRole) {
    updateUserRole(newRole);
    setCurrentRole(newRole);
    // Force page reload to apply changes
    setTimeout(() => {
      window.location.reload();
    }, 100);
  } else {
    // Fallback: Update localStorage directly
    const updatedUser = {
      ...user,
      role: newRole,
      specificRole: newRole,
    };
    localStorage.setItem('udaan_user', JSON.stringify(updatedUser));
    setCurrentRole(newRole);
    // Force page reload to apply changes
    window.location.reload();
  }
};
```

The `setTimeout` gives the state update time to complete before reloading.

### Fix 3: Use Fresh User State for Permission Checks

Updated `src/contexts/AuthContext.jsx` to check permissions using the current user state instead of relying on `authService.currentUser`:

```javascript
const hasPermission = (permission) => {
  // Use current user from state instead of authService to ensure fresh data
  if (!user) return false
  const userRole = user.specificRole || user.role
  const userPermissions = authService.getUserPermissions(userRole)
  return userPermissions.includes(permission)
}

const hasRole = (role) => {
  // Use current user from state instead of authService to ensure fresh data
  if (!user) return false
  const userRole = user.specificRole || user.role
  return userRole === role
}

const hasAnyPermission = (permissionList) => {
  // Use current user from state instead of authService to ensure fresh data
  return permissionList.some(permission => hasPermission(permission))
}

const hasAllPermissions = (permissionList) => {
  // Use current user from state instead of authService to ensure fresh data
  return permissionList.every(permission => hasPermission(permission))
}
```

This ensures that permission checks always use the most up-to-date user role from React state.

## Testing

### Test Case 1: Visa Officer → Workflow Access

**Before Fix:**
1. Switch to Visa Officer role
2. See "Workflow" in navigation
3. Click "Workflow"
4. Screen flickers, stays on current page
5. Cannot access workflow page

**After Fix:**
1. Switch to Visa Officer role
2. Page reloads
3. See "Workflow" in navigation
4. Click "Workflow"
5. Successfully navigate to workflow page ✅

### Test Case 2: Staff → Team Members Access

**Before Fix:**
1. Switch to Staff role
2. "Team Members" disappears from navigation ✅
3. Try to manually navigate to `/teammembers`
4. Access denied ✅

**After Fix:**
1. Switch to Staff role
2. Page reloads
3. "Team Members" disappears from navigation ✅
4. Try to manually navigate to `/teammembers`
5. Access denied ✅

### Test Case 3: Manager → All Accessible Pages

**Before Fix:**
1. Switch to Manager role
2. See navigation items
3. Some pages accessible, some not
4. Inconsistent behavior

**After Fix:**
1. Switch to Manager role
2. Page reloads
3. See correct navigation items
4. All visible pages are accessible ✅
5. Hidden pages remain blocked ✅

## Permission Matrix

Here's what each role can access:

| Feature | Owner | Admin | Manager | Staff | Recruiter | Coordinator | Visa Officer | Accountant |
|---------|-------|-------|---------|-------|-----------|-------------|--------------|------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Jobs (View) | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Jobs (Create) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Drafts | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Applications | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Interviews | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| Workflow | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Team Members | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Audit Log | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

## Files Modified

1. ✅ `src/services/authService.js` - Added permission mappings for all roles
2. ✅ `src/components/DevTools/RoleSwitcher.jsx` - Added page reload after role switch
3. ✅ `src/contexts/AuthContext.jsx` - Updated permission checks to use fresh state

## Verification Steps

1. Start dev server: `npm run dev`
2. Login with any user
3. Open dev tools (should appear at bottom)
4. Switch to "Visa Officer" role
5. Wait for page reload
6. Click "Workflow" in navigation
7. Verify you can access the workflow page ✅
8. Switch to "Staff" role
9. Wait for page reload
10. Verify "Team Members" is not in navigation ✅
11. Try to access `/teammembers` directly
12. Verify you're redirected to dashboard ✅
13. Click "Reset" button
14. Verify original role is restored ✅

## Known Limitations

1. **Page Reload Required** - The page must reload after switching roles. This is necessary to ensure all components re-mount with the new permissions.

2. **Unsaved Data Lost** - If you have unsaved form data and switch roles, it will be lost due to the page reload. This is acceptable for a dev tool.

3. **Navigation State Lost** - Any navigation state (scroll position, expanded sections, etc.) will be reset after role switch.

## Future Improvements

1. **Hot Role Switching** - Implement role switching without page reload using React Context updates
2. **Permission Preview** - Show what permissions will be available before switching
3. **Unsaved Data Warning** - Warn user if they have unsaved data before switching
4. **Role History** - Track role switches during session for debugging

## Conclusion

The role switcher now works correctly! Users can switch between any role and immediately access the pages they have permissions for. The navigation items and route guards are now perfectly aligned.
