# New Job Draft Module - Verification Checklist

## Pre-Deployment Checklist

### ✅ Backend API Verification

#### 1. Countries API
- [ ] Endpoint exists: `GET /countries`
- [ ] Returns proper format: `{ data: [{ name, code }, ...] }`
- [ ] Accessible with bearer token
- [ ] Test command:
  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" \
       http://localhost:3000/countries
  ```

#### 2. Job Titles API (NEW - May Need Implementation)
- [ ] Endpoint exists: `GET /job-titles`
- [ ] Returns proper format: `{ data: [{ id, title }, ...] }`
- [ ] Accessible with bearer token
- [ ] Test command:
  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" \
       http://localhost:3000/job-titles
  ```
- [ ] **If missing**: Implement this endpoint on backend

#### 3. Job Posting Creation API
- [ ] Endpoint exists: `POST /agencies/:license/job-postings`
- [ ] Accepts the payload structure (see IMPLEMENTATION_SUMMARY.md)
- [ ] Returns created job posting with ID
- [ ] Test command:
  ```bash
  curl -X POST \
       -H "Authorization: Bearer YOUR_TOKEN" \
       -H "Content-Type: application/json" \
       -d '{"posting_title":"Test","country":"UAE",...}' \
       http://localhost:3000/agencies/YOUR_LICENSE/job-postings
  ```

### ✅ Frontend Setup

#### 1. Environment Variables
- [ ] `.env` file exists
- [ ] `VITE_API_BASE_URL` is set correctly
- [ ] Example:
  ```env
  VITE_API_BASE_URL=http://localhost:3000
  ```

#### 2. Dependencies
- [ ] All npm packages installed: `npm install`
- [ ] No dependency errors
- [ ] React Router is working
- [ ] Axios is installed

#### 3. Files Verification
- [ ] `src/pages/NewJobDraft.jsx` exists
- [ ] `src/App.jsx` has new route
- [ ] `src/config/roleBasedAccess.js` updated
- [ ] No syntax errors (run `npm run build` to check)

### ✅ Authentication & Authorization

#### 1. LocalStorage
- [ ] User token is stored: `localStorage.getItem('token')`
- [ ] Agency license is stored: `localStorage.getItem('agency_license')`
- [ ] Token is valid and not expired

#### 2. User Roles
- [ ] Owner can access `/new-job-draft`
- [ ] Admin can access `/new-job-draft`
- [ ] Manager can access `/new-job-draft`
- [ ] Other roles cannot access (should redirect)

### ✅ Functional Testing

#### 1. Navigation
- [ ] "New Job Draft" appears in sidebar
- [ ] Clicking navigates to `/new-job-draft`
- [ ] Page loads without errors
- [ ] Progress bar displays correctly

#### 2. Step 1: Basic Information
- [ ] All fields render correctly
- [ ] Country dropdown populates from API
- [ ] Date pickers work
- [ ] Announcement type dropdown works
- [ ] Validation prevents empty fields
- [ ] "Next" button works

#### 3. Step 2: Employer Information
- [ ] All fields render correctly
- [ ] Country dropdown populates
- [ ] Validation works
- [ ] "Previous" and "Next" buttons work

#### 4. Step 3: Contract Details
- [ ] All fields render correctly
- [ ] Number inputs accept valid ranges
- [ ] Dropdowns work (renewable, overtime, food, etc.)
- [ ] Validation works
- [ ] Navigation buttons work

#### 5. Step 4: Positions
- [ ] Job titles dropdown populates from API
- [ ] "Add Position" button works
- [ ] Can add multiple positions
- [ ] "Remove" button works (when > 1 position)
- [ ] Vacancies accept numbers
- [ ] Salary and currency fields work
- [ ] Validation ensures at least one position
- [ ] Navigation buttons work

#### 6. Step 5: Requirements
- [ ] Skills dropdown populates
- [ ] Can add multiple skills
- [ ] Can remove skills
- [ ] Education buttons toggle correctly
- [ ] Experience fields work
- [ ] Validation works
- [ ] Navigation buttons work

#### 7. Step 6: Expenses
- [ ] All expense type buttons render
- [ ] Clicking expense type shows details area
- [ ] "Previous" button works
- [ ] "Save Draft" button works
- [ ] "Publish" button works

#### 8. Save Draft Functionality
- [ ] "Save Draft" button is always visible
- [ ] Clicking shows loading state
- [ ] API call is made correctly
- [ ] Success message displays
- [ ] Redirects to `/drafts` after 1.5 seconds
- [ ] Draft appears in drafts list

#### 9. Publish Functionality
- [ ] "Publish" button only on last step
- [ ] Validates all steps before publishing
- [ ] Shows error if steps incomplete
- [ ] API call is made correctly
- [ ] Success message displays
- [ ] Redirects to `/jobs` after 1.5 seconds
- [ ] Job appears in jobs list

#### 10. Error Handling
- [ ] API errors display properly
- [ ] Validation errors are clear
- [ ] Network errors are caught
- [ ] User can retry after error

