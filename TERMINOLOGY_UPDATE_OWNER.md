# Terminology Update: मालिक → अधिकारि

## Overview
Updated all Nepali translations in owner-related pages to use "अधिकारि" (authority/official) instead of "मालिक" (owner) for better professional terminology.

## Rationale

### Why the Change?

**मालिक (Maalik)** means:
- Owner (in the sense of property owner)
- Master
- Proprietor
- More informal/personal connotation

**अधिकारि (Adhikari)** means:
- Authority
- Official
- Administrator
- More formal/professional connotation

For a professional administrative portal, "अधिकारि" is more appropriate as it conveys:
- Official authority and responsibility
- Professional administrative role
- Formal organizational hierarchy
- Government/institutional context

## Files Modified

### 1. public/translations/ne/pages/owner-layout.json
**Changed:**
- `ownerPortal`: "मालिक पोर्टल" → "अधिकारि पोर्टल"

**Translation:**
- Before: "Owner Portal"
- After: "Authority Portal" / "Official Portal"

### 2. public/translations/ne/pages/owner-auditlog.json
**Changed:**
- `stats.logins`: "मालिक लगइनहरू" → "अधिकारि लगइनहरू"
- `filters.logins`: "मालिक लगइनहरू" → "अधिकारि लगइनहरू"
- `actions.owner_login`: "मालिक लगइन" → "अधिकारि लगइन"

**Translations:**
- Before: "Owner Logins"
- After: "Authority Logins" / "Official Logins"

### 3. public/translations/ne/pages/owner-agencies.json
**Changed:**
- `search.placeholder`: "...मालिकद्वारा..." → "...अधिकारिद्वारा..."
- `table.owner`: "मालिक" → "अधिकारि"
- `detailPanel.overview.owner`: "मालिक जानकारी" → "अधिकारि जानकारी"

**Translations:**
- Before: "Search by owner...", "Owner", "Owner Information"
- After: "Search by authority...", "Authority", "Authority Information"

## Complete List of Changes

| Location | Before (मालिक) | After (अधिकारि) |
|----------|----------------|------------------|
| Owner Layout - Portal Name | मालिक पोर्टल | अधिकारि पोर्टल |
| Audit Log - Stats Card | मालिक लगइनहरू | अधिकारि लगइनहरू |
| Audit Log - Filter Option | मालिक लगइनहरू | अधिकारि लगइनहरू |
| Audit Log - Action Label | मालिक लगइन | अधिकारि लगइन |
| Agencies - Search Placeholder | मालिकद्वारा | अधिकारिद्वारा |
| Agencies - Table Header | मालिक | अधिकारि |
| Agencies - Detail Panel | मालिक जानकारी | अधिकारि जानकारी |

## Impact Areas

### User Interface
1. **Top Navigation Bar**
   - Portal name now shows "अधिकारि पोर्टल"

2. **Audit Log Page**
   - Stats card: "अधिकारि लगइनहरू"
   - Filter dropdown: "अधिकारि लगइनहरू"
   - Log entries: "अधिकारि लगइन"

3. **Agencies Page**
   - Search placeholder: "...अधिकारिद्वारा..."
   - Table column header: "अधिकारि"
   - Detail panel section: "अधिकारि जानकारी"

### Consistency
All owner-related terminology in Nepali is now consistently using "अधिकारि" across:
- Navigation
- Page titles
- Stats cards
- Filters
- Table headers
- Detail panels
- Search placeholders
- Action labels

## User Experience

### Before
```
उडानसारथी
मालिक पोर्टल

Stats: मालिक लगइनहरू
Filter: मालिक लगइनहरू
Search: मालिकद्वारा खोज्नुहोस्
```

### After
```
उडानसारथी
अधिकारि पोर्टल

Stats: अधिकारि लगइनहरू
Filter: अधिकारि लगइनहरू
Search: अधिकारिद्वारा खोज्नुहोस्
```

## Benefits

1. **Professional Tone** - More appropriate for administrative/government context
2. **Formal Language** - Better suited for official portal
3. **Clear Authority** - Emphasizes administrative role and responsibility
4. **Consistency** - Uniform terminology across all owner pages
5. **Cultural Appropriateness** - Better aligned with Nepali administrative terminology

## Testing

### Verification Steps
1. Switch language to Nepali (नेपाली)
2. Navigate to Owner Portal
3. Check top navigation bar - should show "अधिकारि पोर्टल"
4. Go to Audit Log page
5. Check stats cards - should show "अधिकारि लगइनहरू"
6. Open filters - should show "अधिकारि लगइनहरू"
7. Go to Agencies page
8. Check search placeholder - should include "अधिकारिद्वारा"
9. Check table header - should show "अधिकारि"
10. Open agency details - should show "अधिकारि जानकारी"

### Expected Results
✅ All instances of "मालिक" replaced with "अधिकारि"
✅ No translation errors or missing text
✅ Consistent terminology across all pages
✅ Professional and formal tone maintained

## Notes

### English Translations Unchanged
The English translations remain as "Owner" since:
- "Owner" is the standard English term for this role
- English doesn't have the same formal/informal distinction
- "Owner" is clear and universally understood in English

### Context-Specific Usage
The term "अधिकारि" is used specifically for:
- The owner/administrator of the platform
- System-level administrative role
- Not for agency owners (they remain as agency contacts)

## Related Files

- `public/translations/ne/pages/owner-layout.json`
- `public/translations/ne/pages/owner-auditlog.json`
- `public/translations/ne/pages/owner-agencies.json`

## Status

✅ **COMPLETED** - All owner-related Nepali translations updated from "मालिक" to "अधिकारि"

The terminology is now more professional and appropriate for an administrative portal context.
