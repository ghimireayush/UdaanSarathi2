# Backend Action Plan - Phase 2 Implementation

**Date**: 2025-11-29  
**Status**: 🔴 **ACTION REQUIRED**  
**Frontend Status**: ✅ Phase 1 Complete - Waiting for Backend

---

## Executive Summary

The frontend team has successfully completed Phase 1 integration. Backend must now implement 3 critical features to unblock Phase 2.

**What Frontend Completed**:
- ✅ Replaced all mock services with real API calls
- ✅ Integrated application history display
- ✅ Implemented document view-only
- ✅ All existing endpoints working

**What Backend Must Do Now**:
1. Add interview duration field (2-3 hours)
2. Implement bulk interview scheduling (4-6 hours)
3. Create unified candidate detail endpoint (6 hours)

**Total Effort**: 16-19 hours (2-3 days)  
**Deadline**: This week

---

## 🔴 Priority 1: Interview Duration Field

**Effort**: 2-3 hours  
**Blocks**: Interview scheduling UI

### Implementation Steps

**1. Database Migration**
```sql
ALTER TABLE interviews ADD COLUMN duration_minutes INTEGER DEFAULT 60;
```

**2. Update Interview Entity** (`src/modules/domain/interview.entity.ts`)
```typescript
@Column({ type: 'integer', default: 60 })
duration_minutes: number;
```

**3. Update Schedule Endpoint** (`src/modules/application/application.controller.ts`)
- Add `duration_minutes?: number` to request body
- Pass to service layer

**4. Update Reschedule Endpoint**
- Add `duration_minutes?: number` to request body
- Pass to service layer

**5. Update InterviewService** (`src/modules/domain/domain.service.ts`)
- Accept `duration_minutes` in `createInterview()`
- Accept `duration_minutes` in `updateInterview()`
- Default to 60 if not provided

---

## 🔴 Priority 2: Bulk Interview Scheduling

**Effort**: 4-6 hours  
**Blocks**: Batch interview scheduling UI

### Implementation Steps

**1. Create DTO** (`src/modules/agency/dto/job-candidates.dto.ts`)
```typescript
export class BulkScheduleInterviewDto {
  candidate_ids: string[];
  interview_date_ad: string;
  interview_time: string;
  duration_minutes?: number;
  location: string;
  contact_person: string;
  required_documents?: string[];
  notes?: string;
}
```

**2. Add Endpoint** (`src/modules/agency/job-candidates.controller.ts`)
```typescript
@Post(':jobId/candidates/bulk-schedule-interview')
async bulkScheduleInterview(
  @Param('license') license: string,
  @Param('jobId') jobId: string,
  @Body() body: BulkScheduleInterviewDto
): Promise<BulkActionResponseDto>
```

**3. Implementation Logic**
- Loop through candidate_ids
- Find application for each candidate
- Validate status is 'shortlisted'
- Call scheduleInterview() for each
- Track successes and failures
- Return detailed result

---

## 🔴 Priority 3: Unified Candidate Detail Endpoint

**Effort**: 6 hours  
**Blocks**: Candidate detail sidebar

### Implementation Steps

**1. Create Response DTO** (`src/modules/agency/dto/candidate-full-details.dto.ts`)
```typescript
export class CandidateFullDetailsDto {
  candidate: CandidateBasicInfoDto;
  job_profile?: any;
  job_context: JobContextDto;
  application: ApplicationDetailDto;
  interview?: InterviewDetailDto;
  documents: { uploaded: any[]; summary: any };
}
```

**2. Add Endpoint** (`src/modules/agency/job-candidates.controller.ts`)
```typescript
@Get(':jobId/candidates/:candidateId/details')
async getCandidateFullDetails(
  @Param('license') license: string,
  @Param('jobId') jobId: string,
  @Param('candidateId') candidateId: string
): Promise<CandidateFullDetailsDto>
```

**3. Implementation Logic**
- Verify agency owns job
- Fetch candidate basic info
- Fetch job profile (most recent)
- Fetch application with history
- Fetch interview details
- Fetch documents
- Get job context
- Combine and return

---

## Implementation Checklist

### Day 1-2: Interview Duration
- [ ] Create database migration
- [ ] Update Interview entity
- [ ] Update schedule endpoint
- [ ] Update reschedule endpoint
- [ ] Update InterviewService
- [ ] Test endpoints

### Day 2-3: Bulk Scheduling
- [ ] Create DTO
- [ ] Add endpoint
- [ ] Implement logic
- [ ] Add error handling
- [ ] Test with multiple candidates

### Day 3-4: Unified Endpoint
- [ ] Create response DTO
- [ ] Add endpoint
- [ ] Fetch and combine data
- [ ] Test response structure

### Day 5: Testing & Docs
- [ ] Integration testing
- [ ] Update Swagger docs
- [ ] Notify frontend team

---

## Success Criteria

Phase 2 complete when:
1. ✅ Duration field working
2. ✅ Bulk scheduling working
3. ✅ Unified endpoint working
4. ✅ All tested
5. ✅ Docs updated
6. ✅ Frontend notified

---

## Next Steps

1. ✅ Read this document
2. ✅ Confirm timeline
3. 🔧 Start implementation
4. 📢 Notify frontend when ready
5. 🧪 Test together

**Let's get this done!** 🚀