### ✅ UI/UX Testing

#### 1. Responsive Design
- [ ] Works on desktop (1920x1080)
- [ ] Works on laptop (1366x768)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] No horizontal scrolling
- [ ] Buttons are touch-friendly

#### 2. Dark Mode
- [ ] Toggle dark mode works
- [ ] All text is readable
- [ ] Proper contrast ratios
- [ ] Form fields visible
- [ ] Buttons styled correctly

#### 3. Accessibility
- [ ] Can navigate with keyboard
- [ ] Tab order is logical
- [ ] Form labels are present
- [ ] Error messages are clear
- [ ] Focus indicators visible

#### 4. Visual Polish
- [ ] Progress bar updates correctly
- [ ] Completed steps show checkmarks
- [ ] Active step is highlighted
- [ ] Loading spinners work
- [ ] Transitions are smooth
- [ ] No layout shifts

### ✅ Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

### ✅ Performance

- [ ] Page loads quickly (< 2 seconds)
- [ ] No console errors
- [ ] No console warnings
- [ ] API calls are efficient
- [ ] No memory leaks
- [ ] Smooth animations

### ✅ Data Validation

#### Test Case 1: Minimum Valid Job
- [ ] Fill only required fields
- [ ] Should save successfully
- [ ] Should publish successfully

#### Test Case 2: Complete Job with All Fields
- [ ] Fill all fields including optional
- [ ] Add multiple positions
- [ ] Add multiple skills
- [ ] Should save successfully
- [ ] Should publish successfully

#### Test Case 3: Invalid Data
- [ ] Try to skip steps with empty fields
- [ ] Should show validation errors
- [ ] Should not allow progression

#### Test Case 4: API Payload
- [ ] Check network tab in browser
- [ ] Verify payload structure matches test file
- [ ] Verify all fields are included
- [ ] Verify data types are correct

### ✅ Integration Testing

#### 1. End-to-End Flow
- [ ] Log in as owner
- [ ] Navigate to New Job Draft
- [ ] Complete all 6 steps
- [ ] Save as draft
- [ ] Verify draft in `/drafts`
- [ ] Edit draft (if supported)
- [ ] Publish draft
- [ ] Verify job in `/jobs`

#### 2. Role-Based Access
- [ ] Test with owner role
- [ ] Test with admin role
- [ ] Test with manager role
- [ ] Test with staff role (should not access)
- [ ] Test with recruiter role (should not access)

### ✅ Documentation

- [ ] README updated (if needed)
- [ ] API documentation updated
- [ ] User guide available
- [ ] Technical documentation complete
- [ ] Troubleshooting guide available

## Quick Test Script

Run this in your browser console after loading the page:

```javascript
// Check if required data is available
console.log('Token:', localStorage.getItem('token') ? '✅' : '❌');
console.log('License:', localStorage.getItem('agency_license') ? '✅' : '❌');
console.log('API URL:', import.meta.env.VITE_API_BASE_URL || 'Not set ❌');

// Check if component loaded
console.log('Component:', document.querySelector('[class*="NewJobDraft"]') ? '✅' : '❌');

// Check if progress bar exists
console.log('Progress Bar:', document.querySelectorAll('[class*="rounded-full"]').length > 0 ? '✅' : '❌');
```

## Common Issues & Solutions

### Issue: Countries dropdown is empty
**Solution**: 
1. Check if `/countries` API is accessible
2. Verify token in localStorage
3. Check browser console for errors
4. Verify API response format

### Issue: Job titles dropdown is empty
**Solution**:
1. Implement `/job-titles` endpoint if missing
2. Verify endpoint returns correct format
3. Check token authentication

### Issue: Save/Publish fails
**Solution**:
1. Check payload structure in network tab
2. Verify agency license in localStorage
3. Check backend API logs
4. Verify all required fields are filled

### Issue: Navigation not updated
**Solution**:
1. Clear browser cache
2. Restart dev server
3. Check `roleBasedAccess.js` changes
4. Verify user role has access

## Sign-Off

### Developer
- [ ] All code written and tested
- [ ] No syntax errors
- [ ] Documentation complete
- [ ] Ready for review

### QA
- [ ] All test cases passed
- [ ] No critical bugs
- [ ] UI/UX approved
- [ ] Ready for staging

### Product Owner
- [ ] Meets requirements
- [ ] User experience approved
- [ ] Ready for production

## Deployment Steps

1. [ ] Merge code to main branch
2. [ ] Run production build: `npm run build`
3. [ ] Deploy to staging environment
4. [ ] Run smoke tests on staging
5. [ ] Deploy to production
6. [ ] Monitor for errors
7. [ ] Notify users of new feature

## Post-Deployment

- [ ] Monitor error logs
- [ ] Check analytics for usage
- [ ] Gather user feedback
- [ ] Plan improvements
- [ ] Update documentation as needed

---

**Date**: _______________
**Tested By**: _______________
**Approved By**: _______________
