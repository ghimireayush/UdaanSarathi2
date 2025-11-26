# Admin Job Listing - Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ADMIN FRONTEND                            │
│                    (React + Vite + Tailwind)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND API (NestJS)                        │
│                                                                   │
│  ┌────────────────────┐         ┌────────────────────┐          │
│  │   Public Module    │         │   Admin Module     │          │
│  │  /jobs/search      │         │   /admin/jobs      │          │
│  │  (Existing - No    │         │   (NEW - Dedicated │          │
│  │   Changes)         │         │    for Admin)      │          │
│  └────────────────────┘         └────────────────────┘          │
│           │                              │                       │
│           │                              │                       │
│           ▼                              ▼                       │
│  ┌─────────────────────────────────────────────────┐            │
│  │         Domain Module (Job Postings)            │            │
│  │  - JobPosting Entity                            │            │
│  │  - JobContract Entity                           │            │
│  │  - JobPosition Entity                           │            │
│  │  - Employer Entity                              │            │
│  └─────────────────────────────────────────────────┘            │
│           │                              │                       │
│           │                              │                       │
│           ▼                              ▼                       │
│  ┌─────────────────────────────────────────────────┐            │
│  │      Application Module (Statistics)            │            │
│  │  - JobApplication Entity                        │            │
│  │  - Application Aggregations                     │            │
│  └─────────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ TypeORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ job_postings │  │ job_contracts│  │ job_positions│          │
│  │              │  │              │  │              │          │
│  │ + id         │  │ + id         │  │ + id         │          │
│  │ + title      │  │ + period     │  │ + title      │          │
│  │ + country    │  │ + hours/day  │  │ + salary     │          │
│  │ + status ✨  │  │ + food       │  │ + vacancies  │          │
│  │ + description✨│  │ + accom.     │  └──────────────┘          │
│  │ + view_count✨│  └──────────────┘                            │
│  └──────────────┘                                                │
│         │                                                         │
│         │ FK                                                      │
│         ▼                                                         │
│  ┌──────────────────┐                                            │
│  │ job_applications │                                            │
│  │                  │                                            │
│  │ + id             │                                            │
│  │ + job_posting_id │                                            │
│  │ + stage          │                                            │
│  │ + interview_date │                                            │
│  └──────────────────┘                                            │
│                                                                   │
│  ✨ = New fields added by migration                              │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Job Listing Request Flow

```
User Opens Jobs Page
        │
        ▼
┌───────────────────┐
│   Jobs.jsx        │
│   useEffect()     │
└───────────────────┘
        │
        │ fetchJobsData()
        ▼
┌───────────────────┐
│  jobService.js    │
│  getJobsFromAdmin │
│  Api()            │
└───────────────────┘
        │
        │ Delegates to
        ▼
┌───────────────────┐
│ adminJobApiClient │
│ .getAdminJobs()   │
└───────────────────┘
        │
        │ GET /admin/jobs?search=...&country=...
        │ Headers: { Authorization: Bearer <token> }
        ▼
┌───────────────────┐
│ AdminJobsController│
│ @Get()            │
└───────────────────┘
        │
        │ Calls service
        ▼
┌───────────────────┐
│ AdminJobsService  │
│ getAdminJobList() │
└───────────────────┘
        │
        ├─────────────────────┬──────────────────────┐
        │                     │                      │
        ▼                     ▼                      ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Query Jobs   │    │ Get App Stats│    │ Transform    │
│ with Filters │    │ (Aggregation)│    │ to DTO       │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                      │
        └─────────────────────┴──────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Return JSON      │
                    │ {                │
                    │   data: [...],   │
                    │   total: 42,     │
                    │   page: 1        │
                    │ }                │
                    └──────────────────┘
                              │
                              │ Response
                              ▼
                    ┌──────────────────┐
                    │ Jobs.jsx         │
                    │ setJobs(data)    │
                    │ Render UI        │
                    └──────────────────┘
```

