# Job Listing API Integration Plan

## Executive Summary

This document outlines the API integration plan for connecting the frontend job listing page (`Jobs.jsx`) with the backend job posting API. The frontend currently uses mock data, and we need to integrate it with the existing backend endpoints while composing the payload to match frontend requirements.

---

## 1. Current State Analysis

### 1.1 Frontend Data Requirements (Jobs.jsx)

The frontend job listing page expects the following data structure:

```javascript
{
  id: "job_001",
  title: "Cook",                          // Maps to: posting_title
  company: "Al Manara Restaurant",        // Maps to: employer.company_name
  country: "UAE",                         // Direct mapping
  city: "Dubai",                          // Direct mapping
  status: "published",                    // Not in backend (all published jobs are active)
  created_at: "2025-08-23T10:30:00.000Z", // Maps to: created_at (from BaseEntity)
  published_at: "2025-08-25T10:30:00.000Z", // Maps to: posting_date_ad
  salary: "1200 AED",                     // Composed from: positions[0].salary
  currency: "AED",                        // Maps to: positions[0].salary.currency
  salary_amount: 1200,                    // Maps to: positions[0].salary.monthly_amount
  requirements: [...],                    // Maps to: education_requirements + experience_requirements
  description: "...",                     // NOT IN BACKEND - needs to be added or composed
  tags: [...],                            // Maps to: skills array
  applications_count: 45,                 // NOT IN BACKEND - needs separate query
  shortlisted_count: 12,                  // NOT IN BACKEND - needs separate query
  interviews_today: 2,                    // NOT IN BACKEND - needs separate query
  total_interviews: 8,                    // NOT IN BACKEND - needs separate query
  view_count: 234,                        // NOT IN BACKEND - needs tracking
  category: "Cook",                       // Maps to: canonical_titles[0] or positions[0].title
  employment_type: "Full-time",           // NOT IN BACKEND - could be derived from contract
  working_hours: "8 hours/day",           // Maps to: contract.hours_per_day
  accommodation: "Provided",              // Maps to: contract.accommodation
  food: "Provided",                       // Maps to: contract.food
  visa_status: "Company will provide",    // Composed from: expenses.visa
  contract_duration: "2 years"            // Maps to: contract.period_years
}
```

### 1.2 Frontend Filters

The page supports the following filters:
- **Search**: Text search across title, company, description, tags, ID
- **Country**: Dropdown filter by country
- **Status**: Filter by job status (published, draft, closed, paused)
- **Sort By**: 
  - `published_date` (newest first)
  - `applications` (most applications)
  - `shortlisted` (most shortlisted)
  - `interviews` (most interviews today)

### 1.3 Backend Database Schema

**JobPosting Entity** (`job_postings` table):
- `id` (UUID)
- `posting_title` (varchar 500)
- `country` (varchar 100)
- `city` (varchar 100)
- `posting_date_ad` (date)
- `is_active` (boolean)
- `skills` (jsonb array)
- `education_requirements` (jsonb array)
- `experience_requirements` (jsonb object)
- `cutout_url` (varchar 1000)
- Relations: contracts, expenses, interviews, canonical_titles

**JobContract Entity** (`job_contracts` table):
- Contract terms (period_years, renewable, hours_per_day, etc.)
- Benefits (food, accommodation, transport)
- Relations: employer, agency, positions

**JobPosition Entity** (`job_positions` table):
- `title` (varchar 255)
- `male_vacancies`, `female_vacancies`, `total_vacancies`
- `monthly_salary_amount` (decimal)
- `salary_currency` (varchar 10)
- Relations: salaryConversions

**Employer Entity** (`employers` table):
- `company_name`, `country`, `city`

---

## 2. API Endpoints Available

### 2.1 Job Search Endpoint (Primary)

**Endpoint**: `GET /jobs/search`

**Query Parameters**:
- `keyword` (optional): Search across job title, position, employer, agency
- `country` (optional): Filter by country
- `min_salary` (optional): Minimum salary filter
- `max_salary` (optional): Maximum salary filter
- `currency` (optional): Currency for salary filtering
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page
- `sort_by` (optional, default: 'posted_at'): Sort field (posted_at, salary, relevance)
- `order` (optional, default: 'desc'): Sort order (asc, desc)

