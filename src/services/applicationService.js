// Application Service - Handles all application-related operations
import applicationsData from '../data/applications.json'
import candidateService from './candidateService.js'
import jobService from './jobService.js'
import constantsService from './constantsService.js'
import performanceService from './performanceService.js'
import { handleServiceError, createError } from '../utils/errorHandler.js'
import auditService from './auditService.js'
import authService from './authService.js'
import ApplicationDataSource from '../api/datasources/ApplicationDataSource.js'
import InterviewDataSource from '../api/datasources/InterviewDataSource.js'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dev.kaha.com.np/job-portal'

// Get agency license from localStorage (set during login)
const getAgencyLicense = () => {
  const license = localStorage.getItem('udaan_agency_license')
  if (!license) {
    console.warn('[ApplicationService] No agency license found in localStorage')
    return null
  }
  return license
}

// Utility function to simulate API delay (reduced for performance)
const delay = (ms = 50) => new Promise(resolve => setTimeout(resolve, ms))

// Error simulation REMOVED for 100% reliability
const shouldSimulateError = () => false // Always return false for 100% reliability

// Deep clone helper
const deepClone = (obj) => JSON.parse(JSON.stringify(obj))

let applicationsCache = deepClone(applicationsData)

class ApplicationService {
  /**
   * Normalize documents structure from old object format to new array format
   * @param {Object|Array} documents - Documents in old or new format
   * @param {string} appliedAt - Application date for legacy documents
   * @returns {Array} Normalized documents array
   */
  normalizeDocuments(documents, appliedAt = null) {
    if (!documents) return []
    
    if (Array.isArray(documents)) {
      return documents
    }
    
    if (typeof documents === 'object') {
      const normalizedDocuments = []
      
      Object.entries(documents).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          // Handle arrays like certificates
          value.forEach((docPath, index) => {
            normalizedDocuments.push({
              id: `doc_legacy_${key}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              name: docPath.split('/').pop() || `${key}_${index}`,
              stage: 'general',
              type: 'application/pdf',
              size: 0,
              uploaded_at: appliedAt || new Date().toISOString(),
              legacy_path: docPath,
              legacy_key: key
            })
          })
        } else if (typeof value === 'string') {
          // Handle single document paths
          normalizedDocuments.push({
            id: `doc_legacy_${key}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: value.split('/').pop() || key,
            stage: 'general',
            type: 'application/pdf',
            size: 0,
            uploaded_at: appliedAt || new Date().toISOString(),
            legacy_path: value,
            legacy_key: key
          })
        }
      })
      
      return normalizedDocuments
    }
    
