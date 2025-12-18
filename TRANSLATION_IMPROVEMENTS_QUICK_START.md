# Translation System Improvements - Quick Start Guide

## TL;DR

Current system has 3 problems:
1. **Manual sync** - Developers must copy files manually
2. **No validation** - Broken translations can be deployed
3. **No caching** - Every page load fetches translations

**Solution**: Add 3 scripts (5 + 10 + 15 minutes)

---

## Phase 1: Auto-Sync (5 minutes) ⭐ DO THIS FIRST

### Step 1: Create sync script

Create `scripts/sync-translations.js`:
```javascript
import fs from 'fs-extra';

const srcDir = 'src/translations';
const publicDir = 'public/translations';

fs.copySync(srcDir, publicDir);
console.log('✓ Translations synced: src/ → public/');
```

### Step 2: Update package.json

```json
{
  "scripts": {
    "sync-translations": "node scripts/sync-translations.js",
    "dev": "npm run sync-translations && vite",
    "build": "npm run sync-translations && vite build"
  }
}
```

### Result
- Developers only edit `src/translations/`
- Sync happens automatically when running `npm run dev` or `npm run build`
- No more manual copying

---

## Phase 2: Validation (10 minutes)

### Step 1: Create validation script

Create `scripts/validate-translations.js`:
```javascript
import fs from 'fs';
import path from 'path';

const locales = ['en', 'ne'];
const pages = ['login', 'member-login'];

function validateTranslations() {
  const errors = [];
  
  for (const locale of locales) {
    for (const page of pages) {
      const filePath = `public/translations/${locale}/pages/${page}.json`;
      
      if (!fs.existsSync(filePath)) {
        errors.push(`❌ Missing: ${filePath}`);
        continue;
      }
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        JSON.parse(content);
      } catch (err) {
        errors.push(`❌ Invalid JSON in ${filePath}: ${err.message}`);
      }
    }
  }
  
  if (errors.length > 0) {
    console.error('Translation validation failed:');
    errors.forEach(e => console.error(e));
    process.exit(1);
  }
  
  console.log('✓ All translation files are valid');
}

validateTranslations();
```

### Step 2: Update package.json

```json
{
  "scripts": {
    "validate-translations": "node scripts/validate-translations.js",
    "pre-deploy": "npm run validate-translations && npm run build"
  }
}
```

### Result
- Catches JSON errors before deployment
- Ensures all required translation files exist
- Prevents broken translations from going live

---

## Phase 3: Verification (15 minutes)

### Step 1: Create sync verification script

Create `scripts/verify-translation-sync.js`:
```javascript
import fs from 'fs';
import crypto from 'crypto';

function getFileHash(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return crypto.createHash('md5').update(content).digest('hex');
}

function verifySyncStatus() {
  const locales = ['en', 'ne'];
  const pages = ['login', 'member-login'];
  let outOfSync = [];
  
  for (const locale of locales) {
    for (const page of pages) {
      const srcFile = `src/translations/${locale}/pages/${page}.json`;
      const publicFile = `public/translations/${locale}/pages/${page}.json`;
      
      if (fs.existsSync(srcFile) && fs.existsSync(publicFile)) {
        const srcHash = getFileHash(srcFile);
        const publicHash = getFileHash(publicFile);
        
        if (srcHash !== publicHash) {
          outOfSync.push(`${locale}/${page}`);
        }
      }
    }
  }
  
  if (outOfSync.length > 0) {
    console.warn('⚠️  Out of sync translations:');
    outOfSync.forEach(f => console.warn(`  - ${f}`));
    console.warn('\nRun: npm run sync-translations');
    return false;
  }
  
  console.log('✓ All translations are in sync');
  return true;
}

verifySyncStatus();
```

### Step 2: Update package.json

```json
{
  "scripts": {
    "verify-sync": "node scripts/verify-translation-sync.js"
  }
}
```

### Result
- Developers can verify sync status before committing
- Catches out-of-sync files
- Prevents accidental commits with mismatched translations

---

## Phase 4: Caching (5 minutes) - Optional

### Update vite.config.js

Add caching headers for translation files:

