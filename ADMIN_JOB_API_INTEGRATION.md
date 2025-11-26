# Admin Job Listing API Integration Plan

## Overview
This document outlines the API integration for the admin frontend job listing page, creating **dedicated admin endpoints** that won't interfere with existing public job APIs.

---

## 1. Existing API Integration Patterns

### Pattern Analysis from Existing Services

**Authentication Pattern** (from `authService.js`):
```javascript
const API_BASE_URL = 'http://localhost:3000'

const buildAuthHeaders = () => {
  const token = localStorage.getItem('udaan_token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  }
}
```

**API Client Pattern** (from `draftJobApiClient.js`):
```javascript
class DraftJobApiClient {
  async getDraftJobs() {
    const license = getAgencyLicense()
    const response = await fetch(
      `${API_BASE_URL}/agencies/${license}/draft-jobs`,
      {
        method: 'GET',
        headers: getAuthHeaders()
      }
    )
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    return await response.json()
  }
}
```

**Service with Caching** (from `countryService.js`):
```javascript
async getCountries() {
  return await performanceService.getCachedData('countries_api', async () => {
    const response = await fetch(`${API_BASE_URL}/countries`)
    if (!response.ok) {
      throw new Error(`Failed to fetch countries: ${response.statusText}`)
    }
    return await response.json()
  }, 'countries', 3600000) // Cache for 1 hour
}
```

---

## 2. Proposed Backend API Structure

### New Admin Module
Create a dedicated admin module in backend to avoid touching existing public APIs:

```
src/modules/admin/
├── admin.module.ts
├── admin-jobs.controller.ts
├── admin-jobs.service.ts
└── dto/
    ├── admin-job-list.dto.ts
    ├── admin-job-filters.dto.ts
    └── admin-job-stats.dto.ts
```

### Admin Job Endpoints

#### 2.1 List Jobs for Admin (with Statistics)
```
GET /admin/jobs
```

**Query Parameters**:
- `search` (optional): Search across title, company, ID
- `country` (optional): Filter by country
- `status` (optional): Filter by status (published, draft, closed, paused)
- `agency_id` (optional): Filter by agency
- `sort_by` (optional): Sort field (published_date, applications, shortlisted, interviews)
- `order` (optional): Sort order (asc, desc)
- `page` (optional, default: 1)
- `limit` (optional, default: 10)

**Response**:
```typescript
{
  data: [
    {
      id: string,
      title: string,  // posting_title
      company: string,  // employer.company_name
      country: string,
      city: string,
      status: 'published' | 'draft' | 'closed' | 'paused',
      created_at: Date,
      published_at: Date,
      
      // Salary from first position
      salary: string,  // "1200 AED"
      currency: string,
      salary_amount: number,
      
      // Statistics (aggregated from applications)
      applications_count: number,
      shortlisted_count: number,
      interviews_today: number,
      total_interviews: number,
      view_count: number,
      
      // Additional fields
      category: string,  // positions[0].title
      tags: string[],  // skills
      requirements: string[],  // education_requirements
      description: string,
      
      // Contract info (from details if needed)
      working_hours: string,  // "8 hours/day"
      accommodation: string,
      food: string,
      visa_status: string,
      contract_duration: string,  // "2 years"
      
      // Agency info
      agency: {
        id: string,
        name: string,
        license_number: string
      }
    }
  ],
  total: number,
  page: number,
  limit: number,
  filters: {
    search: string,
    country: string,
    status: string
  }
}
```

#### 2.2 Get Country Distribution
```
GET /admin/jobs/statistics/countries
```

**Response**:
```typescript
{
  "UAE": 15,
  "Qatar": 8,
  "Saudi Arabia": 5,
  "Kuwait": 3,
  "Oman": 2
}
```

#### 2.3 Get Job Details (Admin View)
```
GET /admin/jobs/:id
```

**Response**: Full job details with all statistics and admin-specific info

---

## 3. Backend Implementation

### Step 1: Create Admin Module

