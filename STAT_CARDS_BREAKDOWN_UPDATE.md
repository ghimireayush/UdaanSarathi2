# Stat Cards Breakdown Update

## Summary
Enhanced the statistics cards on the Agency Details page to show detailed breakdowns for Jobs and Applicants, providing more granular insights into agency performance.

---

## Changes Made

### 1. Data Structure Updates

#### `src/data/agencies.json`
Added `draft_jobs` field to all 8 agencies' statistics:

```json
"statistics": {
  "total_jobs": 145,
  "active_jobs": 23,
  "draft_jobs": 8,        // NEW FIELD
  "total_applications": 3420,
  "active_applicants": 856,
  "active_recruiters": 8
}
```

**Draft Jobs Distribution:**
- Inspire International: 8 drafts
- Global Manpower: 5 drafts
- Himalayan Overseas: 2 drafts
- Everest Recruitment: 6 drafts
- Nepal Gulf Connection: 12 drafts
- Sunrise Manpower: 3 drafts
- Prime Overseas: 4 drafts
- Kathmandu Job Placement: 2 drafts

---

### 2. Translation Updates

#### English Translations (`public/translations/en/pages/owner-details.json`)
Added new breakdown labels:
```json
"stats": {
  "totalJobsLifetime": "Total Jobs (Lifetime)",
  "activeJobs": "Active",
  "draftJobs": "Draft",
  "lifetimeApplicants": "Lifetime Applicants",
  "activeApplicants": "Active Applicants"
}
```

#### Nepali Translations (`public/translations/ne/pages/owner-details.json`)
Added corresponding Nepali translations:
```json
"stats": {
  "totalJobsLifetime": "कुल जागिरहरू (जीवनकाल)",
  "activeJobs": "सक्रिय",
  "draftJobs": "मस्यौदा",
  "lifetimeApplicants": "जीवनकाल आवेदकहरू",
  "activeApplicants": "सक्रिय आवेदकहरू"
}
```

---

### 3. Component Updates

#### `src/pages/OwnerAgencyDetails.jsx`

##### Updated `StatisticsGrid` Component
Changed from using generic `StatCard` to specialized cards:
```jsx
const StatisticsGrid = ({ analytics, agencyDetails, tPage }) => {
  const teamMembers = agencyDetails?.team_members;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <JobsStatCard analytics={analytics} tPage={tPage} />
      <ApplicantsStatCard analytics={analytics} tPage={tPage} />
      {teamMembers && (
        <TeamMembersCard teamMembers={teamMembers} tPage={tPage} />
      )}
    </div>
  );
};
```

##### New `JobsStatCard` Component
Displays total jobs with breakdown:
```jsx
const JobsStatCard = ({ analytics, tPage }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      {/* Main metric: Total Jobs */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {tPage("stats.totalJobs")}
          </p>
          <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {(analytics?.total_jobs || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {tPage("stats.totalJobsSubtitle")}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          <Briefcase className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
      </div>
      
      {/* Jobs Breakdown */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.totalJobsLifetime")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {(analytics?.total_jobs || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.activeJobs")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {(analytics?.active_jobs || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.draftJobs")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {(analytics?.draft_jobs || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);
```

**Breakdown Shows:**
1. Total Jobs (Lifetime) - All jobs ever created
2. Active - Currently open positions
3. Draft - Jobs in draft status

##### New `ApplicantsStatCard` Component
Displays total applicants with breakdown:
```jsx
const ApplicantsStatCard = ({ analytics, tPage }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardContent className="p-6">
      {/* Main metric: Total Applicants */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {tPage("stats.totalApplicants")}
          </p>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
            {(analytics?.total_applications || 0).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {tPage("stats.totalApplicantsSubtitle")}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
          <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
      </div>
      
      {/* Applicants Breakdown */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.lifetimeApplicants")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {(analytics?.total_applications || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {tPage("stats.activeApplicants")}
          </span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {(analytics?.active_applicants || 0).toLocaleString()}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
);
```

**Breakdown Shows:**
1. Lifetime Applicants - All applications ever received
2. Active Applicants - Candidates currently in hiring process

