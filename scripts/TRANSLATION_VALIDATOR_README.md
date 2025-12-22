# Translation Validator Script

A comprehensive validation tool that ensures consistency across all 4 translation file locations in UdaanSarathi2.

## What It Validates

The validator checks:

1. **src/translations/ consistency** - English and Nepali keys match
2. **public/translations/ consistency** - English and Nepali keys match
3. **src/ vs public/ sync** - Both directories have identical keys
4. **Empty values** - No translation strings are empty

## File Locations Checked

```
src/translations/
├── en/common.json
└── ne/common.json

public/translations/
├── en/common/
└── ne/common/
```

## Usage

### Basic Usage
```bash
node scripts/validate-translations.js
```

### With Custom Base Directory
```bash
node scripts/validate-translations.js /path/to/UdaanSarathi2
```

### From npm scripts
Add to `package.json`:
```json
{
  "scripts": {
    "validate:translations": "node scripts/validate-translations.js"
  }
}
```

Then run:
```bash
npm run validate:translations
```

## Output

The script provides colored output with:

- ✓ Green checkmarks for passing validations
- ✗ Red X marks for errors
- ⚠ Yellow warnings for inconsistencies
- ℹ Blue info messages for details

### Example Output

```
🔍 Translation Validator
ℹ Base directory: /path/to/UdaanSarathi2

Validating src/translations/
ℹ English keys: 245
ℹ Nepali keys: 245
✓ src/translations: Keys match between EN and NE

Validating public/translations/
ℹ English files: common.json
ℹ Nepali files: common.json
✓ public/translations: Keys match between EN and NE

Validating src/ vs public/
ℹ src/translations/en keys: 245
ℹ public/translations/en keys: 245
✓ src/ and public/ translations are in sync

Checking for empty values
✓ No empty translation values found

📊 Summary
ℹ Total errors: 0
ℹ Total warnings: 0

✅ All validations passed!
```

## Exit Codes

- `0` - All validations passed
- `1` - Validation failed (errors or warnings present)

## Common Issues & Fixes

### Issue: "File not found: src/translations/en/common.json"
**Fix:** Ensure you're running from the UdaanSarathi2 root directory or provide the correct base path.

### Issue: "Missing keys found in Nepali"
**Fix:** Add the missing keys to `src/translations/ne/common.json` to match English.

### Issue: "public/translations: File names don't match"
**Fix:** Ensure both `public/translations/en/` and `public/translations/ne/` have identical file names.

### Issue: "Empty value at key"
**Fix:** Find and fill in the empty translation string in the specified file.

## Integration with CI/CD

Add to your CI pipeline to catch translation issues before deployment:

```yaml
# Example GitHub Actions
- name: Validate Translations
  run: npm run validate:translations
```

## How It Works

1. **Loads all translation files** from both src/ and public/ directories
2. **Extracts all keys** recursively (handles nested objects)
3. **Compares key sets** between English and Nepali
4. **Checks for empty values** in translation strings
5. **Reports mismatches** with specific key names
6. **Returns appropriate exit code** for CI/CD integration

## Key Features

- ✅ Recursive key extraction (handles nested translations)
- ✅ Detailed mismatch reporting
- ✅ Color-coded output for easy reading
- ✅ CI/CD friendly exit codes
- ✅ Supports custom base directories
- ✅ Fast execution
- ✅ No external dependencies (uses only Node.js built-ins)

## Maintenance

When adding new translations:

1. Add keys to `src/translations/en/common.json`
2. Add corresponding keys to `src/translations/ne/common.json`
3. Run the validator to ensure consistency
4. Build/deploy to update public/ files

```bash
npm run validate:translations
```

## Related Files

- `src/translations/en/common.json` - English source translations
- `src/translations/ne/common.json` - Nepali source translations
- `public/translations/en/common/` - Built English translations
- `public/translations/ne/common/` - Built Nepali translations
