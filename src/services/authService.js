// Authentication and Authorization Service
import { delay } from '../utils/helpers.js'
import auditService from './auditService.js'

// Role definitions with permissions
export const ROLES = {
  ADMIN: 'admin',
  RECIPIENT: 'recipient',
  COORDINATOR: 'interview-coordinator',
  AGENCY_OWNER: 'agency_owner',
  AGENCY_MEMBER: 'agency_member'
}

export const PERMISSIONS = {
  // Job Management
  CREATE_JOB: 'create_job',
  EDIT_JOB: 'edit_job',
  DELETE_JOB: 'delete_job',
  PUBLISH_JOB: 'publish_job',
  VIEW_JOBS: 'view_jobs',
  
  // Application Management
  VIEW_APPLICATIONS: 'view_applications',
  EDIT_APPLICATION: 'edit_application',
  SHORTLIST_CANDIDATE: 'shortlist_candidate',
  REJECT_APPLICATION: 'reject_application',
  
  // Interview Management
  SCHEDULE_INTERVIEW: 'schedule_interview',
  CONDUCT_INTERVIEW: 'conduct_interview',
  EDIT_INTERVIEW: 'edit_interview',
  VIEW_INTERVIEWS: 'view_interviews',
  
  // Workflow Management
  VIEW_WORKFLOW: 'view_workflow',
  UPDATE_WORKFLOW_STAGE: 'update_workflow_stage',
  MANAGE_DOCUMENTS: 'manage_documents',
  
  // System Administration
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  MANAGE_AGENCIES: 'manage_agencies',
  MANAGE_MEMBERS: 'manage_members',
  
  // Notifications and Scheduling
  SEND_NOTIFICATIONS: 'send_notifications',
  MANAGE_CALENDAR: 'manage_calendar',
  SCHEDULE_EVENTS: 'schedule_events',
  
  // Document Management
  UPLOAD_DOCUMENTS: 'upload_documents',
  EDIT_DOCUMENTS: 'edit_documents',
  DELETE_DOCUMENTS: 'delete_documents',
  
  // Limited Edit Permissions
  LIMITED_EDIT: 'limited_edit'
}

// Role-based permission mapping
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Admin has all permissions
    ...Object.values(PERMISSIONS)
  ],
  
  [ROLES.AGENCY_OWNER]: [
    // Agency management
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    // Job management
    PERMISSIONS.CREATE_JOB,
    PERMISSIONS.EDIT_JOB,
    PERMISSIONS.DELETE_JOB,
    PERMISSIONS.PUBLISH_JOB,
    PERMISSIONS.VIEW_JOBS,
    // Application management
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.EDIT_APPLICATION,
    PERMISSIONS.SHORTLIST_CANDIDATE,
    PERMISSIONS.REJECT_APPLICATION,
    // Interview management
    PERMISSIONS.SCHEDULE_INTERVIEW,
    PERMISSIONS.CONDUCT_INTERVIEW,
    PERMISSIONS.EDIT_INTERVIEW,
    PERMISSIONS.VIEW_INTERVIEWS,
    // Workflow management
    PERMISSIONS.VIEW_WORKFLOW,
    PERMISSIONS.UPDATE_WORKFLOW_STAGE,
    PERMISSIONS.MANAGE_DOCUMENTS
  ],
  
  [ROLES.RECIPIENT]: [
    // Jobs
    PERMISSIONS.CREATE_JOB,
    PERMISSIONS.EDIT_JOB,
    PERMISSIONS.DELETE_JOB,
    PERMISSIONS.PUBLISH_JOB,
    PERMISSIONS.VIEW_JOBS,
    
    // Applications
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.EDIT_APPLICATION,
    PERMISSIONS.SHORTLIST_CANDIDATE,
    PERMISSIONS.REJECT_APPLICATION,
    
    // Interviews
    PERMISSIONS.SCHEDULE_INTERVIEW,
    PERMISSIONS.CONDUCT_INTERVIEW,
    PERMISSIONS.EDIT_INTERVIEW,
    PERMISSIONS.VIEW_INTERVIEWS,
    
    // Workflow
    PERMISSIONS.VIEW_WORKFLOW,
    PERMISSIONS.UPDATE_WORKFLOW_STAGE,
    PERMISSIONS.MANAGE_DOCUMENTS
  ],
  
  [ROLES.COORDINATOR]: [
    // Scheduling
    PERMISSIONS.SCHEDULE_INTERVIEW,
    PERMISSIONS.MANAGE_CALENDAR,
    PERMISSIONS.SCHEDULE_EVENTS,
    
    // Notifications
    PERMISSIONS.SEND_NOTIFICATIONS,
    
    // Documents
    PERMISSIONS.UPLOAD_DOCUMENTS,
    PERMISSIONS.EDIT_DOCUMENTS,
    PERMISSIONS.VIEW_WORKFLOW,
    
    // Limited editing capabilities
    PERMISSIONS.LIMITED_EDIT,
    
    // View permissions
    PERMISSIONS.VIEW_JOBS,
    PERMISSIONS.VIEW_APPLICATIONS,
    PERMISSIONS.VIEW_INTERVIEWS
  ]
}

