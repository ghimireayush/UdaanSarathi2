# Implementation Plan

- [x] 1. Create TokenManager service
  - Create new file `src/services/tokenManager.js`
  - Implement token storage methods (getToken, setToken, clearToken)
  - Implement token validation methods (isTokenValid, isTokenExpired, getTokenExpiration)
  - Implement portal management methods (getLoginPortal, setLoginPortal)
  - Add constants for token refresh window and localStorage keys
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 6.1_

- [ ]* 1.1 Write property test for token storage completeness
  - **Property 1: Token storage completeness**
  - **Validates: Requirements 1.1, 1.4**

- [ ]* 1.2 Write property test for expired token cleanup
  - **Property 3: Expired token cleanup**
  - **Validates: Requirements 1.3**

- [ ]* 1.3 Write property test for logout cleanup
  - **Property 4: Logout cleanup completeness**
  - **Validates: Requirements 1.5**

- [x] 2. Create AuthErrorHandler utility
  - Create new file `src/utils/authErrorHandler.js`
  - Define AuthError class with error types enum
  - Implement error classification methods (isAuthError, isNetworkError)
  - Implement redirect path generation based on portal
  - Implement error notification display logic with debouncing
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 5.1_

- [ ]* 2.1 Write property test for error type classification
  - **Property 19: Error type classification**
  - **Validates: Requirements 5.1**

- [ ]* 2.2 Write property test for error notification debouncing
  - **Property 8: Error notification debouncing**
  - **Validates: Requirements 2.5**

- [ ]* 2.3 Write property test for sensitive data exclusion
  - **Property 30: Sensitive data exclusion from logs**
  - **Validates: Requirements 7.4**

- [x] 3. Update AuthContext with token validation
  - Update `src/contexts/AuthContext.jsx`
  - Import and integrate TokenManager service
  - Add tokenExpiration and isTokenValid to context state
  - Update initializeAuth to validate token expiration
  - Add validateSession method to check token validity
  - Update all login methods to store token expiration timestamp
  - Update logout to use TokenManager.clearToken()
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 6.1_

- [ ]* 3.1 Write property test for session restoration consistency
  - **Property 2: Session restoration consistency**
  - **Validates: Requirements 1.2**

- [ ]* 3.2 Write property test for portal identifier storage
  - **Property 23: Portal identifier storage**
  - **Validates: Requirements 6.1**

- [x] 4. Update HttpClient with token validation
  - Update `src/api/config/httpClient.js`
  - Import TokenManager and AuthErrorHandler
  - Add validateAndGetToken method
  - Update all request methods (get, post, patch, delete) to validate token before sending
  - Implement error handling for 401 responses
  - Add error logging for API failures
  - _Requirements: 4.1, 4.2, 4.3, 4.5, 7.3_

- [ ]* 4.1 Write property test for pre-request token validation
  - **Property 14: Pre-request token validation**
  - **Validates: Requirements 4.1**

- [ ]* 4.2 Write property test for invalid token error type
  - **Property 15: Invalid token error type**
  - **Validates: Requirements 4.2**

- [ ]* 4.3 Write property test for 401 error handling
  - **Property 5: 401 error handling consistency**
  - **Validates: Requirements 2.2**

- [x] 5. Implement network error retry logic
  - Update `src/api/config/httpClient.js`
  - Add retry method with exponential backoff
  - Wrap all request methods with retry logic for network errors
  - Distinguish between network errors and auth errors
  - Preserve authentication state during network errors
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ]* 5.1 Write property test for network error retry behavior
  - **Property 20: Network error retry behavior**
  - **Validates: Requirements 5.2**

- [ ]* 5.2 Write property test for retry exhaustion preserves auth
  - **Property 21: Retry exhaustion preserves auth**
  - **Validates: Requirements 5.3**

- [ ]* 5.3 Write property test for network recovery continuation
  - **Property 22: Network recovery continuation**
  - **Validates: Requirements 5.4**