**File**: `src/modules/admin/admin.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminJobsController } from './admin-jobs.controller';
import { AdminJobsService } from './admin-jobs.service';
import { JobPosting } from '../domain/domain.entity';
import { JobApplication } from '../application/job-application.entity';
import { DomainModule } from '../domain/domain.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JobPosting, JobApplication]),
    DomainModule
  ],
  controllers: [AdminJobsController],
  providers: [AdminJobsService],
  exports: [AdminJobsService]
})
export class AdminModule {}
```

### Step 2: Create DTOs

**File**: `src/modules/admin/dto/admin-job-list.dto.ts`
```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AdminJobFiltersDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ required: false, enum: ['published', 'draft', 'closed', 'paused'] })
  @IsOptional()
  @IsEnum(['published', 'draft', 'closed', 'paused'])
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  agency_id?: string;

  @ApiProperty({ required: false, enum: ['published_date', 'applications', 'shortlisted', 'interviews'] })
  @IsOptional()
  @IsEnum(['published_date', 'applications', 'shortlisted', 'interviews'])
  sort_by?: string;

  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class AdminJobItemDto {
  id!: string;
  title!: string;
  company!: string;
  country!: string;
  city?: string;
  status!: string;
  created_at!: Date;
  published_at?: Date;
  
  salary!: string;
  currency!: string;
  salary_amount!: number;
  
  applications_count!: number;
  shortlisted_count!: number;
  interviews_today!: number;
  total_interviews!: number;
  view_count!: number;
  
  category!: string;
  tags!: string[];
  requirements!: string[];
  description?: string;
  
  working_hours?: string;
  accommodation?: string;
  food?: string;
  visa_status?: string;
  contract_duration?: string;
  
  agency?: {
    id: string;
    name: string;
    license_number: string;
  };
}

export class AdminJobListResponseDto {
  data!: AdminJobItemDto[];
  total!: number;
  page!: number;
  limit!: number;
  filters!: Partial<AdminJobFiltersDto>;
}
```

### Step 3: Create Service

