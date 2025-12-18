# Roles Management Implementation

## Overview
Implemented roles dropdown availability with local storage flag and toggle for "Enable advanced roles" in the Members page.

## How It Works

### Flag-Based System
- **Flag stored in localStorage**: `udaan_advanced_roles_enabled`
- **When `true`**: Show all roles from RBAC source of truth (Admin, Manager, Staff, Recruiter, Coordinator, Visa Officer, Accountant)
- **When `false`**: Show only Admin and Staff roles

### Components Created

#### 1. `src/services/rolesStorageService.js`
Manages the localStorage flag and role filtering:
- `isAdvancedRolesEnabled()` - Check current flag state
- `setAdvancedRoles(enabled)` - Set the flag
- `toggleAdvancedRoles()` - Toggle the flag
- `getFilteredRoles(allRoles)` - Filter roles based on flag state
- Dispatches custom event `advancedRolesToggled` when flag changes

#### 2. `src/hooks/useAdvancedRoles.js`
React hook for managing advanced roles state:
- Returns `{ isEnabled, toggle }`
- Listens to `advancedRolesToggled` events
- Syncs state across components

#### 3. Updated `src/pages/Members.jsx`
- Added toggle switch in page header
- Uses `useAdvancedRoles` hook to manage state
- Filters roles in:
  - Invite form role dropdown
  - Role filter dropdown
- Updates form default role when toggle changes
- Translations support for toggle label

### Translations Added

#### English (`src/translations/en/pages/team-members.json`)
```json
"settings": {
  "advancedRoles": {
    "label": "Enable advanced roles"
  }
}
```

#### Nepali (`src/translations/ne/pages/team-members.json`)
```json
"settings": {
  "advancedRoles": {
    "label": "उन्नत भूमिकाहरू सक्षम गर्नुहोस्"
  }
}
```

## Usage

### For Users
1. Go to Team Members page
2. Toggle "Enable advanced roles" switch in the header
3. When ON: All 8 roles available in dropdowns
4. When OFF: Only Admin and Staff available
5. Setting persists across page refreshes

### For Developers
```javascript
import { useAdvancedRoles } from '../hooks/useAdvancedRoles';
import rolesStorageService from '../services/rolesStorageService';

// In a component
const { isEnabled, toggle } = useAdvancedRoles();

// Or directly use the service
const filtered = rolesStorageService.getFilteredRoles(allRoles);
```

## Features
- ✅ Flag stored in localStorage
- ✅ Toggle switch in Members page header
- ✅ Real-time role filtering in dropdowns
- ✅ Persists across page refreshes
- ✅ Custom event system for cross-component sync
- ✅ Bilingual support (English & Nepali)
- ✅ No breaking changes to existing code
