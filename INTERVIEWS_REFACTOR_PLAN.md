# Interviews Page Refactor Plan

## Current Status
The Interviews page is fully functional with:
- ✅ Contemporary mode (Today/Tomorrow/Unattended/All)
- ✅ Calendar mode (Week view with day selection + Custom range)
- ✅ Scroll preservation on week navigation
- ✅ Day selection tracking (week range vs single day)
- ✅ Stats display
- ✅ Job and search filters
- ✅ Tab-based UI

## Proposed Refactor

### Extract Reusable Components

1. **PageHeader.jsx** - Reusable page header with title/subtitle/actions
2. **StatCard.jsx** - Reusable stat card component
3. **JobSelect.jsx** - Job dropdown filter
4. **SearchInput.jsx** - Search input with icon
5. **TabSwitcher.jsx** - Generic tab component

### Keep Current Structure
The current Interviews.jsx has complex state management that works well:
- Scroll position tracking
- Day selection state
- Multiple filter states
- Data loading with proper dependencies

### Recommendation
**Don't refactor yet** - The current code is:
- Working correctly
- Well-organized
- Has all features implemented
- Easy to understand

Premature abstraction can make the code harder to maintain. Wait until you need to reuse these components elsewhere before extracting them.

## If You Still Want to Refactor

Here's what to extract first (in order of priority):

### 1. StatCard Component (High Value)
```jsx
// src/components/StatCard.jsx
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card p-4">
    <div className="flex items-center">
      <Icon className={`w-8 h-8 mr-3 ${color}`} />
      <div>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
      </div>
    </div>
  </div>
)
```

### 2. Keep Everything Else As-Is
The rest of the code is specific to the Interviews page and doesn't need extraction yet.

## Why Not Refactor Now?

1. **YAGNI Principle** - You Aren't Gonna Need It (yet)
2. **Working Code** - Don't fix what isn't broken
3. **Complexity** - The state management is complex and works well as-is
4. **Maintenance** - Easier to maintain one file than many small files
5. **Context** - All related logic is in one place

## When to Refactor?

Refactor when:
- You need the same component on another page
- The file becomes too large (>1000 lines)
- You're adding a new feature that would benefit from separation
- You have 3+ pages using similar patterns

## Current File Size
- Interviews.jsx: ~450 lines
- This is manageable and doesn't need splitting yet

## Conclusion

**Keep the current structure.** It's clean, working, and maintainable. Focus on building features, not premature optimization.