- [x] 6. Implement token expiration monitoring and warnings
  - Update `src/services/tokenManager.js`
  - Add shouldShowExpirationWarning method to check if warning is needed
  - Add getTimeUntilExpiration method to calculate remaining time
  - Update `src/contexts/AuthContext.jsx` to add checkTokenExpiration method
  - Implement periodic expiration checking (every 30 seconds)
  - Add expiration warning notification display
  - Implement immediate logout when token expires during session
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 6.1 Write property test for expiration warning trigger timing
  - **Property 9: Expiration warning trigger timing**
  - **Validates: Requirements 3.1**

- [ ]* 6.2 Write property test for expired token immediate logout
  - **Property 10: Expired token immediate logout**
  - **Validates: Requirements 3.2**

- [ ]* 6.3 Write property test for expired token on load cleanup
  - **Property 11: Expired token on load cleanup**
  - **Validates: Requirements 3.3**

- [ ]* 6.4 Write property test for expiration warning actionability
  - **Property 12: Expiration warning actionability**
  - **Validates: Requirements 3.4**

- [ ]* 6.5 Write property test for expiration validation uses timestamp
  - **Property 13: Expiration validation uses timestamp**
  - **Validates: Requirements 3.5**

- [ ] 7. Implement portal-specific redirect logic
  - Update `src/utils/authErrorHandler.js`
  - Add portal-to-path mapping constant
  - Implement getRedirectPath method using TokenManager
  - Update AuthContext logout to use portal-specific redirect
  - Add URL preservation for post-auth redirect
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 2.4_

- [ ]* 7.1 Write property test for portal-specific expiration redirect
  - **Property 24: Portal-specific expiration redirect**
  - **Validates: Requirements 6.2**

- [ ]* 7.2 Write property test for portal-specific logout redirect
  - **Property 25: Portal-specific logout redirect**
  - **Validates: Requirements 6.3**

- [ ]* 7.3 Write property test for URL preservation on expiration
  - **Property 7: URL preservation on expiration**
  - **Validates: Requirements 2.4**

- [ ] 8. Implement comprehensive error logging
  - Create `src/utils/authLogger.js` utility
  - Implement logging methods for auth errors, validation failures, and API failures
  - Add sanitization to exclude sensitive data from logs
  - Integrate logging into TokenManager, AuthContext, and HttpClient
  - Add log entry structure with required fields (type, timestamp, context)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 8.1 Write property test for auth error logging completeness
  - **Property 27: Auth error logging completeness**
  - **Validates: Requirements 7.1**

- [ ]* 8.2 Write property test for validation failure log content
  - **Property 28: Validation failure log content**
  - **Validates: Requirements 7.2**

- [ ]* 8.3 Write property test for API failure log content
  - **Property 29: API failure log content**
  - **Validates: Requirements 7.3**

- [ ] 9. Update all authentication flows with expiration timestamps
  - Update `src/services/authService.js`
  - Modify loginVerifyWithBackend to calculate and store expiration
  - Modify loginVerifyOwnerWithBackend to calculate and store expiration
  - Modify memberLoginVerifyWithBackend to calculate and store expiration
  - Modify verifyOwnerWithBackend to calculate and store expiration
  - Add default token expiration (24 hours) if backend doesn't provide it
  - _Requirements: 1.1, 1.4_

- [ ] 10. Create user-facing error messages and UI components
  - Create `src/components/AuthErrorMessage.jsx` component
  - Implement error message display with troubleshooting steps
  - Add error message variants for different error types
  - Integrate error component into AuthContext
  - Style error messages for visibility and clarity
  - _Requirements: 2.1, 2.3, 5.5_

- [ ]* 10.1 Write unit tests for error message component
  - Test that error messages contain troubleshooting steps
  - Test different error type variants render correctly
  - Test error message dismissal

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Integration testing and validation
  - Test complete authentication flow with token persistence
  - Test token expiration warning display
  - Test automatic logout when token expires
  - Test network error retry behavior
  - Test portal-specific redirects
  - Verify all localStorage keys are properly managed
  - _Requirements: All_

- [ ]* 12.1 Write integration tests for end-to-end flows
  - Test login → reload → session persists
  - Test login → token near expiration → warning displayed
  - Test login → token expires → redirect to login
  - Test login → network error → retry → success
  - Test login via different portals → expire → correct redirect

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
