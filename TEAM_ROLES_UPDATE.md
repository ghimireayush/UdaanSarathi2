# Team Roles Display Update

## Summary
Added team member role information display to the Owner Analytics pages, showing the breakdown of Admin, Recipient, and Interview Coordinator roles for each agency.

## Changes Made

### 1. Data Structure Updates

#### `src/data/agencies.json`
- Added `team_members` object to all 8 agencies with the following structure:
  ```json
  "team_members": {
    "total": 9,
    "admin": 1,
    "recipient": 5,
    "interview_coordinator": 3
  }
  ```
- Each agency now has:
  - 1 Admin (consistent across all agencies)
  - Variable number of Recipients (2-6 members)
  - Variable number of Interview Coordinators (1-4 members)

### 2. Translation Updates

#### English Translations (`public/translations/en/pages/owner-details.json`)
Added new translation keys:
- `stats.totalMembers`: "Total Team Members"
- `stats.totalMembersSubtitle`: "Admin and member roles"
- `stats.adminRole`: "Admin"
- `stats.recipientRole`: "Recipient"
- `stats.coordinatorRole`: "Interview Coordinator"

#### Nepali Translations (`public/translations/ne/pages/owner-details.json`)
Added corresponding Nepali translations:
- `stats.totalMembers`: "कुल टोली सदस्यहरू"
- `stats.totalMembersSubtitle`: "प्रशासक र सदस्य भूमिकाहरू"
- `stats.adminRole`: "प्रशासक"
- `stats.recipientRole`: "प्राप्तकर्ता"
- `stats.coordinatorRole`: "अन्तर्वार्ता संयोजक"

#### Analytics Page Translations
- Added `card.teamMembers` to both English and Nepali analytics translations

### 3. Component Updates

#### `src/pages/OwnerAgencyDetails.jsx`
- Updated `StatisticsGrid` component to accept `agencyDetails` prop
- Changed grid layout from 2 columns to 3 columns (`md:grid-cols-2` → `lg:grid-cols-3`)
- Added new `TeamMembersCard` component that displays:
  - Total team members count (large number)
  - Breakdown by role:
    - Admin count
    - Recipient count
    - Interview Coordinator count
  - Purple color scheme to differentiate from other stat cards
  - Responsive design with proper dark mode support

#### `src/pages/OwnerAnalytics.jsx`
- Updated agency card to show team members count
- Added conditional rendering for team members info
- Displays total team members alongside active jobs and active applicants

## Role Structure

Based on the codebase analysis (`src/services/authService.js`):

### Agency Roles:
1. **Admin** (1 per agency)
   - Full system access
   - Manages all recruitment operations
   - Can manage members and settings

2. **Recipient** (Multiple per agency)
   - Job management (create, edit, delete, publish)
   - Application management (view, edit, shortlist, reject)
   - Interview management (schedule, conduct, edit)
   - Workflow and document management

3. **Interview Coordinator** (Multiple per agency)
   - Interview scheduling
   - Calendar management
   - Notifications
   - Document upload/edit
   - View-only access to jobs, applications, and interviews
   - Limited editing capabilities

## Visual Changes

### Agency Details Page (`/owner/analytics/:agencyId`)
- Now shows a third stat card with:
  - Purple-themed design
  - Total team members as main metric
  - Role breakdown in a list format below
  - Consistent styling with other stat cards

### Analytics List Page (`/owner/analytics`)
- Agency cards now display team member count
- Shows as a third metric alongside active jobs and applicants
- Only displays if team_members data is available

### Agencies Management Page (`/owner/agencies`)
- Detail panel (popup) now includes a new "Team Members" section
- Shows 4 stat items in a 2-column grid:
  - Total Team Members (with description)
  - Admin count (with role description)
  - Recipient count (with role description)
  - Interview Coordinator count (with role description)
- Positioned after the Statistics section
- Uses the same StatItem component for consistent styling
- Only displays if team_members data is available

## Testing Recommendations

1. Verify team member counts display correctly on agency details page
2. Check that role breakdown shows accurate numbers
3. Ensure responsive layout works on mobile, tablet, and desktop
4. Test dark mode appearance
5. Verify translations work in both English and Nepali
6. Confirm data displays correctly for all 8 agencies

## Future Enhancements

Potential improvements:
- Add ability to click on team members to see individual details
- Show active vs inactive team members
- Add team member management interface
- Display recent activity by team members
- Add role-based performance metrics
