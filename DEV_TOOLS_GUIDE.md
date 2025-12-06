# Developer Tools Guide

## Role Switcher Dev Tool

### Overview

A developer tool that allows instant role switching for testing RBAC (Role-Based Access Control) without logging in and out repeatedly.

### Features

- ✅ **Localhost Only** - Only appears when running on `localhost` or `127.0.0.1`
- ✅ **Authenticated Users Only** - Only visible after user login
- ✅ **All Roles Available** - Shows all 8 roles in a horizontal scrollable list
- ✅ **Visual Feedback** - Current role is highlighted with a ring
- ✅ **Reset Functionality** - Reset button to restore original role
- ✅ **Minimizable** - Can minimize to save screen space
- ✅ **Closeable** - Can close completely if not needed
- ✅ **Persistent** - Appears on all authenticated pages

### Location

The dev tool card appears at the **bottom center** of the screen on all authenticated pages:
- Agency Portal pages (wrapped in `Layout`)
- Owner Portal pages (wrapped in `OwnerLayout`)

### How to Use

#### 1. Start Development Server
```bash
npm run dev
# or
yarn dev
```

#### 2. Login to Application
Navigate to `http://localhost:5173` (or your dev port) and login with any user.

#### 3. Role Switcher Appears
You'll see a purple/indigo card at the bottom of the screen with:
- **Header**: "Dev Tools - Role Switcher"
- **Current Role**: Shows your active role
- **Role Buttons**: Horizontal scrollable list of all roles
- **Reset Button**: Appears when role is changed

#### 4. Switch Roles
Click any role button to instantly switch to that role. The page will reload to apply the new permissions.

#### 5. Test RBAC
After switching roles:
- Navigation items will update based on role permissions
- Pages will be restricted based on role access
- Features will be enabled/disabled based on role

#### 6. Reset to Original
Click the **Reset** button to restore your original login role.

### Available Roles

1. **Owner** - Full access to everything
2. **Administrator** - Manages operations, team, and most features
3. **Manager** - Manages recruitment process and team coordination
4. **Staff** - Handles job postings and candidate applications
5. **Recruiter** - Focuses on candidate sourcing and screening
6. **Interview Coordinator** - Manages interview scheduling
7. **Visa Officer** - Handles visa processing and documentation
8. **Accountant** - Manages payments and financial tracking

### UI Controls

#### Minimize Button (▼/▲)
- Click to collapse/expand the role list
- Saves screen space when not actively switching roles

#### Close Button (X)
- Click to completely hide the dev tool
- Refresh page to show it again

### Visual Design

- **Background**: Purple/indigo gradient with dark theme
- **Border**: Purple border with shadow
- **Active Role**: White background with yellow ring
- **Inactive Roles**: Purple background with hover effects
- **Reset Button**: Yellow background for visibility

### Technical Details

#### Files Created/Modified

1. **Created**: `src/components/DevTools/RoleSwitcher.jsx`
   - Main dev tool component
   - Handles role switching logic
   - UI rendering

2. **Modified**: `src/contexts/AuthContext.jsx`
   - Added `updateUserRole()` function
   - Updates user role in state and localStorage
   - Updates permissions for new role

3. **Modified**: `src/components/Layout.jsx`
   - Imported and rendered `RoleSwitcher`
   - Appears on all agency portal pages

4. **Modified**: `src/components/OwnerLayout.jsx`
   - Imported and rendered `RoleSwitcher`
   - Appears on all owner portal pages

5. **Modified**: `src/index.css`
   - Added custom scrollbar styles
   - Purple theme for horizontal scroll

#### How It Works

```javascript
// 1. User clicks a role button
handleRoleSwitch('manager')

// 2. Updates AuthContext
updateUserRole('manager')

// 3. Updates localStorage
localStorage.setItem('udaan_user', JSON.stringify({
  ...user,
  role: 'manager',
  specificRole: 'manager'
}))

// 4. Updates permissions
const newPermissions = authService.getUserPermissions('manager')
localStorage.setItem('udaan_permissions', JSON.stringify(newPermissions))

// 5. Page reloads to apply changes
window.location.reload()
```

#### Conditional Rendering

```javascript
// Only shows in development
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

if (!isDevelopment || !user) {
  return null;
}
```

### Testing Scenarios

#### Scenario 1: Test Navigation Restrictions
1. Login as Owner
2. Note all navigation items visible
3. Switch to "Staff" role
4. Observe: Team Members, Audit Log, Settings disappear
5. Reset to Owner
6. Observe: All items return