// Mock user data - Phone-based authentication only
const MOCK_USERS = [
  {
    id: 'user_1',
    phone: '9801234567',
    email: 'admin@udaan.com',
    password: '123456',
    name: 'System Administrator',
    role: ROLES.ADMIN,
    avatar: '/avatars/admin.jpg',
    isActive: true,
    lastLogin: '2025-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user_owner',
    phone: '9809999999',
    email: 'owner@udaan.com',
    password: '123456',
    name: 'Platform Owner',
    role: ROLES.ADMIN,
    avatar: '/avatars/owner.jpg',
    isActive: true,
    lastLogin: '2025-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'user_2',
    phone: '9801111111',
    email: 'recipient@udaan.com',
    password: '123456',
    name: 'Recipient',
    role: ROLES.RECIPIENT,
    avatar: '/avatars/recipient.jpg',
    isActive: true,
    lastLogin: '2025-01-15T09:15:00Z',
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 'user_3',
    phone: '9802222222',
    email: 'coordinator@udaan.com',
    password: '123456',
    name: 'Interview Coordinator',
    role: ROLES.COORDINATOR,
    avatar: '/avatars/coordinator.jpg',
    isActive: true,
    lastLogin: '2025-01-15T08:45:00Z',
    createdAt: '2024-03-01T00:00:00Z'
  }
]

class AuthService {
  constructor() {
    this.currentUser = null
    this.isAuthenticated = false
    this.initializeAuth()
  }

  /**
   * Initialize authentication state from localStorage
   */
  initializeAuth() {
    try {
      const storedUser = localStorage.getItem('udaan_user')
      const storedToken = localStorage.getItem('udaan_token')
      
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser)
        
        // Validate that the user data is complete
        if (userData && userData.id && userData.role) {
          this.currentUser = userData
          this.isAuthenticated = true
          return true
        }
      }
      
