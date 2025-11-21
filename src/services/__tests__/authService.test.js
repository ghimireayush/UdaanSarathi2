import authService, { ROLES, PERMISSIONS } from '../authService'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock

// Mock auditService
jest.mock('../auditService', () => ({
  logEvent: jest.fn().mockResolvedValue(true)
}))

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    
    // Reset auth service state
    authService.currentUser = null
    authService.isAuthenticated = false
  })

  describe('login', () => {
    test('should login with valid admin credentials', async () => {
      const result = await authService.login('9801234567', '123456')
      
      expect(result.user.phone).toBe('9801234567')
      expect(result.user.role).toBe(ROLES.ADMIN)
      expect(result.token).toBeDefined()
    })

    test('should reject invalid credentials', async () => {
      await expect(authService.login('invalid', 'invalid'))
        .rejects
        .toThrow('Invalid phone number or OTP')
    })

    test('should reject non-admin users', async () => {
      await expect(authService.login('9801111111', '123456'))
        .rejects
        .toThrow('Access Denied: Only administrators can access this portal')
    })
  })

  describe('logout', () => {
    test('should clear user data', () => {
      // Set up authenticated state
      authService.currentUser = { id: 'user_1', name: 'Test User' }
      authService.isAuthenticated = true
      
      authService.logout()
      
      expect(authService.currentUser).toBe(null)
      expect(authService.isAuthenticated).toBe(false)
    })
  })

  describe('permissions', () => {
    test('admin should have all permissions', () => {
      const permissions = authService.getUserPermissions(ROLES.ADMIN)
      expect(permissions).toContain(PERMISSIONS.MANAGE_USERS)
      expect(permissions).toContain(PERMISSIONS.CREATE_JOB)
    })

    test('recipient should have limited permissions', () => {
      const permissions = authService.getUserPermissions(ROLES.RECIPIENT)
      expect(permissions).toContain(PERMISSIONS.CREATE_JOB)
      expect(permissions).not.toContain(PERMISSIONS.MANAGE_USERS)
    })

    test('coordinator should have scheduling permissions', () => {
      const permissions = authService.getUserPermissions(ROLES.COORDINATOR)
      expect(permissions).toContain(PERMISSIONS.SCHEDULE_INTERVIEW)
      expect(permissions).not.toContain(PERMISSIONS.CREATE_JOB)
    })
  })

  describe('role checks', () => {
    test('should check roles correctly', () => {
      authService.currentUser = { role: ROLES.ADMIN }
      
      expect(authService.isAdmin()).toBe(true)
      expect(authService.isRecipient()).toBe(false)
      expect(authService.hasRole(ROLES.ADMIN)).toBe(true)
    })

    test('should return null for no user', () => {
      authService.currentUser = null
      
      expect(authService.getUserRole()).toBe(null)
      expect(authService.isAdmin()).toBe(false)
    })
  })

  describe('permission checks', () => {
    test('should check permissions correctly', () => {
      authService.currentUser = { role: ROLES.ADMIN }
      
      expect(authService.hasPermission(PERMISSIONS.MANAGE_USERS)).toBe(true)
      
      authService.currentUser = { role: ROLES.COORDINATOR }
      expect(authService.hasPermission(PERMISSIONS.MANAGE_USERS)).toBe(false)
    })

    test('should handle no user', () => {
      authService.currentUser = null
      
      expect(authService.hasPermission(PERMISSIONS.MANAGE_USERS)).toBe(false)
    })
  })
})