#### Scenario 2: Test Page Access
1. Login as Manager
2. Navigate to `/teammembers`
3. Switch to "Staff" role
4. Observe: Redirected to dashboard (no access)
5. Reset to Manager
6. Navigate to `/teammembers` again
7. Observe: Access granted

#### Scenario 3: Test Feature Permissions
1. Login as Admin
2. Go to Jobs page
3. Observe: Can create, edit, delete jobs
4. Switch to "Recruiter" role
5. Observe: Can only view jobs, no create/edit/delete buttons
6. Reset to Admin
7. Observe: Full permissions restored

#### Scenario 4: Test Multiple Roles Quickly
1. Login as Owner
2. Switch to Admin → Test features
3. Switch to Manager → Test features
4. Switch to Staff → Test features
5. Switch to Recruiter → Test features
6. Switch to Coordinator → Test features
7. Switch to Visa Officer → Test features
8. Switch to Accountant → Test features
9. Reset to Owner

### Troubleshooting

#### Dev Tool Not Appearing

**Problem**: Dev tool doesn't show up after login

**Solutions**:
1. Check you're on `localhost` or `127.0.0.1`
2. Verify you're logged in (check localStorage for `udaan_user`)
3. Check browser console for errors
4. Refresh the page
5. Clear browser cache and localStorage

#### Role Switch Not Working

**Problem**: Clicking role button doesn't change role

**Solutions**:
1. Check browser console for errors
2. Verify `updateUserRole` function exists in AuthContext
3. Check localStorage is not disabled
4. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

#### Page Not Reloading

**Problem**: Role changes but page doesn't reload

**Solutions**:
1. Manually refresh the page
2. Check if `window.location.reload()` is being called
3. Check browser console for errors

#### Permissions Not Updating

**Problem**: Role changes but permissions stay the same

**Solutions**:
1. Check `authService.getUserPermissions()` is working
2. Verify permissions are being saved to localStorage
3. Check RBAC configuration in `roleBasedAccess.js`
4. Clear localStorage and login again

### Production Deployment

**IMPORTANT**: The dev tool automatically hides in production.

It checks:
```javascript
window.location.hostname === 'localhost' || 
window.location.hostname === '127.0.0.1'
```

On production domains (e.g., `app.udaan.com`), the dev tool will not render at all.

### Best Practices

1. **Always Reset** - Reset to original role before logging out
2. **Test Systematically** - Test one role at a time thoroughly
3. **Document Issues** - Note any RBAC issues found during testing
4. **Clear Cache** - Clear browser cache between major role changes
5. **Use Incognito** - Test in incognito mode for clean state

### Future Enhancements

Potential improvements for the dev tool:

1. **Permission Viewer** - Show current permissions for active role
2. **Feature Access Matrix** - Visual grid of role vs features
3. **Quick Actions** - Preset role switching scenarios
4. **Session History** - Track role switches during session
5. **Export Test Report** - Generate RBAC test coverage report
6. **Custom Roles** - Temporarily create custom role configurations
7. **Keyboard Shortcuts** - Quick role switching with hotkeys
8. **Role Comparison** - Side-by-side comparison of two roles

### Related Documentation

- [Role Configuration Guide](./ROLE_CONFIGURATION_GUIDE.md) - How to add/modify roles
- [Role Alignment Analysis](./ROLE_ALIGNMENT_ANALYSIS.md) - Current role system architecture
- [RBAC Configuration](./src/config/roleBasedAccess.js) - Role permissions configuration

### Support

If you encounter issues with the dev tool:

1. Check this guide first
2. Review browser console for errors
3. Check localStorage contents
4. Verify you're on localhost
5. Try clearing cache and restarting dev server

### Example Usage Video

```
1. Start dev server: npm run dev
2. Open http://localhost:5173
3. Login with any credentials
4. See dev tool at bottom of screen
5. Click "Staff" role button
6. Page reloads with Staff permissions
7. Navigate to /teammembers
8. Get redirected (no access)
9. Click "Reset" button
10. Original role restored
11. Navigate to /teammembers
12. Access granted
```

### Keyboard Shortcuts (Future)

Planned keyboard shortcuts:

- `Ctrl+Shift+D` - Toggle dev tool visibility
- `Ctrl+Shift+R` - Reset to original role
- `Ctrl+Shift+1-8` - Quick switch to role 1-8
- `Ctrl+Shift+M` - Minimize/expand dev tool

---

**Happy Testing! 🚀**

The Role Switcher dev tool makes RBAC testing fast and efficient. No more logging in and out repeatedly!
