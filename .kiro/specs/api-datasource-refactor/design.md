# Design Document

## Overview

This design establishes a clean architecture for API data sources in the frontend application. The current implementation has 11 scattered API client files with duplicate base URL definitions, mixed mock/real implementations, and inconsistent HTTP client usage (both fetch and axios). 

The refactored architecture will:
- Consolidate all API calls into domain-specific data sources
- Create a single HTTP client configuration
- Separate mock data from real implementations
- Provide consistent error handling and request/response patterns
- Use the repository pattern for clean separation of concerns

## Architecture

### Layer Structure

```
src/
├── api/
│   ├── config/
│   │   └── httpClient.js          # Centralized HTTP client
│   ├── datasources/
│   │   ├── AuthDataSource.js      # Authentication APIs
│   │   ├── JobDataSource.js       # Job posting APIs
│   │   ├── CandidateDataSource.js # Candidate APIs
│   │   ├── InterviewDataSource.js # Interview APIs
│   │   ├── ApplicationDataSource.js # Application workflow APIs
│   │   ├── AgencyDataSource.js    # Agency profile APIs
│   │   ├── MemberDataSource.js    # Team member APIs
│   │   ├── DocumentDataSource.js  # Document APIs
│   │   └── CountryDataSource.js   # Country/reference data APIs
│   └── index.js                   # Barrel export
├── services/                      # Business logic layer (uses datasources)
└── mocks/                         # Mock implementations (dev only)
```

### Current State Analysis

**Existing API Clients:**
1. `authService.js` - 8 endpoints (register, login, OTP flows)
2. `applicationApiClient.js` - 4 endpoints (shortlist, withdraw, status updates)
3. `interviewApiClient.js` - 7 endpoints (schedule, reschedule, complete, stats)
4. `candidateApiClient.js` - 1 endpoint (candidate details)
5. `documentApiClient.js` - 1 endpoint (get documents)
6. `draftJobApiClient.js` - 6 endpoints (CRUD for draft jobs)
7. `jobCandidatesApiClient.js` - 5 endpoints (job details, candidates, bulk actions)
8. `adminJobApiClient.js` - 3 endpoints (admin job listings, stats)
9. `agencyService.js` - 10 endpoints (profile, settings, uploads)
10. `memberService.js` - 4 endpoints (invite, list, delete, status)
11. `countryService.js` - 1 endpoint (countries list)

**Issues Identified:**
- 11 separate `API_BASE_URL` definitions
- Mixed use of `fetch` and `axios`
- Mock data mixed with real implementations in same files
- Inconsistent error handling patterns
- No centralized request/response interceptors
- Duplicate token retrieval logic

## Components and Interfaces

### HTTP Client Configuration

**File:** `src/api/config/httpClient.js`

```javascript
/**
 * Centralized HTTP client configuration
 * Handles base URL, authentication, and common request/response patterns
 */
class HttpClient {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
  }

  /**
   * Get auth token from localStorage
   * @returns {string|null}
   */
  getAuthToken() {
    return localStorage.getItem('udaan_token')
  }

  /**
   * Build request headers
   * @param {Object} customHeaders
   * @returns {Object}
   */
  buildHeaders(customHeaders = {}) {
    const token = this.getAuthToken()
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...customHeaders
    }
  }

  /**
   * Handle API response
   * @param {Response} response
   * @returns {Promise<any>}
   */
  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
        status: response.status
      }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }
    return response.json()
  }

  /**
   * GET request
   * @param {string} endpoint
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async get(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.buildHeaders(options.headers),
      ...options
    })
    return this.handleResponse(response)
  }

  /**
   * POST request
   * @param {string} endpoint
   * @param {Object} data
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async post(endpoint, data, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.buildHeaders(options.headers),
      body: JSON.stringify(data),
      ...options
    })
    return this.handleResponse(response)
  }

  /**
   * PATCH request
   * @param {string} endpoint
   * @param {Object} data
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async patch(endpoint, data, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.buildHeaders(options.headers),
      body: JSON.stringify(data),
      ...options
    })
    return this.handleResponse(response)
  }

  /**
   * DELETE request
   * @param {string} endpoint
   * @param {Object} options
   * @returns {Promise<any>}
   */
  async delete(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.buildHeaders(options.headers),
      ...options
    })
    return this.handleResponse(response)
  }

  /**
   * Upload file (multipart/form-data)
   * @param {string} endpoint
   * @param {FormData} formData
   * @returns {Promise<any>}
   */
  async upload(endpoint, formData) {
    const token = this.getAuthToken()
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
        // Don't set Content-Type for FormData - browser sets it with boundary
      },
      body: formData
    })
    return this.handleResponse(response)
  }
}

export default new HttpClient()
```

