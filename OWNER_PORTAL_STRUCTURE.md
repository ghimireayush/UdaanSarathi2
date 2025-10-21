# Owner Portal Structure

## Overview
The `/owner` section is now a completely separate portal with its own layout, navigation, and purpose - providing a bird's eye view of the entire platform.

## Architecture

### Separation of Concerns

```
/owner/*          → Owner Portal (Platform-wide view)
  - Dedicated OwnerLayout component
  - Separate navigation
  - Platform-wide metrics and management
  
/*                → Agency Portal (Agency-specific view)
  - Standard Layout component
  - Agency-focused navigation
  - Agency-specific operations
```

## Owner Portal Routes

### Authentication
- `/owner/login` - Owner login page (no layout)

### Protected Routes (with OwnerLayout)
- `/owner/dashboard` - Platform overview with metrics
- `/owner/agencies` - Manage all agencies
- `/owner/users` - Manage all users across platform
- `/owner/settings` - Platform-wide settings

## OwnerLayout Component

### Features
✅ **Dedicated Sidebar Navigation**
- Dashboard
- Agencies
- Users
- Settings
- Logout

✅ **Top Bar**
- Mobile menu toggle
- Language switcher
- Theme toggle (light/dark)

✅ **User Profile Section**
- Owner avatar
- Owner name and email
- Logout button

✅ **Responsive Design**
- Mobile: Collapsible sidebar with backdrop
- Desktop: Fixed sidebar (256px width)
- Smooth transitions

✅ **Dark Theme Support**
- Full dark mode compatibility
- Proper color contrast
- Theme toggle in header

✅ **Bilingual Support**
- English and Nepali translations
- Language switcher in header

### Visual Design
- Clean, modern sidebar layout
- Brand colors for active navigation
- Smooth hover effects
- Professional appearance
- Consistent spacing

## File Structure

```
src/
├── components/
│   ├── Layout.jsx           # Agency portal layout
│   └── OwnerLayout.jsx      # Owner portal layout (NEW)
├── pages/
│   ├── Dashboard.jsx        # Agency dashboard
│   ├── OwnerDashboard.jsx   # Owner dashboard (NEW)
│   ├── OwnerAgencies.jsx    # Agencies management (NEW)
│   ├── OwnerUsers.jsx       # Users management (NEW)
│   ├── OwnerSettings.jsx    # Platform settings (NEW)
│   └── OwnerLogin.jsx       # Owner login (NEW)

public/translations/
├── en/pages/
│   ├── owner-layout.json
│   ├── owner-dashboard.json
│   ├── owner-agencies.json
│   ├── owner-users.json
│   └── owner-settings.json
└── ne/pages/
    ├── owner-layout.json
    ├── owner-dashboard.json
    ├── owner-agencies.json
    ├── owner-users.json
    └── owner-settings.json
```

## Navigation Structure

### Owner Portal Navigation
```
┌─────────────────────────┐
│  UdaanSarathi          │
│  Owner Portal          │
├─────────────────────────┤
│  📊 Dashboard          │
│  🏢 Agencies           │
│  👥 Users              │
│  ⚙️  Settings          │
├─────────────────────────┤
│  [Owner Profile]       │
│  🚪 Logout             │
└─────────────────────────┘
```

### Agency Portal Navigation (Separate)
```
┌─────────────────────────┐
│  UdaanSarathi          │
│  [Agency Name]         │
├─────────────────────────┤
│  📊 Dashboard          │
│  💼 Jobs               │
│  📝 Applications       │
│  📅 Interviews         │
│  🔄 Workflow           │
│  📋 Drafts             │
│  👥 Team Members       │
│  ⚙️  Settings          │
└─────────────────────────┘
```

## Key Differences

### Owner Portal
- **Purpose**: Platform-wide management and oversight
- **Scope**: All agencies, all users, platform metrics
- **Users**: Platform owners/administrators only
- **View**: Bird's eye view of entire platform
- **Layout**: OwnerLayout with dedicated navigation

### Agency Portal
- **Purpose**: Agency-specific operations
- **Scope**: Single agency's jobs, applications, team
- **Users**: Agency owners, recipients, coordinators
- **View**: Agency-focused operations
- **Layout**: Standard Layout with agency navigation

## Access Control

### Owner Portal Access
```javascript
// Only users with role 'admin' can access
if (user.role !== 'admin') {
  // Redirect to appropriate portal
}
```

### Route Protection
All owner routes are wrapped with:
```jsx
<OwnerLayout>
  <PrivateRoute>
    <OwnerDashboard />
  </PrivateRoute>
</OwnerLayout>
```

## Styling & Theming

### OwnerLayout Styling
- **Sidebar**: 256px fixed width on desktop
- **Background**: White (light) / Gray-800 (dark)
- **Active Nav**: Brand blue bright
- **Hover**: Gray-100 (light) / Gray-700 (dark)
- **Border**: Gray-200 (light) / Gray-700 (dark)

### Responsive Breakpoints
- **Mobile** (< 1024px): Collapsible sidebar
- **Desktop** (≥ 1024px): Fixed sidebar

## Translation Keys

### OwnerLayout
```json
{
  "branding": {
    "appName": "UdaanSarathi",
    "ownerPortal": "Owner Portal"
  },
  "nav": {
    "dashboard": "Dashboard",
    "agencies": "Agencies",
    "users": "Users",
    "settings": "Settings",
    "logout": "Logout"
  }
}
```

## Implementation Details

### OwnerLayout Component
- Uses `useAuth()` for user info and logout
- Uses `useTheme()` for theme toggle
- Uses `useLanguage()` for translations
- Uses `useLocation()` for active route detection
- Uses `useNavigate()` for navigation

### State Management
- `sidebarOpen`: Controls mobile sidebar visibility
- `theme`: Light/dark theme state
- `user`: Current owner user info

### Navigation Logic
```javascript
const isActive = (path) => location.pathname === path
```

## Future Enhancements

### Owner Dashboard
- [x] Platform metrics
- [ ] Real-time updates
- [ ] Charts and graphs
- [ ] Export functionality

### Owner Agencies
- [ ] List all agencies
- [ ] Filter and search
- [ ] Activate/deactivate agencies
- [ ] View agency details
- [ ] Agency analytics

### Owner Users
- [ ] List all users
- [ ] Filter by role/agency
- [ ] User management
- [ ] Activity logs

### Owner Settings
- [ ] Platform configuration
- [ ] Email templates
- [ ] System settings
- [ ] Backup/restore

## Testing

### Test Owner Portal Access
1. Navigate to `/owner/login`
2. Login with: `owner@udaan.com` / `owner123`
3. Verify redirect to `/owner/dashboard`
4. Test navigation between owner pages
5. Verify sidebar on mobile/desktop
6. Test theme toggle
7. Test language switch
8. Test logout

### Test Separation
1. Login as owner → Should see OwnerLayout
2. Login as agency user → Should see standard Layout
3. Verify different navigation menus
4. Verify different routes accessible

## Benefits

✅ **Clear Separation**: Owner and agency portals are distinct
✅ **Scalability**: Easy to add new owner features
✅ **Security**: Separate access control
✅ **UX**: Appropriate navigation for each user type
✅ **Maintainability**: Separate layouts and routes
✅ **Flexibility**: Independent styling and features

## Notes

- Owner portal uses a completely different layout from agency portal
- Navigation is context-specific (owner vs agency)
- Both portals support dark theme and bilingual
- Both portals are fully responsive
- Access control ensures proper user routing
