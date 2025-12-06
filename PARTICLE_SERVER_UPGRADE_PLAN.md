# Particle Server Upgrade Plan
## Enhanced Particle Model for Use Case Tracking

**Version:** 2.0  
**Date:** 2025-11-30  
**Target Server:** /Volumes/shared_code/skyrim/server

---

## Problem Statement

The current particle model is too simplistic for tracking real-world use cases from code domains. It only captures:
- `title` (String)
- `status` (String)
- `school` (String?)
- `weitage` (int?)

**What's Missing:**
- Evidence tracking (file paths, line numbers, code snippets)
- API endpoint metadata (method, path, parameters)
- Temporal data (timestamps, duration, frequency)
- Agent/user context (who triggered the use case)
- Response metadata (status codes, error messages)
- Relationships (parent particles, dependencies)

## Current Model Limitations

```dart
class ParticleEssence {
  final String title;
  final String status;
  final String? school;
  final int? weitage;
}
```

**Issues:**
1. No way to store evidence (code snippets, file locations)
2. No metadata for API calls (endpoint, method, response)
3. No temporal tracking (when, how often)
4. No agent/user attribution
5. No structured data for filtering/querying
6. Cannot represent relationships between particles

## Proposed Upgrade: ParticleEssence v2

### Enhanced Model Structure

```dart
@JsonSerializable()
class ParticleEssence {
  // Core fields (existing)
  final String title;
  final String status; // 'committed', 'uncommitted', 'flickering', 'archived'
  final String? school;
  final int? weitage;
  
  // NEW: Evidence tracking
  final Evidence? evidence;
  
  // NEW: API metadata
  final ApiMetadata? apiMetadata;
  
  // NEW: Temporal data
  final TemporalData? temporal;
  
  // NEW: Agent context
  final AgentContext? agent;
  
  // NEW: Relationships
  final List<String>? relatedParticleIds;
  final String? parentParticleId;
  
  // NEW: Custom metadata (flexible JSON)
  final Map<String, dynamic>? metadata;
  
  ParticleEssence({
    required this.title,
    required this.status,
    this.school,
    this.weitage,
    this.evidence,
    this.apiMetadata,
    this.temporal,
    this.agent,
    this.relatedParticleIds,
    this.parentParticleId,
    this.metadata,
  });
}
```

### Supporting Models

#### 1. Evidence Model
```dart
@JsonSerializable()
class Evidence {
  final String? filePath;           // e.g., "src/services/memberService.js"
  final LineRange? lineRange;       // Start and end line numbers
  final String? codeSnippet;        // Actual code excerpt
  final String? description;        // Human-readable description
  final String? commitHash;         // Git commit reference
  final DateTime? capturedAt;       // When evidence was captured
  
  Evidence({
    this.filePath,
    this.lineRange,
    this.codeSnippet,
    this.description,
    this.commitHash,
    this.capturedAt,
  });
}

@JsonSerializable()
class LineRange {
  final int start;
  final int end;
  
  LineRange({required this.start, required this.end});
}
```

#### 2. API Metadata Model
```dart
@JsonSerializable()
class ApiMetadata {
  final String? endpoint;           // e.g., "/agencies/owner/members/invite"
  final String? method;             // GET, POST, PUT, DELETE, PATCH
  final int? statusCode;            // HTTP response code
  final int? durationMs;            // Request duration in milliseconds
  final Map<String, dynamic>? requestParams;
  final Map<String, dynamic>? responseData;
  final String? errorMessage;       // If request failed
  
  ApiMetadata({
    this.endpoint,
    this.method,
    this.statusCode,
    this.durationMs,
    this.requestParams,
    this.responseData,
    this.errorMessage,
  });
}
```

#### 3. Temporal Data Model
```dart
@JsonSerializable()
class TemporalData {
  final DateTime createdAt;
  final DateTime? updatedAt;
  final DateTime? lastTriggeredAt;  // Last time use case was executed
  final int triggerCount;           // How many times triggered
  final Duration? averageDuration;  // Average execution time
  final List<DateTime>? triggerHistory; // Recent trigger timestamps
  
  TemporalData({
    required this.createdAt,
    this.updatedAt,
    this.lastTriggeredAt,
    this.triggerCount = 0,
    this.averageDuration,
    this.triggerHistory,
  });
}
```

