import authService, { ROLES } from '../../services/authService'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
global.localStorage = localStorageMock

// Mock auditService
jest.mock('../../services/auditService', () => ({
  logEvent: jest.fn().mockResolvedValue(true)
}))

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    
    // Reset auth service state
    authService.currentUser = null
    authService.isAuthenticated = false
  })

  test('complete admin login flow', async () => {
    // Test login
    const result = await authService.login('9801234567', '123456')
    
    expect(result.user.phone).toBe('9801234567')
    expect(result.user.role).toBe(ROLES.ADMIN)
    expect(authService.isAuthenticated).toBe(true)
    expect(authService.currentUser).toBeDefined()
  })

  test('owner login flow', async () => {
    const result = await authService.ownerLogin('9809999999', '123456')
    
    expect(result.user.phone).toBe('9809999999')
    expect(result.user.isOwner).toBe(true)
    expect(authService.isAuthenticated).toBe(true)
  })

  test('member login flow', async () => {
    const result = await authService.memberLogin('9801111111', '123456')
    
    expect(result.user.phone).toBe('9801111111')
    expect(result.user.role).toBe(ROLES.RECIPIENT)
    expect(authService.isAuthenticated).toBe(true)
  })

  test('logout clears authentication', async () => {
    // Login first
    await authService.login('9801234567', '123456')
    expect(authService.isAuthenticated).toBe(true)
    
    // Then logout
    authService.logout()
    
    expect(authService.isAuthenticated).toBe(false)
    expect(authService.currentUser).toBe(null)
  })

  test('role-based access control', async () => {
    // Login as admin
    await authService.login('9801234567', '123456')
    
    expect(authService.isAdmin()).toBe(true)
    expect(authService.hasPermission('manage_users')).toBe(true)
    
    // Login as coordinator
    authService.currentUser = null
    authService.isAuthenticated = false
    
    await authService.memberLogin('9802222222', '123456')
    
    expect(authService.isCoordinator()).toBe(true)
    expect(authService.hasPermission('manage_users')).toBe(false)
    expect(authService.hasPermission('schedule_interview')).toBe(true)
  })

  test('session persistence', () => {
    const mockUser = {
      id: 'user_1',
      role: ROLES.ADMIN,
      name: 'Test Admin'
    }
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'udaan_user') return JSON.stringify(mockUser)
      if (key === 'udaan_token') return 'mock_token'
      return null
    })
    
    const result = authService.initializeAuth()
    
    expect(result).toBe(true)
    expect(authService.currentUser.id).toBe(mockUser.id)
    expect(authService.currentUser.role).toBe(mockUser.role)
    expect(authService.isAuthenticated).toBe(true)
  })

  test('invalid session data handling', () => {
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'udaan_user') return 'invalid_json'
      return null
    })
    
    // Reset state first
    authService.currentUser = null
    authService.isAuthenticated = false
    
    const result = authService.initializeAuth()
    
    expect(result).toBe(false)
    expect(authService.isAuthenticated).toBe(false)
  })
})