### 2. Statistics Aggregation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AdminJobsService                          │
│                                                               │
│  getAdminJobList(filters)                                    │
│    │                                                          │
│    ├─► 1. Query job_postings with filters                   │
│    │      SELECT * FROM job_postings                         │
│    │      WHERE country = 'UAE'                              │
│    │      AND status = 'published'                           │
│    │                                                          │
│    ├─► 2. Get job IDs: [id1, id2, id3, ...]                 │
│    │                                                          │
│    ├─► 3. Aggregate statistics from job_applications        │
│    │      SELECT                                             │
│    │        job_posting_id,                                  │
│    │        COUNT(*) as applications_count,                  │
│    │        SUM(CASE WHEN stage='shortlisted' THEN 1        │
│    │            ELSE 0 END) as shortlisted_count,            │
│    │        SUM(CASE WHEN interview_date=CURRENT_DATE        │
│    │            THEN 1 ELSE 0 END) as interviews_today       │
│    │      FROM job_applications                              │
│    │      WHERE job_posting_id IN (id1, id2, id3, ...)      │
│    │      GROUP BY job_posting_id                            │
│    │                                                          │
│    ├─► 4. Create Map: jobId → stats                         │
│    │      {                                                  │
│    │        id1: { applications: 45, shortlisted: 12 },     │
│    │        id2: { applications: 67, shortlisted: 18 }      │
│    │      }                                                  │
│    │                                                          │
│    └─► 5. Transform jobs + stats to DTO                     │
│           jobs.map(job => ({                                 │
│             ...job,                                          │
│             applications_count: statsMap.get(job.id).apps,  │
│             shortlisted_count: statsMap.get(job.id).short   │
│           }))                                                │
└─────────────────────────────────────────────────────────────┘
```

## API Comparison

### Public API (Existing - Untouched)

```
┌────────────────────────────────────────────────────────┐
│  GET /jobs/search                                       │
│                                                          │
│  Purpose: Public job search for mobile app             │
│  Auth: None (public)                                    │
│  Response:                                              │
│    - Basic job info                                     │
│    - Employer & agency                                  │
│    - Positions with salary                              │
│    - NO statistics                                      │
│    - NO application counts                              │
│                                                          │
│  Used by: Mobile app, public website                   │
└────────────────────────────────────────────────────────┘
```

### Admin API (New - Dedicated)

```
┌────────────────────────────────────────────────────────┐
│  GET /admin/jobs                                        │
│                                                          │
│  Purpose: Admin panel job management                    │
│  Auth: Required (JWT Bearer token)                     │
│  Response:                                              │
│    - Full job info                                      │
│    - Employer & agency                                  │
│    - Positions with salary                              │
│    - ✨ Application statistics                          │
│    - ✨ Shortlisted counts                              │
│    - ✨ Interview counts                                │
│    - ✨ Status management                               │
│                                                          │
│  Used by: Admin frontend only                          │
└────────────────────────────────────────────────────────┘
```

## Frontend Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Services                     │
│                                                           │
│  ┌────────────────┐         ┌────────────────┐          │
│  │  jobService.js │         │ adminJobApi    │          │
│  │                │         │ Client.js      │          │
│  │ - getJobs()    │────────▶│                │          │
│  │ - getJobById() │ Uses    │ - getAdminJobs │          │
│  │ - createJob()  │         │ - getCountry   │          │
│  │ - updateJob()  │         │   Distribution │          │
│  │ - deleteJob()  │         │ - getJobStats  │          │
│  └────────────────┘         └────────────────┘          │
│         │                            │                   │
│         │                            │                   │
│         ▼                            ▼                   │
│  ┌────────────────────────────────────────┐             │
│  │      performanceService.js             │             │
│  │      (Caching Layer)                   │             │
│  │                                         │             │
│  │  - getCachedData()                     │             │
│  │  - Cache TTL: 1 minute for admin       │             │
│  │  - Cache TTL: 1 hour for public        │             │
│  └────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌──────────────┐
│ User Login   │
│ (Phone + OTP)│
└──────────────┘
       │
       ▼
┌──────────────┐
│ authService  │
│ .login()     │
└──────────────┘
       │
       │ POST /login/verify
       ▼
┌──────────────┐
│ Backend Auth │
│ Module       │
└──────────────┘
       │
       │ Returns JWT token
       ▼
┌──────────────────────────────┐
│ localStorage.setItem(        │
│   'udaan_token',             │
│   token                      │
│ )                            │
└──────────────────────────────┘
       │
       │ Token stored
       ▼
┌──────────────────────────────┐
│ All subsequent API calls     │
│ include:                     │
│ Authorization: Bearer <token>│
└──────────────────────────────┘
```

## Caching Strategy

```
┌─────────────────────────────────────────────────────────┐
│                   Cache Layers                           │
│                                                           │
│  Frontend (performanceService)                           │
│  ┌────────────────────────────────────────┐             │
│  │ Key: 'admin_jobs_<filters_hash>'       │             │
│  │ TTL: 60 seconds                        │             │
│  │ Storage: Memory (Map)                  │             │
│  └────────────────────────────────────────┘             │
│                    │                                     │
│                    │ Cache miss                          │
│                    ▼                                     │
│  Backend (Future: Redis)                                │
│  ┌────────────────────────────────────────┐             │
│  │ Key: 'admin:jobs:<filters>'            │             │
│  │ TTL: 5 minutes                         │             │
│  │ Storage: Redis                         │             │
│  └────────────────────────────────────────┘             │
│                    │                                     │
│                    │ Cache miss                          │
│                    ▼                                     │
│  Database (PostgreSQL)                                  │
│  ┌────────────────────────────────────────┐             │
│  │ Query with indexes                     │             │
│  │ - IDX_job_postings_status              │             │
│  │ - IDX_job_postings_country             │             │
│  └────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
Backend Error
     │
     ▼
┌─────────────────┐
│ HTTP Status     │
│ 400 Bad Request │
│ 401 Unauthorized│
│ 404 Not Found   │
│ 500 Server Error│
└─────────────────┘
     │
     │ Response
     ▼
┌─────────────────┐
│ adminJobApiClient│
│ .catch(error)   │
└─────────────────┘
     │
     │ Throw Error
     ▼
┌─────────────────┐
│ jobService      │
│ handleService   │
│ Error()         │
└─────────────────┘
     │
     │ Retry 3x
     ▼
┌─────────────────┐
│ Jobs.jsx        │
│ handleError()   │
└─────────────────┘
     │
     │ Display UI
     ▼
┌─────────────────┐
│ Error Card      │
│ - Message       │
│ - Retry Button  │
│ - Reload Button │
└─────────────────┘
```

---

## Key Architectural Decisions

1. **Separate Admin Module**: Keeps admin logic isolated from public APIs
2. **Dedicated DTOs**: Admin responses have different structure than public
3. **Statistics Aggregation**: Computed on-demand, not stored
4. **Caching Strategy**: Short TTL for admin (fresh data), long TTL for public
5. **No Breaking Changes**: Existing `/jobs/search` remains untouched
6. **Authentication**: Admin endpoints require JWT, public don't
7. **Error Handling**: Consistent error handling across all layers

---

**Last Updated**: 2025-11-26
