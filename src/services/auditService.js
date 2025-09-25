// Audit Service - Handles audit logging for system changes
import { format } from 'date-fns'

// Utility function to simulate API delay
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms))

// In-memory audit log storage (persisted to localStorage for demo)
let auditLogs = []

// Load persisted logs if available
const STORAGE_KEY = 'udaan_audit_logs'
const loadAuditLogs = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        auditLogs = parsed
      }
    }
  } catch (e) {
    console.warn('Failed to load persisted audit logs:', e)
  }
}

const saveAuditLogs = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auditLogs))
  } catch (e) {
    console.warn('Failed to persist audit logs:', e)
  }
}

// Initialize from storage on module load
loadAuditLogs()

class AuditService {
  /**
   * Log an audit event
   * @param {Object} auditData - Audit event data
   * @returns {Promise<Object>} Created audit log entry
   */
  async logEvent(auditData) {
    await delay()
    
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      user_id: auditData.user_id || 'system',
      user_name: auditData.user_name || 'System User',
      action: auditData.action,
      resource_type: auditData.resource_type,
      resource_id: auditData.resource_id,
      changes: auditData.changes || {},
      old_values: auditData.old_values || {},
      new_values: auditData.new_values || {},
      ip_address: auditData.ip_address || '127.0.0.1',
      user_agent: auditData.user_agent || 'Unknown',
      session_id: auditData.session_id || 'unknown_session',
      metadata: auditData.metadata || {}
    }

    auditLogs.push(auditEntry)
    // Persist after mutation
    saveAuditLogs()
    
    // Keep only last 1000 entries in memory (in production, use proper storage)
    if (auditLogs.length > 1000) {
      auditLogs = auditLogs.slice(-1000)
      saveAuditLogs()
    }