### Data Source Pattern

Each data source follows this pattern:

```javascript
import httpClient from '../config/httpClient'

/**
 * [Domain] Data Source
 * Handles all API calls related to [domain]
 */
class [Domain]DataSource {
  /**
   * [Operation description]
   * @param {Type} param - Parameter description
   * @returns {Promise<Type>} Response description
   */
  async operation(param) {
    return httpClient.get(`/endpoint/${param}`)
  }
}

export default new [Domain]DataSource()
```

## Data Models

### API Response Envelope

All data sources return raw API responses. Services layer handles transformation.

```javascript
// Success response
{
  data: any,          // Response payload
  status: number,     // HTTP status
  message?: string    // Optional message
}

// Error response (thrown as Error)
{
  message: string,    // Error message
  status: number,     // HTTP status
  errors?: Object     // Validation errors
}
```

### Domain Models

Each data source handles its domain-specific models:

**Auth Domain:**
- User, Token, OTP, Registration, Login

**Job Domain:**
- Job, DraftJob, JobDetails, JobStatistics

**Candidate Domain:**
- Candidate, CandidateProfile, Application

**Interview Domain:**
- Interview, InterviewSchedule, InterviewStats

**Application Domain:**
- Application, ApplicationHistory, WorkflowStage

**Agency Domain:**
- Agency, AgencyProfile, AgencySettings

**Member Domain:**
- Member, MemberInvite, MemberRole

**Document Domain:**
- Document, DocumentSlot

**Country Domain:**
- Country, Currency

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Centralized HTTP Client Usage

*For any* data source file, all API calls should use the centralized httpClient instance and not directly call fetch or axios.
**Validates: Requirements 2.1, 8.1, 8.2**

### Property 2: Automatic Authentication Header Inclusion

*For any* authenticated API call, the Authorization header should be automatically included when a token is present in localStorage.
**Validates: Requirements 2.3, 4.5**

### Property 3: Consistent Error Transformation

*For any* API error response, the error should be transformed into a consistent error format with message and status properties.
**Validates: Requirements 2.4, 4.4**

### Property 4: Consistent Request Body Formatting

*For any* POST or PATCH request, the request body should be JSON-formatted and include the Content-Type: application/json header.
**Validates: Requirements 4.2**

### Property 5: Consistent Parameter Serialization

*For any* GET request with query parameters, the parameters should be serialized using URLSearchParams for consistent formatting.
**Validates: Requirements 4.1**

### Example Tests

The following are specific examples that should be verified:

**Example 1: Single Base URL Definition**
Verify that "localhost:3000" or "API_BASE_URL" appears in only one configuration file.
**Validates: Requirements 6.1, 6.2**

**Example 2: Centralized Response Handling**
Verify that all data source methods use httpClient's response handler rather than custom parsing.
**Validates: Requirements 4.3**

**Example 3: Environment Variable Configuration**
Verify that the httpClient reads the base URL from VITE_API_BASE_URL environment variable.
**Validates: Requirements 2.5, 6.5**

**Example 4: No Direct HTTP Library Usage**
Verify that data source files do not contain direct calls to fetch() or axios.get/post/etc.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

**Example 5: Shared Configuration Import**
Verify that all data sources import httpClient from the shared configuration.
**Validates: Requirements 6.3**



## Error Handling

### Error Response Format

All errors from the HTTP client will be thrown as Error objects with additional properties:

```javascript
class ApiError extends Error {
  constructor(message, status, errors = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}
```

### Error Handling Strategy

1. **Network Errors**: Caught and wrapped with user-friendly messages
2. **HTTP Errors (4xx, 5xx)**: Parsed from response body and thrown as ApiError
3. **Validation Errors**: Included in the errors property of ApiError
4. **Authentication Errors (401)**: Special handling to trigger logout/redirect
5. **Service Layer**: Catches ApiError and transforms for UI consumption

### Retry Logic

