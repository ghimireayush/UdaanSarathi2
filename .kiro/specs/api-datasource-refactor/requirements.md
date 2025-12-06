# Requirements Document

## Introduction

The frontend codebase currently has fragmented API client implementations scattered across multiple service files, each independently defining base URLs and making HTTP calls. This creates maintenance challenges, increases cognitive load, and makes it difficult to distinguish between real API calls and legacy mock data implementations. This refactor will consolidate API calls into clean architecture data source groups following the repository pattern.

## Glossary

- **Data Source**: A module responsible for fetching data from a specific source (API, local storage, etc.)
- **API Client**: A service that handles HTTP communication with backend endpoints
- **Base URL**: The root URL for API endpoints (currently localhost:3000)
- **Repository Pattern**: An abstraction layer between business logic and data sources
- **Mock Data**: Fake data used during development before real APIs were available
- **HTTP Client**: The library used to make HTTP requests (fetch, axios)

## Requirements

### Requirement 1

**User Story:** As a developer, I want all API endpoints organized by domain, so that I can quickly find and maintain related API calls.

#### Acceptance Criteria

1. WHEN examining the codebase THEN the System SHALL group API endpoints by business domain (auth, jobs, candidates, interviews, agencies, members, documents, applications)
2. WHEN a new API endpoint is added THEN the System SHALL place it in the appropriate domain-specific data source
3. WHEN viewing a data source file THEN the System SHALL contain only endpoints related to that specific domain
4. WHEN counting data source files THEN the System SHALL have one file per major business domain
5. WHEN examining endpoint organization THEN the System SHALL follow consistent naming conventions across all data sources

### Requirement 2

**User Story:** As a developer, I want a single HTTP client configuration, so that I can manage base URLs, headers, and error handling in one place.

#### Acceptance Criteria

1. WHEN making any API call THEN the System SHALL use a centralized HTTP client instance
2. WHEN the base URL changes THEN the System SHALL require updating only one configuration file
3. WHEN authentication tokens are needed THEN the System SHALL automatically include them from the centralized client
4. WHEN API errors occur THEN the System SHALL handle them through a centralized error handler
5. WHEN environment variables change THEN the System SHALL read the base URL from a single configuration point

### Requirement 3

**User Story:** As a developer, I want clear separation between real API calls and mock data, so that I can easily identify which implementations are production-ready.

#### Acceptance Criteria

1. WHEN examining a data source THEN the System SHALL contain only real API implementations
2. WHEN mock data exists THEN the System SHALL isolate it in separate mock files
3. WHEN switching between mock and real data THEN the System SHALL use dependency injection or feature flags
4. WHEN reading service code THEN the System SHALL not mix mock and real implementations in the same function
5. WHEN deploying to production THEN the System SHALL exclude all mock data implementations

### Requirement 4

**User Story:** As a developer, I want consistent request/response handling, so that all API calls follow the same patterns.

#### Acceptance Criteria

1. WHEN making GET requests THEN the System SHALL use consistent parameter serialization
2. WHEN making POST/PATCH requests THEN the System SHALL use consistent body formatting
3. WHEN receiving responses THEN the System SHALL parse them through a common handler
4. WHEN errors occur THEN the System SHALL transform them into a consistent error format
5. WHEN handling authentication THEN the System SHALL apply the same token retrieval logic across all endpoints

### Requirement 5

**User Story:** As a developer, I want type-safe API calls, so that I can catch errors at development time.

#### Acceptance Criteria

1. WHEN defining API functions THEN the System SHALL include JSDoc type annotations for parameters
2. WHEN returning API responses THEN the System SHALL document the expected response shape
3. WHEN calling API functions THEN the System SHALL provide IDE autocomplete for parameters
4. WHEN passing invalid parameters THEN the System SHALL show type warnings in the IDE
5. WHEN examining API documentation THEN the System SHALL include request and response examples

### Requirement 6

**User Story:** As a developer, I want to eliminate duplicate API base URL definitions, so that configuration is not scattered across files.

#### Acceptance Criteria

1. WHEN searching for "localhost:3000" THEN the System SHALL find it in only one configuration file
2. WHEN searching for "API_BASE_URL" THEN the System SHALL find it defined in only one location
3. WHEN examining data sources THEN the System SHALL import the base URL from the shared configuration
4. WHEN updating the API URL THEN the System SHALL require changes in only one file
5. WHEN deploying to different environments THEN the System SHALL read the URL from environment variables through one config

### Requirement 7

**User Story:** As a developer, I want clear data source boundaries, so that I understand which service handles which API domain.

#### Acceptance Criteria

1. WHEN examining the auth data source THEN the System SHALL contain only authentication-related endpoints
2. WHEN examining the jobs data source THEN the System SHALL contain only job-related endpoints
3. WHEN examining the candidates data source THEN the System SHALL contain only candidate-related endpoints
4. WHEN examining the interviews data source THEN the System SHALL contain only interview-related endpoints
5. WHEN a data source grows too large THEN the System SHALL split it into logical sub-domains

### Requirement 8

**User Story:** As a developer, I want to remove axios and fetch inconsistencies, so that all HTTP calls use the same client.

#### Acceptance Criteria

1. WHEN examining HTTP calls THEN the System SHALL use only one HTTP client library
2. WHEN making requests THEN the System SHALL not mix fetch and axios calls
3. WHEN configuring requests THEN the System SHALL use consistent configuration patterns
4. WHEN handling responses THEN the System SHALL use the same parsing logic
5. WHEN intercepting requests THEN the System SHALL apply interceptors consistently across all calls