**File**: `src/modules/admin/admin-jobs.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JobPosting } from '../domain/domain.entity';
import { JobApplication } from '../application/job-application.entity';
import { AdminJobFiltersDto, AdminJobListResponseDto, AdminJobItemDto } from './dto/admin-job-list.dto';

@Injectable()
export class AdminJobsService {
  constructor(
    @InjectRepository(JobPosting)
    private jobPostingRepo: Repository<JobPosting>,
    @InjectRepository(JobApplication)
    private applicationRepo: Repository<JobApplication>,
  ) {}

  async getAdminJobList(filters: AdminJobFiltersDto): Promise<AdminJobListResponseDto> {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Build query
    let query = this.jobPostingRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.contracts', 'contract')
      .leftJoinAndSelect('contract.employer', 'employer')
      .leftJoinAndSelect('contract.agency', 'agency')
      .leftJoinAndSelect('contract.positions', 'position')
      .where('job.is_active = :active', { active: true });

    // Apply filters
    if (filters.search) {
      query = query.andWhere(
        '(job.posting_title ILIKE :search OR employer.company_name ILIKE :search OR job.id::text ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    if (filters.country) {
      query = query.andWhere('job.country = :country', { country: filters.country });
    }

    if (filters.status) {
      query = query.andWhere('job.status = :status', { status: filters.status });
    }

    if (filters.agency_id) {
      query = query.andWhere('agency.id = :agencyId', { agencyId: filters.agency_id });
    }

    // Get total count
    const total = await query.getCount();

    // Apply sorting
    const sortBy = filters.sort_by || 'published_date';
    const order = filters.order || 'DESC';
    
    if (sortBy === 'published_date') {
      query = query.orderBy('job.posting_date_ad', order);
    }
    // Note: For applications/shortlisted/interviews sorting, we'll need to join with aggregated stats

    // Apply pagination
    query = query.skip(skip).take(limit);

    const jobs = await query.getMany();

    // Get job IDs for statistics
    const jobIds = jobs.map(j => j.id);
    
    // Fetch application statistics
    const appStats = await this.getApplicationStatistics(jobIds);
    const statsMap = new Map(appStats.map(s => [s.job_id, s]));

    // Transform to DTO
    const data: AdminJobItemDto[] = jobs.map(job => {
      const contract = job.contracts?.[0];
      const position = contract?.positions?.[0];
      const stats = statsMap.get(job.id) || {
        applications_count: 0,
        shortlisted_count: 0,
        interviews_today: 0,
        total_interviews: 0
      };

      return {
        id: job.id,
        title: job.posting_title,
        company: contract?.employer?.company_name || 'N/A',
        country: job.country,
        city: job.city,
        status: job.status || 'published',
        created_at: job.created_at,
        published_at: job.posting_date_ad,
        
        salary: position ? `${position.monthly_salary_amount} ${position.salary_currency}` : 'N/A',
        currency: position?.salary_currency || '',
        salary_amount: position?.monthly_salary_amount || 0,
        
        applications_count: parseInt(stats.applications_count),
        shortlisted_count: parseInt(stats.shortlisted_count),
        interviews_today: parseInt(stats.interviews_today),
        total_interviews: parseInt(stats.total_interviews),
        view_count: 0, // TODO: Implement view tracking
        
        category: position?.title || 'General',
        tags: job.skills || [],
        requirements: job.education_requirements || [],
        description: job.description || job.posting_title,
        
        working_hours: contract?.hours_per_day ? `${contract.hours_per_day} hours/day` : undefined,
        accommodation: contract?.accommodation || undefined,
        food: contract?.food || undefined,
        visa_status: 'Company will provide', // TODO: Derive from expenses
        contract_duration: contract?.period_years ? `${contract.period_years} years` : undefined,
        
        agency: contract?.agency ? {
          id: contract.agency.id,
          name: contract.agency.name,
          license_number: contract.agency.license_number
        } : undefined
      };
    });

    return {
      data,
      total,
      page,
      limit,
      filters: {
        search: filters.search,
        country: filters.country,
        status: filters.status
      }
    };
  }

  async getApplicationStatistics(jobIds: string[]) {
    if (jobIds.length === 0) return [];

    const stats = await this.applicationRepo
      .createQueryBuilder('app')
      .select('app.job_posting_id', 'job_id')
      .addSelect('COUNT(*)', 'applications_count')
      .addSelect(
        'SUM(CASE WHEN app.stage = :shortlisted THEN 1 ELSE 0 END)',
        'shortlisted_count'
      )
      .addSelect(
        'SUM(CASE WHEN app.interview_date = CURRENT_DATE THEN 1 ELSE 0 END)',
        'interviews_today'
      )
      .addSelect(
        'SUM(CASE WHEN app.interview_date IS NOT NULL THEN 1 ELSE 0 END)',
        'total_interviews'
      )
      .where('app.job_posting_id IN (:...ids)', { ids: jobIds })
      .setParameter('shortlisted', 'shortlisted')
      .groupBy('app.job_posting_id')
      .getRawMany();

    return stats;
  }

  async getCountryDistribution(): Promise<Record<string, number>> {
    const results = await this.jobPostingRepo
      .createQueryBuilder('job')
      .select('job.country', 'country')
      .addSelect('COUNT(*)', 'count')
      .where('job.is_active = :active', { active: true })
      .andWhere('job.status = :status', { status: 'published' })
      .groupBy('job.country')
      .getRawMany();

    const distribution: Record<string, number> = {};
    results.forEach(r => {
      distribution[r.country] = parseInt(r.count);
    });

    return distribution;
  }
}
```

### Step 4: Create Controller