#### 4. Agent Context Model
```dart
@JsonSerializable()
class AgentContext {
  final String? agentId;            // User/agent identifier
  final String? agentName;          // Human-readable name
  final String? agentRole;          // Role (owner, admin, staff)
  final String? sessionId;          // Session identifier
  final String? ipAddress;          // Request origin
  final String? userAgent;          // Browser/client info
  
  AgentContext({
    this.agentId,
    this.agentName,
    this.agentRole,
    this.sessionId,
    this.ipAddress,
    this.userAgent,
  });
}
```

## API Endpoint Upgrades

### 1. Enhanced Create Particle

**Current:**
```json
POST /particle
{
  "domainName": "skyrim",
  "namedPosition": "topRight",
  "title": "Use case title",
  "status": "committed",
  "weitage": 1
}
```

**Upgraded:**
```json
POST /particle
{
  "domainName": "skyrim",
  "namedPosition": "topRight",
  "title": "Member Invite Use Case",
  "status": "committed",
  "weitage": 1,
  "evidence": {
    "filePath": "src/services/memberService.js",
    "lineRange": {"start": 70, "end": 150},
    "codeSnippet": "export const inviteMember = async (memberData) => {...}",
    "description": "inviteMember with audit logging"
  },
  "apiMetadata": {
    "endpoint": "/agencies/owner/members/invite",
    "method": "POST",
    "statusCode": 201,
    "durationMs": 245
  },
  "temporal": {
    "createdAt": "2025-11-30T10:00:00Z",
    "triggerCount": 1
  },
  "agent": {
    "agentId": "agency_001",
    "agentName": "Test Agency",
    "agentRole": "owner"
  },
  "metadata": {
    "auditTracked": true,
    "category": "team_management"
  }
}
```

### 2. New Query Endpoints

#### Query by Evidence
```
GET /particles/by-file?filePath=src/services/memberService.js
GET /particles/by-file?filePath=src/services/memberService.js&lineStart=70&lineEnd=150
```

#### Query by API Endpoint
```
GET /particles/by-api?endpoint=/agencies/owner/members/invite
GET /particles/by-api?method=POST&statusCode=201
```

#### Query by Agent
```
GET /particles/by-agent?agentId=agency_001
GET /particles/by-agent?agentRole=owner
```

#### Query by Temporal
```
GET /particles/recent?hours=24
GET /particles/frequent?minTriggers=10
GET /particles/slow?minDurationMs=1000
```

### 3. Particle Update with Increment

```
POST /particle/trigger
{
  "domainName": "skyrim",
  "particleId": "particle_xyz",
  "apiMetadata": {
    "statusCode": 200,
    "durationMs": 180
  },
  "agent": {
    "agentId": "agency_002"
  }
}
```

This endpoint:
- Increments `triggerCount`
- Updates `lastTriggeredAt`
- Adds to `triggerHistory`
- Recalculates `averageDuration`
- Auto-flickers candle if frequency is high

### 4. Bulk Particle Creation

```
POST /particles/bulk
{
  "domainName": "skyrim",
  "particles": [
    { /* particle 1 */ },
    { /* particle 2 */ },
    { /* particle 3 */ }
  ]
}
```

## Migration Strategy

### Phase 1: Backward Compatible Addition
1. Add new fields as optional to `ParticleEssence`
2. Existing particles continue to work
3. New particles can use enhanced fields
4. No breaking changes to existing API

### Phase 2: New Endpoints
1. Add query endpoints for filtering
2. Add trigger endpoint for incrementing
3. Add bulk creation endpoint
4. Keep existing endpoints unchanged

### Phase 3: Data Migration
1. Script to migrate existing particles
2. Add default values for new fields
3. Preserve all existing data
4. Optional: enrich with historical data

### Phase 4: Deprecation (Optional)
1. Mark old simple creation as deprecated
2. Encourage use of enhanced model
3. Provide migration guide
4. Eventually remove old endpoints (v3.0)

