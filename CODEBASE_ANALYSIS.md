# Udaan Sarathi - Codebase Analysis

**Project**: Udaan Sarathi - A comprehensive agency-facing recruitment management portal  
**Stack**: React 18.2.0 + Vite + Tailwind CSS + TypeScript support  
**Package Manager**: npm/bun  
**Node Version**: 16+  
**Port**: 5850 (development)

---

## 📊 Project Overview

Udaan Sarathi is a full-featured recruitment management portal designed for agencies to manage job postings, candidates, interviews, and team workflows. The application supports multiple user roles with role-based access control (RBAC) and includes comprehensive features for job management, candidate tracking, interview scheduling, and analytics.

### Key Characteristics
- **Multi-role system**: Admin, Recruiter, Coordinator, Owner roles with specific permissions
- **Bilingual support**: English and Nepali language translations
- **Date-aware**: Nepali date conversion and localization
- **Audit logging**: Comprehensive audit trail for compliance
- **Real-time updates**: Axios + React Query for API communication
- **Full calendar integration**: FullCalendar for interview scheduling
- **Analytics dashboard**: Metrics and performance tracking

---

## 🏗️ Architecture & Directory Structure

```
src/
├── api/                      # API integration layer
│   ├── config/              # API configuration & constants
│   ├── datasources/         # Data source definitions
│   ├── generated/           # Generated API types
│   ├── types/               # TypeScript type definitions
│   ├── dashboardApi.js      # Dashboard API endpoints
│   └── index.js             # API exports
│
├── components/              # React components (45+ files)
│   ├── agencies/            # Agency-specific components
│   ├── analytics/           # Analytics dashboard components
│   ├── job-management/      # Job posting components
│   ├── InteractiveUI/       # Enhanced UI components
│   ├── ui/                  # Base UI component library
│   ├── DevTools/            # Development utilities
│   ├── public/              # Public pages (login, register)
│   ├── Layout.jsx           # Main application layout
│   ├── OwnerLayout.jsx      # Owner/admin layout
│   ├── ErrorBoundary.jsx    # Error handling
│   ├── ConfirmProvider.jsx  # Confirmation dialogs
│   └── ... (specialized components)
│
├── contexts/                # React Context API (6 files)
│   ├── AuthContext.jsx      # Authentication state
│   ├── AgencyContext.jsx    # Agency-level state
│   ├── LanguageContext.jsx  # i18n/translation state
│   ├── ThemeContext.jsx     # Dark/light mode
│   ├── NotificationContext.jsx  # Toast notifications
│   └── WorkflowStagesContext.jsx  # Workflow management
│
├── pages/                   # Full-page components (38+ files)
│   ├── Dashboard.jsx        # Main agency dashboard
│   ├── Jobs.jsx             # Job listing
│   ├── JobDetails.jsx       # Job detail view
│   ├── Applications.jsx     # Application management
│   ├── Interviews.jsx       # Interview scheduling
│   ├── Drafts.jsx           # Draft job management
│   ├── WorkflowV2.jsx       # Workflow stage management
│   ├── AuditLog.jsx         # Activity audit log
│   ├── OwnerDashboard.jsx   # Owner/admin views
│   ├── OwnerAnalytics.jsx   # Administrative analytics
│   ├── OwnerAgencies.jsx    # Multi-agency management
│   └── ... (additional pages)
│
├── services/                # Business logic layer (40+ files)
│   ├── authService.js       # Authentication logic
│   ├── jobService.js        # Job management
│   ├── applicationService.js  # Application processing
│   ├── interviewService.js  # Interview scheduling
│   ├── candidateService.js  # Candidate management
│   ├── analyticsService.js  # Metrics & reporting
│   ├── workflowService.js   # Workflow operations
│   ├── i18nService.js       # Translation & localization
│   ├── agencyService.js     # Agency operations
│   ├── rolesStorageService.js # Role management
│   ├── memberService.js     # Team member management
│   └── ... (specialized services)
│
├── hooks/                   # Custom React hooks (20+ files)
│   ├── useI18n.js          # Translation hook
│   ├── useLanguage.js      # Language selection
│   ├── useRoleBasedAccess.js # RBAC hook
│   ├── useErrorHandler.js  # Error handling
│   ├── useApiCache.js      # API response caching
│   ├── usePagination.js    # Pagination logic
│   ├── useDebounce.js      # Debounce utility
│   ├── useOptimisticUpdate.js # Optimistic updates
│   └── ... (specialized hooks)
│
├── utils/                   # Utility functions (30+ files)
│   ├── translationValidator.js  # i18n validation
│   ├── helpers.js           # Generic utilities
│   ├── formValidation.js    # Form validation rules
│   ├── errorHandler.js      # Error handling utilities
│   ├── nepaliDate.js        # Nepali date conversion
│   ├── roleHelpers.js       # Role-related utilities
│   ├── imageHelpers.js      # Image processing
│   └── ... (specialized utilities)
│
├── assets/                  # Static assets
│   └── images, icons, etc.
│
├── styles/                  # Global styles
│   └── Tailwind CSS config
│
├── translations/            # i18n translation files
│   ├── en.json             # English translations
│   ├── ne.json             # Nepali translations
│   └── ... (additional locales)
│
├── data/                    # Mock/seed data
│   └── Sample data for development
│
├── config/                  # Configuration files
│   └── Application constants
│
├── __tests__/               # Test files
│   ├── integration/         # Integration tests
│   ├── utils/               # Utility tests
│   └── ... (various test files)
│
├── App.jsx                  # Main application component
├── main.jsx                 # React entry point
└── index.css               # Global styles
```