**File**: `src/modules/admin/admin-jobs.controller.ts`
```typescript
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminJobsService } from './admin-jobs.service';
import { AdminJobFiltersDto, AdminJobListResponseDto } from './dto/admin-job-list.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Uncomment when auth is ready

@ApiTags('admin')
@Controller('admin/jobs')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is ready
// @ApiBearerAuth()
export class AdminJobsController {
  constructor(private readonly adminJobsService: AdminJobsService) {}

  @Get()
  @ApiOperation({ summary: 'Get job listings for admin panel with statistics' })
  async getAdminJobs(
    @Query() filters: AdminJobFiltersDto
  ): Promise<AdminJobListResponseDto> {
    return await this.adminJobsService.getAdminJobList(filters);
  }

  @Get('statistics/countries')
  @ApiOperation({ summary: 'Get job distribution by country' })
  async getCountryDistribution(): Promise<Record<string, number>> {
    return await this.adminJobsService.getCountryDistribution();
  }
}
```

### Step 5: Register Module

**File**: `src/app.module.ts`
```typescript
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    // ... existing modules
    AdminModule,
  ],
})
export class AppModule {}
```

---

## 4. Frontend Implementation

### Step 1: Create Admin Job API Client

**File**: `src/services/adminJobApiClient.js`
```javascript
// Admin Job API Client - Dedicated admin endpoints
import performanceService from './performanceService.js';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Get authorization headers with JWT token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('udaan_token');
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

/**
 * Handle API errors
 */
const handleApiError = (error, operation) => {
  console.error(`API Error [${operation}]:`, error);
  throw new Error(`${operation} failed: ${error.message}`);
};

/**
 * Admin Job API Client
 */
class AdminJobApiClient {
  /**
   * Get jobs for admin panel with filters and statistics
   */
  async getAdminJobs(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.search) params.append('search', filters.search);
      if (filters.country && filters.country !== 'All Countries') {
        params.append('country', filters.country);
      }
      if (filters.status) params.append('status', filters.status);
      if (filters.sortBy) params.append('sort_by', this.mapSortBy(filters.sortBy));
      if (filters.order) params.append('order', filters.order);
      
      params.append('page', '1');
      params.append('limit', '100'); // Get all for client-side pagination

      const url = `${API_BASE_URL}/admin/jobs?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data; // Return just the jobs array
    } catch (error) {
      return handleApiError(error, 'Get admin jobs');
    }
  }

  /**
   * Get country distribution statistics
   */
  async getCountryDistribution() {
    return await performanceService.getCachedData('admin_country_dist', async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/jobs/statistics/countries`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        console.error('Failed to fetch country distribution:', error);
        return {}; // Return empty object on error
      }
    }, 'admin_jobs', 300000); // Cache for 5 minutes
  }

  /**
   * Get job statistics summary
   */
  async getJobStatistics() {
    const distribution = await this.getCountryDistribution();
    return {
      byCountry: distribution
    };
  }

  /**
   * Map frontend sort field to backend field
   */
  mapSortBy(frontendSort) {
    const mapping = {
      'published_date': 'published_date',
      'applications': 'applications',
      'shortlisted': 'shortlisted',
      'interviews': 'interviews'
    };
    return mapping[frontendSort] || 'published_date';
  }
}

// Export singleton instance
const adminJobApiClient = new AdminJobApiClient();
export default adminJobApiClient;
```

### Step 2: Update Job Service

**File**: `src/services/jobService.js`

Add this method to the existing `JobService` class:

```javascript
/**
 * Get jobs using admin API (with real statistics)
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of jobs
 */
async getJobsFromAdminApi(filters = {}) {
  const cacheKey = `admin_jobs_${JSON.stringify(filters)}`;
  
  return await performanceService.getCachedData(cacheKey, async () => {
    return handleServiceError(async () => {
      // Import at top of file: import adminJobApiClient from './adminJobApiClient.js'
      const jobs = await adminJobApiClient.getAdminJobs(filters);
      return jobs;
    }, 3, 500);
  }, 'jobs', 60000); // Cache for 1 minute
}
```

### Step 3: Update Jobs.jsx

**File**: `src/pages/Jobs.jsx`

Update the `fetchJobsData` function:

```javascript
useEffect(() => {
  const fetchJobsData = async () => {
    try {
      setIsLoading(true);
      clearError();
      
      const [jobsData, statsData] = await Promise.all([
        jobService.getJobsFromAdminApi(filters), // Use new admin API
        adminJobApiClient.getJobStatistics()
      ]);
      
      setAllJobs(jobsData);
      setJobs(jobsData);
      setCountryDistribution(statsData.byCountry || {});
    } catch (err) {
      handleError(err, 'fetch jobs data');
    } finally {
      setIsLoading(false);
    }
  };

  fetchJobsData();
}, [filters]);
```

---

## 5. Migration Database Changes

### Add Missing Fields to JobPosting

**Migration File**: `src/migrations/YYYYMMDDHHMMSS-add-job-admin-fields.ts`

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddJobAdminFields1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add description field
    await queryRunner.addColumn('job_postings', new TableColumn({
      name: 'description',
      type: 'text',
      isNullable: true
    }));

    // Add status field
    await queryRunner.addColumn('job_postings', new TableColumn({
      name: 'status',
      type: 'enum',
      enum: ['published', 'draft', 'closed', 'paused'],
      default: "'published'"
    }));

    // Add view_count field
    await queryRunner.addColumn('job_postings', new TableColumn({
      name: 'view_count',
      type: 'integer',
      default: 0
    }));

    // Add index on status for filtering
    await queryRunner.query(
      `CREATE INDEX "IDX_job_postings_status" ON "job_postings" ("status")`
    );

    // Add index on country for filtering
    await queryRunner.query(
      `CREATE INDEX "IDX_job_postings_country" ON "job_postings" ("country")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_job_postings_country"`);
    await queryRunner.query(`DROP INDEX "IDX_job_postings_status"`);
    await queryRunner.dropColumn('job_postings', 'view_count');
    await queryRunner.dropColumn('job_postings', 'status');
    await queryRunner.dropColumn('job_postings', 'description');
  }
}
```

### Update Entity

**File**: `src/modules/domain/domain.entity.ts`

Add these fields to the `JobPosting` class:

```typescript
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

