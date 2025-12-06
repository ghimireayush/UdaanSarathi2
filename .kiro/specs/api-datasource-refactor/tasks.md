# Implementation Plan

- [x] 1. Create HTTP client infrastructure
  - Create `src/api/config/httpClient.js` with centralized HTTP client
  - Implement GET, POST, PATCH, DELETE, and upload methods
  - Implement automatic auth token injection
  - Implement centralized error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.4, 6.1, 6.2, 6.5_

- [ ]* 1.1 Write property test for authentication header inclusion
  - **Property 2: Automatic Authentication Header Inclusion**
  - **Validates: Requirements 2.3, 4.5**

- [ ]* 1.2 Write property test for error transformation
  - **Property 3: Consistent Error Transformation**
  - **Validates: Requirements 2.4, 4.4**

- [ ]* 1.3 Write property test for request body formatting
  - **Property 4: Consistent Request Body Formatting**
  - **Validates: Requirements 4.2**

- [ ]* 1.4 Write unit tests for HTTP client methods
  - Test GET, POST, PATCH, DELETE methods
  - Test header construction
  - Test response parsing
  - Test error handling
  - _Requirements: 2.1, 2.3, 2.4, 4.2, 4.4_

- [x] 2. Create AuthDataSource
  - Create `src/api/datasources/AuthDataSource.js`
  - Migrate authentication endpoints from `authService.js`
  - Implement: registerOwner, verifyOwner, loginStart, loginVerify, loginStartOwner, loginVerifyOwner, memberLoginStart, memberLoginVerify, memberLogin
  - _Requirements: 1.1, 1.3, 2.1, 7.1, 8.1_

- [ ]* 2.1 Write property test for centralized HTTP client usage
  - **Property 1: Centralized HTTP Client Usage**
  - **Validates: Requirements 2.1, 8.1, 8.2**

- [ ]* 2.2 Write unit tests for AuthDataSource methods
  - Test each endpoint method
  - Mock httpClient
  - Verify correct endpoint paths
  - _Requirements: 1.1, 2.1, 7.1_

- [x] 3. Create JobDataSource
  - Create `src/api/datasources/JobDataSource.js`
  - Migrate job endpoints from `adminJobApiClient.js` and `draftJobApiClient.js`
  - Implement: getAdminJobs, getCountryDistribution, getJobStatistics, getDraftJobs, getDraftJobById, createDraftJob, updateDraftJob, deleteDraftJob, validateDraftJob, publishDraftJob
  - _Requirements: 1.1, 1.3, 2.1, 7.2, 8.1_

- [ ]* 3.1 Write unit tests for JobDataSource methods
  - Test each endpoint method
  - Mock httpClient
  - Verify correct endpoint paths
  - _Requirements: 1.1, 2.1, 7.2_

- [x] 4. Create CandidateDataSource
  - Create `src/api/datasources/CandidateDataSource.js`
  - Migrate candidate endpoints from `candidateApiClient.js` and `jobCandidatesApiClient.js`
  - Implement: getCandidateDetails, getJobDetails, getCandidates, getAllCandidates, bulkShortlistCandidates, bulkRejectCandidates, bulkScheduleInterviews
  - _Requirements: 1.1, 1.3, 2.1, 7.3, 8.1_

- [ ]* 4.1 Write property test for parameter serialization
  - **Property 5: Consistent Parameter Serialization**
  - **Validates: Requirements 4.1**

- [ ]* 4.2 Write unit tests for CandidateDataSource methods
  - Test each endpoint method
  - Mock httpClient
  - Verify correct endpoint paths and query parameters
  - _Requirements: 1.1, 2.1, 4.1, 7.3_

- [x] 5. Create InterviewDataSource
  - Create `src/api/datasources/InterviewDataSource.js`
  - Migrate interview endpoints from `interviewApiClient.js`
  - Implement: scheduleInterview, rescheduleInterview, completeInterview, getInterviewsForJob, getInterviewStats, getInterviews, getInterviewsForAgency, getAgencyInterviewStats
  - _Requirements: 1.1, 1.3, 2.1, 7.4, 8.1_

- [ ]* 5.1 Write unit tests for InterviewDataSource methods
  - Test each endpoint method
  - Mock httpClient
  - Verify correct endpoint paths
  - _Requirements: 1.1, 2.1, 7.4_

- [x] 6. Create ApplicationDataSource
  - Create `src/api/datasources/ApplicationDataSource.js`
  - Migrate application endpoints from `applicationApiClient.js`
  - Implement: shortlistApplication, withdrawApplication, getApplicationWithHistory, updateApplicationStatus
  - _Requirements: 1.1, 1.3, 2.1, 8.1_

