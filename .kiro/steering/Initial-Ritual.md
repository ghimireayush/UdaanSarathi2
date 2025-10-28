---
inclusion: always
---
---
inclusion: always
---

# Udaan Sarathi Development Guidelines

## Tech Stack

React 18 (JSX only), Vite, Tailwind CSS, React Query v4, React Router DOM v6, date-fns/date-fns-tz, nepali-date-converter, Lucide React icons, Jest + React Testing Library.

**Critical**: No TypeScript. No custom CSS files (Tailwind only).

## Component Conventions

- Functional components with hooks only
- PascalCase naming: `Dashboard.jsx`, `JobDetails.jsx`
- Default exports
- Single responsibility

## State Management

**Server state**: React Query (API data, caching, mutations)
**Global UI state**: React Context (auth, theme, language, notifications)
**Local UI state**: useState

**Context provider order** (wrap App in this order):
1. ThemeProvider → 2. LanguageProvider → 3. NotificationProvider → 4. AgencyProvider → 5. ToastProvider → 6. ConfirmProvider

## Authentication & Authorization

- **Roles**: Admin, Recruiter, Coordinator
- **Portals**: Agency portal, Owner portal, Member portal
- Protect routes with `PrivateRoute` component
- Check permissions via `PERMISSIONS` constants from `authService.js`

## Internationalization (i18n)

- **Languages**: English, Nepali
- **Always** use `i18nService.t()` for all user-facing text (never hardcode strings)
- Translation files: `public/translations/{locale}/`
- Language switching via `LanguageContext`
- Persist preference in localStorage

## Date & Time

- **Dual calendar**: Gregorian and Nepali (BS)
- **Timezone**: Asia/Kathmandu (always use date-fns-tz)
- Use `DateDisplay` component for consistent formatting
- Respect user's calendar preference

## Styling Rules

- **Tailwind CSS only** (no custom CSS files, no inline styles)
- Mobile-first responsive design
- Spacing: 4, 8, 12, 16, 24, 32, 48, 64
- WCAG 2.1 Level AA color contrast required

## API Integration

- Use React Query hooks from `hooks/useApi.js`
- Auth via `authService.js`
- **Always** handle loading, error, and success states
- Use optimistic updates for better UX

## Error Handling

- App wrapped in `ErrorBoundary`
- User-friendly messages via `ToastProvider`
- Never expose technical details to users
- Always provide fallback UI

## Performance

- React.memo() for expensive components
- useMemo() and useCallback() to prevent re-renders
- React.lazy() for route code splitting
- Target: <500KB gzipped bundle

## Debugging Strategy

### Common Issue Areas

1. **Authentication**: Session expiration, role permissions, context not updating, route protection
2. **Data Sync**: React Query cache staleness, optimistic update rollbacks, race conditions
3. **i18n**: Missing translation keys, language persistence, date format inconsistencies
4. **Calendar**: Timezone errors (Asia/Kathmandu), BS conversion, date picker preferences
5. **Performance**: Unnecessary re-renders, unvirtualized lists, heavy render computations

### Debug Checklist

- **Auth**: Check AuthContext (user, role, permissions), session token validity
- **React Query**: Use DevTools, verify cache keys, check mutation status
- **Context**: Verify AuthContext, LanguageContext, ThemeContext, AgencyContext values
- **Storage**: Check localStorage (authToken, userRole, language), sessionStorage
- **Network**: Verify API success, headers (Authorization, Content-Type), CORS
- **Console**: React warnings, React Query errors, translation warnings, date errors

## Critical Rules

### State Management
- Never mutate state directly - use setState
- Never use array indices as keys for dynamic lists
- Never put API calls in render functions
- Never ignore useEffect dependency arrays
- Always memoize objects/functions created in render

### Context
- Never put frequently changing values in context (causes re-renders)
- Never create context providers inside components
- Always memoize context values with useMemo

### React Query
- Use React Query for data fetching, not useEffect
- Always handle loading and error states
- Only invalidate queries when necessary
- Make stale data visible to users

### Routing
- Use React Router for navigation, not window.location
- Always protect routes with PrivateRoute
- Use route constants, never hardcode URLs