---

## 6. Testing Plan

### Backend Tests

1. **Unit Tests** (`admin-jobs.service.spec.ts`):
   - Test filtering by search, country, status
   - Test pagination
   - Test statistics aggregation
   - Test country distribution

2. **Integration Tests** (`admin-jobs.controller.spec.ts`):
   - Test GET /admin/jobs endpoint
   - Test GET /admin/jobs/statistics/countries endpoint
   - Test authentication (when enabled)

### Frontend Tests

1. **Service Tests** (`adminJobApiClient.test.js`):
   - Test API calls
   - Test error handling
   - Test caching

2. **Component Tests** (`Jobs.test.jsx`):
   - Test job listing renders
   - Test filters work
   - Test pagination
   - Test error states

---

## 7. Deployment Checklist

- [ ] Backend: Create admin module
- [ ] Backend: Add DTOs
- [ ] Backend: Implement service
- [ ] Backend: Implement controller
- [ ] Backend: Register module in app.module.ts
- [ ] Backend: Run migration to add fields
- [ ] Backend: Test endpoints with Postman/Swagger
- [ ] Frontend: Create adminJobApiClient.js
- [ ] Frontend: Update jobService.js
- [ ] Frontend: Update Jobs.jsx
- [ ] Frontend: Test in browser
- [ ] Add authentication guards (when ready)
- [ ] Add rate limiting
- [ ] Add logging
- [ ] Deploy to staging
- [ ] QA testing
- [ ] Deploy to production

---

## 8. Environment Variables

**Frontend** (`.env`):
```env
VITE_API_BASE_URL=http://localhost:3000
```

**Backend** (`.env`):
```env
# Existing variables
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
```

---

## 9. API Documentation

Once implemented, the admin endpoints will be available in Swagger at:
```
http://localhost:3000/api-docs
```

Look for the "admin" tag to see all admin-specific endpoints.

---

**Document Version**: 1.0  
**Last Updated**: 2025-11-26  
**Status**: Ready for Implementation