- [ ]* 6.1 Write unit tests for ApplicationDataSource methods
  - Test each endpoint method
  - Mock httpClient
  - Verify correct endpoint paths
  - _Requirements: 1.1, 2.1_

- [x] 7. Create AgencyDataSource
  - Create `src/api/datasources/AgencyDataSource.js`
  - Migrate agency endpoints from `agencyService.js`
  - Implement: getAgencyProfile, updateLocation, updateBasicInfo, updateContactInfo, updateSocialMedia, updateSettings, uploadLogo, uploadBanner, updateSpecializations, updateTargetCountries, updateServices
  - _Requirements: 1.1, 1.3, 2.1, 8.1_

- [ ]* 7.1 Write unit tests for AgencyDataSource methods
  - Test each endpoint method
  - Mock httpClient
  - Verify correct endpoint paths
  - Test file upload handling
  - _Requirements: 1.1, 2.1_

- [x] 8. Create MemberDataSource
  - Create `src/api/datasources/MemberDataSource.js`
  - Migrate member endpoints from `memberService.js`
  - Implement: inviteMember, getMembersList, deleteMember, updateMemberStatus
  - _Requirements: 1.1, 1.3, 2.1, 8.1_

- [ ]* 8.1 Write unit tests for MemberDataSource methods
  - Test each endpoint method
  - Mock httpClient
  - Verify correct endpoint paths
  - _Requirements: 1.1, 2.1_

- [x] 9. Create DocumentDataSource
  - Create `src/api/datasources/DocumentDataSource.js`
  - Migrate document endpoints from `documentApiClient.js`
  - Implement: getCandidateDocuments
  - _Requirements: 1.1, 1.3, 2.1, 8.1_

- [ ]* 9.1 Write unit tests for DocumentDataSource methods
  - Test each endpoint method
  - Mock httpClient
  - Verify correct endpoint paths
  - _Requirements: 1.1, 2.1_

- [x] 10. Create CountryDataSource
  - Create `src/api/datasources/CountryDataSource.js`
  - Migrate country endpoints from `countryService.js`
  - Implement: getCountries, getCountryNames, findByName, getCurrencyCode
  - _Requirements: 1.1, 1.3, 2.1, 8.1_

- [ ]* 10.1 Write unit tests for CountryDataSource methods
  - Test each endpoint method
  - Mock httpClient
  - Verify correct endpoint paths
  - _Requirements: 1.1, 2.1_

- [x] 11. Create barrel export
  - Create `src/api/index.js` to export all data sources
  - Export httpClient for direct access if needed
  - _Requirements: 1.1, 1.2_

- [x] 12. Update services layer to use new data sources
  - Update `authService.js` to use AuthDataSource
  - Update `jobService.js` to use JobDataSource
  - Update `candidateService.js` to use CandidateDataSource
  - Update `interviewService.js` to use InterviewDataSource
  - Update `applicationService.js` to use ApplicationDataSource
  - Update `agencyService.js` to use AgencyDataSource
  - Update `memberService.js` to use MemberDataSource
  - Update `countryService.js` to use CountryDataSource
  - _Requirements: 1.1, 1.2, 2.1_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 14. Remove old API client implementations
  - Remove direct API calls from service files
  - Keep service files for business logic only
  - Remove `applicationApiClient.js`
  - Remove `interviewApiClient.js`
  - Remove `candidateApiClient.js`
  - Remove `documentApiClient.js`
  - Remove `draftJobApiClient.js`
  - Remove `jobCandidatesApiClient.js`
  - Remove `adminJobApiClient.js`
  - _Requirements: 3.1, 6.1, 6.2_

- [ ]* 14.1 Write example test for single base URL definition
  - Verify "localhost:3000" appears in only one file
  - Verify "API_BASE_URL" defined in only one location
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 14.2 Write example test for no direct HTTP library usage
  - Verify data sources don't contain fetch() calls
  - Verify data sources don't contain axios calls
  - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

- [x] 15. Update NewJobDraft.jsx to use data sources
  - Remove direct axios calls
  - Use JobDataSource and CountryDataSource
  - _Requirements: 2.1, 8.1, 8.2_

- [ ] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Update documentation
  - Add JSDoc comments to all data source methods
  - Create API documentation showing available endpoints
  - Document migration from old to new architecture
  - _Requirements: 5.1, 5.2, 5.5_