---

## 🔑 Key Components & Features

### 1. **Authentication System**
- **File**: [src/services/authService.js](src/services/authService.js)
- **Context**: [src/contexts/AuthContext.jsx](src/contexts/AuthContext.jsx)
- Multi-role support (Admin, Recruiter, Coordinator, Owner)
- Session management with token persistence
- Protected routes and role-based access control

### 2. **Job Management**
- **Main Pages**: [src/pages/Jobs.jsx](src/pages/Jobs.jsx), [src/pages/JobDetails.jsx](src/pages/JobDetails.jsx)
- **Service**: [src/services/jobService.js](src/services/jobService.js)
- Job CRUD operations
- Shortlist management ([src/pages/JobShortlist.jsx](src/pages/JobShortlist.jsx))
- Draft management system ([src/pages/Drafts.jsx](src/pages/Drafts.jsx))

### 3. **Candidate Management**
- **Service**: [src/services/candidateService.js](src/services/candidateService.js)
- Candidate ranking
- Application notes ([src/components/ApplicationNotes.jsx](src/components/ApplicationNotes.jsx))
- Candidate summary view ([src/components/CandidateSummaryS2.jsx](src/components/CandidateSummaryS2.jsx))
- Advanced filtering ([src/services/advancedFilterService.js](src/services/advancedFilterService.js))

### 4. **Interview Management**
- **Main Page**: [src/pages/Interviews.jsx](src/pages/Interviews.jsx)
- **Service**: [src/services/interviewService.js](src/services/interviewService.js)
- **Components**: Interview scheduling, calendar views
- FullCalendar integration ([src/components/EnhancedCalendar.jsx](src/components/EnhancedCalendar.jsx))
- Interview scheduling dialog ([src/components/InterviewScheduleDialog.jsx](src/components/InterviewScheduleDialog.jsx))
- AI scheduling assistant ([src/components/AISchedulingAssistant.jsx](src/components/AISchedulingAssistant.jsx))

### 5. **Workflow & Stages**
- **Main Page**: [src/pages/WorkflowV2.jsx](src/pages/WorkflowV2.jsx)
- **Service**: [src/services/workflowService.js](src/services/workflowService.js)
- **Context**: [src/contexts/WorkflowStagesContext.jsx](src/contexts/WorkflowStagesContext.jsx)
- Workflow stage transitions
- Stage-based application tracking

### 6. **Analytics & Reporting**
- **Service**: [src/services/analyticsService.js](src/services/analyticsService.js)
- Dashboard metrics ([src/components/DashboardMetrics.jsx](src/components/DashboardMetrics.jsx))
- Performance tracking ([src/services/performanceService.js](src/services/performanceService.js))
- Owner-level analytics ([src/pages/OwnerAnalytics.jsx](src/pages/OwnerAnalytics.jsx))

### 7. **Audit Logging**
- **Service**: [src/services/auditService.js](src/services/auditService.js)
- **Component**: [src/components/AuditLog.jsx](src/components/AuditLog.jsx)
- **Page**: [src/pages/AuditLog.jsx](src/pages/AuditLog.jsx)
- Complete activity trail

### 8. **Internationalization (i18n)**
- **Service**: [src/services/i18nService.js](src/services/i18nService.js)
- **Context**: [src/contexts/LanguageContext.jsx](src/contexts/LanguageContext.jsx)
- **Translations**: [src/translations/](src/translations/)
  - English (en.json)
  - Nepali (ne.json)
- **Utils**: Translation validation, preloading, and error handling
- HOC: [src/components/withPageTranslations.jsx](src/components/withPageTranslations.jsx)