**Response Structure**:
```typescript
{
  data: [
    {
      id: string,
      posting_title: string,
      country: string,
      city: string | null,
      posting_date_ad: Date | string,
      employer: {
        id: string,
        company_name: string,
        country: string,
        city: string | null
      } | null,
      agency: {
        id: string,
        name: string,
        license_number: string
      } | null,
      positions: [
        {
          title: string,
          vacancies: { male: number, female: number, total: number },
          salary: {
            monthly_amount: number,
            currency: string,
            converted: [{ amount: number, currency: string }]
          },
          overrides: { ... }
        }
      ]
    }
  ],
  total: number,
  page: number,
  limit: number,
  search: {
    keyword: string | null,
    filters: { country, min_salary, max_salary, currency }
  }
}
```

### 2.2 Job Details Endpoint

**Endpoint**: `GET /jobs/:id`

**Response**: Full job details including contract, expenses, interview info

---

## 3. Data Mapping Strategy

### 3.1 Direct Mappings

| Frontend Field | Backend Source | Transformation |
|---------------|----------------|----------------|
| `id` | `data[].id` | Direct |
| `title` | `data[].posting_title` | Direct |
| `company` | `data[].employer.company_name` | Direct |
| `country` | `data[].country` | Direct |
| `city` | `data[].city` | Direct |
| `published_at` | `data[].posting_date_ad` | Direct |
| `currency` | `data[].positions[0].salary.currency` | First position |
| `salary_amount` | `data[].positions[0].salary.monthly_amount` | First position |

### 3.2 Composed Fields

| Frontend Field | Composition Logic |
|---------------|-------------------|
| `salary` | `${positions[0].salary.monthly_amount} ${positions[0].salary.currency}` |
| `category` | `positions[0].title` or first canonical_title |
| `requirements` | Merge `education_requirements` + format `experience_requirements` |
| `tags` | Use `skills` array |
| `working_hours` | `${contract.hours_per_day} hours/day` (from details endpoint) |
| `contract_duration` | `${contract.period_years} years` (from details endpoint) |

### 3.3 Missing Fields (Require Backend Extension)

These fields are NOT available in the current backend and need to be added:

1. **Application Statistics** (High Priority):
   - `applications_count`
   - `shortlisted_count`
   - `interviews_today`
   - `total_interviews`
   
   **Solution**: Add aggregation queries to count from `job_applications` table

2. **Job Description** (Medium Priority):
   - `description`
   
   **Solution**: Add `description` field to `JobPosting` entity

3. **View Tracking** (Low Priority):
   - `view_count`
   
   **Solution**: Add `view_count` field and increment logic

4. **Status Management** (Medium Priority):
   - `status` (published, draft, closed, paused)
   
   **Solution**: Add `status` enum field to `JobPosting` entity

5. **Employment Type** (Low Priority):
   - `employment_type`
   
   **Solution**: Add field or derive from contract type

---

## 4. Implementation Plan

### Phase 1: Minimal Integration (Use Existing API)

**Goal**: Get the job listing page working with existing backend data

#### Step 1.1: Create API Service Adapter
Create `jobApiService.js` to wrap the backend API:

```javascript
// services/jobApiService.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class JobApiService {
  async getJobs(filters = {}) {
    const params = {
      keyword: filters.search || undefined,
      country: filters.country !== 'All Countries' ? filters.country : undefined,
      page: 1,
      limit: 100, // Get all for client-side pagination
      sort_by: this.mapSortBy(filters.sortBy),
      order: 'desc'
    };

    const response = await axios.get(`${API_BASE_URL}/jobs/search`, { params });
    return this.transformJobsResponse(response.data);
  }

  mapSortBy(frontendSort) {
    const mapping = {
      'published_date': 'posted_at',
      'applications': 'posted_at', // Fallback until backend supports
      'shortlisted': 'posted_at',  // Fallback until backend supports
      'interviews': 'posted_at'    // Fallback until backend supports
    };
    return mapping[frontendSort] || 'posted_at';
  }

  transformJobsResponse(apiResponse) {
    return apiResponse.data.map(job => ({
      id: job.id,
      title: job.posting_title,
      company: job.employer?.company_name || 'N/A',
      country: job.country,
      city: job.city || '',
      status: 'published', // All jobs from this endpoint are published
      created_at: job.posting_date_ad, // Use posting date as created
      published_at: job.posting_date_ad,
      
      // Salary from first position
      salary: this.formatSalary(job.positions[0]),
      currency: job.positions[0]?.salary.currency || '',
      salary_amount: job.positions[0]?.salary.monthly_amount || 0,
      
      // Composed fields
      requirements: [], // TODO: Fetch from details endpoint if needed
      description: job.posting_title, // Use title as description for now
      tags: [], // TODO: Fetch skills from details endpoint
      
      // Statistics (mock for now)
      applications_count: 0,
      shortlisted_count: 0,
      interviews_today: 0,
      total_interviews: 0,
      view_count: 0,
      
      // Additional fields
      category: job.positions[0]?.title || 'General',
      employment_type: 'Full-time', // Default
      working_hours: '8 hours/day', // Default
      accommodation: 'To be confirmed',
      food: 'To be confirmed',
      visa_status: 'Company will provide',
      contract_duration: '2 years' // Default
    }));
  }

  formatSalary(position) {
    if (!position?.salary) return 'N/A';
    return `${position.salary.monthly_amount} ${position.salary.currency}`;
  }

  async getJobStatistics() {
    // Mock statistics for now
    return {
      byCountry: {
        'UAE': 15,
        'Qatar': 8,
        'Saudi Arabia': 5,
        'Kuwait': 3,
        'Oman': 2
      }
    };
  }
}

export default new JobApiService();
```