      // If we reach here, authentication data is invalid or missing
      this.logout()
      return false
    } catch (error) {
      console.error('Error initializing auth:', error)
      this.logout()
      return false
    }
  }

  /**
   * Login user
   * @param {string} username - Username or email
   * @param {string} password - Password
   * @returns {Promise<Object>} Login result
   */
  async register(userData) {
    await delay(1000) // Simulate API call
    
    // Check if phone already exists
    if (MOCK_USERS.some(u => u.phone === userData.phone)) {
      throw new Error('Phone number already registered')
    }

    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      username: userData.phone,
      phone: userData.phone,
      name: userData.fullName,
      role: ROLES.AGENCY_OWNER,
      phone: userData.phone,
      avatar: '/avatars/default.jpg',
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    }

    MOCK_USERS.push(newUser)

    // Generate token
    const token = `token_${newUser.id}_${Date.now()}`
    
    // Store auth state
    localStorage.setItem('udaan_user', JSON.stringify(newUser))
    localStorage.setItem('udaan_token', token)
    
    this.currentUser = newUser
    this.isAuthenticated = true

    return {
      user: newUser,
      token,
      permissions: this.getUserPermissions(newUser.role)
    }
  }

  async createCompany(companyData) {
    await delay(1000) // Simulate API call
    
    if (!this.currentUser) {
      throw new Error('Not authenticated')
    }

    // Create company
    const company = {
      id: `company_${Date.now()}`,
      ...companyData,
      ownerId: this.currentUser.id,
      createdAt: new Date().toISOString(),
      status: 'active'
    }

    // In a real app, store this in your backend
    localStorage.setItem('company_data', JSON.stringify(company))

    // Update user with company reference
    const updatedUser = {
      ...this.currentUser,
      companyId: company.id
    }

    const userIndex = MOCK_USERS.findIndex(u => u.id === this.currentUser.id)
    if (userIndex !== -1) {
      MOCK_USERS[userIndex] = updatedUser
    }

    localStorage.setItem('udaan_user', JSON.stringify(updatedUser))
    this.currentUser = updatedUser

    return company
  }

  // Agency portal login - Only for ADMIN role (not for owners)
  async login(username, password) {
    await delay(1000) // Simulate network delay
    
    // Find user in mock data - phone number only
    const user = MOCK_USERS.find(u => 
      u.phone === username && u.password === password
    )
    
    if (!user) {
      throw new Error('Invalid phone number or OTP')
    }

    // Only allow admin login (NOT agency owners)
    if (user.role !== ROLES.ADMIN) {
      throw new Error('Access Denied: Only administrators can access this portal')
    }
    
    // Additional check: Prevent owner accounts from logging in here
    if (user.id === 'user_owner' || user.phone === '9809999999') {
      throw new Error('Access Denied: Owner accounts must use the Owner Portal at /owner/login')
    }
    
    if (!user.isActive) {
      throw new Error('Account is deactivated')
    }
    
    // Store authentication data
    const authData = {
      token: `token_${Date.now()}`,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: this.getUserPermissions(user.role),
        isActive: user.isActive
      },
      permissions: this.getUserPermissions(user.role),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
    
    localStorage.setItem('udaan_token', authData.token)
    localStorage.setItem('udaan_user', JSON.stringify(authData.user))
    localStorage.setItem('udaan_permissions', JSON.stringify(authData.permissions))
    
    this.currentUser = authData.user
    this.isAuthenticated = true
    
    // Log successful login
    try {
      await auditService.logEvent({
        action: 'USER_LOGIN',
        user_id: user.id,
        user_name: user.name,
        resource_type: 'AUTH',
        resource_id: user.id,
        metadata: {
          phone: user.phone,
          role: user.role,
          loginTime: new Date().toISOString()
        }
      })
    } catch (e) {
      console.warn('Audit logging (LOGIN) failed:', e)
    }
    
    return authData
  }

  // Owner portal login - Only for platform owners
  async ownerLogin(phone, password) {
    await delay(1000) // Simulate network delay
    
    // Find user in mock data - phone number only
    const user = MOCK_USERS.find(u => 
      u.phone === phone && u.password === password
    )
    
    if (!user) {
      throw new Error('Invalid phone number or OTP')
    }
    
    // Only allow admin role AND must be the owner account
    if (user.role !== ROLES.ADMIN) {
      throw new Error('Access Denied: Only platform owners can access this portal')
    }
    
    // Verify this is actually an owner account (not regular admin)
    if (user.id !== 'user_owner' || user.phone !== '9809999999') {
      throw new Error('Access Denied: This account does not have owner privileges. Please use the Agency Portal.')
    }
    
    if (!user.isActive) {
      throw new Error('Account is deactivated')
    }
    
    // Store authentication data
    const authData = {
      token: `owner_token_${Date.now()}`,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: this.getUserPermissions(user.role),
        isActive: user.isActive,
        isOwner: true
      },
      permissions: this.getUserPermissions(user.role),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
    
    localStorage.setItem('udaan_token', authData.token)
    localStorage.setItem('udaan_user', JSON.stringify(authData.user))
    localStorage.setItem('udaan_permissions', JSON.stringify(authData.permissions))
    
    this.currentUser = authData.user
    this.isAuthenticated = true
    
    // Log successful owner login
    try {
      await auditService.logEvent({
        action: 'OWNER_LOGIN',
        user_id: user.id,
        user_name: user.name,
        resource_type: 'AUTH',
        resource_id: user.id,
        metadata: {
          email: user.email,
          role: user.role,
          loginTime: new Date().toISOString(),
          portal: 'owner'
        }
      })
    } catch (e) {
      console.warn('Audit logging (OWNER_LOGIN) failed:', e)
    }
    
    return authData
  }

  // Member login for Recipients and Coordinators ONLY
  async memberLogin(phone, password, invitationToken = null) {
    await delay(1000) // Simulate network delay
    
    // Find user in mock data - phone number only
    const user = MOCK_USERS.find(u => 
      u.phone === phone && u.password === password
    )
    
    if (!user) {
      throw new Error('Invalid phone number or OTP')
    }
    
    // Only allow recipients and coordinators (NOT admins or owners)
    if (user.role !== ROLES.RECIPIENT && user.role !== ROLES.COORDINATOR) {
      throw new Error('Access Denied: Only team members (Recipients and Coordinators) can access this portal')
    }
    
    if (!user.isActive) {
      throw new Error('Account is deactivated')
    }
    
    // Store authentication data
    const authData = {
      token: `member_token_${Date.now()}`,
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: this.getUserPermissions(user.role),
        isActive: user.isActive,
        invitationToken: invitationToken
      },
      permissions: this.getUserPermissions(user.role),
      expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    }
    
    localStorage.setItem('udaan_token', authData.token)
    localStorage.setItem('udaan_user', JSON.stringify(authData.user))
    localStorage.setItem('udaan_permissions', JSON.stringify(authData.permissions))
    
    this.currentUser = authData.user
    this.isAuthenticated = true
    
    // Log successful member login
    try {
      await auditService.logEvent({
        action: 'MEMBER_LOGIN',
        user_id: user.id,
        user_name: user.name,
        resource_type: 'AUTH',
        resource_id: user.id,
        metadata: {
          phone: user.phone,
          role: user.role,
          loginTime: new Date().toISOString(),
          invitationToken: invitationToken
        }
      })
    } catch (e) {
      console.warn('Audit logging (MEMBER_LOGIN) failed:', e)
    }
    
    return { success: true, ...authData }
  }

  /**
   * Logout user
   */
  logout() {
    // Snapshot current user for audit before clearing
    const prevUser = this.currentUser

    localStorage.removeItem('udaan_user')
    localStorage.removeItem('udaan_token')
    this.currentUser = null
    this.isAuthenticated = false

    // Fire-and-forget audit for logout (do not block UI)
    if (prevUser) {
      Promise.resolve(
        auditService.logEvent({
          user_id: prevUser.id,
          user_name: prevUser.name,
          action: 'LOGOUT',
          resource_type: 'AUTH',
          resource_id: prevUser.id,
          metadata: {
            role: prevUser.role
          }
        })
      ).catch(e => console.warn('Audit logging (LOGOUT) failed:', e))
    }
  }

  /**
   * Get current user
   * @returns {Object|null} Current user object
   */
  getCurrentUser() {
    return this.currentUser
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} Authentication status
   */
  isUserAuthenticated() {
    return this.isAuthenticated && this.currentUser !== null
  }

  /**
   * Get user permissions based on role
   * @param {string} role - User role
   * @returns {Array} Array of permissions
   */
  getUserPermissions(role) {
    return ROLE_PERMISSIONS[role] || []
  }

  /**
   * Check if current user has specific permission
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  hasPermission(permission) {
    if (!this.currentUser) return false
    
    const userPermissions = this.getUserPermissions(this.currentUser.role)
    return userPermissions.includes(permission)
  }

  /**
   * Check if current user has any of the specified permissions
   * @param {Array} permissions - Array of permissions to check
   * @returns {boolean} True if user has at least one permission
   */
  hasAnyPermission(permissions) {
    return permissions.some(permission => this.hasPermission(permission))
  }

  /**
   * Check if current user has all specified permissions
   * @param {Array} permissions - Array of permissions to check
   * @returns {boolean} True if user has all permissions
   */
  hasAllPermissions(permissions) {
    return permissions.every(permission => this.hasPermission(permission))
  }

  /**
   * Get user role
   * @returns {string|null} User role
   */
  getUserRole() {
    return this.currentUser?.role || null
  }

  /**
   * Check if user has specific role
   * @param {string} role - Role to check
   * @returns {boolean} True if user has role
   */
  hasRole(role) {
    return this.currentUser?.role === role
  }

  /**
   * Check if user is admin
   * @returns {boolean} True if user is admin
   */
  isAdmin() {
    return this.hasRole(ROLES.ADMIN)
  }

  /**
   * Check if user is recipient
   * @returns {boolean} True if user is recipient
   */
  isRecipient() {
    return this.hasRole(ROLES.RECIPIENT)
  }

  /**
   * Check if user is coordinator
   * @returns {boolean} True if user is coordinator
   */
  isCoordinator() {
    return this.hasRole(ROLES.COORDINATOR)
  }

  /**
   * Get all users (admin only)
   * @returns {Promise<Array>} Array of users
   */
  async getUsers() {
    if (!this.hasPermission(PERMISSIONS.MANAGE_USERS)) {
      throw new Error('Insufficient permissions')
    }
    
    await delay(300)
    return MOCK_USERS
  }

  /**
   * Create new user (admin only)
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    if (!this.hasPermission(PERMISSIONS.MANAGE_USERS)) {
      throw new Error('Insufficient permissions')
    }
    
    await delay(500)
    
    const newUser = {
      id: `user_${Date.now()}`,
      ...userData,
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLogin: null
    }
    
    MOCK_USERS.push(newUser)

    // Audit: admin created user
    try {
      const actor = this.currentUser || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'CREATE',
        resource_type: 'USER',
        resource_id: newUser.id,
        changes: { created: true },
        new_values: newUser
      })
    } catch (e) {
      console.warn('Audit logging (CREATE USER) failed:', e)
    }

    return newUser
  }

  /**
   * Update user (admin only)
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData) {
    if (!this.hasPermission(PERMISSIONS.MANAGE_USERS)) {
      throw new Error('Insufficient permissions')
    }
    
    await delay(400)
    
    const userIndex = MOCK_USERS.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('User not found')
    }
    
    const before = { ...MOCK_USERS[userIndex] }
    MOCK_USERS[userIndex] = {
      ...MOCK_USERS[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    const updated = MOCK_USERS[userIndex]

    // Audit: admin updated user
    try {
      const actor = this.currentUser || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'UPDATE',
        resource_type: 'USER',
        resource_id: userId,
        changes: updateData,
        old_values: before,
        new_values: updated
      })
    } catch (e) {
      console.warn('Audit logging (UPDATE USER) failed:', e)
    }

    return updated
  }

  /**
   * Delete user (admin only)
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteUser(userId) {
    if (!this.hasPermission(PERMISSIONS.MANAGE_USERS)) {
      throw new Error('Insufficient permissions')
    }
    
    await delay(300)
    
    const userIndex = MOCK_USERS.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('User not found')
    }

    const removed = MOCK_USERS[userIndex]
    MOCK_USERS.splice(userIndex, 1)

    // Audit: admin deleted user
    try {
      const actor = this.currentUser || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'DELETE',
        resource_type: 'USER',
        resource_id: userId,
        old_values: removed
      })
    } catch (e) {
      console.warn('Audit logging (DELETE USER) failed:', e)
    }

    return true
  }

  /**
   * Get role display name
   * @param {string} role - Role key
   * @returns {string} Display name
   */
  getRoleDisplayName(role) {
    const roleNames = {
      [ROLES.ADMIN]: 'Administrator',
      [ROLES.RECIPIENT]: 'Recipient',
      [ROLES.COORDINATOR]: 'Interview Coordinator'
    }
    return roleNames[role] || role
  }

  /**
   * Get permission display name
   * @param {string} permission - Permission key
   * @returns {string} Display name
   */
  getPermissionDisplayName(permission) {
    const permissionNames = {
      [PERMISSIONS.CREATE_JOB]: 'Create Jobs',
      [PERMISSIONS.EDIT_JOB]: 'Edit Jobs',
      [PERMISSIONS.DELETE_JOB]: 'Delete Jobs',
      [PERMISSIONS.PUBLISH_JOB]: 'Publish Jobs',
      [PERMISSIONS.VIEW_JOBS]: 'View Jobs',
      [PERMISSIONS.VIEW_APPLICATIONS]: 'View Applications',
      [PERMISSIONS.EDIT_APPLICATION]: 'Edit Applications',
      [PERMISSIONS.SHORTLIST_CANDIDATE]: 'Shortlist Candidates',
      [PERMISSIONS.REJECT_APPLICATION]: 'Reject Applications',
      [PERMISSIONS.SCHEDULE_INTERVIEW]: 'Schedule Interviews',
      [PERMISSIONS.CONDUCT_INTERVIEW]: 'Conduct Interviews',
      [PERMISSIONS.EDIT_INTERVIEW]: 'Edit Interviews',
      [PERMISSIONS.VIEW_INTERVIEWS]: 'View Interviews',
      [PERMISSIONS.VIEW_WORKFLOW]: 'View Workflow',
      [PERMISSIONS.UPDATE_WORKFLOW_STAGE]: 'Update Workflow',
      [PERMISSIONS.MANAGE_DOCUMENTS]: 'Manage Documents',
      [PERMISSIONS.MANAGE_USERS]: 'Manage Users',
      [PERMISSIONS.MANAGE_SETTINGS]: 'Manage Settings',
      [PERMISSIONS.VIEW_AUDIT_LOGS]: 'View Audit Logs',
      [PERMISSIONS.MANAGE_AGENCIES]: 'Manage Agencies',
      [PERMISSIONS.SEND_NOTIFICATIONS]: 'Send Notifications',
      [PERMISSIONS.MANAGE_CALENDAR]: 'Manage Calendar',
      [PERMISSIONS.SCHEDULE_EVENTS]: 'Schedule Events',
      [PERMISSIONS.UPLOAD_DOCUMENTS]: 'Upload Documents',
      [PERMISSIONS.EDIT_DOCUMENTS]: 'Edit Documents',
      [PERMISSIONS.DELETE_DOCUMENTS]: 'Delete Documents',
      [PERMISSIONS.LIMITED_EDIT]: 'Limited Editing'
    }
    return permissionNames[permission] || permission
  }
}

// Create and export singleton instance
const authService = new AuthService()
export default authService