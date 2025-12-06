# Enchantment Table Integration Plan
## Linking Job Portal Audit System with Enchantment Table

**Date:** 2025-11-30  
**Workspace:** UdaanSarathi  
**Server:** http://localhost:8080 (Running ✓)

## Overview

Successfully mapped 24 use case APIs from the Udaan job portal admin panel to the enchantment table particle system. Each API call represents a particle that can be tracked, visualized, and monitored through the enchantment table interface.

## Completed Analysis

### Use Cases Identified: 24 Total

**By School (Magical Category):**
- **Restoration** (2): Authentication & session management
- **Illusion** (5): Data queries & viewing operations  
- **Conjuration** (5): Creation operations (drafts, interviews, members)
- **Alteration** (7): Update & modification operations
- **Destruction** (5): Deletion & rejection operations

**Audit Tracking Status:**
- Currently tracked: 8 use cases
- Missing audit: 16 use cases

### Particles Created in Enchantment Table

Successfully created 5 committed particles in the skyrim domain:

1. **Restoration Candle (topRight)** - "Udaan Portal - 24 Use Cases Mapped" (weight: 24)
2. **Conjuration Candle (bottomLeft)** - "Udaan: Draft Job Creation & Publishing" (weight: 5)
3. **Alteration Candle (midLeft)** - "Udaan: Application & Interview Updates" (weight: 7)
4. **Destruction Candle (bottomRight)** - "Udaan: Bulk Reject & Member Deletion" (weight: 5)
5. **Illusion Candle (midRight)** - "Udaan: Job & Candidate Queries" (weight: 5)

## Implementation Strategy

### Phase 1: Backend Interceptor (Next Step)

Create a use case interceptor on the job portal backend that:

1. **Tag API Controllers** - Use Swagger annotations or custom decorators to mark use case endpoints
2. **Capture API Calls** - Intercept requests to tagged endpoints
3. **Extract Metadata** - Collect:
   - Endpoint path
   - HTTP method
   - Response status
   - Duration
   - User/agent info
   - Timestamp
4. **Send to Enchantment Table** - POST particle updates to http://localhost:8080/particle

### Phase 2: Particle Mapping

Map each API call to a particle:

```json
{
  "domainName": "skyrim",
  "namedPosition": "bottomLeft",  // Based on school
  "title": "Draft Job Created by Agency X",
  "status": "committed",
  "weitage": 1
}
```

**Named Position Mapping:**
- `topLeft` or `topRight` → restoration (auth, audit)
- `midRight` → illusion (queries, views)
- `bottomLeft` → conjuration (create operations)
- `midLeft` → alteration (updates)
- `bottomRight` → destruction (deletes)

### Phase 3: Dynamic Visualization

The enchantment table will:
- Light candles when particles are committed
- Show particle count as candle intensity
- Flicker when attention needed (errors, high frequency)
- Provide real-time dashboard of system activity

## API Endpoint Reference

### Enchantment Table Server Endpoints

**Create Particle:**
```bash
POST http://localhost:8080/particle
Content-Type: application/json

{
  "domainName": "skyrim",
  "namedPosition": "topRight",
  "title": "Use case description",
  "status": "committed",
  "weitage": 1
}
```

**Get Domain State:**
```bash
GET http://localhost:8080/domain/skyrim
```

**Update Particle:**
```bash
PUT http://localhost:8080/particle
Content-Type: application/json

{
  "domainName": "skyrim",
  "particleId": "particle_id_here",
  "title": "Updated title",
  "status": "committed",
  "school": "restoration",
  "weitage": 5
}
```

**Delete Particle:**
```bash
DELETE http://localhost:8080/particle
Content-Type: application/json

{
  "domainName": "skyrim",
  "particleId": "particle_id_here"
}
```

## Use Case Categories

### Restoration (Authentication & Audit)
- `uc_auth_login` - User Login ✓ Audited
- `uc_auth_logout` - User Logout ✓ Audited

### Illusion (Queries & Views)
- `uc_job_list_admin` - Get Admin Job Listings
- `uc_job_country_stats` - Get Country Distribution
- `uc_candidate_details` - Get Candidate Details
- `uc_job_candidates` - Get Job Candidates
- `uc_member_list` - Get Team Members

### Conjuration (Creation)
- `uc_draft_create` - Create Draft Job
- `uc_draft_publish` - Publish Draft Job ✓ Audited
- `uc_interview_schedule` - Schedule Interview ✓ Audited
- `uc_bulk_schedule_interview` - Bulk Schedule Interviews ✓ Audited
- `uc_member_invite` - Invite Team Member ✓ Audited

### Alteration (Updates)
- `uc_draft_update` - Update Draft Job
- `uc_app_shortlist` - Shortlist Application ✓ Audited
- `uc_bulk_shortlist` - Bulk Shortlist Candidates
- `uc_interview_reschedule` - Reschedule Interview
- `uc_interview_complete` - Complete Interview
- `uc_member_status_update` - Update Member Status

### Destruction (Deletion)
- `uc_draft_delete` - Delete Draft Job
- `uc_app_withdraw` - Withdraw/Reject Application ✓ Audited
- `uc_bulk_reject` - Bulk Reject Candidates
- `uc_member_delete` - Delete Team Member

## Next Steps

1. **Backend Implementation:**
   - Create interceptor middleware
   - Tag use case endpoints
   - Implement particle creation logic
   - Add error handling

2. **Audit Enhancement:**
   - Add audit logging to 16 missing use cases
   - Ensure consistent audit data structure
   - Link audit logs to particles

3. **Testing:**
   - Test interceptor with sample API calls
   - Verify particle creation in enchantment table
   - Monitor candle lighting behavior

4. **Visualization:**
   - Open enchantment table UI
   - Watch candles light up with activity
   - Configure flicker rules for alerts

## Evidence File

Complete analysis with code snippets: `use-case-analysis.json`

## Server Status

✓ Enchantment table server running on port 8080  
✓ Domain "skyrim" active with 5 candles  
✓ Particles successfully created and committed  
✓ Ready for backend integration