#### Step 1.2: Update Jobs.jsx
Replace mock service with API service:

```javascript
// In Jobs.jsx
import jobApiService from '../services/jobApiService.js'

// Replace in useEffect:
const [jobsData, statsData] = await Promise.all([
  jobApiService.getJobs(filters),
  jobApiService.getJobStatistics()
])

setAllJobs(jobsData)
setJobs(jobsData)
setCountryDistribution(statsData.byCountry || {})
```

### Phase 2: Backend Enhancements

#### Step 2.1: Add Application Statistics

**Backend Changes Required**:

1. Create aggregation service method:
```typescript
// domain.service.ts
async getJobApplicationStatistics(jobPostingIds: string[]) {
  const stats = await this.applicationRepository
    .createQueryBuilder('app')
    .select('app.job_posting_id', 'job_id')
    .addSelect('COUNT(*)', 'applications_count')
    .addSelect('SUM(CASE WHEN app.stage = :shortlisted THEN 1 ELSE 0 END)', 'shortlisted_count')
    .where('app.job_posting_id IN (:...ids)', { ids: jobPostingIds })
    .setParameter('shortlisted', 'shortlisted')
    .groupBy('app.job_posting_id')
    .getRawMany();
  
  return stats;
}
```

2. Modify search endpoint to include statistics:
```typescript
// public-jobs.controller.ts - in searchJobs method
const jobIds = results.data.map(j => j.id);
const appStats = await this.jobs.getJobApplicationStatistics(jobIds);
const statsMap = new Map(appStats.map(s => [s.job_id, s]));

// Add to transformation
const transformedData = results.data.map(job => {
  const stats = statsMap.get(job.id) || { 
    applications_count: 0, 
    shortlisted_count: 0 
  };
  
  return {
    ...job,
    applications_count: parseInt(stats.applications_count),
    shortlisted_count: parseInt(stats.shortlisted_count)
  };
});
```

#### Step 2.2: Add Description Field

**Migration**:
```typescript
// Add to JobPosting entity
@Column({ type: 'text', nullable: true })
description?: string;
```

#### Step 2.3: Add Status Field

**Migration**:
```typescript
// Add to JobPosting entity
@Column({
  type: 'enum',
  enum: ['published', 'draft', 'closed', 'paused'],
  default: 'published'
})
status: string;
```

Update search query to filter by status.

#### Step 2.4: Enhance Search Response DTO

```typescript
// job-search.dto.ts
export class JobSearchItemDto {
  // ... existing fields ...
  
  @ApiProperty({ required: false })
  applications_count?: number;
  
  @ApiProperty({ required: false })
  shortlisted_count?: number;
  
  @ApiProperty({ required: false })
  description?: string;
  
  @ApiProperty({ required: false })
  status?: string;
}
```

### Phase 3: Advanced Features

#### Step 3.1: Interview Statistics
- Add query to count interviews by date
- Include `interviews_today` and `total_interviews` in response

#### Step 3.2: View Tracking
- Add `view_count` field
- Implement increment endpoint
- Track views on job details page

#### Step 3.3: Enhanced Sorting
- Support sorting by `applications`, `shortlisted`, `interviews`
- Requires indexed columns for performance

