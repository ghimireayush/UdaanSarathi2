# Manual Test Guide - Admin Job API

## 🚀 Quick Manual Test (5 Minutes)

Since the backend is running in Docker and the frontend uses the browser's native `fetch`, the easiest way to test is to just open the frontend and use the browser's developer tools.

### Step 1: Start the Frontend

```bash
cd portal/agency_research/code/admin_panel/UdaanSarathi2
npm run dev
```

### Step 2: Open the Jobs Page

Open in browser: `http://localhost:5173/jobs`

### Step 3: Open Browser DevTools

Press `F12` or right-click → Inspect

Go to the **Console** tab

### Step 4: Test the API Client Directly in Console

Paste this code in the browser console:

```javascript
// Test 1: Get all jobs
fetch('http://localhost:3000/admin/jobs')
  .then(r => r.json())
  .then(data => {
    console.log('✓ Test 1 PASSED: Get all jobs');
    console.log(`  Found ${data.total} jobs`);
    console.log('  Sample job:', data.data[0]);
  })
  .catch(e => console.error('✗ Test 1 FAILED:', e.message));

// Test 2: Search for "cook"
fetch('http://localhost:3000/admin/jobs?search=cook')
  .then(r => r.json())
  .then(data => {
    console.log('✓ Test 2 PASSED: Search for cook');
    console.log(`  Found ${data.total} jobs`);
  })
  .catch(e => console.error('✗ Test 2 FAILED:', e.message));

// Test 3: Filter by country
fetch('http://localhost:3000/admin/jobs?country=UAE')
  .then(r => r.json())
  .then(data => {
    console.log('✓ Test 3 PASSED: Filter by UAE');
    console.log(`  Found ${data.total} UAE jobs`);
  })
  .catch(e => console.error('✗ Test 3 FAILED:', e.message));

// Test 4: Get country distribution
fetch('http://localhost:3000/admin/jobs/statistics/countries')
  .then(r => r.json())
  .then(data => {
    console.log('✓ Test 4 PASSED: Country distribution');
    console.log('  Countries:', Object.keys(data));
    console.log('  Distribution:', data);
  })
  .catch(e => console.error('✗ Test 4 FAILED:', e.message));
```

### Step 5: Test the UI

**Test Search**:
1. Type "cook" in the search box
2. ✅ Should show only cook-related jobs
3. Check Network tab: Should see `GET /admin/jobs?search=cook`

**Test Country Filter (Dropdown)**:
1. Select "UAE" from the country dropdown
2. ✅ Should show only UAE jobs
3. Check Network tab: Should see `GET /admin/jobs?country=UAE`

**Test Country Filter (Row)**:
1. Click "UAE (15)" button in the country distribution section
2. ✅ Should show only UAE jobs
3. ✅ Dropdown should also show "UAE" selected

**Test Sort Options**:
1. Select "Applications" from sort dropdown
2. ✅ Jobs with most applications should appear first
3. Check Network tab: Should see `GET /admin/jobs?sort_by=applications`

**Test Statistics**:
1. Look at the "Application Status" column
2. ✅ Should show real numbers (not all zeros)
3. ✅ Applications count, shortlisted count, interviews today

---

## 📊 Expected Results

### Network Tab Should Show:

```
GET http://localhost:3000/admin/jobs?search=&country=All%20Countries&sort_by=published_date&order=desc&page=1&limit=1000
Status: 200 OK
Response: {"data": [...], "total": 42, "page": 1, "limit": 1000}

GET http://localhost:3000/admin/jobs/statistics/countries
Status: 200 OK
Response: {"UAE": 15, "Qatar": 8, ...}
```

### Console Should Show:

```
✓ Test 1 PASSED: Get all jobs
  Found 42 jobs
  Sample job: {id: "...", title: "Cook", ...}

✓ Test 2 PASSED: Search for cook
  Found 5 jobs

✓ Test 3 PASSED: Filter by UAE
  Found 15 UAE jobs

✓ Test 4 PASSED: Country distribution
  Countries: ["UAE", "Qatar", "Saudi Arabia", "Kuwait", "Oman"]
  Distribution: {UAE: 15, Qatar: 8, ...}
```

### UI Should Show:

- ✅ Jobs load without errors
- ✅ Search filter works
- ✅ Country dropdown shows only countries with jobs
- ✅ Country distribution row shows job counts
- ✅ Sort options work
- ✅ Statistics show real numbers
- ✅ Pagination works

---

## 🐛 Troubleshooting

### Issue: "Failed to fetch"

**Check**:
1. Is backend running? `docker ps`
2. Is backend on port 3000? `curl http://localhost:3000/admin/jobs`
3. CORS enabled? Check backend logs

**Fix**:
```bash
# Restart backend
docker restart <backend-container>
```

### Issue: Empty job list

**Check**:
```bash
# Check if jobs exist in database
curl http://localhost:3000/admin/jobs | jq '.total'
```

**Fix**:
```bash
# Seed some jobs
curl -X POST http://localhost:3000/jobs/seedv1
```

### Issue: Statistics show 0

**Cause**: No applications in database

**This is OK**: If there are no applications yet, statistics will be 0. The API is working correctly.

---

## ✅ Success Checklist

- [ ] Frontend loads at `http://localhost:5173/jobs`
- [ ] No console errors
- [ ] Network tab shows API calls to `/admin/jobs`
- [ ] Jobs display in the table
- [ ] Search filter works
- [ ] Country dropdown shows countries
- [ ] Country distribution row shows counts
- [ ] Clicking country button filters jobs
- [ ] Sort dropdown works
- [ ] Statistics display (even if 0)
- [ ] Pagination controls appear

---

## 🎯 Quick Verification Commands

Run these in your terminal to verify backend is working:

```bash
# Test 1: Backend is responding
curl -s http://localhost:3000/admin/jobs | jq '.total'

# Test 2: Search works
curl -s "http://localhost:3000/admin/jobs?search=cook" | jq '.total'

# Test 3: Country filter works
curl -s "http://localhost:3000/admin/jobs?country=UAE" | jq '.total'

# Test 4: Country distribution works
curl -s http://localhost:3000/admin/jobs/statistics/countries | jq '.'

# Test 5: Sort works
curl -s "http://localhost:3000/admin/jobs?sort_by=applications" | jq '.data[0].applications_count'
```

All commands should return valid JSON without errors.

---

## 📸 Screenshot Checklist

Take screenshots of:
1. Jobs page loaded with data
2. Network tab showing successful API calls
3. Console with no errors
4. Search filter in action
5. Country filter in action
6. Statistics displaying

---

**Last Updated**: 2025-11-26
