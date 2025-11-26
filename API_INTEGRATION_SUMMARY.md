# Admin Job Listing API Integration - Quick Summary

## Overview
Integration plan for connecting the admin frontend Jobs.jsx page (currently using mock data) with **dedicated admin backend APIs** that won't interfere with existing public job endpoints.

## Key Findings

### ✅ Available in Backend
- Job posting basic info (title, country, city, posting date)
- Employer information (company name, location)
- Agency information (name, license)
- Position details (title, vacancies, salary with currency conversion)
- Contract terms (duration, hours, benefits)
- Skills, education, and experience requirements
- Expenses and interview details

### ❌ Missing in Backend (Need to Add)
1. **Application Statistics** (HIGH PRIORITY)
   - applications_count
   - shortlisted_count
   - interviews_today
   - total_interviews

2. **Job Description** (MEDIUM PRIORITY)
   - description field

3. **Status Management** (MEDIUM PRIORITY)
   - status enum (published, draft, closed, paused)

4. **View Tracking** (LOW PRIORITY)
   - view_count

## API Endpoints (New Admin-Specific)

### Primary Admin Endpoint
```
GET /admin/jobs
```
**Query Params**: search, country, status, agency_id, sort_by, order, page, limit

**Returns**: Paginated job listings with statistics (applications, shortlisted, interviews)

### Country Distribution
```
GET /admin/jobs/statistics/countries
```
**Returns**: Job count by country

### Details Endpoint
```
GET /admin/jobs/:id
```
**Returns**: Full job details with admin-specific info

**Note**: These are NEW endpoints that won't affect existing `/jobs/search` public API

## Data Mapping

| Frontend Field | Backend Source | Notes |
|---------------|----------------|-------|
| title | posting_title | Direct |
| company | employer.company_name | Direct |
| salary | positions[0].salary | First position |
| category | positions[0].title | First position |
| tags | skills | Direct |
| requirements | education_requirements + experience_requirements | Composed |
| applications_count | **MISSING** | Need to add |
| description | **MISSING** | Need to add |
| status | **MISSING** | Need to add |

## Implementation Phases

### Phase 1: Minimal Integration (Week 1)
- Create API service adapter
- Map existing backend data to frontend format
- Use defaults for missing fields
- **Result**: Working job listing with basic data

### Phase 2: Backend Enhancements (Week 2)
- Add application statistics aggregation
- Add description and status fields
- Update API response DTOs
- **Result**: Complete data with statistics

### Phase 3: Advanced Features (Week 3)
- Interview statistics
- View tracking
- Enhanced sorting options
- **Result**: Full-featured job listing

## Quick Start Code

### Admin API Client (Following Existing Patterns)
```javascript
// services/adminJobApiClient.js
const API_BASE_URL = 'http://localhost:3000';

const getAuthHeaders = () => {
  const token = localStorage.getItem('udaan_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

class AdminJobApiClient {
  async getAdminJobs(filters) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.country !== 'All Countries') params.append('country', filters.country);
    if (filters.status) params.append('status', filters.status);
    params.append('limit', '100');

    const response = await fetch(`${API_BASE_URL}/admin/jobs?${params}`, {
      method: 'GET',
      headers: getAuthHeaders()
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.data;
  }
}

export default new AdminJobApiClient();
```

### Usage in Jobs.jsx
```javascript
import adminJobApiClient from '../services/adminJobApiClient.js'

const jobsData = await adminJobApiClient.getAdminJobs(filters)
setJobs(jobsData)
```

## Backend Changes Needed

### 1. Create New Admin Module (Separate from Public APIs)
```
src/modules/admin/
├── admin.module.ts
├── admin-jobs.controller.ts  // NEW: @Controller('admin/jobs')
├── admin-jobs.service.ts     // NEW: Aggregates statistics
└── dto/
    ├── admin-job-list.dto.ts
    └── admin-job-filters.dto.ts
```

### 2. Add Missing Fields to JobPosting Entity
```typescript
// In domain.entity.ts
@Column({ type: 'text', nullable: true })
description?: string;

@Column({
  type: 'enum',
  enum: ['published', 'draft', 'closed', 'paused'],
  default: 'published'
})
status: string;

@Column({ type: 'integer', default: 0 })
view_count: number;
```

### 3. Create Migration
```bash
npm run migration:generate -- src/migrations/AddJobAdminFields
npm run migration:run
```

## Performance Notes
- Backend supports pagination (use limit=10-25 for optimal performance)
- Add indexes on: country, status, posting_date_ad
- Cache job listings for 5 minutes
- Use Redis for distributed caching in production

## Testing Checklist
- [ ] Job listing loads from API
- [ ] Search functionality works
- [ ] Country filter works
- [ ] Pagination works
- [ ] Error handling works
- [ ] Application counts are accurate (Phase 2)
- [ ] Status filtering works (Phase 2)
- [ ] Sorting by applications works (Phase 2)

## Next Steps
1. Review this plan with the team
2. Set up API base URL in environment variables
3. Start Phase 1 implementation
4. Create backend tickets for missing fields
5. Schedule Phase 2 backend work

## Key Differences from Public API

| Aspect | Public API (`/jobs/search`) | Admin API (`/admin/jobs`) |
|--------|----------------------------|---------------------------|
| **Purpose** | Mobile app, public job search | Admin panel management |
| **Statistics** | No application counts | Full statistics included |
| **Filtering** | Keyword, salary range | Search, status, agency |
| **Auth** | Public (no auth) | Requires admin JWT token |
| **Response** | Minimal job info | Full admin details |
| **Caching** | Long cache (1 hour) | Short cache (1 minute) |

## Why Separate Admin APIs?

1. **No Breaking Changes**: Existing public APIs remain untouched
2. **Different Data Needs**: Admin needs statistics, public doesn't
3. **Security**: Admin endpoints can have stricter auth
4. **Performance**: Different caching strategies
5. **Maintainability**: Clear separation of concerns

---

**For detailed implementation guide, see**: `ADMIN_JOB_API_INTEGRATION.md`