---

## 5. API Contract Specification

### 5.1 Enhanced Search Endpoint (Target State)

**Request**:
```
GET /jobs/search?keyword=cook&country=UAE&status=published&sort_by=applications&page=1&limit=10
```

**Response**:
```json
{
  "data": [
    {
      "id": "uuid-v4",
      "posting_title": "Cook",
      "country": "UAE",
      "city": "Dubai",
      "posting_date_ad": "2025-08-25T10:30:00.000Z",
      "status": "published",
      "description": "Looking for experienced cook...",
      "employer": {
        "id": "uuid",
        "company_name": "Al Manara Restaurant",
        "country": "UAE",
        "city": "Dubai"
      },
      "agency": {
        "id": "uuid",
        "name": "Inspire International",
        "license_number": "LIC-001"
      },
      "positions": [
        {
          "title": "Cook",
          "vacancies": { "male": 2, "female": 1, "total": 3 },
          "salary": {
            "monthly_amount": 1200,
            "currency": "AED",
            "converted": [
              { "amount": 326, "currency": "USD" },
              { "amount": 43200, "currency": "NPR" }
            ]
          }
        }
      ],
      "applications_count": 45,
      "shortlisted_count": 12,
      "interviews_today": 2,
      "total_interviews": 8,
      "view_count": 234,
      "skills": ["cooking", "arabic cuisine"],
      "category": "Cook"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 10,
  "search": {
    "keyword": "cook",
    "filters": {
      "country": "UAE",
      "status": "published"
    }
  }
}
```

### 5.2 Country Distribution Endpoint (New)

**Request**:
```
GET /jobs/statistics/countries
```

**Response**:
```json
{
  "UAE": 15,
  "Qatar": 8,
  "Saudi Arabia": 5,
  "Kuwait": 3,
  "Oman": 2
}
```

---

## 6. Testing Strategy

### 6.1 Phase 1 Testing
- Verify job listing loads from API
- Test search functionality
- Test country filter
- Verify pagination works
- Check error handling

### 6.2 Phase 2 Testing
- Verify application counts are accurate
- Test status filtering
- Verify description displays correctly
- Test sorting by applications

### 6.3 Integration Testing
- Test with real database data
- Verify performance with 100+ jobs
- Test concurrent user access
- Verify caching works correctly

---

## 7. Migration Path

### Week 1: Phase 1 Implementation
- Day 1-2: Create API service adapter
- Day 3-4: Integrate with Jobs.jsx
- Day 5: Testing and bug fixes

### Week 2: Phase 2 Backend Enhancements
- Day 1-2: Add application statistics
- Day 3: Add description and status fields
- Day 4-5: Update API endpoints and DTOs

### Week 3: Phase 3 Advanced Features
- Day 1-2: Interview statistics
- Day 3: View tracking
- Day 4-5: Enhanced sorting and filtering

---

## 8. Performance Considerations

### 8.1 Caching Strategy
- Cache job listings for 5 minutes
- Invalidate cache on job updates
- Use Redis for distributed caching

### 8.2 Query Optimization
- Add indexes on frequently filtered columns (country, status, posting_date_ad)
- Use database views for complex aggregations
- Implement cursor-based pagination for large datasets

### 8.3 Response Size
- Limit default page size to 10-25 items
- Implement field selection (sparse fieldsets)
- Compress responses with gzip

---

## 9. Security Considerations

- Implement rate limiting on search endpoint
- Validate and sanitize all query parameters
- Use parameterized queries to prevent SQL injection
- Implement CORS properly for frontend domain
- Add authentication for admin-specific endpoints

---

## 10. Monitoring and Logging

- Log all API requests with response times
- Monitor error rates and types
- Track popular search keywords
- Alert on slow queries (>1s)
- Dashboard for API health metrics

---

## Appendix A: Environment Variables

```env
# Frontend (.env)
REACT_APP_API_URL=http://localhost:3000
REACT_APP_API_TIMEOUT=10000

# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
REDIS_URL=redis://localhost:6379
CACHE_TTL=300
```

## Appendix B: Error Codes

| Code | Message | Action |
|------|---------|--------|
| 400 | Invalid query parameters | Check filter values |
| 404 | Job not found | Verify job ID |
| 429 | Too many requests | Implement backoff |
| 500 | Internal server error | Check logs |

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-26  
**Author**: API Integration Team