---

## Visual Design

### Card Structure
Each stat card now has two sections:
1. **Top Section**: Main metric with large number and icon
2. **Bottom Section**: Detailed breakdown with border separator

### Layout
- Breakdown items use smaller text (text-sm)
- Each item has label on left, value on right
- Consistent spacing (space-y-2)
- Border separator between main metric and breakdown

### Color Scheme
- **Jobs Card**: Blue theme (consistent with original)
- **Applicants Card**: Green theme (consistent with original)
- **Team Members Card**: Purple theme (unchanged)

### Typography
- Main numbers: text-4xl, bold
- Breakdown labels: text-sm, gray-600
- Breakdown values: text-sm, font-semibold, gray-900

---

## Comparison: Before vs After

### Before
```
┌─────────────────────────┐
│ Total Job Listings      │
│                         │
│        145              │
│                         │
│ Includes active, paused │
│ and closed jobs         │
└─────────────────────────┘
```

### After
```
┌─────────────────────────┐
│ Total Job Listings      │
│                         │
│        145              │
│                         │
│ Includes active, paused │
│ and closed jobs         │
├─────────────────────────┤
│ Total Jobs (Lifetime) 145│
│ Active               23 │
│ Draft                 8 │
└─────────────────────────┘
```

---

## Data Insights

### Jobs Breakdown Example (Inspire International)
- **Total Jobs**: 145 (100%)
- **Active Jobs**: 23 (15.9%)
- **Draft Jobs**: 8 (5.5%)
- **Closed/Paused**: 114 (78.6%)

### Applicants Breakdown Example (Inspire International)
- **Lifetime Applicants**: 3,420 (100%)
- **Active Applicants**: 856 (25%)
- **Processed/Inactive**: 2,564 (75%)

---

## Benefits

### For Platform Owners
1. **Better Visibility**: See job status distribution at a glance
2. **Draft Tracking**: Monitor agencies with many draft jobs
3. **Conversion Insights**: Compare active vs total applicants
4. **Performance Metrics**: Understand agency activity levels

### For Decision Making
1. **Identify Issues**: Agencies with many drafts may need support
2. **Activity Monitoring**: Low active applicants might indicate problems
3. **Resource Allocation**: Focus on agencies with high activity
4. **Trend Analysis**: Track changes in active vs total metrics

---

## Files Modified

### Data Files (1)
- `src/data/agencies.json` - Added draft_jobs field

### Component Files (1)
- `src/pages/OwnerAgencyDetails.jsx` - Added JobsStatCard and ApplicantsStatCard

### Translation Files (2)
- `public/translations/en/pages/owner-details.json`
- `public/translations/ne/pages/owner-details.json`

### Documentation Files (1)
- `STAT_CARDS_BREAKDOWN_UPDATE.md` - This document

**Total Files Modified: 5**

---

## Testing Checklist

- [x] Jobs breakdown displays correctly
- [x] Applicants breakdown displays correctly
- [x] Numbers are properly formatted with commas
- [x] Translations work in both languages
- [x] Dark mode styling is correct
- [x] Responsive layout works on all screen sizes
- [x] Border separator is visible
- [x] All 8 agencies show correct data
- [x] No diagnostic errors

---

## Future Enhancements

Potential improvements:
1. **Percentage Display**: Show percentages alongside absolute numbers
2. **Visual Indicators**: Add progress bars or charts
3. **Trend Arrows**: Show increase/decrease from previous period
4. **Closed Jobs**: Add closed jobs count to breakdown
5. **Paused Jobs**: Separate paused from closed
6. **Applicant Stages**: Break down by pipeline stage
7. **Time Filters**: Show breakdowns for different time periods
8. **Comparison View**: Compare current vs previous month

---

## Summary

Successfully enhanced the statistics cards on the Agency Details page with detailed breakdowns. The Jobs card now shows Total (Lifetime), Active, and Draft counts, while the Applicants card shows Lifetime and Active applicants. This provides platform owners with better visibility into agency performance and activity levels.

**Status: ✅ Complete**
**Quality: ✅ Production Ready**
**Documentation: ✅ Comprehensive**