    return []
  }

  /**
   * Get all applications with optional filtering
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of applications
   */
  async getApplications(filters = {}) {
    return handleServiceError(async () => {
      await delay()
      if (shouldSimulateError()) {
        throw new Error('Failed to fetch applications')
      }

      let filteredApplications = [...applicationsCache]

      // Apply filters
      if (filters.stage && filters.stage !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.stage === filters.stage)
      }

      if (filters.job_id) {
        filteredApplications = filteredApplications.filter(app => app.job_id === filters.job_id)
      }

      if (filters.candidate_id) {
        filteredApplications = filteredApplications.filter(app => app.candidate_id === filters.candidate_id)
      }

      if (filters.status && filters.status !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.status === filters.status)
      }

      if (filters.priority_min) {
        filteredApplications = filteredApplications.filter(app => app.priority_score >= filters.priority_min)
      }

      if (filters.search) {
        // We'll need to get candidate and job data for search
        const candidates = await candidateService.getCandidates()
        const jobs = await jobService.getJobs()
        
        const searchTerm = filters.search.toLowerCase()
        filteredApplications = filteredApplications.filter(app => {
          const candidate = candidates.find(c => c.id === app.candidate_id)
          const job = jobs.find(j => j.id === app.job_id)
          
          return (candidate && (
            candidate.name.toLowerCase().includes(searchTerm) ||
            candidate.phone.includes(searchTerm) ||
            candidate.email.toLowerCase().includes(searchTerm)
          )) || (job && (
            job.title.toLowerCase().includes(searchTerm) ||
            job.company.toLowerCase().includes(searchTerm)
          ))
        })
      }

      // Apply sorting
      if (filters.sortBy) {
        filteredApplications.sort((a, b) => {
          switch (filters.sortBy) {
            case 'newest':
              return new Date(b.applied_at) - new Date(a.applied_at)
            case 'oldest':
              return new Date(a.applied_at) - new Date(b.applied_at)
            case 'priority_score':
              return b.priority_score - a.priority_score
            case 'stage':
              return a.stage.localeCompare(b.stage)
            default:
              return 0
          }
        })
      }

      return filteredApplications
    }, 3, 500);
  }

  /**
   * Get applications with detailed candidate and job information
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of applications with candidate and job details
   */
  async getApplicationsWithDetails(filters = {}) {
    // Use paginated method for better performance
    if (filters.page || filters.limit) {
      const result = await this.getApplicationsPaginated(filters)
      return result
    }
    
    await delay(50)
    const applications = await this.getApplications(filters)
    const candidates = await candidateService.getCandidates()
    const jobs = await jobService.getJobs()

    return applications.map(app => {
      const candidate = candidates.find(c => c.id === app.candidate_id)
      
      // Normalize documents structure
      const normalizedDocuments = this.normalizeDocuments(app.documents, app.applied_at)
      
      return {
        ...app,
        documents: normalizedDocuments, // Ensure app.documents is always an array
        candidate: candidate ? {
          ...candidate,
          // Include normalized documents from the application in the candidate object
          documents: normalizedDocuments
        } : null,
        job: jobs.find(j => j.id === app.job_id)
      }
    })
  }

  /**
   * Get application by ID
   * @param {string} applicationId - Application ID
   * @returns {Promise<Object|null>} Application object or null if not found
   */
  async getApplicationById(applicationId) {
    return handleServiceError(async () => {
      await delay(30)
      // Removed random error simulation for 100% reliability

      const application = applicationsCache.find(app => app.id === applicationId)
      return application ? deepClone(application) : null
    }, 3, 500);
  }

  /**
   * Create new application
   * @param {Object} applicationData - Application data
   * @returns {Promise<Object>} Created application
   */
  async createApplication(applicationData) {
    return handleServiceError(async () => {
      await delay(80)
      // Removed random error simulation for 100% reliability

      const constants = await constantsService.getApplicationStages()
      const newApplication = {
        id: `app_${Date.now()}`,
        ...applicationData,
        stage: constants.APPLIED,
        applied_at: new Date().toISOString(),
        shortlisted_at: null,
        interviewed_at: null,
        decision_at: null,
        status: 'active',
        notes: '',
        recruiter_notes: ''
      }

      applicationsCache.push(newApplication)
      // Audit: Application created
      try {
        const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
        await auditService.logEvent({
          user_id: actor.id,
          user_name: actor.name,
          action: 'CREATE',
          resource_type: 'APPLICATION',
          resource_id: newApplication.id,
          new_values: newApplication
        })
      } catch (e) {
        console.warn('Audit logging (CREATE APPLICATION) failed:', e)
      }
      return deepClone(newApplication)
    }, 3, 500);
  }

  /**
   * Update application
   * @param {string} applicationId - Application ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object|null>} Updated application or null if not found
   */
  async updateApplication(applicationId, updateData) {
    await delay(50)
    // Removed random error simulation for 100% reliability

    const applicationIndex = applicationsCache.findIndex(app => app.id === applicationId)
    if (applicationIndex === -1) {
      return null
    }

    const before = deepClone(applicationsCache[applicationIndex])
    applicationsCache[applicationIndex] = {
      ...applicationsCache[applicationIndex],
      ...updateData,
      updated_at: new Date().toISOString()
    }

    const updated = deepClone(applicationsCache[applicationIndex])
    // Audit: Application updated
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'UPDATE',
        resource_type: 'APPLICATION',
        resource_id: applicationId,
        changes: updateData,
        old_values: before,
        new_values: updated
      })
    } catch (e) {
      console.warn('Audit logging (UPDATE APPLICATION) failed:', e)
    }
    return updated
  }

  /**
   * Delete application
   * @param {string} applicationId - Application ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteApplication(applicationId) {
    await delay(40)
    // Removed random error simulation for 100% reliability

    const applicationIndex = applicationsCache.findIndex(app => app.id === applicationId)
    if (applicationIndex === -1) {
      return false
    }

    const removed = deepClone(applicationsCache[applicationIndex])
    applicationsCache.splice(applicationIndex, 1)
    // Audit: Application deleted
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'DELETE',
        resource_type: 'APPLICATION',
        resource_id: applicationId,
        old_values: removed
      })
    } catch (e) {
      console.warn('Audit logging (DELETE APPLICATION) failed:', e)
    }
    return true
  }

  /**
   * Update application stage
   * @deprecated Use stageTransitionService.updateStage() instead for better validation
   * @param {string} applicationId - Application ID
   * @param {string} newStage - New application stage
   * @returns {Promise<Object|null>} Updated application or null if not found
   */
  async updateApplicationStage(applicationId, newStage) {
    await delay(300)
    
    // Import stageTransitionService dynamically to avoid circular dependency
    const { default: stageTransitionService } = await import('./stageTransitionService.js')
    
    const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
    
    try {
      // Delegate to unified stage transition service
      // Note: We don't have current stage here, so validation will be limited
      const result = await stageTransitionService.updateStage(
        applicationId,
        'unknown', // Current stage unknown in this context
        newStage,
        { note: 'Updated via application service' }
      )
      
      // Audit: Stage change
      try {
        await auditService.logEvent({
          user_id: actor.id,
          user_name: actor.name,
          action: 'UPDATE',
          resource_type: 'APPLICATION',
          resource_id: applicationId,
          changes: { stage: newStage },
          metadata: { stage_change: true }
        })
      } catch (e) {
        console.warn('Audit logging (STAGE UPDATE APPLICATION) failed:', e)
      }
      
      return result
    } catch (error) {
      console.error('Stage update failed:', error)
      throw error
    }
  }

  /**
   * Shortlist application
   * @param {string} applicationId - Application ID
   * @param {string} notes - Optional notes
   * @returns {Promise<Object|null>} Updated application or null if not found
   */
  async shortlistApplication(applicationId, notes = '') {
    await delay(300)
    const constants = await constantsService.getApplicationStages()
    
    const updateData = {
      stage: constants.SHORTLISTED,
      shortlisted_at: new Date().toISOString(),
      recruiter_notes: notes
    }
    const res = await this.updateApplication(applicationId, updateData)
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'UPDATE',
        resource_type: 'APPLICATION',
        resource_id: applicationId,
        changes: updateData,
        metadata: { action: 'SHORTLIST' }
      })
    } catch (e) {
      console.warn('Audit logging (SHORTLIST APPLICATION) failed:', e)
    }
    return res
  }

  /**
   * Reject application with reason (required)
   * @param {string} applicationId - Application ID
   * @param {string} reason - Rejection reason (required)
   * @returns {Promise<Object|null>} Updated application or null if not found
   */
  async rejectApplication(applicationId, reason) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required')
    }

    await delay(300)
    
    const updateData = {
      notes: `REJECTED: ${reason}`,
      status: 'rejected',
      decision_at: new Date().toISOString()
    }
    
    const res = await this.updateApplication(applicationId, updateData)
    
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'UPDATE',
        resource_type: 'APPLICATION',
        resource_id: applicationId,
        changes: updateData,
        metadata: { action: 'REJECT', reason }
      })
    } catch (e) {
      console.warn('Audit logging (REJECT APPLICATION) failed:', e)
    }
    
    return res
  }

  /**
   * Bulk reject all "applied" applications for a job posting
   * Used when closing a job posting
   * @param {string} jobId - Job posting ID
   * @param {string} reason - Rejection reason (required)
   * @returns {Promise<Object>} Result with count of rejected applications
   */
  async bulkRejectApplicationsForJob(jobId, reason) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Rejection reason is required')
    }

    await delay(500)
    
    // Find all applications with status "applied" for this job
    const applicationsToReject = applicationsCache.filter(
      app => app.job_id === jobId && app.stage === 'applied'
    )
    
    const rejectedIds = []
    
    // Reject each application
    for (const app of applicationsToReject) {
      try {
        await this.rejectApplication(app.id, reason)
        rejectedIds.push(app.id)
      } catch (error) {
        console.error(`Failed to reject application ${app.id}:`, error)
        // Continue with other applications
      }
    }
    
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'BULK_UPDATE',
        resource_type: 'APPLICATION',
        resource_id: jobId,
        metadata: { 
          action: 'BULK_REJECT',
          reason,
          rejected_count: rejectedIds.length,
          application_ids: rejectedIds
        }
      })
    } catch (e) {
      console.warn('Audit logging (BULK REJECT) failed:', e)
    }
    
    return {
      rejected: rejectedIds.length,
      applicationIds: rejectedIds
    }
  }

  /**
   * Select application
   * @param {string} applicationId - Application ID
   * @param {string} notes - Optional notes
   * @returns {Promise<Object|null>} Updated application or null if not found
   */
  async selectApplication(applicationId, notes = '') {
    await delay(300)
    const constants = await constantsService.getApplicationStages()
    
    // Selection means moving to the final stage: Interview Passed
    const updateData = {
      stage: constants.INTERVIEW_PASSED,
      decision_at: new Date().toISOString(),
      recruiter_notes: notes,
      status: 'selected'
    }
    const res = await this.updateApplication(applicationId, updateData)
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'UPDATE',
        resource_type: 'APPLICATION',
        resource_id: applicationId,
        changes: updateData,
        metadata: { action: 'SELECT' }
      })
    } catch (e) {
      console.warn('Audit logging (SELECT APPLICATION) failed:', e)
    }
    return res
  }

  /**
   * Get applications by job ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Array>} Array of applications for the job
   */
  async getApplicationsByJobId(jobId) {
    await delay(30)
    return applicationsCache.filter(app => app.job_id === jobId)
  }

  /**
   * Get applications by candidate ID
   * @param {string} candidateId - Candidate ID
   * @returns {Promise<Array>} Array of applications by the candidate
   */
  async getApplicationsByCandidateId(candidateId) {
    await delay(30)
    return applicationsCache.filter(app => app.candidate_id === candidateId)
  }

  /**
   * Get applications by stage
   * @param {string} stage - Application stage
   * @returns {Promise<Array>} Array of applications in specified stage
   */
  async getApplicationsByStage(stage) {
    await delay(30)
    return applicationsCache.filter(app => app.stage === stage)
  }

  /**
   * Get application statistics
   * @returns {Promise<Object>} Application statistics
   */
  async getApplicationStatistics() {
    await delay(30)
    const stats = {
      total: applicationsCache.length,
      byStage: {},
      byStatus: {},
      averagePriorityScore: 0,
      conversionRates: {},
      processingTimes: {}
    }

    // Group by stage
    applicationsCache.forEach(app => {
      stats.byStage[app.stage] = (stats.byStage[app.stage] || 0) + 1
    })

    // Group by status
    applicationsCache.forEach(app => {
      stats.byStatus[app.status] = (stats.byStatus[app.status] || 0) + 1
    })

    // Calculate average priority score
    const totalScore = applicationsCache.reduce((sum, app) => sum + app.priority_score, 0)
    stats.averagePriorityScore = applicationsCache.length > 0 ? totalScore / applicationsCache.length : 0

    // Calculate conversion rates
    const constants = await constantsService.getApplicationStages()
    const appliedCount = stats.byStage[constants.APPLIED] || 0
    const shortlistedCount = stats.byStage[constants.SHORTLISTED] || 0
    const interviewScheduledCount = stats.byStage[constants.INTERVIEW_SCHEDULED] || 0
    const interviewPassedCount = stats.byStage[constants.INTERVIEW_PASSED] || 0

    if (appliedCount > 0) {
      stats.conversionRates.applicationToShortlist = (shortlistedCount / appliedCount) * 100
      stats.conversionRates.applicationToInterviewScheduled = (interviewScheduledCount / appliedCount) * 100
      stats.conversionRates.applicationToInterviewPassed = (interviewPassedCount / appliedCount) * 100
    }

    return stats
  }

  /**
   * Get recent applications
   * @param {number} days - Number of days to look back (default: 7)
   * @returns {Promise<Array>} Array of recent applications
   */
  async getRecentApplications(days = 7) {
    await delay(30)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return applicationsCache.filter(app => new Date(app.applied_at) >= cutoffDate)
  }

  /**
   * Get top priority applications
   * @param {number} limit - Number of applications to return (default: 10)
   * @returns {Promise<Array>} Array of high-priority applications
   */
  async getTopPriorityApplications(limit = 10) {
    await delay(30)
    return applicationsCache
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, limit)
  }

  /**
   * Bulk update application stages
   * @param {Array} applicationIds - Array of application IDs
   * @param {string} newStage - New stage for all applications
   * @returns {Promise<Array>} Array of updated applications
   */
  async bulkUpdateStage(applicationIds, newStage) {
    await delay(500)
    const updatedApplications = []
    
    for (const appId of applicationIds) {
      const updated = await this.updateApplicationStage(appId, newStage)
      if (updated) {
        updatedApplications.push(updated)
      }
    }
    
    return updatedApplications
  }

  /**
   * Get applications requiring action
   * @returns {Promise<Array>} Array of applications that need attention
   */
  async getApplicationsRequiringAction() {
    await delay(30)
    const constants = await constantsService.getApplicationStages()
    
    // Applications that have been in applied stage for more than 3 days
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 3)
    
    return applicationsCache.filter(app => 
      app.stage === constants.APPLIED && 
      new Date(app.applied_at) <= cutoffDate
    )
  }

  /**
   * Get duplicate applications (same candidate applying for same job)
   * @returns {Promise<Array>} Array of duplicate applications
   */
  async getDuplicateApplications() {
    await delay(30)
    const seen = new Set()
    const duplicates = []
    
    applicationsCache.forEach(app => {
      const key = `${app.candidate_id}_${app.job_id}`
      if (seen.has(key)) {
        duplicates.push(app)
      } else {
        seen.add(key)
      }
    })
    
    return duplicates
  }

  /**
   * Get candidates by workflow stage with job details
   * @param {string} stage - Workflow stage
   * @returns {Promise<Array>} Array of candidates with application and job details
   */
  async getCandidatesByStage(stage) {
    await delay(300)
    const applications = applicationsCache.filter(app => app.stage === stage)
    const jobs = await jobService.getJobs()
    
    return applications.map(app => {
      const job = jobs.find(j => j.id === app.job_id)
      
      // Normalize documents structure
      const normalizedDocuments = this.normalizeDocuments(app.documents, app.applied_at)
      
      return {
        ...app,
        job_title: job?.title,
        job_company: job?.company,
        interviewed_at: app.interviewed_at,
        interview_remarks: app.interview_remarks || app.recruiter_notes || app.notes,
        interview_type: app.interview_type,
        documents: normalizedDocuments
      }
    })
  }

  /**
   * Get all candidates in workflow (post-interview stages)
   * @returns {Promise<Array>} Array of all workflow candidates
   */
  async getAllCandidatesInWorkflow() {
    await delay(300)
    const constants = await constantsService.getApplicationStages()
    const workflowStages = [
      'applied',
      'shortlisted',
      'interview-scheduled',
      'interview-passed',
      'medical-scheduled',
      'medical-passed',
      'visa-application',
      'visa-approved',
      'police-clearance',
      'embassy-attestation',
      'travel-documents',
      'flight-booking',
      'pre-departure',
      'departed',
      'ready-to-fly'
    ]
    
    const applications = applicationsCache.filter(app => 
      workflowStages.includes(app.stage)
    )
    
    const jobs = await jobService.getJobs()
    
    return applications.map(app => {
      const job = jobs.find(j => j.id === app.job_id)
      
      // Normalize documents structure
      const normalizedDocuments = this.normalizeDocuments(app.documents, app.applied_at)
      
      return {
        ...app,
        job_title: job?.title,
        job_company: job?.company,
        interviewed_at: app.interviewed_at,
        interview_remarks: app.interview_remarks || app.recruiter_notes || app.notes,
        interview_type: app.interview_type,
        documents: normalizedDocuments
      }
    })
  }

  /**
   * Attach document to candidate application
   * @param {string} candidateId - Candidate ID
   * @param {Object} document - Document details
   * @returns {Promise<boolean>} Success status
   */
  async attachDocument(candidateId, document) {
    await delay(40)
    // Removed random error simulation for 100% reliability

    const application = applicationsCache.find(app => app.candidate_id === candidateId)
    if (!application) {
      return false
    }

    // Normalize documents structure
    application.documents = this.normalizeDocuments(application.documents, application.applied_at)

    const newDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...document,
      uploaded_at: new Date().toISOString()
    }

    application.documents.push(newDocument)
    
    // Audit: Document attached
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'CREATE',
        resource_type: 'DOCUMENT',
        resource_id: newDocument.id,
        metadata: { 
          candidate_id: candidateId,
          document_name: document.name,
          document_stage: document.stage
        }
      })
    } catch (e) {
      console.warn('Audit logging (ATTACH DOCUMENT) failed:', e)
    }
    
    return true
  }

  /**
   * Remove document from candidate application
   * @param {string} candidateId - Candidate ID
   * @param {number} docIndex - Document index (global index in the documents array)
   * @returns {Promise<boolean>} Success status
   */
  async removeDocument(candidateId, docIndex) {
    await delay(40)
    
    const application = applicationsCache.find(app => app.candidate_id === candidateId)
    if (!application || !application.documents) {
      return false
    }

    // Ensure documents is an array
    application.documents = this.normalizeDocuments(application.documents, application.applied_at)

    // Check if the index is valid
    if (docIndex >= application.documents.length) {
      return false
    }

    // Remove the document at the specified index
    const removed = application.documents.splice(docIndex, 1)[0]
    
    // Audit: Document removed
    try {
      const actor = authService.getCurrentUser() || { id: 'system', name: 'System' }
      await auditService.logEvent({
        user_id: actor.id,
        user_name: actor.name,
        action: 'DELETE',
        resource_type: 'DOCUMENT',
        resource_id: removed.id,
        metadata: { 
          candidate_id: candidateId,
          document_name: removed.name,
          document_stage: removed.stage
        }
      })
    } catch (e) {
      console.warn('Audit logging (REMOVE DOCUMENT) failed:', e)
    }
    
    return true
  }

  /**
   * Get applications from backend API with optimized data structure
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Applications with optimized structure
   */
  async getApplicationsFromAPI(options = {}) {
    const startTime = performance.now()
    
    try {
      const agencyLicense = getAgencyLicense()
      
      if (!agencyLicense) {
        throw new Error('Agency license not found. Please log in again.')
      }
      
      const params = new URLSearchParams()
      
      // Add query parameters
      if (options.page) params.append('page', options.page)
      if (options.limit) params.append('limit', options.limit)
      if (options.search) params.append('search', options.search)
      if (options.stage) params.append('stage', options.stage) // Backend uses 'stage' query param
      if (options.country) params.append('country', options.country)
      if (options.jobId) params.append('job', options.jobId) // Backend uses 'job'
      
      const url = `${API_BASE_URL}/agencies/${agencyLicense}/applications?${params.toString()}`
      console.log('Fetching from API:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Transform backend response to match frontend expectations
      const transformedApplications = data.applications.map(app => {
        const candidate = data.candidates[app.candidate_id]
        const job = data.jobs[app.job_posting_id]
        const position = data.positions[app.position_id]
        
        return {
          id: app.id,
          candidate_id: app.candidate_id,
          job_id: app.job_posting_id,
          position_id: app.position_id,
          stage: app.status, // Backend uses 'status', frontend uses 'stage'
          status: 'active',
          priority_score: app.priority_score,
          applied_at: app.created_at,
          updated_at: app.updated_at,
          withdrawn_at: app.withdrawn_at,
          documents: [], // Documents not in current API response
          candidate: candidate ? {
            id: candidate.id,
            name: candidate.full_name,
            phone: candidate.phone,
            email: candidate.email,
            skills: candidate.skills || [],
            age: candidate.age,
            gender: candidate.gender,
            documents: []
          } : null,
          job: job ? {
            id: job.id,
            title: position?.title || job.posting_title,
            company: job.company_name,
            country: job.country,
            city: job.city,
            salary: position?.monthly_salary_amount,
            currency: position?.salary_currency,
            vacancies: position?.total_vacancies
          } : null
        }
      })
      
      const endTime = performance.now()
      
      return {
        data: transformedApplications,
        pagination: {
          page: data.pagination.page,
          limit: data.pagination.limit,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
          hasNext: data.pagination.hasNext,
          hasPrev: data.pagination.hasPrev
        },
        performance: {
          loadTime: Math.round(endTime - startTime),
          apiLoadTime: data.performance?.loadTime,
          cached: false
        }
      }
    } catch (error) {
      console.error('Error fetching from API:', error)
      // Fallback to local data if API fails
      console.log('Falling back to local data')
      return this.getApplicationsPaginatedLocal(options)
    }
  }

  /**
   * Get applications with server-side pagination and performance optimization (Local fallback)
   * Optimized for handling 10k+ records with <1.5s load time
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Paginated results with metadata
   */
  async getApplicationsPaginatedLocal(options = {}) {
    const startTime = performance.now()
    
    const {
      page = 1,
      limit = 20,
      search = '',
      stage = '',
      country = '',
      jobId = '', // This is the parameter name from the frontend
      sortBy = 'applied_at',
      sortOrder = 'desc'
    } = options

    // Use performance service for caching
    const cacheKey = `applications_${JSON.stringify(options)}`
    
    try {
      return await performanceService.getCachedData(cacheKey, async () => {
        await delay(50) // Minimal delay for realism
        
        let filteredApplications = [...applicationsCache]
        
        // Apply search filter first (most selective)
        if (search) {
          const searchLower = search.toLowerCase()
          const candidates = await candidateService.getCandidates()
          const jobs = await jobService.getJobs()
          
          filteredApplications = filteredApplications.filter(app => {
            const candidate = candidates.find(c => c.id === app.candidate_id)
            const job = jobs.find(j => j.id === app.job_id)
            
            return (
              candidate?.name?.toLowerCase().includes(searchLower) ||
              candidate?.email?.toLowerCase().includes(searchLower) ||
              candidate?.phone?.includes(search) ||
              job?.title?.toLowerCase().includes(searchLower) ||
              candidate?.skills?.some(skill => skill.toLowerCase().includes(searchLower))
            )
          })
        }
        
        // Apply other filters
        if (stage) {
          filteredApplications = filteredApplications.filter(app => app.stage === stage)
        }
        
        // Fix the parameter name mismatch - frontend sends jobId, but we need to check app.job_id
        if (jobId) {
          filteredApplications = filteredApplications.filter(app => app.job_id === jobId)
        }
        
        if (country) {
          const jobs = await jobService.getJobs()
          const countryJobIds = jobs.filter(job => job.country === country).map(job => job.id)
          filteredApplications = filteredApplications.filter(app => countryJobIds.includes(app.job_id))
        }
        
        // Sort applications
        filteredApplications.sort((a, b) => {
          let aValue = a[sortBy]
          let bValue = b[sortBy]
          
          if (sortBy === 'applied_at' || sortBy === 'updated_at') {
            aValue = new Date(aValue)
            bValue = new Date(bValue)
          }
          
          if (sortOrder === 'desc') {
            return bValue > aValue ? 1 : -1
          } else {
            return aValue > bValue ? 1 : -1
          }
        })
        
        // Calculate pagination
        const total = filteredApplications.length
        const totalPages = Math.ceil(total / limit)
        const offset = (page - 1) * limit
        const paginatedApplications = filteredApplications.slice(offset, offset + limit)
        
        // Enrich with candidate and job data (only for current page)
        const enrichedApplications = await this.enrichApplicationsData(paginatedApplications)
        
        const endTime = performance.now()
        const loadTime = endTime - startTime
        
        return {
          data: enrichedApplications,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          },
          performance: {
            loadTime: Math.round(loadTime),
            cached: false
          }
        }
      })
    } catch (error) {
      console.error('Error in getApplicationsPaginatedLocal:', error)
      // Preserve original error details so the UI can make better decisions
      throw createError(error, 'getApplicationsPaginatedLocal')
    }
  }

  /**
   * Get applications with server-side pagination (Main method - tries API first, falls back to local)
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Paginated results with metadata
   */
  async getApplicationsPaginated(options = {}) {
    // Try API first, fallback to local if it fails
    return this.getApplicationsFromAPI(options)
  }

  /**
   * Enrich applications with candidate and job data efficiently
   * @param {Array} applications - Applications to enrich
   * @returns {Promise<Array>} Enriched applications
   */
  async enrichApplicationsData(applications) {
    if (!applications.length) return []
    
    // Get unique IDs to minimize data fetching
    const candidateIds = [...new Set(applications.map(app => app.candidate_id))]
    const jobIds = [...new Set(applications.map(app => app.job_id))]
    
    // Fetch data in parallel
    const [candidates, jobs] = await Promise.all([
      candidateService.getCandidatesByIds(candidateIds),
      jobService.getJobsByIds(jobIds)
    ])
    
    // Create lookup maps for O(1) access
    const candidateMap = new Map(candidates.map(c => [c.id, c]))
    const jobMap = new Map(jobs.map(j => [j.id, j]))
    
    // Enrich applications
    return applications.map(app => {
      const candidate = candidateMap.get(app.candidate_id)
      
      // Normalize documents structure
      const normalizedDocuments = this.normalizeDocuments(app.documents, app.applied_at)
      
      return {
        ...app,
        documents: normalizedDocuments, // Ensure app.documents is always an array
        candidate: candidate ? {
          ...candidate,
          // Include normalized documents from the application in the candidate object
          documents: normalizedDocuments
        } : null,
        job: jobMap.get(app.job_id)
      }
    })
  }

  /**
   * Get application statistics for dashboard
   * @returns {Promise<Object>} Application statistics
   */
  async getApplicationStatistics() {
    const cacheKey = 'application_statistics'
    
    return await performanceService.getCachedData(cacheKey, async () => {
      await delay(30) // Reduced delay for performance
      
      const applications = [...applicationsCache]
      const stages = await constantsService.getApplicationStages()
      
      const stats = {
        total: applications.length,
        byStage: {},
        byMonth: {},
        recentActivity: applications
          .filter(app => {
            const appDate = new Date(app.applied_at)
            const weekAgo = new Date()
            weekAgo.setDate(weekAgo.getDate() - 7)
            return appDate >= weekAgo
          }).length
      }
      
      // Count by stage
      Object.values(stages).forEach(stage => {
        stats.byStage[stage] = applications.filter(app => app.stage === stage).length
      })
      
      // Count by month (last 6 months)
      for (let i = 0; i < 6; i++) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthKey = date.toISOString().slice(0, 7) // YYYY-MM
        
        stats.byMonth[monthKey] = applications.filter(app => {
          return app.applied_at.startsWith(monthKey)
        }).length
      }
      
      return stats
    }, 'analytics') // Use analytics cache type
  }

  /**
   * Bulk operations with performance optimization
   * @param {Array} applicationIds - Application IDs to update
   * @param {string} stage - New stage
   * @returns {Promise<Object>} Update result
   */
  async bulkUpdateStageOptimized(applicationIds, stage) {
    const startTime = performance.now()
    
    try {
      // Process in chunks to avoid blocking
      await performanceService.processInChunks(
        applicationIds,
        async (chunk) => {
          chunk.forEach(id => {
            const appIndex = applicationsCache.findIndex(app => app.id === id)
            if (appIndex !== -1) {
              applicationsCache[appIndex] = {
                ...applicationsCache[appIndex],
                stage,
                updated_at: new Date().toISOString()
              }
            }
          })
          await delay(10) // Small delay between chunks
        },
        50 // Process 50 at a time
      )
      
      // Clear relevant caches
      performanceService.clearCache()
      
      const endTime = performance.now()
      
      return {
        success: true,
        updated: applicationIds.length,
        performance: {
          loadTime: Math.round(endTime - startTime)
        }
      }
    } catch (error) {
      console.error('Bulk update error:', error)
      throw new Error('Failed to update applications')
    }
  }
}

// Create and export singleton instance
const applicationService = new ApplicationService()
export default applicationService