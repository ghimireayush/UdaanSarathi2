# Udaan Sarathi Workspace Setup

**Date:** 2025-11-30  
**Status:** Partial - Using skyrim domain for now

## Issue Encountered

When creating a new domain `udaan-sarathi` via the `/initializeDomain` endpoint, it creates an empty domain with no candles. The server's `initializeDomain` method only creates:

```dart
final newDomain = Domain(
  name: workspaceName,
  notes: [],
  candles: CandleVariant(light: [], dark: []),  // Empty!
  sigilStoneConcepts: [],
);
```

This means particles cannot be added because there are no candles (schools) to attach them to.

## Workaround

For now, we're using the existing **skyrim** domain to track Udaan Sarathi use cases. The particles have been successfully created:

1. **Restoration Candle (topRight)** - "Udaan Portal - 24 Use Cases Mapped" (weight: 24)
2. **Conjuration Candle (bottomLeft)** - "Udaan: Draft Job Creation & Publishing" (weight: 5)
3. **Alteration Candle (midLeft)** - "Udaan: Application & Interview Updates" (weight: 7)
4. **Destruction Candle (bottomRight)** - "Udaan: Bulk Reject & Member Deletion" (weight: 5)
5. **Illusion Candle (midRight)** - "Udaan: Job & Candidate Queries" (weight: 5)

## Recommended Server Upgrade

Add to the upgrade plan: **Enhanced Domain Initialization**

The `/initializeDomain` endpoint should accept optional parameters to initialize candles:

```dart
POST /initializeDomain
{
  "workspaceName": "udaan-sarathi",
  "notes": ["Job Portal", "Recruitment Platform"],
  "initializeCandles": true,  // NEW: Auto-create standard 6 candles
  "candleTheme": "light"      // NEW: Which theme to initialize
}
```

Or provide a separate endpoint:

```dart
POST /domain/<name>/initializeCandles
{
  "theme": "light",  // or "dark"
  "positions": ["topLeft", "topRight", "midLeft", "midRight", "bottomLeft", "bottomRight"]
}
```

This would create the standard 6-candle layout automatically.

## Current Server State

```bash
# Check domains
curl http://localhost:8080/workspaces

# Check skyrim domain (has Udaan particles)
curl http://localhost:8080/domain/skyrim

# Check udaan-sarathi domain (empty, no candles)
curl http://localhost:8080/domain/udaan-sarathi
```

## Next Steps

1. **Option A:** Continue using skyrim domain for Udaan tracking
   - Pros: Works immediately
   - Cons: Mixed project particles in one domain

2. **Option B:** Upgrade server to support candle initialization
   - Pros: Clean separation of projects
   - Cons: Requires server code changes

3. **Option C:** Manually edit snapshot file while server is stopped
   - Pros: No code changes needed
   - Cons: Manual process, error-prone

## Recommendation

Proceed with **Option A** for now (use skyrim domain) and add candle initialization to the **PARTICLE_SERVER_UPGRADE_PLAN.md** as a Phase 1 feature.

The particles are working correctly and can track use cases. The domain separation is a nice-to-have but not critical for the MVP.

## Files Created

- `use-case-analysis.json` - Complete 24 API use case mapping
- `ENCHANTMENT_TABLE_INTEGRATION_PLAN.md` - Integration strategy
- `PARTICLE_SERVER_UPGRADE_PLAN.md` - Server enhancement proposal
- `particle-v2-example.json` - Enhanced particle model examples
- `UDAAN_WORKSPACE_SETUP.md` - This file

## Server Running

✓ Port: 8080  
✓ Domains: 4 (skyrim, nexus, arcanum, udaan-sarathi)  
✓ Udaan particles: 5 (in skyrim domain)  
✓ Ready for backend interceptor implementation