```javascript
export default {
  server: {
    middlewares: [
      {
        path: '/translations',
        handler: (req, res, next) => {
          // Cache translations for 1 hour
          res.setHeader('Cache-Control', 'public, max-age=3600');
          next();
        }
      }
    ]
  }
}
```

### Result
- Translations cached in browser for 1 hour
- Repeat page loads don't fetch translations again
- Faster UX, reduced server load

---

## Usage Examples

### Developer Workflow (After Improvements)

```bash
# Edit translations
nano src/translations/ne/pages/login.json

# Start dev server (auto-syncs)
npm run dev

# Test in browser
# Changes appear immediately ✓

# Before committing, verify sync
npm run verify-sync

# Commit code
git add .
git commit -m "Update Nepali translations"

# Before deploying, validate
npm run pre-deploy

# If validation passes, build succeeds
# If validation fails, build stops with error
```

### Checking Sync Status

```bash
# Check if src/ and public/ are in sync
npm run verify-sync

# Output if in sync:
# ✓ All translations are in sync

# Output if out of sync:
# ⚠️  Out of sync translations:
#   - ne/login
#   - en/member-login
# Run: npm run sync-translations
```

### Pre-Deployment Check

```bash
# Validate before deploying
npm run pre-deploy

# Output if valid:
# ✓ All translation files are valid
# ✓ Translations synced: src/ → public/
# (build output...)

# Output if invalid:
# ❌ Invalid JSON in public/translations/ne/pages/login.json
# Build stops, error shown
```

---

## Files to Create

```
scripts/
├── sync-translations.js          (5 min)
├── validate-translations.js      (10 min)
└── verify-translation-sync.js    (15 min)
```

## Files to Modify

```
package.json                       (2 min)
vite.config.js                     (5 min - optional)
```

---

## Total Implementation Time

| Phase | Task | Time |
|-------|------|------|
| 1 | Auto-sync script | 5 min |
| 2 | Validation script | 10 min |
| 3 | Verification script | 15 min |
| 4 | Caching (optional) | 5 min |
| **Total** | **All improvements** | **~40 min** |

---

## Benefits Summary

### Immediate (Phase 1)
- ✅ No more manual copying
- ✅ Developers only edit `src/translations/`
- ✅ Sync happens automatically

### Short-term (Phase 2)
- ✅ Catch errors before deployment
- ✅ Prevent broken translations going live
- ✅ Automated validation in CI/CD

### Medium-term (Phase 3)
- ✅ Verify sync status before commits
- ✅ Catch out-of-sync files early
- ✅ Better developer experience

### Long-term (Phase 4)
- ✅ Faster page loads (caching)
- ✅ Reduced server load
- ✅ Better user experience

---

## Next Steps

1. **Ready to implement?** Start with Phase 1 (5 minutes)
2. **Want all improvements?** Implement all phases (~40 minutes)
3. **Questions?** Check `TRANSLATION_SYSTEM_IMPROVEMENTS.md` for details

---

## FAQ

**Q: Do I need to implement all phases?**  
A: No. Phase 1 (auto-sync) is the most important. Phases 2-4 are optional but recommended.

**Q: Will this break existing code?**  
A: No. These are additive changes. Existing code continues to work.

**Q: Do I need to install new dependencies?**  
A: Only `fs-extra` for Phase 1. Everything else uses Node.js built-ins.

**Q: Can I implement phases one at a time?**  
A: Yes. Each phase is independent.

**Q: What if I only want Phase 1?**  
A: That's fine. Phase 1 alone eliminates most sync issues.

---

## Implementation Checklist

- [ ] Create `scripts/sync-translations.js`
- [ ] Update `package.json` with sync script
- [ ] Test: `npm run dev` (should sync automatically)
- [ ] Create `scripts/validate-translations.js`
- [ ] Update `package.json` with validation script
- [ ] Test: `npm run validate-translations`
- [ ] Create `scripts/verify-translation-sync.js`
- [ ] Update `package.json` with verify script
- [ ] Test: `npm run verify-sync`
- [ ] Update `vite.config.js` with caching (optional)
- [ ] Commit all changes
- [ ] Update team documentation

---

**Ready to improve your translation system? Start with Phase 1!**
