# Job Portal Enchantment Table - Ready for Integration

**Date:** 2025-11-30  
**Status:** ✅ READY  
**Server:** http://0.0.0.0:8080

---

## Domain Created: "Job Portal"

Successfully created and populated the Job Portal domain in the enchantment table with 6 committed particles representing the 24 use case categories.

### Particles Created

| Candle | School | Position | Particle Title | Weight | Status |
|--------|--------|----------|----------------|--------|--------|
| 🕯️ Top Left | Restoration | topLeft | Auth: User Login & Logout | 2 | ✅ Committed |
| 🕯️ Top Right | Restoration | topRight | Audit: System Activity Tracking | 8 | ✅ Committed |
| 🕯️ Mid Left | Alteration | midLeft | Update: Applications & Interviews | 7 | ✅ Committed |
| 🕯️ Mid Right | Illusion | midRight | Query: Job Listings & Candidate Details | 5 | ✅ Committed |
| 🕯️ Bottom Left | Conjuration | bottomLeft | Create: Draft Jobs & Member Invites | 5 | ✅ Committed |
| 🕯️ Bottom Right | Destruction | bottomRight | Delete: Bulk Reject & Member Removal | 5 | ✅ Committed |

**Total Weight:** 32 (representing 24 individual use cases)

### Particle IDs

```
particle_Job Portal_restoration_1764480384746_137   (Auth)
particle_Job Portal_restoration_1764480386467_291   (Audit)
particle_Job Portal_alteration_1764480390437_113    (Update)
particle_Job Portal_illusion_1764480387717_479      (Query)
particle_Job Portal_conjuration_1764480389059_657   (Create)
particle_Job Portal_destruction_1764480391806_609   (Delete)
```

## Use Case Mapping

### 🕯️ Restoration (Authentication & Audit) - 10 use cases
- `uc_auth_login` - User Login ✓ Audited
- `uc_auth_logout` - User Logout ✓ Audited
- Plus 8 audit tracking use cases

### 🕯️ Illusion (Queries & Views) - 5 use cases
- `uc_job_list_admin` - Get Admin Job Listings
- `uc_job_country_stats` - Get Country Distribution
- `uc_candidate_details` - Get Candidate Details
- `uc_job_candidates` - Get Job Candidates
- `uc_member_list` - Get Team Members

### 🕯️ Conjuration (Creation) - 5 use cases
- `uc_draft_create` - Create Draft Job
- `uc_draft_publish` - Publish Draft Job ✓ Audited
- `uc_interview_schedule` - Schedule Interview ✓ Audited
- `uc_bulk_schedule_interview` - Bulk Schedule Interviews ✓ Audited
- `uc_member_invite` - Invite Team Member ✓ Audited

### 🕯️ Alteration (Updates) - 7 use cases
- `uc_draft_update` - Update Draft Job
- `uc_app_shortlist` - Shortlist Application ✓ Audited
- `uc_bulk_shortlist` - Bulk Shortlist Candidates
- `uc_interview_reschedule` - Reschedule Interview
- `uc_interview_complete` - Complete Interview
- `uc_member_status_update` - Update Member Status
- Plus 1 more

### 🕯️ Destruction (Deletion) - 5 use cases
- `uc_draft_delete` - Delete Draft Job
- `uc_app_withdraw` - Withdraw/Reject Application ✓ Audited
- `uc_bulk_reject` - Bulk Reject Candidates
- `uc_member_delete` - Delete Team Member
- Plus 1 more

## API Endpoints Available

### Query Domain
```bash
curl http://0.0.0.0:8080/domains | jq '.[] | select(.name=="Job Portal")'
```

### Add New Particle
```bash
curl -X POST http://0.0.0.0:8080/particle \
  -H "Content-Type: application/json" \
  -d '{
    "domainName": "Job Portal",
    "namedPosition": "bottomLeft",
    "title": "New Use Case",
    "status": "committed",
    "weitage": 1
  }'
```