    return auditEntry
  }

  /**
   * Get audit logs with filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of audit log entries
   */
  async getAuditLogs(filters = {}) {
    await delay()
    
    let filteredLogs = [...auditLogs]

    // Apply filters
    if (filters.user_id) {
      filteredLogs = filteredLogs.filter(log => log.user_id === filters.user_id)
    }

    if (filters.resource_type) {
      filteredLogs = filteredLogs.filter(log => log.resource_type === filters.resource_type)
    }

    if (filters.resource_id) {
      filteredLogs = filteredLogs.filter(log => log.resource_id === filters.resource_id)
    }

    if (filters.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filters.action)
    }

    if (filters.date_from) {
      const fromDate = new Date(filters.date_from)
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= fromDate)
    }

    if (filters.date_to) {
      const toDate = new Date(filters.date_to)
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= toDate)
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    // Apply pagination
    const page = filters.page || 1
    const limit = filters.limit || 50
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit

    return {
      logs: filteredLogs.slice(startIndex, endIndex),
      total: filteredLogs.length,
      page,
      limit,
      total_pages: Math.ceil(filteredLogs.length / limit)
    }
  }

  /**
   * Get audit log by ID
   * @param {string} auditId - Audit log ID
   * @returns {Promise<Object|null>} Audit log entry or null
   */
  async getAuditLogById(auditId) {
    await delay()
    return auditLogs.find(log => log.id === auditId) || null
  }

  /**
   * Get audit summary for a resource
   * @param {string} resourceType - Resource type
   * @param {string} resourceId - Resource ID
   * @returns {Promise<Object>} Audit summary
   */
  async getAuditSummary(resourceType, resourceId) {
    await delay()
    
    const resourceLogs = auditLogs.filter(log => 
      log.resource_type === resourceType && log.resource_id === resourceId
    )

    const summary = {
      total_changes: resourceLogs.length,
      first_change: resourceLogs.length > 0 ? resourceLogs[resourceLogs.length - 1].timestamp : null,
      last_change: resourceLogs.length > 0 ? resourceLogs[0].timestamp : null,
      unique_users: [...new Set(resourceLogs.map(log => log.user_id))].length,
      actions: {}
    }

    // Count actions
    resourceLogs.forEach(log => {
      summary.actions[log.action] = (summary.actions[log.action] || 0) + 1
    })

    return summary
  }

  /**
   * Log user login
   * @param {Object} params - Login parameters
   * @returns {Promise<Object>} Audit log entry
   */
  async logLogin(params) {
    const { user, ip_address, user_agent, session_id } = params
    
    return this.logEvent({
      user_id: user.id || user.username || 'unknown_user',
      user_name: user.name || user.username || 'Unknown User',
      action: 'LOGIN',
      resource_type: 'AUTH',
      resource_id: user.id || 'auth_session',
      changes: {},
      ip_address: ip_address || '127.0.0.1',
      user_agent: user_agent || navigator.userAgent || 'Unknown',
      session_id: session_id || 'unknown_session',
      metadata: {
        login_timestamp: new Date().toISOString(),
        browser: user_agent || navigator.userAgent || 'Unknown',
        role: user.role || 'Unknown'
      }
    })
  }

  /**
   * Log user logout
   * @param {Object} params - Logout parameters
   * @returns {Promise<Object>} Audit log entry
   */
  async logLogout(params) {
    const { user, ip_address, user_agent, session_id } = params
    
    return this.logEvent({
      user_id: user.id || user.username || 'unknown_user',
      user_name: user.name || user.username || 'Unknown User',
      action: 'LOGOUT',
      resource_type: 'AUTH',
      resource_id: user.id || 'auth_session',
      changes: {},
      ip_address: ip_address || '127.0.0.1',
      user_agent: user_agent || navigator.userAgent || 'Unknown',
      session_id: session_id || 'unknown_session',
      metadata: {
        logout_timestamp: new Date().toISOString(),
        browser: user_agent || navigator.userAgent || 'Unknown',
        role: user.role || 'Unknown'
      }
    })
  }

  /**
   * Log job creation
   * @param {Object} params - Job creation parameters
   * @returns {Promise<Object>} Audit log entry
   */
  async logJobCreation(params) {
    const { user, jobData } = params
    
    return this.logEvent({
      user_id: user.id || 'current_user',
      user_name: user.name || 'Current User',
      action: 'CREATE',
      resource_type: 'JOB_POSTING',
      resource_id: jobData.id || 'new_job',
      changes: {
        title: { from: null, to: jobData.title },
        status: { from: null, to: jobData.status },
        location: { from: null, to: jobData.location }
      },
      new_values: jobData,
      metadata: {
        job_title: jobData.title,
        job_location: jobData.location,
        job_type: jobData.type,
        creation_timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log job update
   * @param {Object} params - Job update parameters
   * @returns {Promise<Object>} Audit log entry
   */
  async logJobUpdate(params) {
    const { user, oldData, newData } = params
    
    return this.logEvent({
      user_id: user.id || 'current_user',
      user_name: user.name || 'Current User',
      action: 'UPDATE',
      resource_type: 'JOB_POSTING',
      resource_id: newData.id || oldData.id,
      changes: this.calculateJobChanges(oldData, newData),
      old_values: oldData,
      new_values: newData,
      metadata: {
        job_title: newData.title || oldData.title,
        update_timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log job deletion
   * @param {Object} params - Job deletion parameters
   * @returns {Promise<Object>} Audit log entry
   */
  async logJobDeletion(params) {
    const { user, jobData } = params
    
    return this.logEvent({
      user_id: user.id || 'current_user',
      user_name: user.name || 'Current User',
      action: 'DELETE',
      resource_type: 'JOB_POSTING',
      resource_id: jobData.id,
      changes: {
        status: { from: jobData.status, to: 'deleted' }
      },
      old_values: jobData,
      metadata: {
        job_title: jobData.title,
        deletion_timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log application creation
   * @param {Object} params - Application creation parameters
   * @returns {Promise<Object>} Audit log entry
   */
  async logApplicationCreation(params) {
    const { user, applicationData, jobData } = params
    
    return this.logEvent({
      user_id: user.id || 'current_user',
      user_name: user.name || 'Current User',
      action: 'CREATE',
      resource_type: 'APPLICATION',
      resource_id: applicationData.id || 'new_application',
      changes: {
        status: { from: null, to: applicationData.status },
        job_id: { from: null, to: applicationData.job_id }
      },
      new_values: applicationData,
      metadata: {
        job_title: jobData?.title,
        candidate_name: applicationData.candidate_name,
        creation_timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log application status update
   * @param {Object} params - Application update parameters
   * @returns {Promise<Object>} Audit log entry
   */
  async logApplicationUpdate(params) {
    const { user, oldData, newData } = params
    
    return this.logEvent({
      user_id: user.id || 'current_user',
      user_name: user.name || 'Current User',
      action: 'UPDATE',
      resource_type: 'APPLICATION',
      resource_id: newData.id || oldData.id,
      changes: this.calculateApplicationChanges(oldData, newData),
      old_values: oldData,
      new_values: newData,
      metadata: {
        candidate_name: newData.candidate_name || oldData.candidate_name,
        update_timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log interview scheduling
   * @param {Object} params - Interview scheduling parameters
   * @returns {Promise<Object>} Audit log entry
   */
  async logInterviewScheduling(params) {
    const { user, interviewData, applicationData } = params
    
    return this.logEvent({
      user_id: user.id || 'current_user',
      user_name: user.name || 'Current User',
      action: 'CREATE',
      resource_type: 'INTERVIEW',
      resource_id: interviewData.id || 'new_interview',
      changes: {
        status: { from: null, to: interviewData.status },
        scheduled_date: { from: null, to: interviewData.scheduled_date }
      },
      new_values: interviewData,
      metadata: {
        candidate_name: applicationData?.candidate_name,
        interview_type: interviewData.type,
        scheduled_date: interviewData.scheduled_date,
        creation_timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Log agency profile update
   * @param {Object} params - Update parameters
   * @returns {Promise<Object>} Audit log entry
   */
  async logAgencyUpdate(params) {
    const { user, oldData, newData, section, changes } = params
    
    return this.logEvent({
      user_id: user.id || 'current_user',
      user_name: user.name || 'Current User',
      action: 'UPDATE',
      resource_type: 'AGENCY_PROFILE',
      resource_id: oldData.id || 'agency_001',
      changes: this.calculateChanges(oldData, newData, section),
      old_values: this.extractRelevantFields(oldData, section),
      new_values: this.extractRelevantFields(newData, section),
      metadata: {
        section: section,
        change_count: Object.keys(changes || {}).length,
        browser: navigator.userAgent || 'Unknown',
        timestamp_formatted: format(new Date(), 'PPpp')
      }
    })
  }

  /**
   * Log file upload
   * @param {Object} params - Upload parameters
   * @returns {Promise<Object>} Audit log entry
   */
  async logFileUpload(params) {
    const { user, fileType, fileName, fileSize, oldUrl, newUrl } = params
    
    return this.logEvent({
      user_id: user.id || 'current_user',
      user_name: user.name || 'Current User',
      action: 'FILE_UPLOAD',
      resource_type: 'AGENCY_MEDIA',
      resource_id: 'agency_001',
      changes: {
        [`${fileType}_url`]: { from: oldUrl, to: newUrl }
      },
      old_values: { [`${fileType}_url`]: oldUrl },
      new_values: { [`${fileType}_url`]: newUrl },
      metadata: {
        file_type: fileType,
        file_name: fileName,
        file_size: fileSize,
        upload_timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Calculate changes between old and new data
   * @param {Object} oldData - Original data
   * @param {Object} newData - Updated data
   * @param {string} section - Section being updated
   * @returns {Object} Changes object
   */
  calculateChanges(oldData, newData, section) {
    const changes = {}
    
    // Get relevant fields based on section
    const relevantFields = this.getRelevantFields(section)
    
    relevantFields.forEach(field => {
      const oldValue = this.getNestedValue(oldData, field)
      const newValue = this.getNestedValue(newData, field)
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[field] = {
          from: oldValue,
          to: newValue
        }
      }
    })
    
    return changes
  }

  /**
   * Calculate changes for job data
   * @param {Object} oldData - Original job data
   * @param {Object} newData - Updated job data
   * @returns {Object} Changes object
   */
  calculateJobChanges(oldData, newData) {
    const changes = {}
    const jobFields = ['title', 'description', 'status', 'location', 'salary_min', 'salary_max', 'requirements', 'benefits']
    
    jobFields.forEach(field => {
      const oldValue = oldData[field]
      const newValue = newData[field]
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[field] = {
          from: oldValue,
          to: newValue
        }
      }
    })
    
    return changes
  }

  /**
   * Calculate changes for application data
   * @param {Object} oldData - Original application data
   * @param {Object} newData - Updated application data
   * @returns {Object} Changes object
   */
  calculateApplicationChanges(oldData, newData) {
    const changes = {}
    const applicationFields = ['status', 'stage', 'notes', 'rating', 'feedback']
    
    applicationFields.forEach(field => {
      const oldValue = oldData[field]
      const newValue = newData[field]
      
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[field] = {
          from: oldValue,
          to: newValue
        }
      }
    })
    
    return changes
  }

  /**
   * Extract relevant fields for a section
   * @param {Object} data - Data object
   * @param {string} section - Section name
   * @returns {Object} Relevant fields
   */
  extractRelevantFields(data, section) {
    const relevantFields = this.getRelevantFields(section)
    const extracted = {}
    
    relevantFields.forEach(field => {
      extracted[field] = this.getNestedValue(data, field)
    })
    
    return extracted
  }

  /**
   * Get relevant fields for a section
   * @param {string} section - Section name
   * @returns {Array} Array of field names
   */
  getRelevantFields(section) {
    const fieldMap = {
      basic: ['name', 'description', 'established_year', 'license_number'],
      contact: ['phone', 'mobile', 'email', 'website'],
      location: ['address'],
      social: ['social_media.facebook', 'social_media.instagram', 'social_media.linkedin', 'social_media.twitter'],
      settings: ['settings.currency', 'settings.timezone', 'settings.date_format', 'settings.notifications'],
      services: ['services', 'specializations', 'target_countries'],
      media: ['logo_url', 'banner_url']
    }
    
    return fieldMap[section] || []
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Object to search
   * @param {string} path - Dot notation path
   * @returns {*} Value at path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Format audit log for display
   * @param {Object} auditLog - Audit log entry
   * @returns {Object} Formatted audit log
   */
  formatAuditLog(auditLog) {
    return {
      ...auditLog,
      timestamp_formatted: format(new Date(auditLog.timestamp), 'PPpp'),
      changes_summary: this.formatChangesSummary(auditLog.changes),
      action_label: this.getActionLabel(auditLog.action),
      resource_label: this.getResourceLabel(auditLog.resource_type)
    }
  }

  /**
   * Format changes summary for display
   * @param {Object} changes - Changes object
   * @returns {string} Formatted summary
   */
  formatChangesSummary(changes) {
    const changeCount = Object.keys(changes).length
    if (changeCount === 0) return 'No changes'
    if (changeCount === 1) return `1 field changed`
    return `${changeCount} fields changed`
  }

  /**
   * Get human-readable action label
   * @param {string} action - Action code
   * @returns {string} Action label
   */
  getActionLabel(action) {
    const labels = {
      'UPDATE': 'Updated',
      'CREATE': 'Created',
      'DELETE': 'Deleted',
      'FILE_UPLOAD': 'File Uploaded',
      'LOGIN': 'Logged In',
      'LOGOUT': 'Logged Out'
    }
    return labels[action] || action
  }

  /**
   * Get human-readable resource label
   * @param {string} resourceType - Resource type code
   * @returns {string} Resource label
   */
  getResourceLabel(resourceType) {
    const labels = {
      'AGENCY_PROFILE': 'Agency Profile',
      'AGENCY_MEDIA': 'Agency Media',
      'JOB_POSTING': 'Job Posting',
      'CANDIDATE': 'Candidate',
      'APPLICATION': 'Application',
      'INTERVIEW': 'Interview',
      'USER': 'User',
      'AUTH': 'Authentication',
      'MEMBER': 'Member',
      'WORKFLOW': 'Workflow',
      'SETTINGS': 'Settings'
    }
    return labels[resourceType] || resourceType
  }
}

// Create and export singleton instance
const auditService = new AuditService()
export default auditService