The HTTP client will not implement automatic retries. Services layer can implement retry logic for specific operations if needed.

## Testing Strategy

### Unit Testing

**HTTP Client Tests:**
- Test request method builders (GET, POST, PATCH, DELETE)
- Test header construction with and without auth tokens
- Test response parsing for success and error cases
- Test error transformation
- Test file upload handling

**Data Source Tests:**
- Test each endpoint method calls httpClient correctly
- Test parameter passing and URL construction
- Mock httpClient to verify correct endpoint paths
- Test error propagation from httpClient

### Property-Based Testing

We will use **fast-check** for JavaScript property-based testing.

**Property Tests:**

1. **Centralized HTTP Client Usage Property**
   - Generate random data source files
   - Verify no direct fetch/axios calls exist
   - Verify all use httpClient import

2. **Authentication Header Property**
   - Generate random API calls with/without tokens
   - Verify Authorization header presence matches token availability
   - Verify header format is always "Bearer {token}"

3. **Error Transformation Property**
   - Generate random error responses (various status codes)
   - Verify all errors are transformed to consistent format
   - Verify error message and status are always present

4. **Request Body Formatting Property**
   - Generate random POST/PATCH payloads
   - Verify all bodies are JSON-stringified
   - Verify Content-Type header is always application/json

5. **Parameter Serialization Property**
   - Generate random query parameter objects
   - Verify all are serialized using URLSearchParams
   - Verify special characters are properly encoded

### Integration Testing

**End-to-End Data Source Tests:**
- Test actual API calls against a test backend
- Verify request/response flow through entire stack
- Test authentication flow
- Test error scenarios

### Example Tests

**Example 1: Single Base URL Definition**
```javascript
test('base URL defined in only one location', () => {
  const files = getAllSourceFiles()
  const matches = files.filter(file => 
    file.content.includes('localhost:3000') || 
    file.content.includes('API_BASE_URL =')
  )
  expect(matches).toHaveLength(1)
  expect(matches[0].path).toBe('src/api/config/httpClient.js')
})
```

**Example 2: No Direct HTTP Library Usage**
```javascript
test('data sources do not use fetch or axios directly', () => {
  const dataSourceFiles = getDataSourceFiles()
  dataSourceFiles.forEach(file => {
    expect(file.content).not.toMatch(/fetch\(/)
    expect(file.content).not.toMatch(/axios\.(get|post|patch|delete)/)
  })
})
```

## Migration Strategy

### Phase 1: Create Infrastructure
1. Create `src/api/config/httpClient.js`
2. Create `src/api/datasources/` directory
3. Set up testing infrastructure

### Phase 2: Migrate Data Sources (One Domain at a Time)
1. Create new data source file
2. Move endpoints from old service
3. Update imports in services layer
4. Test thoroughly
5. Remove old implementation

### Phase 3: Clean Up
1. Remove old API client files
2. Remove duplicate base URL definitions
3. Remove axios dependency if no longer needed
4. Update documentation

### Backward Compatibility

During migration, both old and new implementations will coexist. Services layer will be updated to use new data sources one at a time. No breaking changes to component layer.

## Performance Considerations

### Caching Strategy

The HTTP client will not implement caching. Caching remains the responsibility of the services layer using existing `performanceService`.

### Request Deduplication

Not implemented in initial version. Can be added later if needed.

### Bundle Size

- Removing axios (if fully replaced by fetch) will reduce bundle size by ~13KB
- New architecture adds minimal overhead (~2KB for httpClient)

## Security Considerations

### Token Storage

Tokens remain in localStorage. HTTP client reads from there. Future enhancement could move to httpOnly cookies.

### CSRF Protection

Not implemented in initial version. Backend should handle CSRF tokens if needed.

### XSS Protection

All request/response data is handled as JSON. No HTML rendering in data layer.

## Documentation Requirements

Each data source must include:
- JSDoc comments for all methods
- Parameter types and descriptions
- Return type documentation
- Example usage
- Error cases

## Deployment Considerations

### Environment Variables

Required environment variable:
- `VITE_API_BASE_URL`: API base URL (defaults to http://localhost:3000)

### Build Configuration

No special build configuration needed. Vite handles environment variables automatically.

### Monitoring

Services layer should log API errors for monitoring. Data sources remain pure and don't include logging.