### Update Particle
```bash
curl -X PUT http://0.0.0.0:8080/particle \
  -H "Content-Type: application/json" \
  -d '{
    "domainName": "Job Portal",
    "particleId": "particle_Job Portal_conjuration_1764480389059_657",
    "title": "Updated Title",
    "status": "committed",
    "school": "conjuration",
    "weitage": 10
  }'
```

### Delete Particle
```bash
curl -X DELETE http://0.0.0.0:8080/particle \
  -H "Content-Type: application/json" \
  -d '{
    "domainName": "Job Portal",
    "particleId": "particle_id_here"
  }'
```

## Next Steps: Backend Interceptor

### 1. Create Interceptor Middleware

Add to your backend (Node.js/Express example):

```javascript
// middleware/enchantmentTableInterceptor.js
const axios = require('axios');

const ENCHANTMENT_TABLE_URL = 'http://0.0.0.0:8080';
const DOMAIN_NAME = 'Job Portal';

// Map routes to candle positions
const ROUTE_TO_CANDLE = {
  '/auth/login': 'topLeft',
  '/auth/logout': 'topLeft',
  '/admin/jobs': 'midRight',
  '/agencies/:license/draft-jobs': 'bottomLeft',
  '/applications/:id/shortlist': 'midLeft',
  '/applications/:id/withdraw': 'bottomRight',
  // ... add all 24 routes
};

async function trackUseCase(req, res, next) {
  const startTime = Date.now();
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Send to enchantment table (async, don't block response)
    sendToEnchantmentTable({
      route: req.route.path,
      method: req.method,
      statusCode: res.statusCode,
      duration,
      user: req.user,
    }).catch(err => console.error('Enchantment table error:', err));
    
    originalSend.call(this, data);
  };
  
  next();
}

async function sendToEnchantmentTable(data) {
  const namedPosition = ROUTE_TO_CANDLE[data.route];
  if (!namedPosition) return; // Not a tracked use case
  
  await axios.post(`${ENCHANTMENT_TABLE_URL}/particle`, {
    domainName: DOMAIN_NAME,
    namedPosition,
    title: `${data.method} ${data.route} - ${data.statusCode}`,
    status: data.statusCode < 400 ? 'committed' : 'uncommitted',
    weitage: 1
  });
}

module.exports = { trackUseCase };
```

### 2. Apply Middleware

```javascript
// server.js
const { trackUseCase } = require('./middleware/enchantmentTableInterceptor');

// Apply to all routes
app.use(trackUseCase);

// Or apply to specific routes
app.post('/agencies/:license/draft-jobs', trackUseCase, draftJobController.create);
```

### 3. Test Integration

```bash
# Make an API call to your backend
curl -X POST http://localhost:3000/agencies/ABC123/draft-jobs \
  -H "Authorization: Bearer token" \
  -d '{"title": "Test Job"}'

# Check enchantment table
curl http://0.0.0.0:8080/domains | jq '.[] | select(.name=="Job Portal")'
```

## Visualization

Open the enchantment table UI to see:
- 🕯️ Candles lighting up as APIs are called
- 🔥 Candles flickering when errors occur
- 📊 Particle counts showing usage frequency
- ⚡ Real-time activity tracking

## Files Reference

- `use-case-analysis.json` - Complete 24 API mapping with evidence
- `ENCHANTMENT_TABLE_INTEGRATION_PLAN.md` - Full integration strategy
- `PARTICLE_SERVER_UPGRADE_PLAN.md` - Enhanced particle model proposal
- `particle-v2-example.json` - Enhanced particle examples
- `JOB_PORTAL_ENCHANTMENT_TABLE_READY.md` - This file

## Server Status

✅ Server running on port 8080  
✅ Domain "Job Portal" created  
✅ 6 candles initialized  
✅ 6 particles committed  
✅ Ready for backend integration  
✅ Ready for real-time tracking

---

**The enchantment table is now ready to receive use case events from your job portal backend!**
