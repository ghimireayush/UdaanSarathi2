# Admin Job Listing API Integration - Implementation Checklist

## Phase 1: Backend Setup (2-3 days)

### Day 1: Create Admin Module Structure
- [ ] Create `src/modules/admin/` directory
- [ ] Create `admin.module.ts`
- [ ] Create `admin-jobs.controller.ts`
- [ ] Create `admin-jobs.service.ts`
- [ ] Create `dto/admin-job-list.dto.ts`
- [ ] Create `dto/admin-job-filters.dto.ts`
- [ ] Register `AdminModule` in `app.module.ts`

### Day 2: Implement Service Logic
- [ ] Implement `getAdminJobList()` method
  - [ ] Build query with filters
  - [ ] Join with contracts, employer, agency, positions
  - [ ] Apply search filter
  - [ ] Apply country filter
  - [ ] Apply status filter
  - [ ] Apply pagination
- [ ] Implement `getApplicationStatistics()` method
  - [ ] Count total applications
  - [ ] Count shortlisted
  - [ ] Count interviews today
  - [ ] Count total interviews
- [ ] Implement `getCountryDistribution()` method
- [ ] Transform data to match frontend expectations

### Day 3: Database Migration & Testing
- [ ] Create migration file for new fields
  - [ ] Add `description` column
  - [ ] Add `status` enum column
  - [ ] Add `view_count` column
  - [ ] Add indexes on `status` and `country`
- [ ] Update `JobPosting` entity with new fields
- [ ] Run migration on dev database
- [ ] Test endpoints with Postman/Swagger
  - [ ] Test GET `/admin/jobs` without filters
  - [ ] Test GET `/admin/jobs` with search
  - [ ] Test GET `/admin/jobs` with country filter
  - [ ] Test GET `/admin/jobs` with status filter
  - [ ] Test GET `/admin/jobs` with pagination
  - [ ] Test GET `/admin/jobs/statistics/countries`
- [ ] Write unit tests for service
- [ ] Write integration tests for controller

## Phase 2: Frontend Integration (1-2 days)

### Day 1: Create API Client
- [ ] Create `src/services/adminJobApiClient.js`
- [ ] Implement `getAdminJobs()` method
  - [ ] Build query parameters
  - [ ] Add authentication headers
  - [ ] Handle errors
- [ ] Implement `getCountryDistribution()` method
  - [ ] Add caching with `performanceService`
- [ ] Implement `getJobStatistics()` method
- [ ] Add error handling
- [ ] Test API client in isolation

### Day 2: Update Jobs Page
- [ ] Import `adminJobApiClient` in `Jobs.jsx`
- [ ] Update `fetchJobsData` function
  - [ ] Replace mock service with admin API
  - [ ] Handle loading states
  - [ ] Handle error states
- [ ] Test in browser
  - [ ] Verify jobs load correctly
  - [ ] Test search functionality
  - [ ] Test country filter
  - [ ] Test status filter (if UI exists)
  - [ ] Test pagination
  - [ ] Test sorting
  - [ ] Verify statistics display correctly
- [ ] Test error scenarios
  - [ ] Network error
  - [ ] 401 Unauthorized
  - [ ] 500 Server error
  - [ ] Empty results

## Phase 3: Polish & Deploy (1 day)

### Morning: Final Testing
- [ ] Test with real data
- [ ] Test with large datasets (100+ jobs)
- [ ] Test performance
- [ ] Test caching behavior
- [ ] Cross-browser testing
- [ ] Mobile responsive testing

### Afternoon: Documentation & Deploy
- [ ] Update API documentation in Swagger
- [ ] Add JSDoc comments to frontend code
- [ ] Update README if needed
- [ ] Create PR with changes
- [ ] Code review
- [ ] Deploy to staging
- [ ] QA testing on staging
- [ ] Deploy to production

## Optional Enhancements (Future)

### Authentication & Authorization
- [ ] Add JWT auth guard to admin endpoints
- [ ] Add role-based access control
- [ ] Add rate limiting

### Advanced Features
- [ ] Add view tracking
- [ ] Add bulk operations
- [ ] Add export to CSV
- [ ] Add advanced filters (date range, salary range)
- [ ] Add job status management (publish, pause, close)

### Performance Optimizations
- [ ] Add database indexes for common queries
- [ ] Implement Redis caching
- [ ] Add query result caching
- [ ] Optimize N+1 queries

## Rollback Plan

If issues arise in production:

1. **Frontend Rollback**:
   - [ ] Revert `Jobs.jsx` to use mock data
   - [ ] Comment out `adminJobApiClient` import
   - [ ] Deploy frontend rollback

2. **Backend Rollback**:
   - [ ] Disable admin routes in controller
   - [ ] Or remove `AdminModule` from `app.module.ts`
   - [ ] Deploy backend rollback

3. **Database Rollback**:
   - [ ] Run migration down: `npm run migration:revert`
   - [ ] Verify data integrity

## Success Criteria

- [ ] Job listing page loads without errors
- [ ] All filters work correctly
- [ ] Statistics display accurately
- [ ] Performance is acceptable (<2s load time)
- [ ] No breaking changes to existing APIs
- [ ] All tests pass
- [ ] Code review approved
- [ ] QA sign-off received

## Notes

- Keep existing `/jobs/search` API untouched
- Follow existing code patterns from `draftJobApiClient.js` and `agencyService.js`
- Use `performanceService` for caching
- Add proper error handling everywhere
- Test thoroughly before deploying

---

**Estimated Total Time**: 4-6 days
**Priority**: High
**Risk Level**: Low (no changes to existing APIs)