## Implementation Checklist

### Backend Changes

**Models (lib/models.dart):**
- [ ] Create `Evidence` class
- [ ] Create `LineRange` class
- [ ] Create `ApiMetadata` class
- [ ] Create `TemporalData` class
- [ ] Create `AgentContext` class
- [ ] Update `ParticleEssence` with new fields
- [ ] Add JSON serialization for all new models
- [ ] Run code generation: `dart run build_runner build`

**Server Logic (lib/server.dart):**
- [ ] Update `createParticle` to handle new fields
- [ ] Add `POST /particle/trigger` endpoint
- [ ] Add `POST /particles/bulk` endpoint
- [ ] Add `GET /particles/by-file` endpoint
- [ ] Add `GET /particles/by-api` endpoint
- [ ] Add `GET /particles/by-agent` endpoint
- [ ] Add `GET /particles/recent` endpoint
- [ ] Add `GET /particles/frequent` endpoint
- [ ] Update snapshot save/load for new fields

**Data Layer (lib/memories_data.dart):**
- [ ] Update particle creation logic
- [ ] Add query methods for new filters
- [ ] Add trigger increment logic
- [ ] Add bulk creation logic
- [ ] Update candle flicker logic based on frequency

### Testing
- [ ] Test backward compatibility
- [ ] Test new field serialization
- [ ] Test query endpoints
- [ ] Test trigger increment
- [ ] Test bulk creation
- [ ] Test snapshot persistence
- [ ] Load test with 1000+ particles

### Documentation
- [ ] Update API documentation
- [ ] Create migration guide
- [ ] Add usage examples
- [ ] Document query patterns
- [ ] Update client integration guide

## Benefits

1. **Rich Context:** Full evidence trail for each use case
2. **API Tracking:** Complete API call metadata
3. **Temporal Analysis:** Understand usage patterns over time
4. **Agent Attribution:** Know who triggered what
5. **Queryability:** Filter and search particles effectively
6. **Relationships:** Link related particles together
7. **Flexibility:** Custom metadata for domain-specific needs
8. **Auto-Flickering:** Candles flicker based on frequency/errors
9. **Audit Trail:** Complete history of particle triggers
10. **Performance Insights:** Track slow API calls

## Example Use Cases

### 1. Track API Call from Job Portal
```dart
// When member invite API is called
POST /particle/trigger
{
  "domainName": "skyrim",
  "particleId": "particle_member_invite",
  "apiMetadata": {
    "endpoint": "/agencies/owner/members/invite",
    "method": "POST",
    "statusCode": 201,
    "durationMs": 245,
    "requestParams": {"role": "staff"}
  },
  "agent": {
    "agentId": "agency_001",
    "agentName": "Test Agency",
    "agentRole": "owner"
  }
}
```

### 2. Find All Particles for a File
```bash
GET /particles/by-file?filePath=src/services/memberService.js
```

Returns all particles with evidence pointing to that file.

### 3. Monitor Slow API Calls
```bash
GET /particles/slow?minDurationMs=1000
```

Returns particles where average API duration > 1 second.

### 4. Track High-Frequency Use Cases
```bash
GET /particles/frequent?minTriggers=100
```

Returns particles triggered more than 100 times.

## Timeline

- **Week 1:** Model design and implementation
- **Week 2:** New endpoints and query logic
- **Week 3:** Testing and bug fixes
- **Week 4:** Documentation and migration guide
- **Week 5:** Deploy and monitor

## Backward Compatibility

All existing particles will continue to work. New fields are optional. Existing API endpoints remain unchanged. This is a **non-breaking upgrade**.

## Next Steps

1. Review and approve this upgrade plan
2. Create feature branch: `feature/particle-v2`
3. Implement model changes
4. Add new endpoints
5. Test thoroughly
6. Update documentation
7. Deploy to production
8. Update job portal interceptor to use new fields

---

**Status:** Proposed  
**Requires Approval:** Yes  
**Breaking Changes:** No  
**Estimated Effort:** 2-3 weeks
