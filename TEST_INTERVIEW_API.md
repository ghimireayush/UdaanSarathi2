# Test Interview API - Curl Commands

**Agency License**: REG-2025-793487  
**Date**: November 30, 2025

---

## Prerequisites

1. **Backend must be running**: `http://localhost:3000`
2. **You need a valid job ID**: Get from jobs list first
3. **You need an auth token**: Get from login

---

## Step 1: Get Auth Token

```bash
# Login to get token
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# Response will include: { "token": "your-token-here" }
# Save this token for subsequent requests
```

---

## Step 2: Get Jobs List

```bash
# Replace YOUR_TOKEN with actual token from Step 1
curl -X GET "http://localhost:3000/agencies/REG-2025-793487/jobs" \
  -H "Authorization: Bearer YOUR_TOKEN"

# This will return list of jobs with their IDs
# Pick a job_id from the response
```

---

## Step 3: Test Interview Endpoints

### Get All Scheduled Interviews

```bash
curl -X GET "http://localhost:3000/agencies/REG-2025-793487/jobs/YOUR_JOB_ID/candidates?stage=interview_scheduled&interview_filter=all" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | python3 -m json.tool
```

### Get Today's Interviews

```bash
curl -X GET "http://localhost:3000/agencies/REG-2025-793487/jobs/YOUR_JOB_ID/candidates?stage=interview_scheduled&interview_filter=today" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | python3 -m json.tool
```

### Get Tomorrow's Interviews

```bash
curl -X GET "http://localhost:3000/agencies/REG-2025-793487/jobs/YOUR_JOB_ID/candidates?stage=interview_scheduled&interview_filter=tomorrow" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | python3 -m json.tool
```

### Get Unattended Interviews

```bash
curl -X GET "http://localhost:3000/agencies/REG-2025-793487/jobs/YOUR_JOB_ID/candidates?stage=interview_scheduled&interview_filter=unattended" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | python3 -m json.tool
```

### Get Interview Statistics

```bash
curl -X GET "http://localhost:3000/agencies/REG-2025-793487/jobs/YOUR_JOB_ID/interview-stats?date_range=all" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  | python3 -m json.tool
```

---

## Expected Response Format

### Candidates with Interview Data

```json
{
  "candidates": [
    {
      "id": "candidate-uuid",
      "name": "John Doe",
      "phone": "+977-9841234567",
      "email": "john@example.com",
      "application_id": "app-uuid",
      "stage": "interview_scheduled",
      "interview": {
        "id": "interview-uuid",
        "scheduled_at": "2025-12-15T14:00:00.000Z",
        "duration": 60,
        "status": "scheduled",
        "result": null,
        "type": "In-person",
        "interviewer": "Ahmed",
        "interviewer_email": "ahmed@example.com",
        "location": "Office - Room A",
        "notes": "",
        "rescheduled_at": null,
        "completed_at": null,
        "cancelled_at": null,
        "required_documents": ["cv", "passport"]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### Interview Statistics

```json
{
  "total_scheduled": 45,
  "today": 5,
  "tomorrow": 3,
  "unattended": 2,
  "completed": 30,
  "passed": 22,
  "failed": 8,
  "cancelled": 3
}
```

---

## Troubleshooting

### Issue: 404 Not Found

**Possible Causes**:
1. Backend not running
2. Wrong base URL (check if it's `/api/` prefix or not)
3. Wrong endpoint path

**Solutions**:
```bash
# Check if backend is running
curl http://localhost:3000/health

# Try with /api prefix
curl http://localhost:3000/api/agencies/REG-2025-793487/jobs

# Check backend logs for actual endpoint paths
```

### Issue: 401 Unauthorized

**Cause**: Invalid or expired token

**Solution**:
```bash
# Get a fresh token
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email", "password": "your-password"}'
```

### Issue: Empty Response

**Possible Causes**:
1. No interviews scheduled for this job
2. No candidates in `interview_scheduled` stage
3. Filter returning no results

**Solutions**:
```bash
# Check if there are any candidates at all
curl -X GET "http://localhost:3000/agencies/REG-2025-793487/jobs/YOUR_JOB_ID/candidates" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check different stages
curl -X GET "http://localhost:3000/agencies/REG-2025-793487/jobs/YOUR_JOB_ID/candidates?stage=shortlisted" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Frontend Debugging

### Check Browser Console

Open browser DevTools (F12) and check:

1. **Network Tab**: Look for API calls to `/agencies/.../jobs/.../candidates`
2. **Console Tab**: Look for error messages
3. **Check Request Headers**: Verify Authorization token is present
4. **Check Response**: See what data is actually returned

### Add Console Logging

The frontend now has console logging:

```javascript
// In loadInterviewsWithFilter()
console.log('Loading interviews with filter:', filter)
console.log('Agency license:', agencyLicense)
console.log('Job ID:', selectedJob)
console.log('Response:', response)
```

### Check localStorage

```javascript
// In browser console
localStorage.getItem('token')  // Should return your auth token
```

---

## Common Issues

### 1. No Data Showing in UI

**Checklist**:
- [ ] Backend is running
- [ ] Job is selected in dropdown
- [ ] Auth token is valid
- [ ] API returns data (check Network tab)
- [ ] Response has `candidates` array
- [ ] Candidates have `interview` object

### 2. Loading Forever

**Checklist**:
- [ ] Check browser console for errors
- [ ] Check Network tab for failed requests
- [ ] Verify `isLoading` state is being set to false
- [ ] Check if `selectedJob` is set

### 3. Filters Not Working

**Checklist**:
- [ ] Check if `interview_filter` parameter is in URL
- [ ] Verify backend supports the filter
- [ ] Check if data is being returned
- [ ] Verify filter buttons trigger API call

---

## Quick Test Script

Save this as `test-interview-api.sh`:

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:3000"
LICENSE="REG-2025-793487"
TOKEN="YOUR_TOKEN_HERE"
JOB_ID="YOUR_JOB_ID_HERE"

echo "Testing Interview API..."
echo "======================="

echo "\n1. Testing ALL interviews:"
curl -s -X GET "${BASE_URL}/agencies/${LICENSE}/jobs/${JOB_ID}/candidates?stage=interview_scheduled&interview_filter=all" \
  -H "Authorization: Bearer ${TOKEN}" \
  | python3 -m json.tool | head -50

echo "\n2. Testing TODAY's interviews:"
curl -s -X GET "${BASE_URL}/agencies/${LICENSE}/jobs/${JOB_ID}/candidates?stage=interview_scheduled&interview_filter=today" \
  -H "Authorization: Bearer ${TOKEN}" \
  | python3 -m json.tool | head -50

echo "\n3. Testing STATISTICS:"
curl -s -X GET "${BASE_URL}/agencies/${LICENSE}/jobs/${JOB_ID}/interview-stats?date_range=all" \
  -H "Authorization: Bearer ${TOKEN}" \
  | python3 -m json.tool

echo "\nDone!"
```

Run with:
```bash
chmod +x test-interview-api.sh
./test-interview-api.sh
```

---

## Next Steps

1. **Get your auth token** from localStorage or login
2. **Get a job ID** from the jobs dropdown
3. **Run the curl commands** above with your token and job ID
4. **Check the response** - does it have interview data?
5. **If no data**: Check if there are actually interviews scheduled in the database
6. **If errors**: Check backend logs for details

---

**Document Version**: 1.0  
**Date**: November 30, 2025  
**Status**: Ready for Testing
