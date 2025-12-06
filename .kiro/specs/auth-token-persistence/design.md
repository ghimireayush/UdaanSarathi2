# Design Document

## Overview

This design implements a robust authentication token management system for the Udaan recruitment platform. The solution addresses token persistence, automatic refresh, validation, and graceful error handling across multiple authentication portals (admin, owner, and member). The design focuses on maintaining seamless user sessions while providing clear feedback when authentication issues occur.

## Architecture

The authentication token management system consists of four main layers:

1. **Storage Layer**: Manages token persistence in localStorage with expiration tracking
2. **Validation Layer**: Validates token existence and expiration before API requests
3. **Warning Layer**: Monitors token expiration and warns users before session ends
4. **Error Handling Layer**: Provides graceful degradation and user feedback

### Component Interaction Flow

```
User Action → AuthContext → TokenManager → HttpClient → API
                ↓              ↓              ↓
           LocalStorage   Validation    Error Handler
                              ↓
                    Expiration Warning
```

## Components and Interfaces

### 1. TokenManager Service

A new service that centralizes all token-related operations.

```javascript
class TokenManager {
  // Token storage and retrieval
  getToken(): string | null
  setToken(token: string, expiresIn: number): void
  clearToken(): void
  
  // Token validation
  isTokenValid(): boolean
  isTokenExpired(): boolean
  getTokenExpiration(): number | null
  getTimeUntilExpiration(): number | null
  
  // Token expiration warning
  shouldShowExpirationWarning(): boolean
  getExpirationWarningMessage(): string
  
  // Portal management
  getLoginPortal(): string
  setLoginPortal(portal: string): void
}
```

### 2. Enhanced AuthContext

Updates to the existing AuthContext to integrate token management.

```javascript
interface AuthContextValue {
  // Existing properties
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  permissions: string[]
  
  // New properties
  tokenExpiration: number | null
  isTokenValid: boolean
  
  // New methods
  validateSession(): Promise<boolean>
  checkTokenExpiration(): void
}
```

### 3. Enhanced HttpClient

Updates to the HTTP client to validate tokens before requests.

```javascript
class HttpClient {
  // New method
  async validateAndGetToken(): Promise<string>
  
  // Updated methods with token validation
  async get(endpoint: string, options?: RequestOptions): Promise<any>
  async post(endpoint: string, data: any, options?: RequestOptions): Promise<any>
  async patch(endpoint: string, data: any, options?: RequestOptions): Promise<any>
  async delete(endpoint: string, options?: RequestOptions): Promise<any>
}
```

### 4. AuthErrorHandler

A new utility for handling authentication errors consistently.

```javascript
class AuthErrorHandler {
  handleAuthError(error: Error, context: ErrorContext): void
  isAuthError(error: Error): boolean
  isNetworkError(error: Error): boolean
  getRedirectPath(portal: string): string
  showAuthErrorNotification(message: string): void
}
```

## Data Models

### Token Storage Schema

```javascript
{
  udaan_token: string,              // Bearer token
  udaan_token_expires_at: number,   // Unix timestamp
  udaan_user: string,               // JSON stringified user object
  udaan_permissions: string,        // JSON stringified permissions array
  udaan_user_type: string,          // 'owner' | 'member' | 'admin'
  login_portal: string,             // 'owner' | 'member' | 'admin'
  udaan_agency_id: string,          // Agency ID (if applicable)
  session_start: number             // Session start timestamp
}
```

### Error Types