### 9. **Team & Member Management**
- **Service**: [src/services/memberService.js](src/services/memberService.js)
- **Page**: [src/pages/MemberManagement.jsx](src/pages/MemberManagement.jsx)
- Team member invitations and roles
- User management ([src/components/UserManagement.jsx](src/components/UserManagement.jsx))

### 10. **Multi-Agency Support (Owner Portal)**
- **Components**: 
  - [src/pages/OwnerDashboard.jsx](src/pages/OwnerDashboard.jsx)
  - [src/pages/OwnerAgencies.jsx](src/pages/OwnerAgencies.jsx)
  - [src/pages/OwnerAnalytics.jsx](src/pages/OwnerAnalytics.jsx)
  - [src/pages/OwnerAuditLog.jsx](src/pages/OwnerAuditLog.jsx)
- Manage multiple agencies from central dashboard

---

## 🔌 API Integration

### API Layer Structure
- **Location**: [src/api/](src/api/)
- **Main API**: [src/api/dashboardApi.js](src/api/dashboardApi.js)
- **Configuration**: [src/api/config/](src/api/config/)
- **Types**: [src/api/types/](src/api/types/)
- **Generated Types**: [src/api/generated/](src/api/generated/)

### HTTP Client
- **Library**: Axios 1.7.4
- **State Management**: React Query (@tanstack/react-query 5.51.23)
- **Hooks**: [src/hooks/useApiCache.js](src/hooks/useApiCache.js)

### Key API Services
- Dashboard API
- Job API
- Application API
- Interview API
- Candidate API
- Analytics API
- Workflow API

---

## 🎨 UI & Styling

### Framework
- **CSS Framework**: Tailwind CSS 3.x
- **Component Library**: Custom UI components in [src/components/ui/](src/components/ui/)
- **Icons**: Lucide React 0.427.0

### Configuration Files
- [tailwind.config.js](tailwind.config.js)
- [postcss.config.js](postcss.config.js)
- [vite.config.js](vite.config.js)

### Theme Support
- Light/Dark mode ([src/contexts/ThemeContext.jsx](src/contexts/ThemeContext.jsx))
- Theme switcher component ([src/components/ThemeToggle.jsx](src/components/ThemeToggle.jsx))

---

## 🧪 Testing

### Test Infrastructure
- **Framework**: Jest
- **React Testing**: @testing-library/react 14.3.1
- **Config**: [jest.config.js](jest.config.js)
- **Setup**: [src/setupTests.js](src/setupTests.js)

### Test Locations
- Unit tests: [src/__tests__/](src/__tests__/)
- Integration tests: [src/__tests__/integration/](src/__tests__/integration/)
- Component tests: Alongside components
- Service tests: [src/services/**/*.test.js](src/services/)

### Test Coverage
- Coverage reports: [coverage/](coverage/) directory

---

## 📦 Dependencies Overview

### Core Framework
```
react@18.2.0
react-dom@18.2.0
react-router-dom@6.26.1
```

### State & Data Management
```
@tanstack/react-query@5.51.23
axios@1.7.4
```

### UI & Components
```
lucide-react@0.427.0
tailwind-css@3.x
class-variance-authority@0.7.1
clsx@2.1.1
@fullcalendar/react@6.1.15
fullcalendar@6.1.15
```

### Date & Localization
```
date-fns@3.6.0
date-fns-tz@3.1.3
nepali-date-converter@3.4.0
```

### Search
```
fuse.js@7.0.0
```

### Build Tools
```
vite@latest
@vitejs/plugin-react
babel@7.x
```

---

## 🔒 Role-Based Access Control (RBAC)

### Roles
1. **Admin** - Full system access, audit logs, user management
2. **Recruiter** - Job management, applications, interviews
3. **Coordinator** - Limited workflow and coordination tasks
4. **Owner** - Multi-agency oversight and analytics

### Implementation
- **Service**: [src/services/rolesStorageService.js](src/services/rolesStorageService.js)
- **Hook**: [src/hooks/useRoleBasedAccess.js](src/hooks/useRoleBasedAccess.js)
- **Utilities**: [src/utils/roleHelpers.js](src/utils/roleHelpers.js)
- **Components**: 
  - [src/components/RoleBasedAccess.jsx](src/components/RoleBasedAccess.jsx)
  - [src/components/RoleBasedRoute.jsx](src/components/RoleBasedRoute.jsx)
  - [src/components/PermissionGuard.jsx](src/components/PermissionGuard.jsx)

---

## 🌍 Localization & Date Handling