### Styling
- Use Tailwind classes only, no inline styles or custom CSS files
- Follow mobile-first responsive design
- Ensure accessibility (color contrast, focus states)

### i18n
- Use translation keys via i18nService.t(), never hardcode text
- Add translations for both English and Nepali
- Respect user's calendar preference for dates

## Code Patterns

### State Updates (Immutable)
```jsx
// Correct
setItems([...items, newItem]);
setUser({ ...user, name: newName });
```

### useEffect Dependencies
```jsx
// Always include all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

### Context Memoization
```jsx
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

### Component Memoization
```jsx
const ExpensiveList = memo(({ items, onSelect }) => {
  const handleSelect = useCallback((item) => onSelect(item), [onSelect]);
  return items.map(item => <Item key={item.id} onClick={() => handleSelect(item)} />);
});
```

## Testing

- Test user behavior, not implementation
- Use semantic queries: getByRole, getByLabelText (not test IDs)
- Test accessibility: keyboard navigation, screen readers
- Mock API calls and external dependencies
- Test loading, error, and success states
- Write tests for: critical flows, complex logic, bug fixes
- Don't test: implementation details, third-party libraries

## Usage Patterns

### Route Protection
```jsx
<Route path="/jobs" element={
  <Layout>
    <PrivateRoute requiredPermission={PERMISSIONS.VIEW_JOBS}>
      <Jobs />
    </PrivateRoute>
  </Layout>
} />
```

### API Calls
```jsx
const { data: jobs, isLoading, error } = useJobs();
if (isLoading) return <Loading />;
if (error) return <ErrorMessage error={error} />;
return <JobList jobs={jobs} />;
```

### Translations
```jsx
import i18nService from "../services/i18nService";
const t = i18nService.t;
return <h1>{t("pages.dashboard.title")}</h1>;
```

### Date Display
```jsx
<DateDisplay date={jobPostedDate} format="PPP" showNepali={true} />
```

### Toast Notifications
```jsx
const { showToast } = useToast();
showToast("Job posted successfully", "success");
```

## File Structure

```
src/
├── components/
│   ├── Layout.jsx              # Agency portal layout
│   ├── OwnerLayout.jsx         # Owner portal layout
│   ├── PrivateRoute.jsx        # Route protection
│   ├── ErrorBoundary.jsx       # Error handling
│   ├── ToastProvider.jsx       # Toast notifications
│   ├── ConfirmProvider.jsx     # Confirmation dialogs
│   ├── DateDisplay.jsx         # Date formatting
│   └── NepaliCalendar.jsx      # Nepali calendar picker
├── pages/
│   ├── Login.jsx, OwnerLogin.jsx, MemberLogin.jsx
│   ├── Dashboard.jsx, OwnerDashboard.jsx
│   ├── Jobs.jsx, JobDetails.jsx, Drafts.jsx
│   ├── Applications.jsx, Interviews.jsx, Workflow.jsx
│   ├── Members.jsx, AgencySettings.jsx, AuditLog.jsx
├── services/
│   ├── authService.js          # Auth & authorization
│   ├── i18nService.js          # Internationalization
│   ├── accessibilityService.js # Accessibility
│   └── auditService.js         # Audit logging
├── contexts/
│   ├── AuthContext.jsx         # User auth state
│   ├── LanguageContext.jsx     # Language/locale
│   ├── ThemeContext.jsx        # Theme state
│   ├── AgencyContext.jsx       # Agency data
│   └── NotificationContext.jsx # Notifications
└── hooks/
    └── useApi.js               # React Query hooks
```

## Key Features

- **Multi-portal**: Agency, Owner, Member portals
- **RBAC**: Admin, Recruiter, Coordinator roles with permission-based route protection
- **i18n**: English and Nepali with translation files in `public/translations/{locale}/`
- **Calendar**: Dual support (Gregorian and Nepali BS) with Asia/Kathmandu timezone
- **Data**: React Query for server state with optimistic updates
- **Accessibility**: WCAG 2.1 Level AA, keyboard navigation, screen reader support

## Browser Support

Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