```javascript
enum AuthErrorType {
  TOKEN_MISSING = 'TOKEN_MISSING',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  REFRESH_FAILED = 'REFRESH_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED'
}

interface AuthError extends Error {
  type: AuthErrorType
  statusCode?: number
  context?: Record<string, any>
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Token storage completeness
*For any* successful authentication, the localStorage should contain all required fields: token, expiration timestamp, user data, and permissions.
**Validates: Requirements 1.1, 1.4**

### Property 2: Session restoration consistency
*For any* valid token state in localStorage, initializing the auth context should restore the authentication state to match the stored data.
**Validates: Requirements 1.2**

### Property 3: Expired token cleanup
*For any* expired token in localStorage, initializing the auth context should clear all authentication data.
**Validates: Requirements 1.3**

### Property 4: Logout cleanup completeness
*For any* authenticated state, calling logout should remove all authentication-related keys from localStorage.
**Validates: Requirements 1.5**

### Property 5: 401 error handling consistency
*For any* API request that returns a 401 status, the system should clear authentication state and redirect to the appropriate portal login page.
**Validates: Requirements 2.2**

### Property 6: Error message actionability
*For any* authentication error displayed to the user, the error message should contain at least one actionable troubleshooting step.
**Validates: Requirements 2.3**

### Property 7: URL preservation on expiration
*For any* page where session expiration occurs, the current URL should be stored for post-authentication redirect.
**Validates: Requirements 2.4**

### Property 8: Error notification debouncing
*For any* sequence of authentication errors occurring within a 5-second window, only one notification should be displayed.
**Validates: Requirements 2.5**

### Property 9: Expiration warning trigger timing
*For any* token with expiration time, the warning should only be displayed when the remaining time is less than or equal to 5 minutes.
**Validates: Requirements 3.1**

### Property 10: Expired token immediate logout
*For any* expired token detected during a session, the system should immediately clear authentication state and redirect to login.
**Validates: Requirements 3.2**

### Property 11: Expired token on load cleanup
*For any* expired token detected during page initialization, the authentication state should be cleared before rendering protected content.
**Validates: Requirements 3.3**

### Property 12: Expiration warning actionability
*For any* expiration warning displayed, the warning should include a clear action button for re-authentication.
**Validates: Requirements 3.4**

### Property 13: Expiration validation uses timestamp
*For any* token expiration check, the validation should use the stored expiration timestamp from localStorage.
**Validates: Requirements 3.5**

### Property 14: Pre-request token validation
*For any* HTTP request, token validation should occur before the request is sent to the server.
**Validates: Requirements 4.1**

### Property 15: Invalid token error type
*For any* missing or expired token, the system should throw an AuthError with the appropriate error type (TOKEN_MISSING or TOKEN_EXPIRED).
**Validates: Requirements 4.2**

### Property 16: Error propagation to context
*For any* authentication error thrown by the HTTP client, the AuthContext error handler should be invoked.
**Validates: Requirements 4.3**

### Property 17: Token validation completeness
*For any* token validation call, both existence and expiration checks should be performed.
**Validates: Requirements 4.4**

### Property 18: Validation failure logging
*For any* token validation failure, a log entry should be created with the failure reason.
**Validates: Requirements 4.5**

### Property 19: Error type classification
*For any* API error, the system should correctly classify it as either a network error or an authentication error based on the error properties.
**Validates: Requirements 5.1**

### Property 20: Network error retry behavior
*For any* network error, the system should retry the request exactly 3 times with exponential backoff before failing.
**Validates: Requirements 5.2**

### Property 21: Retry exhaustion preserves auth
*For any* network error where retries are exhausted, the authentication state should remain unchanged.
**Validates: Requirements 5.3**

### Property 22: Network recovery continuation
*For any* successful request after network errors, the authentication state should remain valid without requiring re-authentication.
**Validates: Requirements 5.4**

### Property 23: Portal identifier storage
*For any* successful login through a specific portal, the portal identifier should be stored in localStorage.
**Validates: Requirements 6.1**

### Property 24: Portal-specific expiration redirect
*For any* session expiration, the redirect URL should match the login page for the stored portal identifier.
**Validates: Requirements 6.2**

### Property 25: Portal-specific logout redirect
*For any* logout action, the redirect URL should match the login page for the stored portal identifier.
**Validates: Requirements 6.3**

### Property 26: Portal switching updates identifier
*For any* portal switch, the stored portal identifier in localStorage should be updated to the new portal.
**Validates: Requirements 6.5**

### Property 27: Auth error logging completeness
*For any* authentication error, the log entry should include error type, timestamp, and user context.
**Validates: Requirements 7.1**

### Property 28: Validation failure log content
*For any* token validation failure, the log entry should include token state and expiration information.
**Validates: Requirements 7.2**

### Property 29: API failure log content
*For any* API request failure, the log entry should include endpoint, status code, and error message.
**Validates: Requirements 7.3**

### Property 30: Sensitive data exclusion from logs
*For any* authentication event logged, the log entry should not contain token values or password strings.
**Validates: Requirements 7.4**


## Error Handling

### Error Types and Responses

| Error Type | Trigger | User Action | System Action |
|------------|---------|-------------|---------------|
| TOKEN_MISSING | No token in localStorage | Display session expired message | Redirect to login |
| TOKEN_EXPIRED | Token past expiration time | Display session expired message | Clear auth state, redirect to login |
| TOKEN_INVALID | Token format invalid | Display authentication error | Clear auth state, redirect to login |
| TOKEN_EXPIRING_SOON | Token within 5 min of expiration | Display expiration warning | Show warning notification with re-auth option |
| NETWORK_ERROR | Network connectivity issue | Display network error with retry | Retry request up to 3 times |
| UNAUTHORIZED | 401 response from API | Display session expired message | Clear auth state, redirect to login |

### Error Recovery Strategies

1. **Network Errors**: Implement exponential backoff retry (1s, 2s, 4s)
2. **Token Expiration**: Display warning when within 5-minute window, logout when expired
3. **Session Expiration**: Graceful logout with preserved redirect URL
4. **Multiple Errors**: Debounce notifications to prevent spam

### Error Logging Strategy

All authentication errors will be logged with:
- Error type and message
- Timestamp
- User ID (if available)
- Current route/page
- Portal type
- **Excluded**: Token values, passwords, sensitive user data

## Testing Strategy

### Unit Testing

Unit tests will cover:
- TokenManager methods for storage, retrieval, and validation
- AuthErrorHandler error classification and handling
- Token expiration calculation logic
- Portal redirect URL generation
- Error message formatting

### Property-Based Testing

Property-based tests will verify:
- Token storage and retrieval consistency across all authentication methods
- Session restoration works for all valid token states
- Expired tokens are always cleaned up
- Logout always clears all authentication data
- 401 errors always trigger logout and redirect
- Expiration warnings are only shown within the 5-minute window
- Network errors are retried exactly 3 times
- Portal redirects always match the stored portal identifier
- Logs never contain sensitive information

**Testing Framework**: We will use `fast-check` for property-based testing in JavaScript/React.

**Test Configuration**: Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage of the input space.

**Test Tagging**: Each property-based test will include a comment tag in the format:
```javascript
// Feature: auth-token-persistence, Property X: [property description]
```

### Integration Testing

Integration tests will verify:
- End-to-end authentication flow with token persistence
- Token refresh during active user sessions
- Error handling across multiple API requests
- Portal-specific redirects after session expiration

### Manual Testing Scenarios

1. Login → Reload page → Verify session persists
2. Login → Wait for token expiration → Verify redirect to login
3. Login → Disconnect network → Make API request → Verify retry behavior
4. Login via owner portal → Expire session → Verify redirect to owner login
5. Login → Logout → Verify all localStorage cleared

## Implementation Notes

### Token Expiration Format

Tokens will store expiration as Unix timestamp (milliseconds since epoch) for consistency and ease of comparison.

### Expiration Warning Window

The 5-minute warning window is configurable via a constant `TOKEN_EXPIRATION_WARNING_MS = 5 * 60 * 1000`.

### Expiration Monitoring

Token expiration will be monitored via:
- Periodic checks every 30 seconds when user is active
- Check on every API request
- Check on page load/initialization
- Check on user interaction events

### Portal Mapping

```javascript
const PORTAL_LOGIN_PATHS = {
  admin: '/login',
  owner: '/owner/login',
  member: '/member/login',
  default: '/member/login'
}
```

### Backward Compatibility

The implementation will maintain backward compatibility with existing authentication flows. Existing localStorage keys will be preserved, with new keys added for token expiration tracking.

## Security Considerations

1. **Token Storage**: Tokens remain in localStorage (existing behavior). For enhanced security, consider httpOnly cookies in future iterations.
2. **Token Expiration**: Backend should provide token expiration time. If not provided, use default of 24 hours.
3. **Logging**: Never log complete tokens, only token state (exists/expired/missing).
4. **Error Messages**: Avoid exposing internal system details in user-facing error messages.
5. **XSS Protection**: Ensure all user-facing error messages are properly sanitized.

## Performance Considerations

1. **Token Validation**: Validation is synchronous and lightweight (localStorage read + timestamp comparison).
2. **Expiration Monitoring**: Periodic checks use setInterval with 30-second intervals to minimize overhead.
3. **Warning Display**: Warnings use a debounced notification system to prevent spam.
4. **Error Debouncing**: Use a simple timestamp-based debounce to minimize overhead.

## Deployment Strategy

1. Deploy TokenManager service
2. Update AuthContext with token validation
3. Update HttpClient with pre-request validation
4. Deploy AuthErrorHandler
5. Update all login flows to store expiration timestamps
6. Monitor error logs for authentication issues
7. Gradually roll out automatic token refresh feature

## Monitoring and Metrics

Track the following metrics:
- Token expiration rate
- Expiration warning display frequency
- Authentication error frequency by type
- Session duration before expiration
- Network error retry success rate
- User response to expiration warnings