### Translation System
- **Service**: [src/services/i18nService.js](src/services/i18nService.js)
- **Translations**: [src/translations/](src/translations/)
- **Validation**: [src/utils/translationValidator.js](src/utils/translationValidator.js)
- **Development Tools**: [src/utils/translationDevTools.js](src/utils/translationDevTools.js)

### Nepali Date Support
- **Utility**: [src/utils/nepaliDate.js](src/utils/nepaliDate.js)
- **Validation**: [src/utils/nepaliDateValidation.js](src/utils/nepaliDateValidation.js)
- **Converter**: nepali-date-converter package

### Language Persistence
- LocalStorage persistence
- Automatic language switching
- Fallback to English if translation missing

---

## 🛠️ Build & Deployment

### Build Configuration
- **Builder**: Vite
- **Port**: 5850 (dev)
- **Entry**: [index.html](index.html)
- **Module**: ES modules (`"type": "module"`)

### Available Scripts
```bash
npm run dev              # Start development server with live reload
npm run dev:with-logger # Dev + error logger
npm run build           # Production build
npm run lint            # ESLint validation
npm run test            # Run tests
npm run preview         # Preview production build
npm run validate-mvp    # Validate MVP features
npm run validate-translations  # Check i18n files
npm run pre-deploy      # Full validation before deploy
```

### Deployment
- **Platform**: Netlify (configured in [netlify.toml](netlify.toml))
- **CI/CD**: GitHub Actions ([.github/](.github/))

---

## 📊 Development Tools & Utilities

### Validation & Testing
- MVP validation: [validate-mvp.js](validate-mvp.js)
- Translation validation: [src/utils/validateTranslations.js](src/utils/validateTranslations.js)
- Service tests: [src/services/**/*.test.js](src/services/)

### Debugging & Monitoring
- Error logger server: [error-logger-server.js](error-logger-server.js)
- Development tools: [src/components/DevTools/](src/components/DevTools/)
- Performance monitoring: [src/services/performanceService.js](src/services/performanceService.js)

### Utilities
- Form validation: [src/utils/formValidation.js](src/utils/formValidation.js)
- Error handling: [src/utils/errorHandler.js](src/utils/errorHandler.js)
- Image helpers: [src/utils/imageHelpers.js](src/utils/imageHelpers.js)
- Accessibility: [src/services/accessibilityService.js](src/services/accessibilityService.js)

---

## 📈 Project Metrics

- **Total Components**: 45+ custom React components
- **Total Pages**: 38+ page-level components
- **Total Services**: 40+ business logic services
- **Custom Hooks**: 20+ specialized hooks
- **Utility Functions**: 30+ helper utilities
- **Lines of Code**: ~15,000+ (estimated)
- **Test Suites**: Multiple test files covering critical paths
- **Documentation Files**: 100+ markdown documentation files

---

## 🚀 Notable Features

1. **Real-time Updates** - React Query for efficient data fetching and caching
2. **Interview Scheduling** - FullCalendar integration with AI suggestions
3. **Bilingual Interface** - Full English/Nepali support with validation
4. **Audit Trail** - Complete activity logging for compliance
5. **Responsive Design** - Tailwind CSS for mobile-friendly UI
6. **Error Handling** - Comprehensive error boundaries and error logging
7. **Accessibility** - WCAG compliance tools and utilities
8. **Performance Optimization** - Lazy loading, API caching, optimistic updates
9. **Workflow Management** - Multi-stage workflow with transitions
10. **Analytics Dashboard** - Real-time metrics and reporting

---

## 🔍 Code Quality & Standards

- **Linting**: ESLint with strict rules
- **Testing**: Jest + React Testing Library
- **Documentation**: Extensive inline comments and markdown docs
- **Module Organization**: Clear separation of concerns
- **Error Handling**: Comprehensive error handling throughout
- **TypeScript Support**: Type definitions available in api/types/

---

## 📋 Recent Updates & Focus Areas

Based on documentation files in the workspace:
- Interview filtering and API integration
- Bilingual implementation and translations
- Role-based access control refinement
- Analytics dashboard enhancements
- Interview page restructuring
- Backend API alignment
- Multi-agency support (Owner portal)
- Authentication improvements
- Date/time handling optimization

---

## 🎯 Getting Started Development

1. **Install dependencies**: `npm install` or `bun install`
2. **Start dev server**: `npm run dev`
3. **Access application**: http://localhost:5850
4. **Demo credentials**: See sep3.md for test user credentials
5. **Run tests**: `npm test`
6. **Build**: `npm run build`

---

**Last Updated**: December 24, 2025  
**Project Status**: Active Development  
**Codebase Version**: 0.0.0
